/**
 * Types for the AI orchestration layer.
 *
 * These types define the contract between the chat UI, the API route, and the
 * RAG orchestration service. They are kept separate from the lower-level
 * provider and guardrail types so the orchestration layer can evolve independently.
 */

import type { RetrievalResult } from '../knowledge/types.ts';
import type { InputGuardrailResult, OutputGuardrailResult } from '../guardrails/pipeline.ts';
import type { TokenUsage, FinishReason } from '../llm/provider.ts';

/**
 * The options passed to the orchestration function.
 */
export interface ChatOrchestrationOptions {
  /**
   * The conversation history (excluding the current user message).
   * Used for context in the prompt.
   */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;

  /**
   * Whether to stream the response. Defaults to true.
   */
  stream?: boolean;

  /**
   * The maximum number of chunks to retrieve. Defaults to 5.
   */
  retrievalLimit?: number;

  /**
   * The minimum similarity threshold for retrieval. Defaults to 0.55.
   */
  minSimilarity?: number;

  /**
   * An optional signal to cancel the request.
   */
  signal?: AbortSignal;

  /**
   * A unique identifier for this query, used for logging and tracing.
   * If not provided, one will be generated.
   */
  queryId?: string;

  /**
   * Temperature for the LLM generation. Defaults to 0.3.
   */
  temperature?: number;

  /**
   * Maximum tokens for the LLM generation.
   */
  maxTokens?: number;
}

/**
 * The result of a successful orchestration (non-streaming).
 */
export interface ChatOrchestrationResult {
  /**
   * The generated response text.
   */
  text: string;

  /**
   * Token usage from the LLM provider.
   */
  tokenUsage: TokenUsage | null;

  /**
   * Why the model stopped generating.
   */
  finishReason: FinishReason;

  /**
   * The model that produced the answer.
   */
  model: string;

  /**
   * The input guardrail result.
   */
  inputGuardrails: InputGuardrailResult;

  /**
   * The output guardrail result.
   */
  outputGuardrails: OutputGuardrailResult;

  /**
   * The retrieval result.
   */
  retrieval: RetrievalResult;

  /**
   * Whether the response was a redirect (off-topic, injection, etc.).
   */
  isRedirect: boolean;

  /**
   * Suggested follow-up questions if this was a redirect.
   */
  suggestions?: string[];
}

/**
 * A chunk of a streaming response.
 */
export interface ChatOrchestrationStreamChunk {
  /**
   * The text chunk.
   */
  text: string;

  /**
   * Whether this is the final chunk.
   */
  done: boolean;

  /**
   * Token usage (only present on the final chunk).
   */
  tokenUsage?: TokenUsage | null;

  /**
   * Finish reason (only present on the final chunk).
   */
  finishReason?: FinishReason;

  /**
   * Model name (only present on the final chunk).
   */
  model?: string;

  /**
   * Input guardrail result (only present on the first chunk).
   */
  inputGuardrails?: InputGuardrailResult;

  /**
   * Output guardrail result (only present on the final chunk).
   */
  outputGuardrails?: OutputGuardrailResult;

  /**
   * Retrieval result (only present on the first chunk).
   */
  retrieval?: RetrievalResult;

  /**
   * Whether the response was a redirect.
   */
  isRedirect?: boolean;

  /**
   * Suggested follow-up questions if this was a redirect.
   */
  suggestions?: string[];
}

/**
 * The shape of a request to the chat API.
 */
export interface ChatAPIRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream?: boolean;
  retrievalLimit?: number;
  minSimilarity?: number;
}

/**
 * The shape of a non-streaming response from the chat API.
 */
export interface ChatAPIResponse {
  text: string;
  tokenUsage: TokenUsage | null;
  finishReason: FinishReason;
  model: string;
  isRedirect: boolean;
  suggestions?: string[];
  inputGuardrails?: InputGuardrailResult;
  outputGuardrails?: OutputGuardrailResult;
  retrieval?: RetrievalResult;
}

/**
 * The shape of a streaming response chunk from the chat API (SSE format).
 */
export interface ChatAPIStreamChunk {
  text: string;
  done?: boolean;
  tokenUsage?: TokenUsage | null;
  finishReason?: FinishReason;
  model?: string;
  isRedirect?: boolean;
  suggestions?: string[];
  inputGuardrails?: InputGuardrailResult;
  outputGuardrails?: OutputGuardrailResult;
  retrieval?: RetrievalResult;
}

/**
 * The context built for the LLM prompt.
 */
export interface PromptContext {
  /**
   * The system instruction.
   */
  systemInstruction: string;

  /**
   * The retrieved context chunks, formatted for the prompt.
   */
  context: string;

  /**
   * The conversation history, formatted for the prompt.
   */
  history: string;

  /**
   * The user's current message.
   */
  userMessage: string;

  /**
   * The full prompt ready to send to the LLM.
   */
  fullPrompt: string;
}

/**
 * Metrics collected during orchestration.
 */
export interface OrchestrationMetrics {
  /**
   * Time taken for input guardrails, in milliseconds.
   */
  inputGuardrailsMs: number;

  /**
   * Time taken for retrieval, in milliseconds.
   */
  retrievalMs: number;

  /**
   * Time taken for prompt construction, in milliseconds.
   */
  promptConstructionMs: number;

  /**
   * Time taken for LLM generation, in milliseconds.
   */
  generationMs: number;

  /**
   * Time taken for output guardrails, in milliseconds.
   */
  outputGuardrailsMs: number;

  /**
   * Total time, in milliseconds.
   */
  totalMs: number;

  /**
   * Token usage from the LLM.
   */
  tokenUsage: TokenUsage | null;

  /**
   * Number of chunks retrieved.
   */
  chunksRetrieved: number;

  /**
   * Average similarity of retrieved chunks.
   */
  averageSimilarity: number | null;

  /**
   * Whether a redirect was returned.
   */
  isRedirect: boolean;

  /**
   * The guardrail action taken on input.
   */
  inputAction: string;

  /**
   * The guardrail action taken on output.
   */
  outputAction: string;
}