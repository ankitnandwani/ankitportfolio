import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeJobFit,
  getJobFitPolicy,
  type JobFitAnalysisResult,
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

    if (!result.ok) {
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
        false,
        result.metadata.requirementCount,
        0,
        null,
        latencyMs,
        null,
        'none',
        false,
        result.metadata.redactions,
        result.metadata.rateLimit.scope,
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackJobFitAnalysis failed:', err));

      return NextResponse.json(
        { error: responseError },
        { status: 400, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // Fire analytics event (fire and forget)
    trackJobFitAnalysis(
      sessionId,
      queryId,
      true,
      result.metadata.requirementCount,
      result.evidence.length,
      result.evidence.length > 0
        ? result.evidence.reduce((sum, e) => sum + e.confidence, 0) / result.evidence.length
        : null,
      latencyMs,
      result.metadata.tokenUsage,
      result.metadata.model,
      result.metadata.usedFallback,
      result.metadata.redactions,
      result.metadata.rateLimit.scope,
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
      false,
      0,
      0,
      null,
      0,
      null,
      'error',
      false,
      0,
      null,
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