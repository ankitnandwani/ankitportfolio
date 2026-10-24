import {
  GoogleGenAI,
  type Content,
  type GenerateContentConfig,
  type GenerateContentResponse,
} from '@google/genai';

import { readErrorDetails } from '../geminiErrors.ts';
import { isRetryableError, withRetry } from '../retry.ts';
import {
  LLMConfigurationError,
  LLMError,
  type FinishReason,
  type GenerationOptions,
  type GenerationResult,
  type LLMProvider,
  type TokenUsage,
} from './provider.ts';

/**
 * The default number of attempts for a request.
 */
const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * The default delay before the first retry, in milliseconds.
 */
const DEFAULT_BASE_DELAY_MS = 1000;

/**
 * The default time a request may take, in milliseconds.
 *
 * A model that thinks before it answers regularly needs more than half a
 * minute for a short question, so the limit has to be generous. A streaming
 * answer restarts the limit every time a piece arrives, so it is not held
 * back by a slow first piece.
 */
const DEFAULT_TIMEOUT_MS = 60000;

/**
 * The options for the Gemini provider.
 */
export interface GeminiProviderOptions {
  /**
   * The API key. It is only ever used on the server.
   */
  apiKey: string;

  /**
   * The model to use, for example `gemini-flash-latest`.
   */
  model: string;

  /**
   * The client to talk to the API with. The tests pass a double in here.
   */
  client?: GoogleGenAI;

  /**
   * The temperature used when a call does not set one.
   */
  temperature?: number;

  /**
   * The largest number of tokens the answer may use.
   */
  maxTokens?: number;

  /**
   * The nucleus sampling threshold used when a call does not set one.
   */
  topP?: number;

  /**
   * How many tokens the model may spend on thinking before it answers.
   *
   * Zero turns the thinking off, which makes a short question answer much
   * faster. It is left to the model when it is not set. This is a setting of
   * the Gemini adapter, so it is not part of the provider interface.
   */
  thinkingBudget?: number;

  /**
   * How long a request may take, in milliseconds.
   */
  timeoutMs?: number;

  /**
   * How many times a retryable failure is retried.
   */
  maxAttempts?: number;

  /**
   * The delay before the first retry, in milliseconds. It doubles after
   * every attempt.
   */
  baseDelayMs?: number;

  /**
   * Waits between retries. Used by the tests to avoid waiting.
   */
  wait?: (milliseconds: number) => Promise<void>;
}

/**
 * Maps the finish reasons of the Gemini API onto the provider independent
 * ones.
 */
const FINISH_REASONS: Record<string, FinishReason> = {
  STOP: 'stop',
  MAX_TOKENS: 'max_tokens',
  SAFETY: 'safety',
  RECITATION: 'recitation',
  LANGUAGE: 'language',
  BLOCKLIST: 'blocklist',
  PROHIBITED_CONTENT: 'prohibited_content',
  SPII: 'spii',
  MALFORMED_FUNCTION_CALL: 'malformed_function_call',
  IMAGE_SAFETY: 'image_safety',
  UNEXPECTED_TOOL_CALL: 'unexpected_tool_call',
  TOO_MANY_TOOL_CALLS: 'too_many_tool_calls',
  OTHER: 'other',
  FINISH_REASON_UNSPECIFIED: 'unknown',
};

/**
 * Turns a finish reason of the API into a provider independent one.
 */
function toFinishReason(reason: string | undefined): FinishReason {
  if (!reason) return 'unknown';
  return FINISH_REASONS[reason] ?? 'other';
}

/**
 * Turns the usage metadata of the API into the provider independent shape.
 */
function toTokenUsage(
  usage: GenerateContentResponse['usageMetadata']
): TokenUsage | null {
  if (!usage) return null;

  const promptTokens = usage.promptTokenCount ?? null;
  const completionTokens = usage.candidatesTokenCount ?? null;
  const totalTokens = usage.totalTokenCount ?? null;

  if (promptTokens === null && completionTokens === null && totalTokens === null) {
    return null;
  }

  return { promptTokens, completionTokens, totalTokens };
}

/**
 * Turns a response of the API into the provider independent shape.
 */
function toGenerationResult(
  response: GenerateContentResponse,
  model: string
): GenerationResult {
  return {
    text: response.text ?? '',
    tokenUsage: toTokenUsage(response.usageMetadata),
    finishReason: toFinishReason(response.candidates?.[0]?.finishReason),
    model,
  };
}

/**
 * Waits for the given number of milliseconds.
 */
