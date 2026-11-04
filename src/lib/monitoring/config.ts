/**
 * The configuration of the monitoring layer.
 *
 * This module is deliberately free of any dependency on the Sentry package, so
 * the browser and the server can both read the configuration without pulling a
 * server only package into a client bundle.
 *
 * The monitoring has to work in two modes. When the DSN is configured, the
 * failures are sent to Sentry. When it is not, nothing leaves the machine. A
 * value that is still the placeholder from `.env.example` counts as "not
 * configured", because a placeholder is not a credential, and a value that is
 * not an http or https URL is refused here, before a client is built, rather
 * than after the first report fails.
 *
 * The configuration is read when the function is called and not when the
 * module is loaded, so a change of the environment is picked up without a
 * restart. This is the rule the analytics of M19 follow.
 */

import { isConfiguredValue } from '../analytics/config.ts';
import { isSecretValue, scrubEvent } from './scrub.ts';

/**
 * The variables whose value is a secret.
 *
 * The guardrails hold the names of the same variables, but their rule is used
 * on the assignments of a text (`NAME=value`), and it treats every name with
 * an underscore as a secret. That rule cannot be used here: the value of a
 * limit such as `RATE_LIMIT_MAX_REQUESTS` is the number twenty, and removing
 * that number from every message would be worse than useless.
 */
const SECRET_VARIABLE_NAMES: readonly string[] = [
  'GEMINI_API_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
  'POSTHOG_KEY',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'EMAIL_API_KEY',
  'UPSTASH_REDIS_REST_TOKEN',
  'UPSTASH_REDIS_REST_URL',
];

/**
 * The values the configuration is read from.
 */
export interface MonitoringEnvSource {
  /** The DSN of the project. */
  sentryDsn?: string | undefined;
  /** The `NODE_ENV` value. */
  nodeEnv?: string | undefined;
  /** The release the site runs, for example the commit it was built from. */
  release?: string | undefined;
}

/**
 * The configuration of the monitoring.
 */
export interface MonitoringConfig {
  /** Whether the monitoring is on. */
  enabled: boolean;
  /** The DSN. It is carried only while the monitoring is on. */
  dsn?: string | undefined;
  /** The name of the environment, so an issue can be told apart. */
  environment: string;
  /** The release, when there is one. */
  release?: string | undefined;
  /** Whether the failures are written to the console as well. */
  logToConsole: boolean;
}

/**
 * Whether a value is a DSN Sentry can be reached at.
 *
 * A placeholder is not a DSN, and neither is a string that is not a URL, so
 * both are rejected here.
 *
 * @param dsn The value to check.
 * @returns True when the value is an http or https URL.
 */
export function isValidSentryDsn(dsn: string | null | undefined): boolean {
  if (!isConfiguredValue(dsn)) {
    return false;
  }
  try {
    const url = new URL((dsn as string).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * The options the SDK is started with.
 *
 * They are plain values, so this module keeps its freedom from the Sentry
 * package. The server and the browser are started with the same options, so
 * the two can never disagree about what is collected.
 */
export interface MonitoringOptions {
  /** The DSN of the project. */
  dsn?: string | undefined;
  /** The name of the environment. */
  environment: string;
  /** The release, when there is one. */
  release?: string | undefined;
  /**
   * Whether the SDK attaches the personal data of the visitor on its own.
   *
   * It never does. This is the setting that keeps the body of a request, the
   * cookies and the address of a visitor out of a report (PRD §79).
   */
  sendDefaultPii: boolean;
  /** The share of the requests that are traced. */
  tracesSampleRate: number;
  /** The share of the sessions that are recorded. */
  replaysSessionSampleRate: number;
  /** The share of the sessions with a failure that are recorded. */
  replaysOnErrorSampleRate: number;
  /**
   * The hook that runs before an event leaves the process.
   *
   * It is the backstop: it cleans the event of everything private, so a path
   * that nobody remembered cannot send anything that should not be sent.
   */
  beforeSend?: (<T>(event: T) => T) | undefined;
}

/**
 * The hook that runs before an event leaves the process.
 *
 * The SDK calls it with the event and a hint. The hint is not a list of
 * secrets, so the hook takes the event alone and the secrets of the
 * environment are used. This is the backstop: it cleans the event of
 * everything private, so a path that nobody remembered cannot send anything
 * that should not be sent.
 *
 * @param event The event of the SDK.
 * @returns The clean event.
 */
const beforeSend = <T>(event: T): T => scrubEvent(event);

/**
 * Builds the options the SDK is started with.
 *
 * @param config The configuration of the monitoring.
 * @returns The options.
 */
export function buildMonitoringOptions(config: MonitoringConfig): MonitoringOptions {
  return {
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    // The SDK never attaches the body of a request, the cookies or the
    // address of a visitor on its own.
    sendDefaultPii: false,
    // The performance of M20.06 is a deliberate measurement of the slow
    // requests, and not a span for every request.
    tracesSampleRate: 0,
    // The session recording would show what a visitor types into the chat
    // and into the field of the job description (PRD §36, §78).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // The scrubbing runs on every event before it leaves the process.
    beforeSend,
  };
}

/**
 * Reads the values of the secrets of the environment.
 *
 * They are read once, when the configuration is read, and every string that
 * is sent is checked against them.
 *
 * A value that is not there, that is still the placeholder of `.env.example`
 * or that is too short to be a secret is left out. A placeholder is not a
 * secret, and looking for it would only change the text for nothing.
 *
 * @param source The environment to read.
 * @returns The values that are worth looking for.
 */
export function readMonitoringSecrets(source: Record<string, string | undefined>): string[] {
  const values: string[] = [];

  for (const name of SECRET_VARIABLE_NAMES) {
    const value = source[name];
    if (!isSecretValue(value)) continue;
    values.push((value as string).trim());
  }

  return values;
}

/**
 * Reads the monitoring configuration.
 *
 * This is the single implementation of the configuration. The server side
 * entry point and the browser side entry point both call it, so the two can
 * never disagree about when the monitoring is on.
 *
 * @param source The values to read the configuration from.
 * @returns The configuration.
 */
export function readMonitoringConfig(source: MonitoringEnvSource): MonitoringConfig {
  const dsn = source.sentryDsn?.trim();
  const enabled = isValidSentryDsn(dsn);
  const release = source.release?.trim();

  return {
    enabled,
    // The DSN is only carried while the monitoring is on. A DSN that is not
    // usable is not carried around at all, so it cannot reach a log or a
    // payload by accident.
    dsn: enabled ? dsn : undefined,
    environment: source.nodeEnv === 'production' ? 'production' : 'development',
    release: release && release.length > 0 ? release : undefined,
    logToConsole: source.nodeEnv !== 'production',
  };
}
