/**
 * The measurement of the operations that are too slow.
 *
 * The site already measures the time of its work: the chat measures the time
 * of its answer, the orchestrator measures the time of the generation and of
 * the retrieval, and the analyzer measures the time of the analysis. What was
 * missing is a report when one of those numbers is too big.
 *
 * The measurement is two reads of the clock around the work, and the report of
 * a slow operation goes out on its own and is not awaited, so a slow request
 * does not become a slower request.
 *
 * The report holds the name of the operation, the duration, the threshold it
 * was measured against, the identifier of the query when there is one and the
 * name of the route when there is one. It holds nothing else: no question, no
 * answer, no description of a job and no form.
 *
 * The clock and the reporter are injected, so a test can say that an
 * operation took two thousand milliseconds without waiting two seconds.
 */

import { captureMessage } from './capture.ts';
import { getMonitoringConfig } from './config.ts';
import type { FailureContext } from './scrub.ts';

/**
 * The operations of the site that are measured.
 */
export type PerformanceOperation =
  /** The whole request of the chat. */
  | 'chat'
  /** The whole request of the analyzer of a job description. */
  | 'job-fit'
  /** The whole request of the contact form. */
  | 'contact'
  /** The request to the GitHub API, apart from the time of the cache. */
  | 'github-fetch'
  /** The retrieval of the knowledge base. */
  | 'retrieval'
  /** The generation of the model. */
  | 'generation';

/**
 * The clock of the measurement.
 *
 * It is a function that gives the time in milliseconds, the way `Date.now`
 * does. A test gives one that it can move by hand.
 */
export type PerformanceClock = () => number;

/**
 * What is reported when an operation was too slow.
 */
export interface PerformanceReport {
  /** The name of the operation. */
  operation: PerformanceOperation;
  /** How long the operation took. */
  durationMs: number;
  /** The threshold it was measured against. */
  thresholdMs: number;
  /** The identifier of the query, when there is one. */
  queryId?: string | undefined;
  /** The name of the route, when there is one. */
  route?: string | undefined;
}

/**
 * The reporter of a measurement.
 *
 * The default one sends the report to the monitoring service. A test gives
 * one that writes the reports down instead.
 */
export type PerformanceReporter = (report: PerformanceReport) => void;

/**
 * The parts of a measurement that a caller can give.
 */
export interface PerformanceOptions {
  /** The identifier of the query, when there is one. */
  queryId?: string | undefined;
  /** The name of the route, when there is one. */
  route?: string | undefined;
  /** The clock of the measurement. */
  clock?: PerformanceClock | undefined;
  /** The reporter of the measurement. */
  reporter?: PerformanceReporter | undefined;
}

/**
 * A measurement that has been started.
 */
export interface PerformanceMeasurement {
  /**
   * Ends the measurement.
   *
   * The operation is reported when it took longer than its threshold. The
   * measurement can be ended only once, so a second call does nothing.
   */
  end(): void;
}

/**
 * The default threshold of each operation, in milliseconds.
 *
 * They are the values the site is comfortable with. The chat and the analyzer
 * answer with the model, which takes between a few seconds and a minute on
 * the free tier, so a threshold of three seconds would report every answer
 * and a threshold of thirty seconds reports the ones that are wrong. The form
 * answers in milliseconds, so it gets a short one.
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: Record<PerformanceOperation, number> = {
  chat: 30_000,
  'job-fit': 30_000,
  contact: 5_000,
  'github-fetch': 5_000,
  retrieval: 10_000,
  generation: 25_000,
};

/**
 * The variable of the environment that holds the threshold of each operation.
 */
const THRESHOLD_VARIABLES: Record<PerformanceOperation, string> = {
  chat: 'PERFORMANCE_CHAT_THRESHOLD_MS',
  'job-fit': 'PERFORMANCE_JOB_FIT_THRESHOLD_MS',
  contact: 'PERFORMANCE_CONTACT_THRESHOLD_MS',
  'github-fetch': 'PERFORMANCE_GITHUB_FETCH_THRESHOLD_MS',
  retrieval: 'PERFORMANCE_RETRIEVAL_THRESHOLD_MS',
  generation: 'PERFORMANCE_GENERATION_THRESHOLD_MS',
};

