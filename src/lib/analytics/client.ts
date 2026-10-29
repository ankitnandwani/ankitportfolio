/**
 * Client-side analytics wrapper.
 * Provides CTA tracking without importing server-side dependencies.
 */

import { randomUUID } from './crypto.ts';
import { readAnalyticsConfig } from './config.ts';
import type { CtaType, AnalyticsConfig } from './eventTypes.ts';

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
 * @param clientKey A key identifying the client (e.g., hashed IP + UA)
 * @returns The session ID
 */
export function getSessionId(clientKey: string): string {
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
 * Client-side: analytics disabled (only server tracks).
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
 * Fire-and-forget: does not await the send to avoid blocking.
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

  // On client-side, we can't send to PostHog directly without exposing keys
  // This would need a server-side endpoint to proxy the event
  // For now, we just log to console
  if (config.logToConsole) {
    console.log('[analytics] CTA click tracked (client-side):', {
      sessionId,
      queryId,
      ctaType,
      targetDomain,
    });
  }
}