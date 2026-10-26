/**
 * Rate limiting for the chat endpoint.
 *
 * PRD §48 asks for a limit per visitor: twenty messages every thirty
 * minutes and a hundred a day. Both windows slide, so a request only
 * counts against the half hour it was made in. The store is injected, so
 * the same limiter can run against a shared store later without changing
 * the callers.
 */

/**
 * The default number of seconds in the short window.
 */
export const DEFAULT_WINDOW_SECONDS = 1800;

/**
 * The default number of messages a visitor may send in the short window.
 */
export const DEFAULT_MAX_REQUESTS = 20;

/**
 * The default number of seconds in the long window.
 */
export const DEFAULT_DAILY_WINDOW_SECONDS = 86400;

/**
 * The default number of messages a visitor may send in the long window.
 */
export const DEFAULT_DAILY_MAX_REQUESTS = 100;

/**
 * Where the rate limiting counts are kept.
 */
export interface RateLimitStore {
  /**
   * Returns the moments at which the requests of a key were made.
   */
  read(key: string): number[];

  /**
   * Replaces the moments at which the requests of a key were made.
   */
  write(key: string, timestamps: number[]): void;

  /**
   * Forgets the requests of a key.
   */
  clear(key: string): void;

  /**
   * Forgets the keys whose requests are all older than a moment.
   *
   * It is optional, because a store that keeps its own house does not need
   * it.
   */
  prune?(olderThan: number): void;
}

/**
 * The options of the limiter.
 */
export interface RateLimiterOptions {
  /**
   * The number of seconds in the short window.
   */
  windowSeconds?: number;

  /**
   * The number of messages a visitor may send in the short window.
   */
  maxRequests?: number;

  /**
   * The number of seconds in the long window.
   */
  dailyWindowSeconds?: number;

  /**
   * The number of messages a visitor may send in the long window.
   */
  dailyMaxRequests?: number;

  /**
   * The clock. Used by the tests to move the windows along.
   */
  now?: () => number;

  /**
   * Where the counts are kept. Defaults to a store in memory.
   */
  store?: RateLimitStore;
}

/**
 * What the limiter decided about a request.
 */
export interface RateLimitResult {
  /**
   * Whether the request may go through.
   */
  allowed: boolean;

  /**
   * The number of requests the visitor may still send in the short window.
   */
  limit: number;

  /**
   * The number of requests the visitor may still send in the short window.
   */
  remaining: number;

  /**
   * The moment the short window ends, in milliseconds since the epoch.
   */
  resetAt: number;

  /**
   * How long the visitor has to wait, in seconds.
   */
  retryAfterSeconds: number;

  /**
   * The limit that was reached, when the request was not allowed.
   */
  scope: 'window' | 'daily' | null;
}

/**
 * The limiter.
 */
export interface RateLimiter {
  /**
   * Counts a request against a visitor.
   *
   * @param key The visitor.
   * @returns Whether the request may go through.
   */
  check(key: string): RateLimitResult;

  /**
   * Forgets every count.
   */
  reset(): void;
}

/**
 * How many requests are counted before the store is cleaned up.
 */
const PRUNE_EVERY = 100;

/**
 * Creates a store that keeps the counts in memory.
 *
 * The counts are lost when the process ends. PRD §48 accepts a limit per
 * instance, because the site is meant for low traffic and the free tier.
 *
 * @returns The store.
 */
export function createMemoryRateLimitStore(): RateLimitStore {
  const entries = new Map<string, number[]>();

  return {
    read(key: string): number[] {
      return entries.get(key) ?? [];
    },

    write(key: string, timestamps: number[]): void {
      entries.set(key, timestamps);
    },

    clear(key: string): void {
      entries.delete(key);
    },

    prune(olderThan: number): void {
      for (const [key, timestamps] of entries) {
        const live = timestamps.filter((timestamp) => timestamp >= olderThan);

        if (live.length === 0) entries.delete(key);
        else entries.set(key, live);
      }
    },
  };
}

/**
 * Creates the limiter.
 *
 * @param options The limits, the clock and the store.
 * @returns The limiter.
 */
