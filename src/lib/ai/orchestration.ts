/**
 * The RAG orchestration layer.
 *
 * This module wires together input guardrails, knowledge retrieval, prompt
 * construction, LLM generation, and output guardrails into a single pipeline
 * that processes a user message and returns an AI response.
 */

import { getSupabaseServiceRoleClient } from '../supabase.ts';
import { getLLMProvider } from '../llm/index.ts';
import { evaluateInput, applyOutputGuardrails, SUGGESTED_QUESTIONS } from '../guardrails/index.ts';
import { retrieveChunks, DEFAULT_RETRIEVAL_LIMIT, DEFAULT_SIMILARITY_THRESHOLD } from '../knowledge/retrieval.ts';
import type { RetrievalOptions } from '../knowledge/types.ts';
import type { LLMProvider, GenerationOptions, TokenUsage, FinishReason } from '../llm/provider.ts';
import type {
  ChatOrchestrationOptions,
  ChatOrchestrationResult,
  ChatOrchestrationStreamChunk,
  OrchestrationMetrics,
} from './types.ts';
import {
  SYSTEM_INSTRUCTION,
  buildPromptContext,
} from './promptTemplates.ts';

/**
 * The default temperature for generation.
 */
export const DEFAULT_TEMPERATURE = 0.3;

/**
 * The default maximum tokens for generation.
 */
export const DEFAULT_MAX_TOKENS = 1024;

/**
 * Processes a chat message through the full RAG pipeline (non-streaming).
 *
 * @param message The user's message.
 * @param options Orchestration options.
 * @returns The orchestration result with the generated response and metadata.
 */
export async function processChatMessage(
  message: string,
  options: ChatOrchestrationOptions = {}
): Promise<ChatOrchestrationResult> {
  const metrics: Partial<OrchestrationMetrics> = {};
  const startedAt = Date.now();
  const queryId = options.queryId ?? crypto.randomUUID();

  // 1. Input guardrails
  const guardrailsStartedAt = Date.now();
  const inputResult = evaluateInput(message, { queryId });
  metrics.inputGuardrailsMs = Date.now() - guardrailsStartedAt;
  metrics.inputAction = inputResult.action;

  // If input is not allowed, return redirect without retrieval/generation
  if (!inputResult.allowed) {
    const redirect = inputResult.redirect ?? {
      message: 'I can only help with questions about Ankit\'s professional background.',
      suggestions: SUGGESTED_QUESTIONS.slice(0, 5),
    };

    metrics.totalMs = Date.now() - startedAt;
    metrics.isRedirect = true;
    metrics.outputAction = 'output_allowed';

    return {
      text: redirect.message,
      tokenUsage: null,
      finishReason: 'other',
      model: 'guardrail',
      inputGuardrails: inputResult,
      outputGuardrails: {
        text: redirect.message,
        isValid: true,
        wasRedacted: false,
        violations: [],
        action: 'output_allowed',
      },
      retrieval: {
        query: inputResult.query,
        chunks: [],
        durationMs: 0,
        averageSimilarity: null,
      },
      isRedirect: true,
      suggestions: redirect.suggestions,
    };
  }

  // 2. Retrieve relevant knowledge
  const retrievalStartedAt = Date.now();
  const supabase = getSupabaseServiceRoleClient();
  const retrievalOptions: RetrievalOptions = {
    limit: options.retrievalLimit ?? DEFAULT_RETRIEVAL_LIMIT,
    minSimilarity: options.minSimilarity ?? DEFAULT_SIMILARITY_THRESHOLD,
    logMetrics: true,
  };
  const retrievalResult = await retrieveChunks(inputResult.query, retrievalOptions, supabase);
  metrics.retrievalMs = Date.now() - retrievalStartedAt;
  metrics.chunksRetrieved = retrievalResult.chunks.length;
  metrics.averageSimilarity = retrievalResult.averageSimilarity;

  // 3. Build prompt
  const promptStartedAt = Date.now();
  const promptContext = buildPromptContext(
    inputResult.query,
    retrievalResult.chunks,
    options.history ?? []
  );
  metrics.promptConstructionMs = Date.now() - promptStartedAt;

  // 4. Generate response via LLM
  const generationStartedAt = Date.now();
  const provider = await getLLMProvider();

  const generationOptions: GenerationOptions = {
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    systemInstruction: SYSTEM_INSTRUCTION,
    signal: options.signal,
  };

  const generationResult = await provider.generate(promptContext.fullPrompt, generationOptions);
  metrics.generationMs = Date.now() - generationStartedAt;
  metrics.tokenUsage = generationResult.tokenUsage;

  // 5. Output guardrails
  const outputGuardrailsStartedAt = Date.now();
  const outputResult = applyOutputGuardrails(generationResult.text, { queryId });
  metrics.outputGuardrailsMs = Date.now() - outputGuardrailsStartedAt;
  metrics.outputAction = outputResult.action;

  metrics.totalMs = Date.now() - startedAt;
  metrics.isRedirect = false;

  // Log metrics
  console.log(
    `[orchestration] queryId=${queryId} ` +
      `total=${metrics.totalMs}ms ` +
      `guardrails=${metrics.inputGuardrailsMs}ms ` +
      `retrieval=${metrics.retrievalMs}ms ` +
      `prompt=${metrics.promptConstructionMs}ms ` +
      `generation=${metrics.generationMs}ms ` +
      `outputGuardrails=${metrics.outputGuardrailsMs}ms ` +
      `chunks=${metrics.chunksRetrieved} ` +
      `avgSim=${metrics.averageSimilarity?.toFixed(3) ?? 'n/a'} ` +
      `tokens=${metrics.tokenUsage?.totalTokens ?? 'n/a'} ` +
      `inputAction=${metrics.inputAction} ` +
      `outputAction=${metrics.outputAction}`
  );

  return {
    text: outputResult.text,
    tokenUsage: generationResult.tokenUsage,
    finishReason: generationResult.finishReason,
    model: generationResult.model,
    inputGuardrails: inputResult,
    outputGuardrails: outputResult,
    retrieval: retrievalResult,
    isRedirect: false,
  };
}

