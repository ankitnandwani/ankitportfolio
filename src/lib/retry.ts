/**
 * Retrying a request that failed for a temporary reason.
 *
 * This lives outside the knowledge base because more than one part of the
 * application talks to an external API: the embedding service and the LLM
 * provider both need the same behaviour.
 */

/**
 * Decides whether a failure is worth retrying.
 *
 * Rate limits and server errors are worth another attempt. A rejected
 * request or a bad key will fail the same way every time.
 */
export function isRetryableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const status = (error as { status?: unknown }).status;
  if (typeof status !== 'number') return false;

  return status === 408 || status === 429 || status >= 500;
}

/**
 * Waits for the given number of milliseconds.
 */
function defaultWait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Runs an operation and retries it when it fails with a retryable error.
 *
 * @param operation The work to run.
 * @param options Retry count, delay and the wait function.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    wait?: (milliseconds: number) => Promise<void>;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const wait = options.wait ?? defaultWait;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryableError(error)) {
        throw error;
      }

      options.onRetry?.(error, attempt);

      await wait(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