export function createRateLimiter(
  options: RateLimiterOptions = {}
): RateLimiter {
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const dailyWindowSeconds =
    options.dailyWindowSeconds ?? DEFAULT_DAILY_WINDOW_SECONDS;
  const dailyMaxRequests =
    options.dailyMaxRequests ?? DEFAULT_DAILY_MAX_REQUESTS;
  const now = options.now ?? (() => Date.now());
  const store = options.store ?? createMemoryRateLimitStore();

  let requests = 0;
  const knownKeys = new Set<string>();

  /**
   * Reads the moments of a window and drops the ones that fell out of it.
   */
  function readWindow(key: string, lengthSeconds: number): number[] {
    const timestamp = now();
    const oldest = timestamp - lengthSeconds * 1000;

    return store.read(key).filter((moment) => moment > oldest);
  }

  /**
   * The moment a window ends.
   */
  function windowEnd(timestamps: number[], lengthSeconds: number): number {
    const oldest = timestamps[0];
    return oldest + lengthSeconds * 1000;
  }

  return {
    check(key: string): RateLimitResult {
      const timestamp = now();

      requests += 1;
      if (requests % PRUNE_EVERY === 0) {
        store.prune?.(timestamp - dailyWindowSeconds * 1000);
      }

      const windowKey = `window:${key}`;
      const dailyKey = `daily:${key}`;

      knownKeys.add(windowKey);
      knownKeys.add(dailyKey);

      const windowTimestamps = readWindow(windowKey, windowSeconds);
      const dailyTimestamps = readWindow(dailyKey, dailyWindowSeconds);

      // A request that is turned away is not counted. That way a visitor
      // who reaches the limit does not have the window pushed further away
      // every time they try again.
      if (windowTimestamps.length >= maxRequests) {
        const resetAt = windowEnd(windowTimestamps, windowSeconds);

        store.write(windowKey, windowTimestamps);
        store.write(dailyKey, dailyTimestamps);

        return {
          allowed: false,
          limit: maxRequests,
          remaining: 0,
          resetAt,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((resetAt - timestamp) / 1000)
          ),
          scope: 'window',
        };
      }

      if (dailyTimestamps.length >= dailyMaxRequests) {
        const resetAt = windowEnd(dailyTimestamps, dailyWindowSeconds);

        store.write(windowKey, windowTimestamps);
        store.write(dailyKey, dailyTimestamps);

        return {
          allowed: false,
          limit: dailyMaxRequests,
          remaining: 0,
          resetAt,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((resetAt - timestamp) / 1000)
          ),
          scope: 'daily',
        };
      }

      windowTimestamps.push(timestamp);
      dailyTimestamps.push(timestamp);

      store.write(windowKey, windowTimestamps);
      store.write(dailyKey, dailyTimestamps);

      const windowRemaining = Math.max(0, maxRequests - windowTimestamps.length);
      const dailyRemaining = Math.max(
        0,
        dailyMaxRequests - dailyTimestamps.length
      );

      const resetAt = Math.min(
        windowEnd(windowTimestamps, windowSeconds),
        windowEnd(dailyTimestamps, dailyWindowSeconds)
      );

      return {
        allowed: true,
        limit: maxRequests,
        remaining: Math.min(windowRemaining, dailyRemaining),
        resetAt,
        retryAfterSeconds: 0,
        scope: null,
      };
    },

    reset(): void {
      for (const key of knownKeys) store.clear(key);
      knownKeys.clear();
    },
  };
}

/**
 * The limiter the chat endpoint uses.
 */
let limiter: RateLimiter | null = null;

/**
 * Returns the limiter the chat endpoint uses, creating it on first use.
 *
 * The limits come from the environment when it holds them, so they can be
 * changed without a change to the code (PRD §48).
 *
 * @returns The limiter.
 */
export function getRateLimiter(): RateLimiter {
  if (limiter) return limiter;

  const windowSeconds = readNumber('RATE_LIMIT_WINDOW_SECONDS');
  const maxRequests = readNumber('RATE_LIMIT_MAX_REQUESTS');
  const dailyMaxRequests = readNumber('RATE_LIMIT_DAILY_MAX');

  limiter = createRateLimiter({
    windowSeconds: windowSeconds ?? DEFAULT_WINDOW_SECONDS,
    maxRequests: maxRequests ?? DEFAULT_MAX_REQUESTS,
    dailyMaxRequests: dailyMaxRequests ?? DEFAULT_DAILY_MAX_REQUESTS,
  });

  return limiter;
}

/**
 * Replaces the limiter the chat endpoint uses. Used by the tests.
 *
 * @param next The limiter to use, or null to create a new one next time.
 */
export function setRateLimiter(next: RateLimiter | null): void {
  limiter = next;
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
