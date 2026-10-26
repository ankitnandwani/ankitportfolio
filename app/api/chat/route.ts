import { NextRequest, NextResponse } from 'next/server';
import {
  getRateLimiter,
  processChatMessage,
  processChatMessageStream,
  validateResponse,
  type ChatOrchestrationOptions,
} from '@/src/lib/ai';
import {
  trackMessageSent,
  trackResponseReceived,
  getAnalyticsConfig,
  generateClientKey,
  getSessionId,
  type QuestionCategory,
  type GuardrailAction,
  type OutputGuardrailAction,
} from '@/src/lib/analytics';
import type { InputGuardrailResult, OutputGuardrailResult } from '@/src/lib/guardrails/pipeline.ts';

/**
 * The message a visitor sees when the limit is reached.
 *
 * It says what happened and what to do, without saying anything about the
 * limits themselves.
 */
const RATE_LIMIT_MESSAGE =
  "You've asked a lot of questions in a short time. Please wait a moment before asking another one.";

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
 * Builds the text the answer was made from, so the answer can be checked
 * against it.
 *
 * @param chunks The chunks the answer was built from.
 */
function buildContext(chunks: Array<{ content: string }>): string {
  return chunks.map((chunk) => chunk.content).join('\n');
}

/**
 * Maps an input guardrail action to an analytics category and action.
 */
function mapInputGuardrailToAnalytics(inputGuardrails: InputGuardrailResult): {
  category: QuestionCategory;
  action: GuardrailAction;
} {
  const topic = inputGuardrails.classification?.topic ?? 'unknown';
  const categoryMap: Record<string, QuestionCategory> = {
    profile: 'profile',
    experience: 'experience',
    skills: 'skills',
    projects: 'projects',
    education: 'education',
    off_topic: 'off_topic',
    injection: 'injection',
    private_data: 'private_data',
    unknown: 'unknown',
  };

  const actionMap: Record<string, GuardrailAction> = {
    input_allowed: 'allow',
    input_off_topic: 'redirect_off_topic',
    input_injection_blocked: 'redirect_injection',
    input_sensitive_request_blocked: 'redirect_private_data',
    output_allowed: 'allow',
    output_redacted: 'allow',
    output_warned: 'allow',
  };

  return {
    category: categoryMap[topic] ?? 'unknown',
    action: actionMap[inputGuardrails.action] ?? 'allow',
  };
}

/**
 * Maps an output guardrail action to an analytics action.
 */
function mapOutputGuardrailToAnalytics(outputGuardrails: OutputGuardrailResult): OutputGuardrailAction {
  const actionMap: Record<string, OutputGuardrailAction> = {
    output_allowed: 'output_allowed',
    output_redacted: 'output_redacted',
    output_warned: 'output_allowed', // warnings don't block
  };

  return actionMap[outputGuardrails.action] ?? 'output_allowed';
}

/**
 * Calculates a heuristic confidence score based on retrieval results.
 */
function calculateConfidence(
  chunksRetrieved: number,
  averageSimilarity: number | null,
  isRedirect: boolean
): number | null {
  if (isRedirect) return null;
  if (chunksRetrieved === 0) return 0.1;
  if (averageSimilarity === null) return 0.5;

  // Confidence based on similarity and number of chunks
  const similarityScore = Math.min(averageSimilarity, 1);
  const chunkScore = Math.min(chunksRetrieved / 5, 1);
  return Math.round((similarityScore * 0.7 + chunkScore * 0.3) * 100) / 100;
}

/**
 * POST /api/chat
 *
 * Handles chat requests through the RAG orchestration pipeline.
 * Supports both streaming and non-streaming responses.
 *
 * The request is counted against the rate limit of the visitor before
 * anything else happens, and the answer is checked before it is sent.
 */
