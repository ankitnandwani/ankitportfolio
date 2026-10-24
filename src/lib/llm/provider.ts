/**
 * The contract every language model provider implements.
 *
 * PRD §48 asks for an LLMProvider interface, and PRD §49 states that no
 * application level code should depend directly on a provider specific API.
 * Everything a caller needs is therefore expressed with the plain types
 * declared here, so the Gemini implementation stays behind this boundary.
 *
 * This module deliberately has no imports, which keeps it usable from every
 * layer of the application.
 */

/**
 * Why the model stopped generating.
 *
 * The values are the ones every provider can express. A provider that
 * reports something else maps it to 'other' or 'unknown'.
 */
export type FinishReason =
  | 'stop'
  | 'max_tokens'
  | 'safety'
  | 'recitation'
  | 'language'
  | 'blocklist'
  | 'prohibited_content'
  | 'spii'
  | 'malformed_function_call'
  | 'image_safety'
  | 'unexpected_tool_call'
  | 'too_many_tool_calls'
  | 'other'
  | 'unknown';

/**
 * How many tokens a request used.
 *
 * Every count is optional because not every provider reports every count.
 */
export interface TokenUsage {
  /**
   * The tokens the prompt used.
   */
  promptTokens: number | null;

  /**
   * The tokens the answer used.
   */
  completionTokens: number | null;

  /**
   * The tokens the request used in total.
   */
  totalTokens: number | null;
}

/**
 * The options for a single generation.
 */
export interface GenerationOptions {
  /**
   * How random the answer may be. A lower value gives a more predictable
   * answer. The range is 0 to 2.
   */
  temperature?: number;

  /**
   * The largest number of tokens the answer may use.
   */
  maxTokens?: number;

  /**
   * The nucleus sampling threshold. The range is 0 to 1.
   */
  topP?: number;

  /**
   * The sequences that stop the generation.
   */
  stopSequences?: string[];

  /**
   * The instructions that describe how the model should answer.
   */
  systemInstruction?: string;

  /**
   * How long the request may take, in milliseconds. Defaults to the value
   * the provider was created with.
   */
  timeoutMs?: number;

  /**
   * A signal that cancels the request.
   */
  signal?: AbortSignal;

  /**
   * How many times a retryable failure is retried. Defaults to the value the
   * provider was created with.
   */
  maxAttempts?: number;
}

/**
 * The outcome of a generation.
 */
export interface GenerationResult {
  /**
   * The generated text.
   *
   * While streaming this is the part that was added by this chunk, not the
   * whole answer, so the caller joins the chunks to rebuild it.
   */
  text: string;

  /**
   * How many tokens the request used, when the provider reports it.
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
}

/**
 * A provider of language models.
 *
 * The interface is the only part of the AI stack the application code talks
 * to, so a different provider can be introduced without touching anything
 * that uses it.
 */
export interface LLMProvider {
  /**
   * The name of the provider.
   */
  readonly name: string;

  /**
   * Generates a complete answer.
   *
   * @param prompt The instruction for the model.
   * @param options The generation options.
   * @returns The generated answer.
   */
  generate(
    prompt: string,
    options?: GenerationOptions
  ): Promise<GenerationResult>;

  /**
   * Generates an answer in pieces.
   *
   * The chunks arrive as the model writes them, so the caller can show them
   * while they are still being produced. A failure that happens before the
   * first chunk is retried; one that happens later is reported, because the
   * caller already holds part of the answer.
   *
   * @param prompt The instruction for the model.
   * @param options The generation options.
   * @returns The pieces of the answer.
   */
  stream(
    prompt: string,
    options?: GenerationOptions
  ): AsyncIterable<GenerationResult>;
}

/**
 * A failure that came from the model provider.
 *
 * The status code is kept so a caller can tell a retryable failure from a
 * permanent one. The message never contains the API key.
 */
export class LLMError extends Error {
  /**
   * The status the provider reported, or 0 when it did not report one.
   */
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'LLMError';
    this.status = status;
  }

  /**
   * Whether another attempt could succeed.
   */
  get retryable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

/**
 * A failure caused by the configuration of the provider.
 *
 * A missing API key or a model name is a deployment problem, so it is
 * reported straight away instead of being retried.
 */
export class LLMConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMConfigurationError';
  }
}
