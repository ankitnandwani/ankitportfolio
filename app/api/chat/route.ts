import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider } from '@/src/lib/llm';
import { evaluateInput, applyOutputGuardrails, buildRedirect, SUGGESTED_QUESTIONS } from '@/src/lib/guardrails';
import { retrieveChunks } from '@/src/lib/knowledge/retrieval';
import { RetrievalOptions, RetrievedChunk } from '@/src/lib/knowledge/types';
import { getSupabaseServiceRoleClient } from '@/src/lib/supabase';
import { TokenUsage } from '@/src/lib/llm/provider';

/**
 * POST /api/chat
 *
 * Handles chat requests with guardrails, knowledge retrieval, and LLM generation.
 * Supports both streaming and non-streaming responses.
 */
export async function POST(request: NextRequest) {
  try {
    const { message, history, stream = true } = await request.json();

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

    // Apply input guardrails
    const queryId = crypto.randomUUID();
    const inputResult = evaluateInput(message, { queryId });

    if (!inputResult.allowed) {
      // Return redirect response for blocked queries
      const redirect = inputResult.redirect || buildRedirect('off_topic', {
        suggestions: SUGGESTED_QUESTIONS,
        suggestionCount: 5,
      });

      return NextResponse.json({
        text: redirect.message,
        redirect: true,
        suggestions: redirect.suggestions,
        tokenUsage: null,
        finishReason: 'guardrail',
        model: 'guardrail',
      });
    }

    // Retrieve relevant knowledge
    const supabase = getSupabaseServiceRoleClient();
    const retrievalOptions: RetrievalOptions = {
      limit: 5,
      minSimilarity: 0.55,
    };
    const retrievalResult = await retrieveChunks(inputResult.query, retrievalOptions, supabase);

    // Build context from retrieved chunks
    const context = retrievalResult.chunks
      .map((chunk: RetrievedChunk) => chunk.content)
      .join('\n\n---\n\n');

    // Build conversation history for context
    const historyText = history
      .slice(-6) // Last 6 messages for context
      .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Build system instruction
    const systemInstruction = `You are "Ask Ankit's AI", a helpful assistant that answers questions about Ankit Nandwani's professional background.

Your knowledge comes from a structured knowledge base covering his:
- Career experience and roles
- Technical skills and technologies
- Projects (professional, personal, engineering lab)
- Achievements and impact
- Education and certifications
- Professional philosophy and approach

Guidelines:
- Answer truthfully based only on the provided context
- If the context doesn't contain the answer, say you don't have that information
- Be concise but thorough
- Use a professional, helpful tone
- Don't speculate or hallucinate
- If asked about topics outside Ankit's professional profile, politely redirect
- Never share private contact information (phone, personal email)
- Format responses with clear structure when appropriate

Context from knowledge base:
${context || 'No relevant context found.'}

Recent conversation:
${historyText || 'No previous messages.'}`;

    // Get LLM provider
    const provider = await getLLMProvider();

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';
            let tokenUsage: TokenUsage = { promptTokens: null, completionTokens: null, totalTokens: null };
            let finishReason = 'stop';
            let model = 'gemini';

            for await (const chunk of provider.stream(systemInstruction + '\n\nUser: ' + message)) {
              fullText += chunk.text;

              if (chunk.tokenUsage) {
                tokenUsage = chunk.tokenUsage;
              }
              finishReason = chunk.finishReason;
              model = chunk.model;

              // Send chunk as SSE
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
            }

            // Apply output guardrails to the complete response
            const outputResult = applyOutputGuardrails(fullText, { queryId });

            // If output was blocked or redacted, send the sanitized version
            const finalText = outputResult.text;

            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
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
      // Non-streaming response
      const result = await provider.generate(systemInstruction + '\n\nUser: ' + message);

      // Apply output guardrails
      const outputResult = applyOutputGuardrails(result.text, { queryId });

      return NextResponse.json({
        text: outputResult.text,
        tokenUsage: result.tokenUsage,
        finishReason: result.finishReason,
        model: result.model,
        wasRedacted: outputResult.wasRedacted,
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