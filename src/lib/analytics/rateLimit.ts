/**
 * The analytics of the limits of the visitors.
 *
 * The three parts of the site that answer to a visitor count the requests
 * against a limit. When the limit is reached the request is refused, and
 * this module says so to the analytics, so the refusals can be seen next to
 * the requests that were let through.
 *
 * The event carries only what the visitor already sees in the headers of the
 * answer, so it says nothing about the limits that the site keeps to itself.
 */

import { randomUUID } from './crypto.ts';
import { trackRateLimitExceeded } from './analytics.ts';
import type { AnalyticsConfig, RateLimitEndpoint, RateLimitScope } from './eventTypes.ts';

/**
 * What the limiter says about a visitor.
 *
 * The shape is the part of the answer of the limiter that the routes need
 * when they refuse a request.
 */
export interface RateLimitOutcome {
  /** Which of the two limits was reached. Null when the request may go ahead. */
  scope: 'window' | 'daily' | null;
  /** How long the visitor has to wait, in seconds */
  retryAfterSeconds: number;
}

/**
 * Fires the event that says the limit of a visitor was reached.
 *
 * The routes call this when they refuse a request, so the event is the same
 * whatever part of the site was asked for. The moment the request was refused
 * is on the event as well as the identifier of the request, so it can be
 * found among the other events of the same visit.
 *
 * @param sessionId The session of the visitor.
 * @param endpoint Which part of the site was asked for.
 * @param limit What the limiter said.
 * @param config The configuration to send the event with.
 */
export async function reportRateLimitExceeded(
  sessionId: string,
  endpoint: RateLimitEndpoint,
  limit: RateLimitOutcome,
  config?: AnalyticsConfig
): Promise<void> {
  // The scope is never null in a refusal, but the answer of the limiter
  // allows it. The short window is the one that is meant when the limiter
  // does not say which of the two was reached.
  const scope: RateLimitScope = limit.scope === 'daily' ? 'daily' : 'window';

  await trackRateLimitExceeded(
    sessionId,
    randomUUID(),
    scope,
    endpoint,
    limit.retryAfterSeconds,
    config
  );
}
