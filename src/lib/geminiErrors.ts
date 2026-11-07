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
 *
 * The reason comes with it. It is a fixed word of the API and not the text
 * of an answer, and it tells the failures apart that the status alone cannot:
 * a request the API refused for its own reasons (`safety`, `jailbreak`,
 * `prohibited_content`, `blocklist`) and a request it refused because the
 * key is wrong (`API_KEY_INVALID`) are both a 400.
 */
export function readErrorDetails(error: unknown): {
  message: string;
  status: number;
  reason: string | null;
} {
  const rawMessage = error instanceof Error ? error.message : String(error);
  let message = rawMessage;
  let status = 0;
  let reason: string | null = null;

  if (rawMessage.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawMessage) as {
        error?: { code?: unknown; message?: unknown; details?: unknown };
        code?: unknown;
        message?: unknown;
        details?: unknown;
      };

      const inner = parsed.error ?? parsed;

      if (typeof inner.message === 'string') message = inner.message;
      if (typeof inner.code === 'number') status = inner.code;
      if (typeof inner.code === 'string') reason = inner.code;
      if (reason === null) reason = readReason(inner.details);
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

  if (reason === null && typeof error === 'object' && error !== null) {
    const source = error as { reason?: unknown; code?: unknown };

    // The provider carries the reason of the failure itself. It is the same
    // word the body of an answer carries, read by the provider before the
    // failure was raised.
    if (typeof source.reason === 'string') {
      reason = source.reason;
    } else if (typeof source.code === 'string') {
      reason = source.code;
    }
  }

  return { message, status, reason };
}

/**
 * Reads the reason of the API out of the details of an answer.
 *
 * The details are a list of the parts of the answer, and the reason of the
 * first one that has it is the reason of the answer as a whole.
 *
 * @param details The details of the answer of the API.
 * @returns The reason, or null when there is none.
 */
function readReason(details: unknown): string | null {
  if (!Array.isArray(details)) return null;

  for (const detail of details) {
    if (detail && typeof detail === 'object') {
      const reason = (detail as { reason?: unknown }).reason;
      if (typeof reason === 'string') return reason;
    }
  }

  return null;
}
