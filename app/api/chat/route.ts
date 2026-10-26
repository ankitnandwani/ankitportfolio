import { NextRequest, NextResponse } from 'next/server';
import {
  getRateLimiter,
  processChatMessage,
  processChatMessageStream,
  validateResponse,
  type ChatOrchestrationOptions,
} from '@/src/lib/ai';

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

    const options: ChatOrchestrationOptions = {
      history,
      stream,
      retrievalLimit,
      minSimilarity,
      temperature,
      maxTokens,
      queryId: crypto.randomUUID(),
    };

    if (stream) {
      // Streaming response using the orchestration layer
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let firstChunk = true;
            let context = '';

            for await (const chunk of processChatMessageStream(message, options)) {
              if (firstChunk) {
                context = buildContext(chunk.retrieval?.chunks ?? []);
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
