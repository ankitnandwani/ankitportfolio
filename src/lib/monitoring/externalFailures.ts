/**
 * The failures of the services the site depends on outside its own process.
 *
 * The GitHub API and the database of the knowledge base can both fail while
 * the site keeps working. The report says which service failed, what kind of
 * failure it was and what the site did instead, so the owner can tell an
 * outage of the service from a page that was served with what the site had.
 *
 * The report holds no body of a request, no answer of a service and no
 * credential. The address of a service can carry a token in its query, so an
 * address is only reported when it holds no query, and the name of the
 * repository is reported instead of its address.
 *
 * The failures of one repository are counted and one report goes out per
 * window, so an outage does not fill the project with an issue of its own for
 * every request. The count of the failures is added to the report that
 * follows.
 */

import { captureMessage } from './capture.ts';
import { getMonitoringConfig } from './config.ts';
import type { FailureContext, ReportLevel } from './scrub.ts';

/**
 * The services the site depends on outside its own process.
 */
export type ExternalServiceName = 'github' | 'supabase';

/**
 * The kinds of a failure of a service.
 *
 * The kind is what groups the reports, together with the name of the service.
 * A thousand timeouts of the same service are one issue and not a thousand.
 */
export type ExternalFailureKind =
  /** The service could not be reached. */
  | 'unavailable'
  /** The service did not answer in time. */
  | 'timeout'
  /** The service does not know what was asked for. It is an answer. */
  | 'not_found'
  /** The service refused because of its own limit. */
  | 'rate_limited'
  /** A failure nothing is known about. */
  | 'unknown';

/**
 * What the site did instead of the answer of the service.
 */
export type ExternalFallback =
  /** The site answered with the copy of the data it already had. */
  | 'cached'
  /** The service answered and the answer held nothing. */
  | 'empty'
  /** The answer came with no context at all. */
  | 'none';

/**
 * The failure of a service, as the caller knows it.
 */
export interface ExternalFailure {
  /** The name of the service. */
  service: ExternalServiceName;
  /** The kind of the failure. */
  kind: ExternalFailureKind;
  /** What the site did instead. */
  what: ExternalFallback;
  /** The status the service reported, when it reported one. */
  status?: number | undefined;
  /** The identifier of the request, when the service reported one. */
  requestId?: string | undefined;
  /** The name of the repository, when the failure is of one. */
  repository?: string | undefined;
  /** The address of the request, when it holds no query. */
  url?: string | undefined;
  /**
   * The level of the report.
   *
   * A failure the site answered with what it had is a warning, and a failure
   * that reached the visitor is an error.
   */
  level?: ReportLevel | undefined;
}

/**
 * The facts a service reported about its failure.
 *
 * The message is read only for the fixed words that decide the kind. The
 * message itself never leaves the machine.
 */
export interface ExternalFailureSignal {
  /** The status the service reported. */
  status?: number | undefined;
  /** Whether the request ran out of time. */
  timeout?: boolean | undefined;
  /** Whether the service refused because of its own limit. */
  rateLimited?: boolean | undefined;
  /**
   * Whether the service was not reached at all.
   *
   * The caller knows it when the request itself failed, and it is the
   * difference between a service that is down and a service that answered
   * with something the site does not like.
   */
  unreachable?: boolean | undefined;
  /** The message the service reported, when it reported one. */
  message?: string | undefined;
}

/**
 * The names of the services, as they are written in a report.
 */
const SERVICE_NAMES: Record<ExternalServiceName, string> = {
  github: 'GitHub',
  supabase: 'The knowledge base',
};

/**
 * What the site did instead, as it is written in a report.
 */
const FALLBACK_NAMES: Record<ExternalFallback, string> = {
  cached: 'The site answered with what it had',
  empty: 'The site answered with nothing',
  none: 'The answer came with no context of the retrieval',
};

/**
 * The window in which the failures of one repository are counted.
 *
 * It is short enough that an outage produces a handful of reports and long
 * enough that a page with six repositories does not produce six reports a
 * minute.
 */
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

/**
 * The window that is in use. A test can shorten it.
 */
let windowMs = DEFAULT_WINDOW_MS;

/**
 * The failures that piled up since the last report of each service.
 *
 * The map is held in the memory of the process, the same way the limiter of
 * the chat is held.
 */
const counts = new Map<string, { count: number; sentAt: number }>();

/**
 * Shortens the window in which the failures are counted.
 *
 * It exists for the tests, the same way the factory of the client of the SDK
 * exists for them.
 *
 * @param milliseconds The length of the window.
 */
export function setExternalFailureWindow(milliseconds: number): void {
  windowMs = Math.max(0, milliseconds);
}

/**
 * Forgets the failures that piled up.
 *
 * It exists for the tests.
 */
export function resetExternalFailureCounts(): void {
  counts.clear();
}

/**
 * Reduces the message of a service to its kind.
 *
 * The message of a service can name a table, a column or a constraint, so it
 * never leaves the machine. Only the fixed words that decide the kind are
 * read, and only the kind is reported.
 *
 * @param message The message the service reported.
 * @returns The kind of the failure, or null when the message says nothing.
 */
