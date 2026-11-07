/**
 * The failures of the language model.
 *
 * The model is the part of the site that fails most often, and it fails in
 * ways that mean different things to the owner: a key that is wrong is a
 * problem of the deployment, a spent free tier is a problem of the plan, a
 * timeout is a problem of the limit, and an API that had a problem is a
 * problem of the day. This module tells them apart and builds the context of
 * the report of the failure.
 *
 * The classification is a mapping of the status the provider already carries,
 * of the name of the error and of the reason the API gives. It never reads
 * the text of the message to decide, because the text of the message of the
 * API can be anything. The reason is a fixed word of the API and not a text,
 * and it is what tells a request the API refused for its own reasons from a
 * request it refused because the key is wrong: both of them are a 400.
 */

import { readErrorDetails } from '../geminiErrors.ts';
import type { FailureContext } from './scrub.ts';

/**
 * The kinds of a failure of the model.
 */
export type AiFailureKind =
  /** The key or the model name is wrong. Nothing works until it is fixed. */
  | 'configuration'
  /** The free tier is spent, or there were too many requests. */
  | 'quota'
  /** The model took too long. */
  | 'timeout'
  /** The API had a problem. */
  | 'unavailable'
  /** The model refused to answer for its own reasons. */
  | 'blocked'
  /** Anything else. */
  | 'unknown';

/**
 * The reasons the API gives when it refuses a request for its own reasons.
 */
const REFUSAL_REASONS: readonly string[] = [
  'safety',
  'jailbreak',
  'prohibited_content',
  'blocklist',
  'content_blocked',
  'image_safety',
  'recitation',
  'spii',
];

/**
 * The reasons the API gives when it refuses a request because of the key.
 */
const CONFIGURATION_REASONS: readonly string[] = [
  'api_key_invalid',
  'permission_denied',
  'unauthenticated',
];

/**
 * The name of the error of a failure of the configuration.
 */
const CONFIGURATION_ERROR_NAME = 'LLMConfigurationError';

/**
 * The name of the error of a failure of time.
 */
const TIMEOUT_ERROR_NAME = 'TimeoutError';

/**
 * Tells what kind of failure of the model this is.
 *
 * A failure of the configuration is a problem of the deployment and not a
 * fault of the model, and it is told apart from the others because the fix
 * is different: the owner has to change a variable, not wait for the model
 * to come back.
 *
 * The function never throws. A failure of the classification must not become
 * a second failure that reaches the visitor.
 *
 * @param error The failure.
 * @returns The kind of the failure.
 */
export function classifyAiFailure(error: unknown): AiFailureKind {
  try {
    if (error instanceof Error) {
      if (error.name === CONFIGURATION_ERROR_NAME) {
        return 'configuration';
      }

      if (error.name === TIMEOUT_ERROR_NAME) {
        return 'timeout';
      }
    }

    const { status, reason } = readErrorDetails(error);
    const word = reason?.trim().toLowerCase() ?? '';

    if (word && CONFIGURATION_REASONS.includes(word)) {
      return 'configuration';
    }

    if (word && REFUSAL_REASONS.includes(word)) {
      return 'blocked';
    }

    if (status === 429) {
      return 'quota';
    }

    if (status === 408) {
      return 'timeout';
    }

    // The API rejects the key and the model name with these, and the owner
    // has to change a variable to make it work again.
    if (status === 401 || status === 403 || status === 404) {
      return 'configuration';
    }

    if (status >= 500) {
      return 'unavailable';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * The status the API reported for a failure.
 *
 * It is 0 when the API did not report one, which is the case for a failure
 * of the configuration.
 *
 * @param error The failure.
 * @returns The status.
 */
export function readAiFailureStatus(error: unknown): number {
  try {
    return readErrorDetails(error).status;
  } catch {
    return 0;
  }
}

/**
 * Reads the model the site asks.
 *
 * The name of the model is not private and it is worth reporting, because it
 * says which model was failing. The variable of the environment is the source
 * of truth: it is what the factory of the provider hands to the API.
 *
 * @returns The name of the model.
 */
export function readAiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  return model && model.length > 0 ? model : 'unknown';
}

/**
 * Builds the context of a report of a failure of the model.
 *
 * It holds the kind of the failure, the status the API reported, the model
 * that was asked and the identifier of the query. It holds no question, no
 * answer, no prompt and no context of the retrieval, so the report cannot
 * carry what a visitor wrote.
 *
 * @param error The failure.
 * @param details What the caller knows about the failure.
 * @returns The context of the report.
 */
export function buildAiFailureContext(
  error: unknown,
  details: { queryId?: string | undefined } = {}
): FailureContext {
  const status = readAiFailureStatus(error);

  return {
    kind: classifyAiFailure(error),
    // A failure with no status is not given the status zero, so the report
    // says that there was no status instead of saying there was a status of
    // zero.
    status: status > 0 ? status : undefined,
    model: readAiModel(),
    queryId: details.queryId,
    timestamp: new Date().toISOString(),
  };
}