export async function POST(request: NextRequest) {
  const limiter = getRateLimiter();
  const clientKey = getClientKey(request);
  const limit = limiter.check(clientKey);

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

  try {
    const body = await request.json();
    const { message, history, stream = true, retrievalLimit, minSimilarity, temperature, maxTokens } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const queryId = crypto.randomUUID();
    const options: ChatOrchestrationOptions = {
      history,
      stream,
      retrievalLimit,
      minSimilarity,
      temperature,
      maxTokens,
      queryId,
    };

    // Track message sent (fire-and-forget)
    const messageStartTime = Date.now();

    if (stream) {
      // Streaming response using the orchestration layer
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let firstChunk = true;
            let context = '';
            let inputGuardrailsTracked = false;
            let questionCategory: QuestionCategory = 'unknown';
            let guardrailAction: GuardrailAction = 'allow';

            for await (const chunk of processChatMessageStream(message, options)) {
              if (firstChunk) {
                context = buildContext(chunk.retrieval?.chunks ?? []);

                // Track message sent with guardrail info from first chunk
                if (chunk.inputGuardrails && !inputGuardrailsTracked) {
                  const mapped = mapInputGuardrailToAnalytics(chunk.inputGuardrails);
                  questionCategory = mapped.category;
                  guardrailAction = mapped.action;
                  inputGuardrailsTracked = true;

                  trackMessageSent(
                    sessionId,
                    queryId,
                    questionCategory,
                    guardrailAction,
                    message.length,
                    analyticsConfig
                  ).catch((err) => console.warn('[analytics] trackMessageSent failed:', err));
                }
              }

              if (chunk.done) {
                // The answer is checked before it is sent. The text that was
                // streamed is replaced by the checked one, because the
                // interface shows the final text of a message.
                const validation = validateResponse(chunk.text, { context });
                const text = validation.isValid ? chunk.text : validation.fallback;

                if (!validation.isValid) {
                  console.log(
                    `[validation] queryId=${options.queryId} ` +
                      `errors=${validation.errors.map((error) => error.kind).join(',')} ` +
                      `action=fallback`
                  );
                }

                // Track response received
                const latencyMs = Date.now() - messageStartTime;
                const outputAction = mapOutputGuardrailToAnalytics(
                  chunk.outputGuardrails ?? ({ action: 'output_allowed' } as OutputGuardrailResult)
                );
                const confidence = calculateConfidence(
                  chunk.retrieval?.chunks.length ?? 0,
                  chunk.retrieval?.averageSimilarity ?? null,
                  chunk.isRedirect ?? false
                );

                trackResponseReceived(
                  sessionId,
                  queryId,
                  (chunk.retrieval?.chunks.length ?? 0) > 0,
                  chunk.retrieval?.chunks.length ?? 0,
                  chunk.retrieval?.averageSimilarity ?? null,
                  latencyMs,
                  chunk.tokenUsage ? latencyMs : latencyMs, // total orchestration time approximated
                  chunk.tokenUsage ?? null,
                  chunk.model ?? 'gemini',
                  chunk.isRedirect ?? false,
                  chunk.outputGuardrails?.wasRedacted ?? false,
                  outputAction,
                  confidence,
                  analyticsConfig
                ).catch((err) => console.warn('[analytics] trackResponseReceived failed:', err));

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ ...chunk, text })}\n\n`
                  )
                );
              } else if (firstChunk) {
                // For the first chunk, include metadata
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
                firstChunk = false;
              } else {
                // Intermediate chunk - only send text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`)
                );
              }
            }

            controller.close();
          } catch (error) {
            console.error('Streaming orchestration error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...rateLimitHeaders,
        },
      });
    } else {
      // Non-streaming response using the orchestration layer
      const result = await processChatMessage(message, options);

      // Track message sent
      const mappedInput = mapInputGuardrailToAnalytics(result.inputGuardrails);
      trackMessageSent(
        sessionId,
        queryId,
        mappedInput.category,
        mappedInput.action,
        message.length,
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackMessageSent failed:', err));

      const validation = validateResponse(result.text, {
        context: buildContext(result.retrieval.chunks),
      });

      if (!validation.isValid) {
        console.log(
          `[validation] queryId=${options.queryId} ` +
            `errors=${validation.errors.map((error) => error.kind).join(',')} ` +
            `action=fallback`
        );
      }

      // Track response received
      const latencyMs = Date.now() - messageStartTime;
      const outputAction = mapOutputGuardrailToAnalytics(result.outputGuardrails);
      const confidence = calculateConfidence(
        result.retrieval.chunks.length,
        result.retrieval.averageSimilarity,
        result.isRedirect
      );

      trackResponseReceived(
        sessionId,
        queryId,
        result.retrieval.chunks.length > 0,
        result.retrieval.chunks.length,
        result.retrieval.averageSimilarity,
        latencyMs,
        result.tokenUsage ? latencyMs : latencyMs,
        result.tokenUsage ?? null,
        result.model,
        result.isRedirect,
        result.outputGuardrails.wasRedacted,
        outputAction,
        confidence,
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackResponseReceived failed:', err));

      return NextResponse.json(
        {
          text: validation.isValid ? result.text : validation.fallback,
          tokenUsage: result.tokenUsage,
          finishReason: result.finishReason,
          model: result.model,
          isRedirect: result.isRedirect,
          suggestions: result.suggestions,
          wasRedacted: result.outputGuardrails.wasRedacted,
          inputGuardrails: result.inputGuardrails,
          outputGuardrails: result.outputGuardrails,
          validation: {
            isValid: validation.isValid,
            errors: validation.errors,
            warnings: validation.warnings,
          },
          retrieval: result.retrieval,
        },
        { headers: rateLimitHeaders }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'LLMConfigurationError') {
        return NextResponse.json(
          { error: 'AI service is not configured' },
          { status: 503, headers: rateLimitHeaders }
        );
      }
      // Check for retryable property on LLMError
      const llmError = error as { retryable?: boolean; name?: string };
      if (llmError.name === 'LLMError' && llmError.retryable) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable, please try again' },
          { status: 503, headers: rateLimitHeaders }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}