/**
 * Reads the threshold of an operation.
 *
 * The threshold comes from the environment when it holds one, so it can be
 * changed without a change to the code. A variable that is missing and a
 * variable that holds something that is not a number both mean the default of
 * the code is used, the same way the limits of the chat ignore one.
 *
 * @param operation The name of the operation.
 * @returns The threshold in milliseconds.
 */
export function readPerformanceThreshold(operation: PerformanceOperation): number {
  const raw = process.env[THRESHOLD_VARIABLES[operation]];

  if (!raw) {
    return DEFAULT_PERFORMANCE_THRESHOLDS[operation];
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_PERFORMANCE_THRESHOLDS[operation];
  }

  return value;
}

/**
 * Sends a report of a slow operation.
 *
 * It is the default reporter of the measurement. The report is grouped by the
 * name of the operation, so a slow answer every day is one issue and not a
 * hundred.
 *
 * @param report The report of the slow operation.
 */
function defaultReporter(report: PerformanceReport): void {
  const config = getMonitoringConfig();

  if (!config.enabled) {
    return;
  }

  const message =
    `The ${report.operation} took ${report.durationMs} ms, ` +
    `which is longer than the threshold of ${report.thresholdMs} ms.`;

  const context: FailureContext = {
    kind: 'slow_operation',
    timestamp: new Date().toISOString(),
    // The reports of an operation are grouped by its name, so the slow answer
    // of every day is one issue.
    fingerprint: [report.operation],
    tags: {
      operation: report.operation,
      durationMs: String(report.durationMs),
      thresholdMs: String(report.thresholdMs),
      ...(report.route ? { route: report.route } : {}),
    },
    extra: {
      queryId: report.queryId ?? null,
    },
    // A slow answer is worth knowing about, but the site still answered.
    level: 'warning',
  };

  // The report goes out on its own and is not awaited, so a slow request does
  // not become a slower request.
  void captureMessage(message, context, config);
}

/**
 * Reports an operation that took longer than its threshold.
 *
 * The function never throws: a failure of the monitoring must not become a
 * second failure that reaches the visitor. It does nothing when the
 * monitoring is off.
 *
 * @param operation The name of the operation.
 * @param durationMs How long the operation took.
 * @param thresholdMs The threshold it was measured against.
 * @param options The parts of the measurement the caller gives.
 */
export function reportSlowOperation(
  operation: PerformanceOperation,
  durationMs: number,
  thresholdMs: number,
  options: PerformanceOptions = {}
): void {
  try {
    if (durationMs <= thresholdMs) {
      return;
    }

    const config = getMonitoringConfig();

    if (!config.enabled) {
      return;
    }

    const reporter = options.reporter ?? defaultReporter;

    reporter({
      operation,
      durationMs,
      thresholdMs,
      queryId: options.queryId,
      route: options.route,
    });
  } catch {
    // A failure of the monitoring never reaches the visitor.
  }
}

/**
 * Starts a measurement of an operation.
 *
 * The caller ends it when the work is done. The measurement is two reads of
 * the clock and nothing else, so it adds no work to the path of a request.
 *
 * @param operation The name of the operation.
 * @param thresholdMs The threshold it is measured against.
 * @param options The parts of the measurement the caller gives.
 * @returns The measurement, which the caller ends.
 */
export function startPerformanceMeasurement(
  operation: PerformanceOperation,
  thresholdMs: number,
  options: PerformanceOptions = {}
): PerformanceMeasurement {
  const clock = options.clock ?? Date.now;
  const startedAt = clock();
  let ended = false;

  return {
    end(): void {
      if (ended) {
        return;
      }

      ended = true;

      reportSlowOperation(operation, clock() - startedAt, thresholdMs, options);
    },
  };
}