/**
 * Processes a chat message through the full RAG pipeline with streaming.
 *
 * @param message The user's message.
 * @param options Orchestration options.
 * @returns An async iterable that yields response chunks.
 */
export async function* processChatMessageStream(
  message: string,
  options: ChatOrchestrationOptions = {}
): AsyncIterable<ChatOrchestrationStreamChunk> {
  const metrics: Partial<OrchestrationMetrics> = {};
  const startedAt = Date.now();
  const queryId = options.queryId ?? crypto.randomUUID();

  // 1. Input guardrails
  const guardrailsStartedAt = Date.now();
  const inputResult = evaluateInput(message, { queryId });
  metrics.inputGuardrailsMs = Date.now() - guardrailsStartedAt;
  metrics.inputAction = inputResult.action;

  // If input is not allowed, yield redirect and return
  if (!inputResult.allowed) {
    const redirect = inputResult.redirect ?? {
      message: 'I can only help with questions about Ankit\'s professional background.',
      suggestions: SUGGESTED_QUESTIONS.slice(0, 5),
    };

    yield {
      text: redirect.message,
      done: true,
      tokenUsage: null,
      finishReason: 'other',
      model: 'guardrail',
      inputGuardrails: inputResult,
      outputGuardrails: {
        text: redirect.message,
        isValid: true,
        wasRedacted: false,
        violations: [],
        action: 'output_allowed',
      },
      retrieval: {
        query: inputResult.query,
        chunks: [],
        durationMs: 0,
        averageSimilarity: null,
      },
      isRedirect: true,
      suggestions: redirect.suggestions,
    };
    return;
  }

  // Yield input guardrails info on first chunk
  const firstChunkYielded = { current: false };

  // 2. Retrieve relevant knowledge
  const retrievalStartedAt = Date.now();
  const supabase = getSupabaseServiceRoleClient();
  const retrievalOptions: RetrievalOptions = {
    limit: options.retrievalLimit ?? DEFAULT_RETRIEVAL_LIMIT,
    minSimilarity: options.minSimilarity ?? DEFAULT_SIMILARITY_THRESHOLD,
    logMetrics: true,
  };
  const retrievalResult = await retrieveChunks(inputResult.query, retrievalOptions, supabase);
  metrics.retrievalMs = Date.now() - retrievalStartedAt;
  metrics.chunksRetrieved = retrievalResult.chunks.length;
  metrics.averageSimilarity = retrievalResult.averageSimilarity;

  // 3. Build prompt
  const promptStartedAt = Date.now();
  const promptContext = buildPromptContext(
    inputResult.query,
    retrievalResult.chunks,
    options.history ?? []
  );
  metrics.promptConstructionMs = Date.now() - promptStartedAt;

  // 4. Generate response via LLM (streaming)
  const generationStartedAt = Date.now();
  const provider = await getLLMProvider();

  const generationOptions: GenerationOptions = {
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    systemInstruction: SYSTEM_INSTRUCTION,
    signal: options.signal,
  };

  let fullText = '';
  let tokenUsage: TokenUsage | null = null;
  let finishReason: FinishReason = 'stop';
  let model = 'gemini';

  try {
    for await (const chunk of provider.stream(promptContext.fullPrompt, generationOptions)) {
      fullText += chunk.text;

      if (chunk.tokenUsage) {
        tokenUsage = chunk.tokenUsage;
      }
      finishReason = chunk.finishReason;
      model = chunk.model;

      // Yield first chunk with metadata
      if (!firstChunkYielded.current) {
        firstChunkYielded.current = true;
        yield {
          text: chunk.text,
          done: false,
          inputGuardrails: inputResult,
          retrieval: retrievalResult,
          isRedirect: false,
        };
      } else {
        yield {
          text: chunk.text,
          done: false,
        };
      }
    }
  } catch (error) {
    // If streaming fails, yield error chunk
    const errorMessage = 'I encountered an error generating the response. Please try again.';
    yield {
      text: errorMessage,
      done: true,
      tokenUsage: null,
      finishReason: 'other',
      model: 'error',
      inputGuardrails: inputResult,
      outputGuardrails: {
        text: errorMessage,
        isValid: true,
        wasRedacted: false,
        violations: [],
        action: 'output_allowed',
      },
      retrieval: retrievalResult,
      isRedirect: false,
    };
    throw error;
  }

  metrics.generationMs = Date.now() - generationStartedAt;
  metrics.tokenUsage = tokenUsage;

  // 5. Output guardrails on complete response
  const outputGuardrailsStartedAt = Date.now();
  const outputResult = applyOutputGuardrails(fullText, { queryId });
  metrics.outputGuardrailsMs = Date.now() - outputGuardrailsStartedAt;
  metrics.outputAction = outputResult.action;

  // If output was redacted, we need to send the corrected version
  // Since we already streamed the original, we send a final chunk with the corrected text
  // The UI should replace the accumulated text with this final version
  const finalText = outputResult.text;

  metrics.totalMs = Date.now() - startedAt;
  metrics.isRedirect = false;

  // Log metrics
  console.log(
    `[orchestration:stream] queryId=${queryId} ` +
      `total=${metrics.totalMs}ms ` +
      `guardrails=${metrics.inputGuardrailsMs}ms ` +
      `retrieval=${metrics.retrievalMs}ms ` +
      `prompt=${metrics.promptConstructionMs}ms ` +
      `generation=${metrics.generationMs}ms ` +
      `outputGuardrails=${metrics.outputGuardrailsMs}ms ` +
      `chunks=${metrics.chunksRetrieved} ` +
      `avgSim=${metrics.averageSimilarity?.toFixed(3) ?? 'n/a'} ` +
      `tokens=${metrics.tokenUsage?.totalTokens ?? 'n/a'} ` +
      `inputAction=${metrics.inputAction} ` +
      `outputAction=${metrics.outputAction}`
  );

  // Yield final chunk with metadata
  yield {
    text: finalText,
    done: true,
    tokenUsage,
    finishReason,
    model,
    outputGuardrails: outputResult,
    isRedirect: false,
  };
}

