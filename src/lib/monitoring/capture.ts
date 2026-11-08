/**
 * The capture of the failures.
 *
 * This module is the one place where a failure of the site becomes a report.
 * Every route that catches a failure hands it over here, and nothing else
 * talks to the monitoring service.
 *
 * The report holds the name of the route, the method of the request, the
 * status of the answer, the kind of the failure, the identifier of the query
 * and the moment. It never holds the body of a request, the address of a
 * visitor or anything a visitor wrote: the body never reaches this module,
 * and the address of a visitor is not part of the context.
 *
 * The shape that is handed over is the safe one of M20.02, so the application
 * holds the safe shape and not only the service. The hook of the SDK cleans
 * the event again on the way out, which is the second line.
 *
 * The client of the SDK is created through a factory that a test can replace,
 * the same way the analytics of M19 create the client of PostHog. The package
 * itself is loaded with a dynamic import, so it never becomes part of a client
 * bundle and this module can be imported without a complete environment.
 */

import {
  buildMonitoringOptions,
  getMonitoringConfig,
  readMonitoringSecrets,
  type MonitoringConfig,
} from './config.ts';
import {
  redactText,
  scrubFailure,
  setMonitoringSecrets,
  type FailureContext,
  type ReportLevel,
  type SafeFailure,
} from './scrub.ts';

/**
 * The kinds of a failure.
 *
 * The kind is what groups the reports. The same kind of a failure opens the
 * same issue, so a failure that happens every night does not fill the project
 * with an issue of its own every night.
 */
export type FailureKind =
  /** The model of the language service is not configured. It is a problem of the deployment. */
  | 'llm_configuration_error'
  /** The model of the language service failed in a way that another attempt could survive. */
  | 'llm_unavailable'
  /** A failure nothing is known about. */
  | 'unknown_failure';

/**
 * The parts of the request the context is built from.
 *
 * It is the little that the capture needs. The address of the visitor is not
 * part of it: the limiter of the routes uses it, and a report that carries it
 * would carry a personal detail.
 */
export interface RouteRequest {
  /** The method of the request. */
  method?: string | undefined;
}

/**
 * The answer the route is about to give.
 */
export interface RouteAnswer {
  /** The status of the answer. */
  status: number;
  /** The kind of the failure. */
  kind: FailureKind;
  /** The identifier of the query, when the request has one. */
  queryId?: string | undefined;
}

/**
 * The hint that is given to the SDK with a report.
 *
 * It is the part of the capture context of the SDK that this module uses.
 */
export interface MonitoringHint {
  /** The tags of the report. They are what a report is filtered and grouped by. */
  tags?: Record<string, string>;
  /** The extra parts of the report. */
  extra?: Record<string, unknown>;
  /** The fingerprint that groups the reports. */
  fingerprint?: string[];
  /**
   * The level of the report.
   *
   * The SDK gives a message the level "info" when nothing else is said, and
   * a report that the site answered with what it had is a warning.
   */
  level?: ReportLevel;
}

/**
 * The part of the SDK this module uses.
 */
export interface MonitoringClient {
  /** Reports a failure. */
  captureException: (error: unknown, hint?: MonitoringHint) => void;
  /** Reports something that is not a failure. */
  captureMessage: (message: string, hint?: MonitoringHint) => void;
  /**
   * Sends the reports that are waiting in the queue.
   *
   * The SDK queues the reports and sends them on its own interval. An
   * instance that is put to sleep as soon as it has answered loses the
   * reports it queued, so the report is flushed before the answer goes out.
   */
  flush?: () => Promise<void>;
}

/**
 * Creates the client of the SDK. The tests replace it with one of their own.
 */
export type MonitoringClientFactory = () => MonitoringClient | Promise<MonitoringClient>;

/**
 * The client of the SDK, once it is created.
 */
let monitoringClient: MonitoringClient | null = null;

/**
 * The factory that creates the client. When it is null the real package is
 * used.
 */
let monitoringClientFactory: MonitoringClientFactory | null = null;

/**
 * Replaces the factory that creates the client of the SDK.
 *
 * The client that was created is dropped, so the new factory is used from the
 * next report on. This is the only way a test gets to see what is reported.
 *
 * @param factory The factory to use, or null to use the real package.
 */
export function setMonitoringClientFactory(factory: MonitoringClientFactory | null): void {
  monitoringClientFactory = factory;
  monitoringClient = null;
}

/**
 * Creates the real client of the SDK.
 *
 * The package is loaded with a dynamic import, so it is never part of a
 * client bundle.
 */
