/**
 * The server side proxy for the events the browser sends.
 *
 * The browser cannot talk to PostHog itself, because the project key would
 * have to be published to the page. It posts the event here instead, and
 * this module checks the event and sends it on with the credentials of the
 * server.
 *
 * Only the event types on the list are accepted, and the fields of an
 * accepted event are checked one by one. A client therefore cannot put
 * anything of its own into an event, and the key never leaves the server.
 */

import { z } from 'zod';
import { trackCtaClicked, getAnalyticsConfig, flushAnalytics } from './analytics.ts';
import { createRateLimiter, type RateLimiter } from '../ai/rateLimiter.ts';
import type { AnalyticsConfig, CtaType } from './eventTypes.ts';

/**
 * The event types the browser may send.
 *
 * The list grows with the milestones that add events. An event that is not
 * on it is refused, so a client cannot invent one.
 */
export const CLIENT_EVENT_TYPES = ['cta_clicked'] as const;

/**
 * The kind of event the browser may send.
 */
export type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number];

/**
 * The kinds of call to action that can be clicked.
 */
const CTA_TYPES = ['resume', 'project', 'github', 'linkedin', 'email', 'other'] as const;

/**
 * The shape of a host name.
 *
 * A host name is a list of labels of letters, digits and dashes, joined by
 * dots. The shape does not allow a path, a query, a port or an at sign, so
 * a value that carries personal data or a whole address cannot pass as a
 * host name.
 */
const HOSTNAME_PATTERN =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;

/**
 * The default number of seconds in the short window for the proxy.
 */
export const DEFAULT_ANALYTICS_WINDOW_SECONDS = 60;

/**
 * The default number of events a visitor may send in the short window.
 */
export const DEFAULT_ANALYTICS_MAX_REQUESTS = 100;

/**
 * The default number of seconds in the long window for the proxy.
 */
export const DEFAULT_ANALYTICS_DAILY_WINDOW_SECONDS = 86400;

/**
 * The default number of events a visitor may send in the long window.
 */
export const DEFAULT_ANALYTICS_DAILY_MAX_REQUESTS = 1000;

/**
 * The message the visitor gets when the limit is reached.
 *
 * It says what happened without saying anything about the limits
 * themselves.
 */
export const RATE_LIMIT_MESSAGE =
  'Too many events were sent in a short time. Please wait a moment before sending another one.';

/**
 * The schema of a click on a call to action.
 */
const ctaClickedSchema = z
  .object({
    eventType: z.literal('cta_clicked'),
    sessionId: z.uuid(),
    queryId: z.uuid(),
    ctaType: z.enum(CTA_TYPES),
    targetDomain: z.string().max(253),
  })
  .strict();

/**
 * An event the browser may send, after it was checked.
 */
export interface ClientEvent {
  eventType: 'cta_clicked';
  sessionId: string;
  queryId: string;
  ctaType: CtaType;
  targetDomain: string;
}

/**
 * What the check of an event found.
 */
export type ClientEventValidation =
  | { ok: true; event: ClientEvent }
  | { ok: false; error: string };

/**
 * Checks an event the browser sent.
 *
 * The event type has to be one the browser is allowed to send, the session
 * and the query have to be the anonymous identifiers the site uses, and the
 * target has to be a host name and nothing else. An unknown field is
 * refused rather than dropped, so a client that tries to send anything
 * extra is told that it may not.
 *
 * @param body The body of the request.
 * @returns The event, or the reason the event was refused.
 */
export function validateClientEvent(body: unknown): ClientEventValidation {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Invalid event payload' };
  }

  const raw = body as Record<string, unknown>;
  const eventType = raw.eventType;

  if (typeof eventType !== 'string' || !CLIENT_EVENT_TYPES.includes(eventType as ClientEventType)) {
    return { ok: false, error: 'Unknown event type' };
  }

  const result = ctaClickedSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: 'Invalid event payload' };
  }

  const targetDomain = result.data.targetDomain.toLowerCase();
  if (!HOSTNAME_PATTERN.test(targetDomain)) {
    return { ok: false, error: 'Invalid event payload' };
  }

  return {
    ok: true,
    event: {
      eventType: 'cta_clicked',
      sessionId: result.data.sessionId,
      queryId: result.data.queryId,
      ctaType: result.data.ctaType,
      targetDomain,
    },
  };
}

/**
 * The limiter of the proxy.
 */
let analyticsLimiter: RateLimiter | null = null;

/**
 * Creates the limiter of the proxy.
 *
 * The proxy has its own limiter, with its own store, so the events of a
 * visitor never use up the allowance of the chat or of the job fit
 * analyzer. The key of a visitor is namespaced, so the counts of the proxy
 * never meet the counts of the other routes.
 *
 * @param options The limits and the clock.
 * @returns The limiter.
 */
