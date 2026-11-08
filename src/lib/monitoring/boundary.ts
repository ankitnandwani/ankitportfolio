/**
 * The reporting of the failures that a boundary of the page catches.
 *
 * A boundary is the last line of the site: it shows the visitor a page that
 * works, and it tells the owner that the page below it failed.
 *
 * The report holds the name of the part of the page the boundary covers and
 * the digest that Next.js gives, which is the short identifier that ties the
 * failure in the browser to the one on the server. It holds nothing else of
 * the failure: the message of the failure is left out, because a message can
 * hold the text of the page and the value of a field, and only the frames of
 * the stack are kept, because a frame is a place in the code and never
 * anything a visitor wrote.
 *
 * The reports are grouped by the kind and by the part of the page, so a
 * failure of the same boundary is one issue and not one issue every time it
 * happens.
 */

import { captureException } from './capture.ts';
import { getMonitoringConfig } from './config.ts';
import type { FailureContext } from './scrub.ts';

/**
 * The parts of the page a boundary covers.
 *
 * The boundary of the routes covers every page of the site, and the boundary
 * of the root covers the part of the site that is above the routes.
 */
export type BoundaryScope = 'routes' | 'root';

/**
 * A failure that a boundary caught.
 */
export interface BoundaryFailure {
  /** The part of the page the boundary covers. */
  scope: BoundaryScope;
  /** The failure, as the boundary received it. */
  error: unknown;
  /** The digest that Next.js gives, when there is one. */
  digest?: string | undefined;
}

/**
 * The kind of the reports of a boundary.
 *
 * It is what groups the reports, together with the part of the page.
 */
export const BOUNDARY_FAILURE_KIND = 'browser_boundary_failure';

/**
 * The text of a report of a boundary.
 *
 * It says what happened and nothing about the failure itself. The message of
 * the failure can hold the text of the page and the value of a field, so it
 * never reaches the service.
 */
export const BOUNDARY_FAILURE_MESSAGE = 'A boundary of the page caught a failure.';

/**
 * The name of an error that is safe to report.
 *
 * A name of an error is the name of a class of code, such as `TypeError`. It
 * is kept when it looks like one, so a name that carries something else is
 * left out.
 */
const ERROR_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_.]*$/;

/**
 * The longest name of an error that is reported.
 */
const MAX_ERROR_NAME_LENGTH = 60;

/**
 * The shape of a digest.
 *
 * Next.js gives a digest that is a number and that can hold the code of the
 * failure after a semicolon. It holds no space and no sentence, so a text
 * that a visitor wrote is never a digest.
 */
const DIGEST_PATTERN = /^[A-Za-z0-9_.;-]{1,80}$/;

/**
 * Reads the digest of the failure.
 *
 * Only a digest that looks like a digest is read. A digest is a hash of the
 * failure, and a hash cannot hold personal data, so it is safe to report.
 *
 * @param digest The digest of the failure.
 * @returns The digest, or undefined when there is none that is safe.
 */
export function readBoundaryDigest(digest: unknown): string | undefined {
  if (typeof digest !== 'string') {
    return undefined;
  }

  const trimmed = digest.trim();

  if (!trimmed || !DIGEST_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

/**
 * Reads the name of the failure.
 *
 * @param error The failure.
 * @returns The name of the failure, or undefined when it has none that is safe.
 */
export function readBoundaryErrorName(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const name = (error as { name?: unknown }).name;

  if (typeof name !== 'string') {
    return undefined;
  }

  const trimmed = name.trim();

  if (!trimmed || trimmed.length > MAX_ERROR_NAME_LENGTH) {
    return undefined;
  }

  if (!ERROR_NAME_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

/**
 * Reads the frames of the stack of the failure.
 *
 * The first line of a stack holds the message of the failure, so it is left
 * out. What is left are the places in the code, and a place in the code
 * cannot hold anything a visitor wrote.
 *
 * @param error The failure.
 * @returns The frames of the stack, or undefined when there are none.
 */
export function readBoundaryStackFrames(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const stack = (error as { stack?: unknown }).stack;

  if (typeof stack !== 'string' || !stack.trim()) {
    return undefined;
  }

  const frames = stack
    .split('\n')
    .slice(1)
    .filter((line) => line.trim().startsWith('at '));

  if (frames.length === 0) {
    return undefined;
  }

  return frames.join('\n');
}

/**
 * Builds the failure as it is safe to report.
 *
 * The message of the failure is replaced by a fixed sentence, and the frames
 * of the stack are kept. The result says what happened and where it
 * happened, and it holds nothing that the page held.
 *
 * @param error The failure.
 * @returns The failure as it is safe to report.
 */
export function buildSafeBoundaryError(error: unknown): Error {
  const safe = new Error(BOUNDARY_FAILURE_MESSAGE);
  const name = readBoundaryErrorName(error);

  if (name) {
    safe.name = name;
  }

  const frames = readBoundaryStackFrames(error);

  if (frames) {
    safe.stack = `${safe.name}: ${BOUNDARY_FAILURE_MESSAGE}\n${frames}`;
  }

  return safe;
}

/**
 * Builds the context of the report of a boundary.
 *
 * The part of the page and the digest are in the report. The digest is not a
 * tag, because the digest is different every time and a tag that is
 * different every time is of no use to a filter. It is its own part of the
 * shape of a failure, and the capture puts it in the extra parts of the
 * report.
 *
 * @param failure The failure the boundary caught.
 * @returns The context of the report.
 */
export function buildBoundaryFailureContext(failure: BoundaryFailure): FailureContext {
  const digest = readBoundaryDigest(failure.digest);

  return {
    kind: BOUNDARY_FAILURE_KIND,
    message: BOUNDARY_FAILURE_MESSAGE,
    errorName: readBoundaryErrorName(failure.error),
    timestamp: new Date().toISOString(),
    // The failure reached the visitor: the page below the boundary was not
    // shown. It is an error and not a warning.
    level: 'error',
    fingerprint: [BOUNDARY_FAILURE_KIND, failure.scope],
    tags: {
      scope: failure.scope,
    },
    extra: {
      scope: failure.scope,
    },
    // The digest is its own field and not a part of the extra, because a
    // digest is a number and the redaction of the personal data would take a
    // number of that length apart.
    digest,
  };
}

/**
 * Reports a failure that a boundary of the page caught.
 *
 * The line of the local log holds the failure as it came, whether the
 * monitoring is on or not, because it is the only trace of a failure when
 * nothing leaves the machine. The report itself holds the safe failure.
 *
 * The function never throws: a failure of the monitoring must not become a
 * second failure that reaches the visitor.
 *
 * @param failure The failure the boundary caught.
 */
export async function reportBoundaryFailure(failure: BoundaryFailure): Promise<void> {
  try {
    console.error('[monitoring] A boundary of the page caught a failure:', failure.error);

    const config = getMonitoringConfig();

    if (!config.enabled) {
      return;
    }

    await captureException(
      buildSafeBoundaryError(failure.error),
      buildBoundaryFailureContext(failure),
      config
    );
  } catch {
    // A failure of the monitoring never reaches the visitor.
  }
}