async function createSentryClient(): Promise<MonitoringClient> {
  const Sentry = await import('@sentry/nextjs');

  // The values of the secrets of the environment are read once, and every
  // string that is sent is checked against them.
  setMonitoringSecrets(readMonitoringSecrets(process.env));

  // The SDK is started by the instrumentation file of Next.js. When the
  // instance of the SDK that a route holds is not the one that was started
  // there, it is started here as well, so a report is never lost because of
  // the way the pieces of the server are packed.
  if (!Sentry.getClient()) {
    Sentry.init(buildMonitoringOptions(getMonitoringConfig()));
  }

  return {
    captureException: (error, hint) => {
      Sentry.captureException(error, hint);
    },
    captureMessage: (message, hint) => {
      Sentry.captureMessage(message, hint);
    },
    flush: async () => {
      await Sentry.flush(5000);
    },
  };
}

/**
 * The client of the SDK, once it is created.
 *
 * @returns The client, or null when it could not be created.
 */
async function getMonitoringClient(): Promise<MonitoringClient | null> {
  if (monitoringClient) {
    return monitoringClient;
  }

  const factory = monitoringClientFactory ?? createSentryClient;

  try {
    monitoringClient = await factory();
    return monitoringClient;
  } catch (error) {
    console.warn('[monitoring] The client of the SDK could not be created:', error);
    return null;
  }
}

/**
 * The line the log of the local machine has for each route.
 *
 * The route used to write this line itself. The capture writes it now, so
 * there is one line for a failure and the line looks the way it always
 * looked. The person who works on the site reads this log.
 */
const CONSOLE_LABELS: Record<string, string> = {
  chat: 'Chat API error:',
  'job-fit': 'Job fit API error:',
  contact: 'Contact form API error:',
  feedback: '[feedback] Error processing feedback:',
  analytics: '[analytics] Proxy error:',
};

/**
 * Tells what kind of failure this is.
 *
 * The failure of the configuration of the model is told apart from a failure
 * of the model and from a failure nothing is known about. It is a problem of
 * the deployment, and the owner has to see it as one.
 *
 * The rules are the ones the routes already follow when they answer, so the
 * kind of a report and the status of an answer always agree.
 *
 * @param error The failure.
 * @returns The kind of the failure.
 */
export function classifyFailure(error: unknown): FailureKind {
  if (!(error instanceof Error)) {
    return 'unknown_failure';
  }

  if (error.name === 'LLMConfigurationError') {
    return 'llm_configuration_error';
  }

  const llmError = error as { retryable?: boolean; name?: string };
  if (llmError.name === 'LLMError' && llmError.retryable) {
    return 'llm_unavailable';
  }

  return 'unknown_failure';
}

/**
 * Builds the context of a route.
 *
 * The name of the route is a constant that the caller gives, so it is never
 * read from the address and a query that was asked for never reaches the
 * service. The method comes from the request and the identifier of the query
 * comes with it when the request has one.
 *
 * @param route The name of the route, such as `chat`.
 * @param request The request that came in.
 * @param answer The answer the route is about to give.
 * @returns The context of the failure.
 */
