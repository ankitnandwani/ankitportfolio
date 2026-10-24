import { GeminiProvider } from './geminiProvider.ts';
import type { LLMProvider } from './provider.ts';

/**
 * The options for the provider the factory creates.
 */
export interface CreateLLMProviderOptions {
  /**
   * The model to use. Defaults to the value of GEMINI_MODEL.
   */
  model?: string;

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
   * How long a request may take, in milliseconds.
   */
  timeoutMs?: number;

  /**
   * How many times a retryable failure is retried.
   */
  maxAttempts?: number;
}

/**
 * Creates the provider from the environment.
 *
 * The environment is read when the provider is created rather than when this
 * module is loaded, so importing the provider does not require a complete
 * environment. That keeps the module usable from a server route and from a
 * test at the same time.
 *
 * @param options Overrides for the values of the environment.
 * @returns The provider.
 * @throws LLMConfigurationError when the environment is not usable.
 */
export async function createLLMProvider(
  options: CreateLLMProviderOptions = {}
): Promise<LLMProvider> {
  const { env } = await import('../env.ts');

  return new GeminiProvider({
    apiKey: env.GEMINI_API_KEY,
    model: options.model ?? env.GEMINI_MODEL,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    topP: options.topP,
    timeoutMs: options.timeoutMs,
    maxAttempts: options.maxAttempts,
  });
}

/**
 * The provider the application uses.
 */
let provider: LLMProvider | null = null;

/**
 * Returns the shared provider, creating it on first use.
 *
 * @returns The provider.
 */
export async function getLLMProvider(): Promise<LLMProvider> {
  if (!provider) {
    provider = await createLLMProvider();
  }

  return provider;
}

/**
 * Replaces the shared provider. Used by the tests.
 *
 * @param next The provider to use, or null to create a new one next time.
 */
export function setLLMProvider(next: LLMProvider | null): void {
  provider = next;
}