function kindOfMessage(message: string | undefined): ExternalFailureKind | null {
  if (!message) {
    return null;
  }

  const text = message.toLowerCase();

  if (text.includes('timeout') || text.includes('timed out')) {
    return 'timeout';
  }

  if (text.includes('rate limit') || text.includes('too many requests')) {
    return 'rate_limited';
  }

  if (
    text.includes('connection') ||
    text.includes('connect') ||
    text.includes('terminated') ||
    text.includes('fetch failed') ||
    text.includes('unreachable') ||
    text.includes('socket hang up')
  ) {
    return 'unavailable';
  }

  return null;
}

/**
 * Tells what kind of failure of a service it is.
 *
 * The status decides it when the service reported one. When it did not, the
 * message decides it, and only the fixed words of the message are read.
 *
 * @param signal The facts the service reported.
 * @returns The kind of the failure.
 */
export function classifyExternalFailure(signal: ExternalFailureSignal): ExternalFailureKind {
  if (signal.timeout) {
    return 'timeout';
  }

  if (signal.rateLimited) {
    return 'rate_limited';
  }

  const status = signal.status;

  if (status !== undefined) {
    if (status === 404) return 'not_found';
    if (status === 429) return 'rate_limited';
    if (status === 408) return 'timeout';
    if (status >= 500) return 'unavailable';

    return 'unknown';
  }

  // The service reported no status. It was either not reached at all, or it
  // answered with an error that carries no status.
  if (signal.unreachable) {
    return 'unavailable';
  }

  return kindOfMessage(signal.message) ?? 'unknown';
}

/**
 * The address of a request, when it is safe to report it.
 *
 * An address can carry a token in its query, so an address that holds one is
 * not reported at all.
 *
 * @param url The address of the request.
 * @returns The address, or null when it is not safe to report.
 */
function safeUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (parsed.search || parsed.hash) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Builds the text of a report.
 *
 * The text is for the person who reads the project, so it says what happened
 * in words. It holds the name of the repository and never the address of the
 * service.
 *
 * @param failure The failure of the service.
 * @param count The number of failures the report carries.
 * @returns The text of the report.
 */
export function buildExternalFailureMessage(failure: ExternalFailure, count: number): string {
  const service = SERVICE_NAMES[failure.service] ?? failure.service;
  const what = FALLBACK_NAMES[failure.what] ?? failure.what;
  const subject = failure.repository ? ` for ${failure.repository}` : '';
  const times = count > 1 ? ` ${count} failures since the last report.` : '';

  return `${service} could not answer${subject} (${failure.kind}). ${what}.${times}`;
}

/**
 * Builds the context of a report.
 *
 * The reports of a service are grouped by the name of the service and by the
 * kind of the failure, so an outage is one issue and not one issue for every
 * repository. The name of the repository and the identifier of the request
 * are in the report, and the address of the service is not.
 *
 * @param failure The failure of the service.
 * @param count The number of failures the report carries.
 * @returns The context of the report.
 */
export function buildExternalFailureContext(
  failure: ExternalFailure,
  count: number
): FailureContext {
  const url = safeUrl(failure.url);

  return {
    kind: failure.kind,
    status: failure.status,
    timestamp: new Date().toISOString(),
    level: failure.level ?? 'warning',
    fingerprint: [failure.service, failure.kind],
    tags: {
      service: failure.service,
      what: failure.what,
    },
    extra: {
      service: failure.service,
      kind: failure.kind,
      what: failure.what,
      repository: failure.repository ?? null,
      requestId: failure.requestId ?? null,
      url,
      count,
    },
  };
}

/**
 * Reports a failure of a service.
 *
 * The report is sent once per service and repository per window, and the
 * count of the failures that piled up is added to the report that follows.
 * The function never throws: a failure of the monitoring must not become a
 * second failure that reaches the visitor.
 *
 * The caller decides whether it waits for the report. The path of a question
 * that is answered from a cache does not wait for it, and the path of a
 * question that failed waits for it, so the report is not lost when the
 * instance is put to sleep.
 *
 * @param failure The failure of the service.
 */
export async function reportExternalFailure(failure: ExternalFailure): Promise<void> {
  try {
    const config = getMonitoringConfig();

    if (!config.enabled) {
      return;
    }

    const key = `${failure.service}:${failure.repository ?? ''}`;
    const now = Date.now();
    const entry = counts.get(key);

    if (entry && now - entry.sentAt < windowMs) {
      // The failure is inside the window of the last report. It is counted
      // and no report goes out, so an outage does not fill the project.
      entry.count += 1;
      counts.set(key, entry);
      return;
    }

    // The window has passed. The report goes out and it carries the count of
    // the failures that piled up since the last report.
    const count = (entry?.count ?? 0) + 1;
    counts.set(key, { count: 0, sentAt: now });

    await captureMessage(
      buildExternalFailureMessage(failure, count),
      buildExternalFailureContext(failure, count),
      config
    );
  } catch {
    // A failure of the monitoring never reaches the visitor.
  }
}
