/**
 * Client-side analytics wrapper.
 * Provides CTA tracking without importing server-side dependencies.
 */

import { randomUUID } from './crypto.ts';
import { readAnalyticsConfig } from './config.ts';
import type { CtaType, AnalyticsConfig } from './eventTypes.ts';

/**
 * The address of the endpoint that sends the events on.
 *
 * The browser cannot talk to PostHog itself, because the project key would
 * have to be published to the page. The events go to the server of the site
 * instead, and the server sends them on with the key that never leaves it.
 */
export const ANALYTICS_ENDPOINT = '/api/analytics';

/**
 * The prefix of the key the session is stored under.
 */
const SESSION_STORAGE_PREFIX = 'analytics-session:';

/**
 * In-memory storage for session IDs (per process).
 * In production with multiple instances, this would be replaced
 * by a shared store (e.g., Upstash Redis).
 */
const sessionStore = new Map<string, string>();

/**
 * Hashes a string using a simple hash function.
 * Used for user agent hashing to avoid storing raw UA strings.
 */
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Gets or creates an anonymous session ID for a client.
 *
 * In the browser the session is kept in the storage of the tab, so a
 * visitor who reloads the page is still the same session and the events of
 * one visit belong together. A new tab is a new session, which is what a
 * session means. The storage of the browser can be refused, in a private
 * window for example, and then the session is kept in memory for as long as
 * the page is open.
 *
 * @param clientKey A key identifying the client (e.g., hashed IP + UA)
 * @returns The session ID
 */
export function getSessionId(clientKey: string): string {
  const storageKey = `${SESSION_STORAGE_PREFIX}${clientKey}`;

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored) {
        return stored;
      }

      const created = randomUUID();
      window.sessionStorage.setItem(storageKey, created);
      return created;
    } catch {
      // The storage can be refused. The memory below is used instead.
    }
  }

  let sessionId = sessionStore.get(clientKey);
  if (!sessionId) {
    sessionId = randomUUID();
    sessionStore.set(clientKey, sessionId);
  }
  return sessionId;
}

/**
 * Generates a client key from request headers.
 * Uses hashed IP + user agent for privacy.
 */
export function generateClientKey(
  forwardedFor: string | null,
  realIp: string | null,
  userAgent: string | null
): string {
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'unknown';
  const uaHash = userAgent ? hashString(userAgent) : 'unknown';
  return `${ip}:${uaHash}`;
}

/**
 * Gets the current analytics configuration from environment.
 *
 * In the browser the credentials of the server are not there, because they
 * are never published to the page, so the browser cannot know whether the
 * events will be forwarded. It sends them to the server of the site, and
 * the server decides. A caller that does not want the events sent passes a
 * configuration of its own with `enabled` turned off.
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  return readAnalyticsConfig(
    {
      posthogKey: process.env.POSTHOG_KEY,
      posthogHost: process.env.POSTHOG_HOST,
      nodeEnv: process.env.NODE_ENV,
    },
    { isBrowser: typeof window !== 'undefined' }
  );
}

/**
 * Tracks a CTA click in a response (client-side).
 *
 * The event goes to the endpoint of the site, which sends it on to PostHog.
 * The request is kept alive when the page goes away, so a click on a link
 * that opens in a new tab is still counted.
 *
 * Nothing here ever throws. The analytics are not worth an error in the
 * page of the visitor, and a failure of the endpoint is not worth more
 * than a line in the console of the developer.
 *
 * @param sessionId The anonymous session of the visitor.
 * @param queryId The identifier of the answer the click belongs to.
 * @param ctaType The kind of call to action that was clicked.
 * @param targetDomain The host the link points at.
 * @param config The configuration of the analytics.
 */
export async function trackCtaClicked(
  sessionId: string,
  queryId: string,
  ctaType: CtaType,
  targetDomain: string,
  config: AnalyticsConfig = getAnalyticsConfig()
): Promise<void> {
  // Always log to console in development
  if (config.logToConsole) {
    console.log('[analytics] cta_clicked', {
      sessionId,
      queryId,
      ctaType,
      targetDomain,
    });
  }

  if (!config.enabled) {
    return;
  }

  try {
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The moment the event happened is put on it by the server, which has
      // the clock that counts. The browser clock is not trusted.
      body: JSON.stringify({
        eventType: 'cta_clicked',
        sessionId,
        queryId,
        ctaType,
        targetDomain,
      }),
      // The request goes on even when the page goes away, so a click on a
      // link that opens in a new tab is still counted.
      keepalive: true,
    });

    if (!response.ok) {
      console.warn('[analytics] CTA tracking failed:', response.status);
    }
  } catch (error) {
    // The failure is not worth more than a line in the console. The page of
    // the visitor is not affected by it.
    console.warn('[analytics] CTA tracking error:', error);
  }
}