function defaultWait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * The Google Gemini implementation of the LLM provider.
 *
 * It is the only place in the application that talks to the Gemini
 * generation API, so the rest of the code works against the LLMProvider
 * interface and never against Gemini specific types (PRD §49).
 */
export class GeminiProvider implements LLMProvider {
  /**
   * The name of the provider.
   */
  readonly name = 'gemini';

  /**
   * The client that talks to the API.
   */
  private readonly client: GoogleGenAI;

  /**
   * The model that is asked for an answer.
   */
  private readonly model: string;

  /**
   * The API key. It is kept so that it can be removed from an error message.
   */
  private readonly apiKey: string;

  /**
   * The temperature used when a call does not set one.
   */
  private readonly temperature: number | undefined;

  /**
   * The largest number of tokens the answer may use.
   */
  private readonly maxTokens: number | undefined;

  /**
   * The nucleus sampling threshold used when a call does not set one.
   */
  private readonly topP: number | undefined;

  /**
   * How many tokens the model may spend on thinking before it answers.
   */
  private readonly thinkingBudget: number | undefined;

  /**
   * How long a request may take, in milliseconds.
   */
  private readonly timeoutMs: number;

  /**
   * How many times a retryable failure is retried.
   */
  private readonly maxAttempts: number;

  /**
   * The delay before the first retry, in milliseconds.
   */
  private readonly baseDelayMs: number;

  /**
   * Waits between retries.
   */
  private readonly wait: (milliseconds: number) => Promise<void>;

  /**
   * Creates the provider.
   *
   * @param options The API key, the model and the defaults.
   * @throws LLMConfigurationError when the configuration is not usable.
   */
  constructor(options: GeminiProviderOptions) {
    const apiKey = (options.apiKey ?? '').trim();

    if (!apiKey) {
      throw new LLMConfigurationError(
        'The Gemini API key is missing. Set GEMINI_API_KEY to a valid key.'
      );
    }

    const model = (options.model ?? '').trim();

    if (!model) {
      throw new LLMConfigurationError(
        'The Gemini model is missing. Set GEMINI_MODEL to the model to use.'
      );
    }

    this.apiKey = apiKey;
    this.model = model;
    this.client = options.client ?? new GoogleGenAI({ apiKey });
    this.temperature = validateTemperature(options.temperature, 'temperature');
    this.maxTokens = validateMaxTokens(options.maxTokens);
    this.topP = validateTopP(options.topP);
    this.thinkingBudget = validateThinkingBudget(options.thinkingBudget);
    this.timeoutMs = validateTimeout(options.timeoutMs) ?? DEFAULT_TIMEOUT_MS;
    this.maxAttempts = validateMaxAttempts(options.maxAttempts);
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.wait = options.wait ?? defaultWait;
  }

  /**
   * Generates a complete answer.
   *
   * @param prompt The instruction for the model.
   * @param options The generation options.
   * @returns The generated answer.
   * @throws LLMError when the request fails.
   */
  async generate(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const contents = toContents(prompt);

    const response = await this.request(
      (signal) =>
        this.client.models.generateContent({
          model: this.model,
          contents,
          config: { ...this.buildConfig(options), abortSignal: signal },
        }),
      options
    );

    return toGenerationResult(response, this.model);
  }

  /**
   * Generates an answer in pieces.
   *
   * A failure before the first piece is retried, because nothing has been
   * handed to the caller yet. A failure later is reported as it is, because
   * repeating the request would repeat what the caller already shows.
   *
   * @param prompt The instruction for the model.
   * @param options The generation options.
   * @returns The pieces of the answer.
   * @throws LLMError when the request fails.
   */
  async *stream(
    prompt: string,
    options: GenerationOptions = {}
  ): AsyncIterable<GenerationResult> {
    const contents = toContents(prompt);
    const maxAttempts = options.maxAttempts ?? this.maxAttempts;

    for (let attempt = 1; ; attempt++) {
      let stream: AsyncGenerator<GenerateContentResponse>;

      try {
        stream = await this.openStream(contents, options);
      } catch (error) {
        const failure = this.toError(error, false, options.signal?.aborted);

        if (attempt < maxAttempts && isRetryableError(failure)) {
          await this.wait(this.baseDelayMs * 2 ** (attempt - 1));
          continue;
        }

        throw failure;
      }

      // The caller holds the answer in pieces from here on, so a failure
      // cannot be retried without repeating what was already said.
      let handingOver = false;
      let delivered = false;

      try {
        for await (const chunk of stream) {
          delivered = true;
          handingOver = true;
          yield toGenerationResult(chunk, this.model);
          handingOver = false;
        }

        return;
      } catch (error) {
        // A failure while a piece is being handed over comes from the
        // caller, not from the provider, so it is passed on unchanged.
        if (handingOver) throw error;

        const failure = this.toError(error, false, options.signal?.aborted);

        // Nothing has been handed over yet, so the request can be made again.
        if (
          !delivered &&
          attempt < maxAttempts &&
          isRetryableError(failure)
        ) {
          await this.wait(this.baseDelayMs * 2 ** (attempt - 1));
          continue;
        }

        throw failure;
      }
    }
  }