/**
 * Creates an orchestration service with a specific LLM provider.
 * Useful for testing with a mock provider.
 *
 * @param provider The LLM provider to use.
 * @returns An object with process and processStream methods.
 */
export function createOrchestrationService(provider: LLMProvider) {
  return {
    /**
     * Processes a chat message (non-streaming).
     */
    async process(message: string, options: ChatOrchestrationOptions = {}): Promise<ChatOrchestrationResult> {
      const metrics: Partial<OrchestrationMetrics> = {};
      const startedAt = Date.now();
      const queryId = options.queryId ?? crypto.randomUUID();

      // Input guardrails
      const guardrailsStartedAt = Date.now();
      const inputResult = evaluateInput(message, { queryId });
      metrics.inputGuardrailsMs = Date.now() - guardrailsStartedAt;
      metrics.inputAction = inputResult.action;

      if (!inputResult.allowed) {
        const redirect = inputResult.redirect ?? {
          message: 'I can only help with questions about Ankit\'s professional background.',
          suggestions: SUGGESTED_QUESTIONS.slice(0, 5),
        };

        metrics.totalMs = Date.now() - startedAt;
        metrics.isRedirect = true;
        metrics.outputAction = 'output_allowed';

        return {
          text: redirect.message,
          tokenUsage: null,
          finishReason: 'other',
          model: 'guardrail',
          inputGuardrails: inputResult,
          outputGuardrails: {
            text: redirect.message,
            isValid: true,
            wasRedacted: false,
            violations: [],
            action: 'output_allowed',
          },
          retrieval: {
            query: inputResult.query,
            chunks: [],
            durationMs: 0,
            averageSimilarity: null,
          },
          isRedirect: true,
          suggestions: redirect.suggestions,
        };
      }

      // Retrieval
      const retrievalStartedAt = Date.now();
      const supabase = getSupabaseServiceRoleClient();
      const retrievalOptions: RetrievalOptions = {
        limit: options.retrievalLimit ?? DEFAULT_RETRIEVAL_LIMIT,
        minSimilarity: options.minSimilarity ?? DEFAULT_SIMILARITY_THRESHOLD,
        logMetrics: true,
      };
      const retrievalResult = await retrieveChunks(inputResult.query, retrievalOptions, supabase);
      metrics.retrievalMs = Date.now() - retrievalStartedAt;
      metrics.chunksRetrieved = retrievalResult.chunks.length;
      metrics.averageSimilarity = retrievalResult.averageSimilarity;

      // Build prompt
      const promptStartedAt = Date.now();
      const promptContext = buildPromptContext(
        inputResult.query,
        retrievalResult.chunks,
        options.history ?? []
      );
      metrics.promptConstructionMs = Date.now() - promptStartedAt;

      // Generation
      const generationStartedAt = Date.now();
      const generationOptions: GenerationOptions = {
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        systemInstruction: SYSTEM_INSTRUCTION,
        signal: options.signal,
      };
      const generationResult = await provider.generate(promptContext.fullPrompt, generationOptions);
      metrics.generationMs = Date.now() - generationStartedAt;
      metrics.tokenUsage = generationResult.tokenUsage;

      // Output guardrails
      const outputGuardrailsStartedAt = Date.now();
      const outputResult = applyOutputGuardrails(generationResult.text, { queryId });
      metrics.outputGuardrailsMs = Date.now() - outputGuardrailsStartedAt;
      metrics.outputAction = outputResult.action;

      metrics.totalMs = Date.now() - startedAt;
      metrics.isRedirect = false;

      console.log(
        `[orchestration] queryId=${queryId} ` +
          `total=${metrics.totalMs}ms ` +
          `guardrails=${metrics.inputGuardrailsMs}ms ` +
          `retrieval=${metrics.retrievalMs}ms ` +
          `prompt=${metrics.promptConstructionMs}ms ` +
          `generation=${metrics.generationMs}ms ` +
          `outputGuardrails=${metrics.outputGuardrailsMs}ms ` +
          `chunks=${metrics.chunksRetrieved} ` +
          `avgSim=${metrics.averageSimilarity?.toFixed(3) ?? 'n/a'} ` +
          `tokens=${metrics.tokenUsage?.totalTokens ?? 'n/a'} ` +
          `inputAction=${metrics.inputAction} ` +
          `outputAction=${metrics.outputAction}`
      );

      return {
        text: outputResult.text,
        tokenUsage: generationResult.tokenUsage,
        finishReason: generationResult.finishReason,
        model: generationResult.model,
        inputGuardrails: inputResult,
        outputGuardrails: outputResult,
        retrieval: retrievalResult,
        isRedirect: false,
      };
    },

    /**
     * Processes a chat message with streaming.
     */
    async *processStream(
      message: string,
      options: ChatOrchestrationOptions = {}
    ): AsyncIterable<ChatOrchestrationStreamChunk> {
      const metrics: Partial<OrchestrationMetrics> = {};
      const startedAt = Date.now();
      const queryId = options.queryId ?? crypto.randomUUID();

      // Input guardrails
      const guardrailsStartedAt = Date.now();
      const inputResult = evaluateInput(message, { queryId });
      metrics.inputGuardrailsMs = Date.now() - guardrailsStartedAt;
      metrics.inputAction = inputResult.action;

      if (!inputResult.allowed) {
        const redirect = inputResult.redirect ?? {
          message: 'I can only help with questions about Ankit\'s professional background.',
          suggestions: SUGGESTED_QUESTIONS.slice(0, 5),
        };

        yield {
          text: redirect.message,
          done: true,
          tokenUsage: null,
          finishReason: 'other',
          model: 'guardrail',
          inputGuardrails: inputResult,
          outputGuardrails: {
            text: redirect.message,
            isValid: true,
            wasRedacted: false,
            violations: [],
            action: 'output_allowed',
          },
          retrieval: {
            query: inputResult.query,
            chunks: [],
            durationMs: 0,
            averageSimilarity: null,
          },
          isRedirect: true,
          suggestions: redirect.suggestions,
        };
        return;
      }

      const firstChunkYielded = { current: false };

      // Retrieval
      const retrievalStartedAt = Date.now();
      const supabase = getSupabaseServiceRoleClient();
      const retrievalOptions: RetrievalOptions = {
        limit: options.retrievalLimit ?? DEFAULT_RETRIEVAL_LIMIT,
        minSimilarity: options.minSimilarity ?? DEFAULT_SIMILARITY_THRESHOLD,
        logMetrics: true,
      };
      const retrievalResult = await retrieveChunks(inputResult.query, retrievalOptions, supabase);
      metrics.retrievalMs = Date.now() - retrievalStartedAt;
      metrics.chunksRetrieved = retrievalResult.chunks.length;
      metrics.averageSimilarity = retrievalResult.averageSimilarity;

      // Build prompt
      const promptStartedAt = Date.now();
      const promptContext = buildPromptContext(
        inputResult.query,
        retrievalResult.chunks,
        options.history ?? []
      );
      metrics.promptConstructionMs = Date.now() - promptStartedAt;

      // Generation (streaming)
      const generationStartedAt = Date.now();
      const generationOptions: GenerationOptions = {
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        systemInstruction: SYSTEM_INSTRUCTION,
        signal: options.signal,
      };

      let fullText = '';
      let tokenUsage: TokenUsage | null = null;
      let finishReason: FinishReason = 'stop';
      let model = 'gemini';

      try {
        for await (const chunk of provider.stream(promptContext.fullPrompt, generationOptions)) {
          fullText += chunk.text;

          if (chunk.tokenUsage) {
            tokenUsage = chunk.tokenUsage;
          }
          finishReason = chunk.finishReason;
          model = chunk.model;

          if (!firstChunkYielded.current) {
            firstChunkYielded.current = true;
            yield {
              text: chunk.text,
              done: false,
              inputGuardrails: inputResult,
              retrieval: retrievalResult,
              isRedirect: false,
            };
          } else {
            yield {
              text: chunk.text,
              done: false,
            };
          }
        }
      } catch (error) {
        const errorMessage = 'I encountered an error generating the response. Please try again.';
        yield {
          text: errorMessage,
          done: true,
          tokenUsage: null,
          finishReason: 'other',
          model: 'error',
          inputGuardrails: inputResult,
          outputGuardrails: {
            text: errorMessage,
            isValid: true,
            wasRedacted: false,
            violations: [],
            action: 'output_allowed',
          },
          retrieval: retrievalResult,
          isRedirect: false,
        };
        throw error;
      }

      metrics.generationMs = Date.now() - generationStartedAt;
      metrics.tokenUsage = tokenUsage;

      // Output guardrails
      const outputGuardrailsStartedAt = Date.now();
      const outputResult = applyOutputGuardrails(fullText, { queryId });
      metrics.outputGuardrailsMs = Date.now() - outputGuardrailsStartedAt;
      metrics.outputAction = outputResult.action;

      const finalText = outputResult.text;

      metrics.totalMs = Date.now() - startedAt;
      metrics.isRedirect = false;

      console.log(
        `[orchestration:stream] queryId=${queryId} ` +
          `total=${metrics.totalMs}ms ` +
          `guardrails=${metrics.inputGuardrailsMs}ms ` +
          `retrieval=${metrics.retrievalMs}ms ` +
          `prompt=${metrics.promptConstructionMs}ms ` +
          `generation=${metrics.generationMs}ms ` +
          `outputGuardrails=${metrics.outputGuardrailsMs}ms ` +
          `chunks=${metrics.chunksRetrieved} ` +
          `avgSim=${metrics.averageSimilarity?.toFixed(3) ?? 'n/a'} ` +
          `tokens=${metrics.tokenUsage?.totalTokens ?? 'n/a'} ` +
          `inputAction=${metrics.inputAction} ` +
          `outputAction=${metrics.outputAction}`
      );

      yield {
        text: finalText,
        done: true,
        tokenUsage,
        finishReason,
        model,
        outputGuardrails: outputResult,
        isRedirect: false,
      };
    },
  };
}