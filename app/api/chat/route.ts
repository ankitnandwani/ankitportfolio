import { NextRequest, NextResponse } from 'next/server';
import {
  processChatMessage,
  processChatMessageStream,
  type ChatOrchestrationOptions,
} from '@/src/lib/ai';

/**
 * POST /api/chat
 *
 * Handles chat requests through the RAG orchestration pipeline.
 * Supports both streaming and non-streaming responses.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, stream = true, retrievalLimit, minSimilarity, temperature, maxTokens } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
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

            for await (const chunk of processChatMessageStream(message, options)) {
              // For the first chunk, include metadata
              // For subsequent chunks, only send the text
              if (firstChunk) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
                firstChunk = false;
              } else if (chunk.done) {
                // Final chunk with metadata
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
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
        },
      });
    } else {
      // Non-streaming response using the orchestration layer
      const result = await processChatMessage(message, options);

      return NextResponse.json({
        text: result.text,
        tokenUsage: result.tokenUsage,
        finishReason: result.finishReason,
        model: result.model,
        isRedirect: result.isRedirect,
        suggestions: result.suggestions,
        wasRedacted: result.outputGuardrails.wasRedacted,
        inputGuardrails: result.inputGuardrails,
        outputGuardrails: result.outputGuardrails,
        retrieval: result.retrieval,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'LLMConfigurationError') {
        return NextResponse.json(
          { error: 'AI service is not configured' },
          { status: 503 }
        );
      }
      // Check for retryable property on LLMError
      const llmError = error as { retryable?: boolean; name?: string };
      if (llmError.name === 'LLMError' && llmError.retryable) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable, please try again' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}