/**
 * The configuration of the analytics layer.
 *
 * This module is deliberately free of any dependency on the PostHog package,
 * so the browser and the server can both read the configuration without
 * pulling a server only package into a client bundle.
 *
 * Analytics has to work in two modes. When the credentials are configured,
 * the events are sent to PostHog. When they are not, the events are written
 * to the console in development and nothing leaves the machine. A value that
 * is still the placeholder from `.env.example` counts as "not configured",
 * because a placeholder is not a credential.
 */

import type { AnalyticsConfig } from './eventTypes.ts';

/**
 * The values the configuration is read from.
 */
export interface AnalyticsEnvSource {
  /** The PostHog project API key. */
  posthogKey?: string | undefined;
  /** The PostHog host, for example `https://eu.i.posthog.com`. */
  posthogHost?: string | undefined;
  /** The `NODE_ENV` value. */
  nodeEnv?: string | undefined;
}

/**
 * The shapes that mean "this value was never filled in".
 *
 * The first one is the convention of `.env.example`, which writes
 * `your_posthog_key`. The others are the ways a placeholder is usually
 * written by hand.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^your[_-]/i,
  /^<.*>$/,
  /^(changeme|change_me|change-me|todo|tbd|none|null|undefined)$/i,
  /^x{3,}$/i,
  /^(placeholder|test[-_]?placeholder)/i,
];

/**
 * Whether a value is a placeholder rather than a real credential.
 *
 * @param value The value to check.
 * @returns True when the value is a placeholder or is empty.
 */
export function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return true;
  }
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Whether a value is a real, usable credential.
 *
 * @param value The value to check.
 * @returns True when the value is set and is not a placeholder.
 */
export function isConfiguredValue(value: string | null | undefined): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return !isPlaceholderValue(value);
}

/**
 * Whether a value is a host PostHog can be reached at.
 *
 * A placeholder is not a host, and neither is a string that is not a URL, so
 * both are rejected here.
 *
 * @param host The host to check.
 * @returns True when the host is an http or https URL.
 */
export function isValidPostHogHost(host: string | null | undefined): boolean {
  if (!isConfiguredValue(host)) {
    return false;
  }
  try {
    const url = new URL((host as string).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Reads the analytics configuration.
 *
 * This is the single implementation of the configuration. The server side
 * module and the browser side module both call it, so the two can never
 * disagree about when analytics is on.
 *
 * @param source The values to read the configuration from.
 * @param options Whether the code is running in the browser.
 * @returns The configuration.
 */
export function readAnalyticsConfig(
  source: AnalyticsEnvSource,
  options: { isBrowser?: boolean } = {}
): AnalyticsConfig {
  const logToConsole = source.nodeEnv !== 'production';

  if (options.isBrowser) {
    // The browser never talks to PostHog directly. The key would have to
    // be exposed to the page, so the browser only reports what it sees to
    // the server. The proxy endpoint of M19.02 does the sending.
    //
    // The browser cannot know whether the server has the credentials, so
    // `enabled` here means "the events are sent to the server of the site".
    // Whether the server forwards them is decided there, and a server
    // without credentials simply forwards nothing.
    return { enabled: true, logToConsole };
  }

  const key = source.posthogKey?.trim();
  const host = source.posthogHost?.trim();
  const enabled = isConfiguredValue(key) && isValidPostHogHost(host);

  return {
    enabled,
    // The credentials are only carried when analytics is on. A key that is
    // not usable is not carried around at all.
    posthogKey: enabled ? key : undefined,
    posthogHost: enabled ? host : undefined,
    logToConsole,
  };
}