  /**
   * Runs a request against the API with a timeout and a retry.
   *
   * @param send The request to make.
   * @param options The generation options.
   */
  private async request<T>(
    send: (signal: AbortSignal) => Promise<T>,
    options: GenerationOptions
  ): Promise<T> {
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const maxAttempts = options.maxAttempts ?? this.maxAttempts;

    return withRetry(
      async () => {
        const controller = new AbortController();
        const timer =
          timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

        const signal = options.signal
          ? AbortSignal.any([controller.signal, options.signal])
          : controller.signal;

        try {
          return await send(signal);
        } catch (error) {
          if (options.signal?.aborted) {
            throw new LLMError(
              'The request was cancelled before Gemini answered.'
            );
          }

          throw this.toError(error, controller.signal.aborted);
        } finally {
          if (timer) clearTimeout(timer);
        }
      },
      {
        maxAttempts,
        baseDelayMs: this.baseDelayMs,
        wait: this.wait,
      }
    );
  }

  /**
   * Opens a stream of answers.
   *
   * The timeout covers the whole stream and restarts every time a piece
   * arrives, so a slow answer is still allowed to finish while a stream that
   * stops producing anything is cut off.
   *
   * @param contents The request to send.
   * @param options The generation options.
   */
  private async openStream(
    contents: Content[],
    options: GenerationOptions
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();

    const signal = options.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const arm = (): void => {
      if (timer) clearTimeout(timer);
      if (timeoutMs > 0) timer = setTimeout(() => controller.abort(), timeoutMs);
    };

    arm();

    try {
      const stream = await this.client.models.generateContentStream({
        model: this.model,
        contents,
        config: { ...this.buildConfig(options), abortSignal: signal },
      });

      return this.watch(stream, arm, () => {
        if (timer) clearTimeout(timer);
      });
    } catch (error) {
      if (timer) clearTimeout(timer);

      if (options.signal?.aborted) {
        throw new LLMError('The request was cancelled before Gemini answered.');
      }

      throw this.toError(error, controller.signal.aborted);
    }
  }

  /**
   * Watches a stream so that the timeout restarts on every piece.
   *
   * @param stream The stream of the API.
   * @param arm Restarts the timeout.
   * @param release Releases the timeout.
   */
  private async *watch(
    stream: AsyncGenerator<GenerateContentResponse>,
    arm: () => void,
    release: () => void
  ): AsyncGenerator<GenerateContentResponse> {
    try {
      for await (const chunk of stream) {
        arm();
        yield chunk;
      }
    } finally {
      release();
    }
  }

  /**
   * Builds the configuration of a request.
   *
   * @param options The generation options.
   */
  private buildConfig(options: GenerationOptions): GenerateContentConfig {
    const config: GenerateContentConfig = {};

    const temperature = options.temperature ?? this.temperature;
    if (temperature !== undefined) {
      config.temperature = validateTemperature(temperature, 'temperature');
    }

    const maxTokens = options.maxTokens ?? this.maxTokens;
    if (maxTokens !== undefined) {
      config.maxOutputTokens = validateMaxTokens(maxTokens);
    }

    const topP = options.topP ?? this.topP;
    if (topP !== undefined) {
      config.topP = validateTopP(topP);
    }

    if (this.thinkingBudget !== undefined) {
      config.thinkingConfig = { thinkingBudget: this.thinkingBudget };
    }

    if (options.stopSequences && options.stopSequences.length > 0) {
      config.stopSequences = [...options.stopSequences];
    }

    const systemInstruction = options.systemInstruction?.trim();
    if (systemInstruction) config.systemInstruction = systemInstruction;

    return config;
  }

  /**
   * Turns a failure into an error the caller can act on.
   *
   * @param error The failure.
   * @param timedOut Whether the request was cut off by the timeout.
   * @param cancelled Whether the caller cancelled the request.
   */
  private toError(
    error: unknown,
    timedOut = false,
    cancelled = false
  ): LLMError {
    if (error instanceof LLMError) return error;

    if (cancelled) {
      return new LLMError('The request was cancelled before Gemini answered.');
    }

    if (timedOut) {
      return new LLMError(
        `The request to ${this.model} timed out. The model did not answer in time.`,
        408
      );
    }

    const { message, status } = readErrorDetails(error);

    return new LLMError(this.describe(message, status), status);
  }