export function createAnalyticsRateLimiter(
  options: {
    windowSeconds?: number;
    maxRequests?: number;
    dailyWindowSeconds?: number;
    dailyMaxRequests?: number;
    now?: () => number;
  } = {}
): RateLimiter {
  return createRateLimiter({
    windowSeconds: options.windowSeconds ?? DEFAULT_ANALYTICS_WINDOW_SECONDS,
    maxRequests: options.maxRequests ?? DEFAULT_ANALYTICS_MAX_REQUESTS,
    dailyWindowSeconds: options.dailyWindowSeconds ?? DEFAULT_ANALYTICS_DAILY_WINDOW_SECONDS,
    dailyMaxRequests: options.dailyMaxRequests ?? DEFAULT_ANALYTICS_DAILY_MAX_REQUESTS,
    now: options.now,
  });
}

/**
 * Returns the shared limiter of the proxy, creating it on first use.
 *
 * @returns The limiter.
 */
export function getAnalyticsRateLimiter(): RateLimiter {
  if (!analyticsLimiter) {
    analyticsLimiter = createAnalyticsRateLimiter();
  }
  return analyticsLimiter;
}

/**
 * Replaces the shared limiter of the proxy. Used by the tests.
 *
 * @param next The limiter to use, or null to create a new one next time.
 */
export function setAnalyticsRateLimiter(next: RateLimiter | null): void {
  analyticsLimiter = next;
}

/**
 * The answer of the proxy.
 */
export interface ProxyResult {
  /** The status of the answer. */
  status: number;
  /** The body of the answer. */
  body: { ok: true; message: string } | { ok: false; error: string };
  /** The headers of the answer. */
  headers: Record<string, string>;
}

/**
 * The options of the handler.
 */
export interface HandleClientEventOptions {
  /** The visitor the event comes from. */
  clientKey: string;
  /** The limiter to count the event against. */
  limiter?: RateLimiter;
  /** The configuration of the analytics. */
  config?: AnalyticsConfig;
  /**
   * The function that sends the event on. Used by the tests to make the
   * sending fail, and to see what was sent without a PostHog project.
   */
  send?: (event: ClientEvent, config: AnalyticsConfig) => Promise<void>;
}

/**
 * Sends an event on with the real PostHog client.
 *
 * @param event The event to send.
 * @param config The configuration of the analytics.
 */
async function sendWithPostHog(
  event: ClientEvent,
  config: AnalyticsConfig
): Promise<void> {
  await trackCtaClicked(
    event.sessionId,
    event.queryId,
    event.ctaType,
    event.targetDomain,
    config
  );
}

/**
 * Handles an event the browser sent.
 *
 * The event is counted against the limit of the visitor before anything is
 * parsed, because that is the cheapest check and it stops a flood before it
 * costs anything. The event is then checked, and the ones that pass are
 * sent on.
 *
 * The send is not a request that waits for the network. The PostHog client
 * queues the event and flushes it on its own interval, so the answer does
 * not wait for PostHog, and a failure of the sending is still reported.
 *
 * @param body The body of the request.
 * @param options The visitor and the limiter.
 * @returns The answer.
 */
export async function handleClientEvent(
  body: unknown,
  options: HandleClientEventOptions
): Promise<ProxyResult> {
  const limiter = options.limiter ?? getAnalyticsRateLimiter();

  // The key is namespaced, so the events of the proxy are counted apart
  // from the messages of the chat and from the analyses.
  const limit = limiter.check(`analytics:${options.clientKey}`);

  const headers = {
    'X-RateLimit-Limit': String(limit.limit),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)),
    'Cache-Control': 'no-store',
  };

  if (!limit.allowed) {
    return {
      status: 429,
      body: { ok: false, error: RATE_LIMIT_MESSAGE },
      headers: { ...headers, 'Retry-After': String(limit.retryAfterSeconds) },
    };
  }

  const validation = validateClientEvent(body);
  if (!validation.ok) {
    return { status: 400, body: { ok: false, error: validation.error }, headers };
  }

  try {
    const send = options.send ?? sendWithPostHog;
    await send(validation.event, options.config ?? getAnalyticsConfig());

    // The event is sent now, instead of being left in the queue of the
    // client. A serverless function is put to sleep as soon as it has
    // answered, so an event that is still queued when the answer goes out
    // can be lost.
    await flushAnalytics();

    return {
      status: 200,
      body: { ok: true, message: 'Event tracked' },
      headers,
    };
  } catch {
    // The reason is not reported, because it may hold something about the
    // server that a visitor has no use for.
    return {
      status: 500,
      body: { ok: false, error: 'Something went wrong while tracking the event.' },
      headers,
    };
  }
}

/**
 * Checks that a request came from the site itself.
 *
 * The endpoint writes into the analytics, so a request from another site
 * would fill the data of the project with events that did not happen here.
 * A browser sends the origin of the page with a request that writes, so a
 * request whose origin is not the site is refused. A request without an
 * origin is allowed, because that is a request that did not come from a
 * browser.
 *
 * @param origin The origin of the request.
 * @param host The host the request was sent to.
 * @returns Whether the request may go on.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) {
    return true;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
