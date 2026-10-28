/**
 * Rate limiting for the contact form endpoint.
 *
 * Stricter limits than the chat endpoint since contact form sends emails.
 * Suggested: 3 requests per 30 minutes, 5 per day.
 */

import {
  type RateLimitStore,
  type RateLimiter,
  type RateLimiterOptions,
  createMemoryRateLimitStore,
  createRateLimiter as createBaseRateLimiter,
} from '../ai/rateLimiter.ts';

/**
 * The default number of seconds in the short window for the contact form.
 * 30 minutes = 1800 seconds.
 */
export const DEFAULT_CONTACT_WINDOW_SECONDS = 1800;

/**
 * The default number of submissions a visitor may send in the short window.
 */
export const DEFAULT_CONTACT_MAX_REQUESTS = 3;

/**
 * The default number of seconds in the long window for the contact form.
 * 24 hours = 86400 seconds.
 */
export const DEFAULT_CONTACT_DAILY_WINDOW_SECONDS = 86400;

/**
 * The default number of submissions a visitor may send in the long window.
 */
export const DEFAULT_CONTACT_DAILY_MAX_REQUESTS = 5;

/**
 * Creates the contact form rate limiter.
 *
 * @param options The options for the rate limiter.
 * @returns The rate limiter.
 */
export function createContactRateLimiter(
  options: RateLimiterOptions = {}
): RateLimiter {
  return createBaseRateLimiter({
    windowSeconds: options.windowSeconds ?? DEFAULT_CONTACT_WINDOW_SECONDS,
    maxRequests: options.maxRequests ?? DEFAULT_CONTACT_MAX_REQUESTS,
    dailyWindowSeconds:
      options.dailyWindowSeconds ?? DEFAULT_CONTACT_DAILY_WINDOW_SECONDS,
    dailyMaxRequests:
      options.dailyMaxRequests ?? DEFAULT_CONTACT_DAILY_MAX_REQUESTS,
    now: options.now,
    store: options.store ?? createMemoryRateLimitStore(),
  });
}

/**
 * The contact form rate limiter instance.
 */
let contactRateLimiter: RateLimiter | null = null;

/**
 * Returns the contact form rate limiter, creating it on first use.
 *
 * The limits come from the environment when it holds them, so they can be
 * changed without a change to the code.
 *
 * @returns The rate limiter.
 */
export function getContactRateLimiter(): RateLimiter {
  if (contactRateLimiter) return contactRateLimiter;

  const windowSeconds = readNumber('CONTACT_WINDOW_SECONDS');
  const maxRequests = readNumber('CONTACT_MAX_REQUESTS');
  const dailyMaxRequests = readNumber('CONTACT_DAILY_MAX_REQUESTS');

  contactRateLimiter = createContactRateLimiter({
    windowSeconds: windowSeconds ?? DEFAULT_CONTACT_WINDOW_SECONDS,
    maxRequests: maxRequests ?? DEFAULT_CONTACT_MAX_REQUESTS,
    dailyMaxRequests: dailyMaxRequests ?? DEFAULT_CONTACT_DAILY_MAX_REQUESTS,
  });

  return contactRateLimiter;
}

/**
 * Replaces the contact form rate limiter. Used by the tests.
 *
 * @param next The limiter to use, or null to create a new one next time.
 */
export function setContactRateLimiter(next: RateLimiter | null): void {
  contactRateLimiter = next;
}

/**
 * Reads a number from the environment.
 *
 * @param name The name of the variable.
 * @returns The number, or null when it is not set or not a number.
 */
function readNumber(name: string): number | null {
  const raw = process.env[name];

  if (!raw) return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;

  return value;
}

export type { RateLimitStore, RateLimiter, RateLimiterOptions } from '../ai/rateLimiter.ts';