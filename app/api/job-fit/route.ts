import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeJobFit,
  getJobFitPolicy,
  type JobFitAnalysisResult,
  type ClassifiedRequirement,
} from '@/src/lib/jobFit';
import {
  trackJobFitAnalysis,
  getAnalyticsConfig,
  generateClientKey,
  getSessionId,
} from '@/src/lib/analytics';

/**
 * The message a visitor sees when the limit is reached.
 *
 * It says what happened and what to do, without saying anything about the
 * limits themselves.
 */
const RATE_LIMIT_MESSAGE =
  'The analysis takes a moment to complete. Please wait a bit before requesting another analysis.';

/**
 * Works out which visitor a request comes from.
 *
 * The hosting platform writes the address of the client into the header, so
 * the first address in it is the one of the visitor.
 *
 * @param request The request that came in.
 * @returns The key the visitor is counted under.
 */
function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

/**
 * Computes the classification counts from the classified requirements.
 */
function computeClassificationCounts(
  requirements: ReadonlyArray<ClassifiedRequirement>
): {
  directMatch: number;
  strongTransfer: number;
  related: number;
  learnable: number;
  unknown: number;
} {
  const counts = {
    directMatch: 0,
    strongTransfer: 0,
    related: 0,
    learnable: 0,
    unknown: 0,
  };

  for (const req of requirements) {
    switch (req.classification) {
      case 'DIRECT_MATCH':
        counts.directMatch++;
        break;
      case 'STRONG_TRANSFER':
        counts.strongTransfer++;
        break;
      case 'RELATED':
        counts.related++;
        break;
      case 'LEARNABLE':
        counts.learnable++;
        break;
      case 'UNKNOWN':
        counts.unknown++;
        break;
    }
  }

  return counts;
}

/**
 * Type guard for successful analysis result.
 */
function isSuccessResult(result: JobFitAnalysisResult): result is JobFitAnalysisResult & { ok: true } {
  return result.ok === true;
}

/**
 * POST /api/job-fit
 *
 * Handles job fit analysis requests.
 *
 * The request is counted against the rate limit of the visitor before
 * anything else happens, and the analysis is returned only when it passes
 * all safety checks.
 */