export function buildRouteContext(
  route: string,
  request: RouteRequest,
  answer: RouteAnswer
): FailureContext {
  return {
    route,
    method: request.method ?? 'UNKNOWN',
    status: answer.status,
    kind: answer.kind,
    queryId: answer.queryId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds the hint of a report from the safe shape of a failure.
 *
 * The fingerprint groups the reports by the kind of the failure and by the
 * route. The identifier of the query and the moment are not part of it,
 * because a fingerprint that changes every time opens an issue of its own
 * every time.
 *
 * @param safe The safe shape of the failure.
 * @returns The hint of the report.
 */
function buildHint(safe: SafeFailure): MonitoringHint {
  // The tags of the report of a service come first, so the name of the
  // service and what the site did instead are there next to the kind of the
  // failure.
  const tags: Record<string, string> = { ...safe.tags };

  if (safe.route) tags.route = safe.route;
  if (safe.kind) tags.kind = safe.kind;
  if (safe.method) tags.method = safe.method;
  if (safe.model) tags.model = safe.model;
  if (safe.status !== null) tags.status = String(safe.status);

  // The extra parts of the failure are the parts the caller added, and they
  // were cleaned before they got here.
  const extra: Record<string, unknown> = { ...safe.extra };

  if (safe.queryId) extra.queryId = safe.queryId;
  if (safe.digest) extra.digest = safe.digest;
  if (safe.timestamp) extra.timestamp = safe.timestamp;

  return {
    tags,
    extra,
    level: safe.level ?? undefined,
    // A failure that comes from the model is grouped by its kind alone, so
    // a thousand timeouts are one issue and not a thousand. Every other
    // failure is grouped by its kind and by the route it happened in. A
    // report that brings its own fingerprint is grouped by it, so a failure
    // of a service is one issue and not one issue per repository.
    fingerprint:
      safe.fingerprint ??
      (safe.route
        ? [safe.kind ?? 'unknown_failure', safe.route]
        : [safe.kind ?? 'unknown_failure']),
  };
}

/**
 * The failure as it is safe to report.
 *
 * The message of the parser of a body holds the first words of that body,
 * and a report must not hold the text of a visitor. The name of the error
 * and the place it happened are kept, because they are what the owner needs,
 * and the words of the parser are of no use to anyone.
 *
 * The console line of the local log still holds the failure as it came, so
 * the person who works on the site loses nothing.
 *
 * @param error The failure.
 * @returns The failure as it is safe to report.
 */
function safeError(error: unknown): unknown {
  if (!(error instanceof SyntaxError)) {
    return error;
  }

  const message = 'The body of the request could not be read';
  const safe = new SyntaxError(message);
  const frames = error.stack?.split('\n').slice(1).join('\n');

  if (frames) {
    safe.stack = `SyntaxError: ${message}\n${frames}`;
  }

  return safe;
}

/**
 * The failures that have been reported already.
 *
 * A failure of the model is reported by the place where it happens, and the
 * route that catches it afterwards must not report it a second time. Two
 * reports of one failure are two events in the project, and the count of the
 * issue would be twice what it is.
 */
const reportedFailures = new WeakSet<object>();

/**
 * Marks a failure as reported, so it is not reported twice.
 *
 * @param error The failure.
 */
export function markFailureReported(error: unknown): void {
  if (error && (typeof error === 'object' || typeof error === 'function')) {
    reportedFailures.add(error as object);
  }
}

/**
 * Whether a failure has been reported already.
 *
 * @param error The failure.
 * @returns True when the failure has been reported.
 */
export function isFailureReported(error: unknown): boolean {
  if (!error || (typeof error !== 'object' && typeof error !== 'function')) {
    return false;
  }

  return reportedFailures.has(error as object);
}

/**
 * Reports a failure.
 *
 * The report is sent before the answer of the route goes out, so it is not
 * lost when the instance is put to sleep. The function never throws: a
 * failure of the monitoring must not become a second failure that reaches
 * the visitor.
 *
 * The line of the local log is written whether the monitoring is on or not,
 * because it is the only trace of a failure when nothing leaves the machine.
 * It is the line of the route, so a report that does not come from a route
 * writes no line of its own.
 *
 * A failure that has been reported already is not sent again, but the line of
 * the local log is still written. The failure of the model is reported by the
 * place where it happens, and the route that catches it afterwards writes the
 * line and leaves the report to the place that knows the kind of it.
 *
 * @param error The failure.
 * @param context The context of the failure.
 * @param config The configuration of the monitoring.
 */
export async function captureException(
  error: unknown,
  context: FailureContext,
  config: MonitoringConfig = getMonitoringConfig()
): Promise<void> {
  try {
    const safe = scrubFailure(context);

    if (safe.route) {
      console.error(CONSOLE_LABELS[safe.route] ?? `[monitoring] ${safe.route}:`, error);
    }

    if (!config.enabled) {
      return;
    }

    // A failure that has been reported already is not reported twice.
    if (isFailureReported(error)) {
      return;
    }

    // The failure is marked before the first wait, so the body of this
    // function has run its first part by the time the call returns. The
    // route that catches the failure afterwards therefore knows that it must
    // not report it a second time, even when it catches it in the same tick.
    markFailureReported(error);

    const client = await getMonitoringClient();
    if (!client) {
      return;
    }

    client.captureException(safeError(error), buildHint(safe));

    // The report is flushed before the answer goes out, because an instance
    // that is put to sleep as soon as it has answered loses what is queued.
    await client.flush?.();
  } catch {
    // A failure of the monitoring never reaches the visitor.
  }
}

/**
 * Reports something that is not a failure but is worth knowing.
 *
 * It is used for a service that could not be reached and the site answered
 * with what it had. The text is cleaned of its private parts before it is
 * handed over, because it is a text and not an identifier.
 *
 * @param message The text to report.
 * @param context The context of the report.
 * @param config The configuration of the monitoring.
 */
export async function captureMessage(
  message: string,
  context: FailureContext,
  config: MonitoringConfig = getMonitoringConfig()
): Promise<void> {
  try {
    if (!config.enabled) {
      return;
    }

    const safe = scrubFailure(context);
    const client = await getMonitoringClient();
    if (!client) {
      return;
    }

    client.captureMessage(redactText(message), buildHint(safe));

    await client.flush?.();
  } catch {
    // A failure of the monitoring never reaches the visitor.
  }
}
