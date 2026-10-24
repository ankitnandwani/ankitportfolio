import { LLMError } from './llm/provider.ts';

/**
 * The errors of the Gemini adapter.
 *
 * They live outside the Gemini module so that the provider can use them
 * without importing the environment, which the module does to read the
 * embedding configuration.
 */

/**
 * Raised when the Gemini API rejects a request.
 *
 * The status code is kept so callers can tell a retryable failure from a
 * permanent one. The message never contains the API key.
 */
export class GeminiApiError extends LLMError {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = 'GeminiApiError';
  }
}

/**
 * Pulls a readable message and a status code out of an error.
 *
 * The SDK reports some failures with the whole response body as the error
 * message. The status has to be recovered from that body, otherwise a rate
 * limit would look like an unknown failure and would not be retried.
 */
export function readErrorDetails(error: unknown): {
  message: string;
  status: number;
} {
  const rawMessage = error instanceof Error ? error.message : String(error);
  let message = rawMessage;
  let status = 0;

  if (rawMessage.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawMessage) as {
        error?: { code?: unknown; message?: unknown };
        code?: unknown;
        message?: unknown;
      };

      const inner = parsed.error ?? parsed;

      if (typeof inner.message === 'string') message = inner.message;
      if (typeof inner.code === 'number') status = inner.code;
    } catch {
      // The message was not JSON, so keep it as it is.
    }
  }

  if (status === 0 && typeof error === 'object' && error !== null) {
    const candidate = (error as { status?: unknown }).status;
    if (typeof candidate === 'number') status = candidate;
  }

  if (status === 0 && typeof error === 'object' && error !== null) {
    const candidate = (error as { code?: unknown }).code;
    if (typeof candidate === 'number') status = candidate;
  }

  return { message, status };
}
