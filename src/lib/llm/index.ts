/**
 * The entry point of the language model layer.
 *
 * Application code imports from here, so it never depends on Gemini specific
 * APIs (PRD §49).
 */

export {
  LLMConfigurationError,
  LLMError,
  type FinishReason,
  type GenerationOptions,
  type GenerationResult,
  type LLMProvider,
  type TokenUsage,
} from './provider.ts';

export {
  GeminiProvider,
  type GeminiProviderOptions,
} from './geminiProvider.ts';

export {
  createLLMProvider,
  getLLMProvider,
  setLLMProvider,
  type CreateLLMProviderOptions,
} from './factory.ts';