  /**
   * Writes a message that says what went wrong and how to fix it.
   *
   * The API key is removed from the message, so a failure can be logged or
   * shown without leaking the secret.
   *
   * @param message The message the API reported.
   * @param status The status the API reported.
   */
  private describe(message: string, status: number): string {
    const safe = this.redact(message);

    if (status === 400) {
      return `Gemini rejected the request (HTTP 400). ${safe}`;
    }

    if (status === 401 || status === 403) {
      return `Gemini rejected the API key or the request (HTTP ${status}). Check the API key and the model name. ${safe}`;
    }

    if (status === 404) {
      return `Gemini does not know the model "${this.model}" (HTTP 404). Check the value of GEMINI_MODEL. ${safe}`;
    }

    if (status === 429) {
      return `The Gemini API rate limit was reached (HTTP 429). ${safe}`;
    }

    if (status >= 500) {
      return `The Gemini API is unavailable (HTTP ${status}). ${safe}`;
    }

    if (status === 0) {
      return `The request to Gemini failed. ${safe}`;
    }

    return `The request to Gemini failed (HTTP ${status}). ${safe}`;
  }

  /**
   * Removes the API key from a message.
   *
   * @param message The message to clean.
   */
  private redact(message: string): string {
    if (!this.apiKey) return message;
    return message.split(this.apiKey).join('[redacted]');
  }
}

/**
 * Turns a prompt into the contents of a request.
 *
 * @param prompt The instruction for the model.
 * @throws LLMError when the prompt is empty.
 */
function toContents(prompt: string): Content[] {
  const text = (prompt ?? '').trim();

  if (!text) {
    throw new LLMError('The prompt is empty, so there is nothing to answer.');
  }

  return [{ role: 'user', parts: [{ text }] }];
}

/**
 * Checks that a temperature is inside the range the API accepts.
 *
 * @param value The temperature to check.
 * @param name The name used in the error message.
 * @throws LLMConfigurationError when the temperature is out of range.
 */
function validateTemperature(
  value: number | undefined,
  name: string
): number | undefined {
  if (value === undefined) return undefined;

  if (!Number.isFinite(value) || value < 0 || value > 2) {
    throw new LLMConfigurationError(
      `The ${name} has to be between 0 and 2, but it is ${value}.`
    );
  }

  return value;
}

/**
 * Checks that a token limit is a positive whole number.
 *
 * @param value The limit to check.
 * @throws LLMConfigurationError when the limit is not usable.
 */
function validateMaxTokens(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;

  if (!Number.isInteger(value) || value <= 0) {
    throw new LLMConfigurationError(
      `The maximum number of tokens has to be a positive whole number, but it is ${value}.`
    );
  }

  return value;
}

/**
 * Checks that a sampling threshold is inside the range the API accepts.
 *
 * @param value The threshold to check.
 * @throws LLMConfigurationError when the threshold is out of range.
 */
function validateTopP(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new LLMConfigurationError(
      `The topP has to be between 0 and 1, but it is ${value}.`
    );
  }

  return value;
}

/**
 * Checks that the thinking budget is a number of tokens the API accepts.
 *
 * @param value The budget to check.
 * @throws LLMConfigurationError when the budget is not usable.
 */
function validateThinkingBudget(
  value: number | undefined
): number | undefined {
  if (value === undefined) return undefined;

  if (!Number.isInteger(value) || value < 0) {
    throw new LLMConfigurationError(
      `The thinking budget has to be zero or a positive whole number, but it is ${value}.`
    );
  }

  return value;
}

/**
 * Checks that a timeout is a positive number of milliseconds.
 *
 * @param value The timeout to check.
 * @throws LLMConfigurationError when the timeout is not usable.
 */
function validateTimeout(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;

  if (!Number.isFinite(value) || value <= 0) {
    throw new LLMConfigurationError(
      `The timeout has to be a positive number of milliseconds, but it is ${value}.`
    );
  }

  return value;
}

/**
 * Checks that the number of attempts is at least one.
 *
 * @param value The number of attempts to check.
 * @throws LLMConfigurationError when the number is not usable.
 */
function validateMaxAttempts(value: number | undefined): number {
  if (value === undefined) return DEFAULT_MAX_ATTEMPTS;

  if (!Number.isInteger(value) || value < 1) {
    throw new LLMConfigurationError(
      `The number of attempts has to be at least one, but it is ${value}.`
    );
  }

  return value;
}