export async function POST(request: NextRequest) {
  const policy = getJobFitPolicy();
  const clientKey = getClientKey(request);
  const limit = policy.checkRateLimit(clientKey);

  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(limit.limit),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)),
  };

  if (!limit.allowed) {
    console.log(
      `[rate-limit] key=${clientKey} scope=${limit.scope} ` +
        `retryAfter=${limit.retryAfterSeconds}s action=blocked`
    );

    return NextResponse.json(
      {
        error: RATE_LIMIT_MESSAGE,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          'Retry-After': String(limit.retryAfterSeconds),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // Analytics configuration
  const analyticsConfig = getAnalyticsConfig();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  const analyticsClientKey = generateClientKey(forwardedFor, realIp, userAgent);
  const sessionId = getSessionId(analyticsClientKey);
  const queryId = crypto.randomUUID();

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const { jobDescription } = body as { jobDescription?: unknown };

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Job description is required and must be a string' },
        { status: 400, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const startTime = Date.now();

    // Run the analysis
    const result: JobFitAnalysisResult = await analyzeJobFit(jobDescription, {
      clientKey,
    });

    const latencyMs = Date.now() - startTime;

    // Use type guard to narrow the union
    if (!isSuccessResult(result)) {
      // Map policy errors to 400 responses
      const errorMessage = result.error;

      // Determine the specific error message based on the policy reason
      let responseError = errorMessage;
      if (errorMessage.includes('too_short')) {
        responseError = 'The job description is too short. Please provide a more complete job description.';
      } else if (errorMessage.includes('too_long')) {
        responseError = 'The job description is too long. Please provide a shorter job description (max 12,000 characters).';
      } else if (errorMessage.includes('injection')) {
        responseError = 'This job description contains text that looks like an attempt to change the assistant\'s instructions, so it was not analysed. Paste the job description without that text and try again.';
      } else if (errorMessage.includes('Rate limit')) {
        responseError = RATE_LIMIT_MESSAGE;
      }

      // Fire analytics event (fire and forget)
      trackJobFitAnalysis(
        sessionId,
        queryId,
        {
          queryId,
          success: false,
          requirementCount: result.metadata.requirementCount,
          analysedRequirementCount: 0,
          directMatchCount: 0,
          strongTransferCount: 0,
          relatedCount: 0,
          learnableCount: 0,
          unknownCount: 0,
          chunksRetrieved: 0,
          averageSimilarity: null,
          retrievalSuccess: false,
          latencyMs,
          tokenUsage: null,
          model: 'none',
          usedFallback: false,
          replacedBySafeFallback: false,
          correctedClaims: 0,
          redactions: result.metadata.redactions,
          rateLimitScope: result.metadata.rateLimit.scope,
        },
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackJobFitAnalysis failed:', err));

      return NextResponse.json(
        { error: responseError },
        { status: 400, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // Compute classification counts
    const classificationCounts = computeClassificationCounts(result.analysis.requirements);
    const analysedCount = result.analysis.requirements.length;

    // Determine if analysis was replaced by safe fallback
    const replacedBySafeFallback = result.metadata.usedFallback ||
      result.analysis.requirements.length === 0;

    // Fire analytics event (fire and forget)
    trackJobFitAnalysis(
      sessionId,
      queryId,
      {
        queryId,
        success: true,
        requirementCount: result.metadata.requirementCount,
        analysedRequirementCount: analysedCount,
        directMatchCount: classificationCounts.directMatch,
        strongTransferCount: classificationCounts.strongTransfer,
        relatedCount: classificationCounts.related,
        learnableCount: classificationCounts.learnable,
        unknownCount: classificationCounts.unknown,
        chunksRetrieved: result.evidence.length,
        averageSimilarity: result.evidence.length > 0
          ? result.evidence.reduce((sum, e) => sum + e.confidence, 0) / result.evidence.length
          : null,
        retrievalSuccess: result.evidence.length > 0,
        latencyMs,
        tokenUsage: result.metadata.tokenUsage
          ? {
              promptTokens: result.metadata.tokenUsage.promptTokens ?? 0,
              completionTokens: result.metadata.tokenUsage.completionTokens ?? 0,
              totalTokens: result.metadata.tokenUsage.totalTokens ?? 0,
            }
          : null,
        model: result.metadata.model,
        usedFallback: result.metadata.usedFallback,
        replacedBySafeFallback,
        correctedClaims: 0, // TODO: Get this from claimValidation report when available
        redactions: result.metadata.redactions,
        rateLimitScope: result.metadata.rateLimit.scope,
      },
      analyticsConfig
    ).catch((err) => console.warn('[analytics] trackJobFitAnalysis failed:', err));

    // Return successful response
    return NextResponse.json(
      {
        analysis: result.analysis,
        evidence: result.evidence,
        meta: {
          latencyMs: result.metadata.latencyMs,
          tokenUsage: result.metadata.tokenUsage,
          model: result.metadata.model,
          requirementCount: result.metadata.requirementCount,
          chunksRetrieved: result.evidence.length,
          usedFallback: result.metadata.usedFallback,
          queryId,
        },
      },
      { headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Job fit API error:', error);

    // Fire analytics event for failure (fire and forget)
    trackJobFitAnalysis(
      sessionId,
      queryId,
      {
        queryId,
        success: false,
        requirementCount: 0,
        analysedRequirementCount: 0,
        directMatchCount: 0,
        strongTransferCount: 0,
        relatedCount: 0,
        learnableCount: 0,
        unknownCount: 0,
        chunksRetrieved: 0,
        averageSimilarity: null,
        retrievalSuccess: false,
        latencyMs: 0,
        tokenUsage: null,
        model: 'error',
        usedFallback: false,
        replacedBySafeFallback: false,
        correctedClaims: 0,
        redactions: 0,
        rateLimitScope: null,
      },
      analyticsConfig
    ).catch((err) => console.warn('[analytics] trackJobFitAnalysis failed:', err));

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'LLMConfigurationError') {
        return NextResponse.json(
          { error: 'The analysis service is not configured.' },
          { status: 503, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      // Check for retryable property on LLMError
      const llmError = error as { retryable?: boolean; name?: string };
      if (llmError.name === 'LLMError' && llmError.retryable) {
        return NextResponse.json(
          { error: 'The analysis service is temporarily unavailable. Please try again.' },
          { status: 503, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
        );
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong while analysing the job description. Please try again.' },
      { status: 500, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
    );
  }
}