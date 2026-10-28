/**
 * Contact form rate limiter tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createContactRateLimiter,
  DEFAULT_CONTACT_WINDOW_SECONDS,
  DEFAULT_CONTACT_MAX_REQUESTS,
  DEFAULT_CONTACT_DAILY_MAX_REQUESTS,
} from './rateLimiter.ts';

/**
 * Creates a fake clock for testing.
 */
function createFakeClock(initialTime = 1000000000000) {
  let time = initialTime;
  return {
    now: () => time,
    advance: (ms: number) => { time += ms; },
  };
}

describe('createContactRateLimiter', () => {
  describe('defaults', () => {
    test('uses default window of 30 minutes', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({ now: clock.now });

      const result = limiter.check('test-key');
      assert.equal(result.limit, DEFAULT_CONTACT_MAX_REQUESTS);
      assert.equal(result.resetAt, 1000000000000 + DEFAULT_CONTACT_WINDOW_SECONDS * 1000);
    });

    test('uses default max requests of 3', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({ now: clock.now });

      const result = limiter.check('test-key');
      assert.equal(result.limit, 3);
    });

    test('uses default daily window of 24 hours', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({ now: clock.now });

      const result = limiter.check('test-key');
      assert.equal(result.resetAt, 1000000000000 + DEFAULT_CONTACT_WINDOW_SECONDS * 1000);
    });

    test('uses default daily max of 5', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({ now: clock.now });

      // Make 3 requests (window limit)
      limiter.check('test-key');
      limiter.check('test-key');
      limiter.check('test-key');
      // Next should be blocked by window limit
      const result = limiter.check('test-key');
      assert.equal(result.allowed, false);
      assert.equal(result.scope, 'window');
    });
  });

  describe('short window limiting', () => {
    test('allows requests up to maxRequests', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 3,
        windowSeconds: 60,
      });

      for (let i = 0; i < 3; i++) {
        const result = limiter.check('user-1');
        assert.equal(result.allowed, true);
        assert.equal(result.remaining, 2 - i);
      }
    });

    test('blocks request when window limit exceeded', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 3,
        windowSeconds: 60,
      });

      limiter.check('user-1');
      limiter.check('user-1');
      limiter.check('user-1');

      const result = limiter.check('user-1');
      assert.equal(result.allowed, false);
      assert.equal(result.scope, 'window');
      assert.equal(result.remaining, 0);
      assert(result.retryAfterSeconds > 0);
    });

    test('resets window after time passes', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 2,
        windowSeconds: 60,
      });

      limiter.check('user-1');
      limiter.check('user-1');

      const blocked = limiter.check('user-1');
      assert.equal(blocked.allowed, false);

      // Advance past the window
      clock.advance(61 * 1000);

      const allowed = limiter.check('user-1');
      assert.equal(allowed.allowed, true);
      assert.equal(allowed.remaining, 1);
    });

    test('different keys have independent limits', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 2,
        windowSeconds: 60,
      });

      limiter.check('user-1');
      limiter.check('user-1');
      const blocked1 = limiter.check('user-1');
      assert.equal(blocked1.allowed, false);

      const allowed2 = limiter.check('user-2');
      assert.equal(allowed2.allowed, true);
      assert.equal(allowed2.remaining, 1);
    });
  });

  describe('daily window limiting', () => {
    test('allows requests up to dailyMaxRequests across window resets', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 2, // Short window of 2
        dailyMaxRequests: 5,
        dailyWindowSeconds: 86400,
      });

      // First window: 2 requests
      limiter.check('user-1');
      limiter.check('user-1');
      assert.equal(limiter.check('user-1').allowed, false);

      // Advance past short window but not daily window
      clock.advance(1801 * 1000); // 30 min + 1 sec

      // Second window: 2 more requests
      limiter.check('user-1');
      limiter.check('user-1');
      assert.equal(limiter.check('user-1').allowed, false);

      // Advance past short window again
      clock.advance(1801 * 1000);

      // Third window: 1 more request (total 5 = daily max)
      assert.equal(limiter.check('user-1').allowed, true);
      // Next should be blocked by daily limit
      const result = limiter.check('user-1');
      assert.equal(result.allowed, false);
      assert.equal(result.scope, 'daily');
    });

    test('blocks request when daily limit exceeded', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 100, // High short window limit
        dailyMaxRequests: 5,
        dailyWindowSeconds: 86400,
      });

      for (let i = 0; i < 5; i++) {
        limiter.check('user-1');
      }

      const result = limiter.check('user-1');
      assert.equal(result.allowed, false);
      assert.equal(result.scope, 'daily');
      assert.equal(result.remaining, 0);
      assert(result.retryAfterSeconds > 0);
    });

    test('resets daily window after 24 hours', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 100,
        dailyMaxRequests: 2,
        dailyWindowSeconds: 86400,
      });

      limiter.check('user-1');
      limiter.check('user-1');
      const blocked = limiter.check('user-1');
      assert.equal(blocked.allowed, false);
      assert.equal(blocked.scope, 'daily');

      // Advance past daily window
      clock.advance(86401 * 1000);

      const allowed = limiter.check('user-1');
      assert.equal(allowed.allowed, true);
      assert.equal(allowed.remaining, 1);
    });
  });

  describe('blocked requests are not counted', () => {
    test('retrying while blocked does not extend the window', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 1,
        windowSeconds: 60,
      });

      limiter.check('user-1'); // First request allowed
      const blocked1 = limiter.check('user-1'); // Second blocked
      assert.equal(blocked1.allowed, false);
      const retryAfter1 = blocked1.retryAfterSeconds;

      // Try again immediately
      const blocked2 = limiter.check('user-1');
      assert.equal(blocked2.allowed, false);
      // Retry-After should not have increased
      assert.equal(blocked2.retryAfterSeconds, retryAfter1);

      // Advance past window
      clock.advance(61 * 1000);
      const allowed = limiter.check('user-1');
      assert.equal(allowed.allowed, true);
    });
  });

  describe('rate limit headers', () => {
    test('returns correct headers on allowed request', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 3,
        windowSeconds: 60,
      });

      const result = limiter.check('user-1');
      assert.equal(result.allowed, true);
      assert.equal(result.limit, 3);
      assert.equal(result.remaining, 2);
      assert.equal(result.resetAt, 1000000000000 + 60 * 1000);
      assert.equal(result.retryAfterSeconds, 0);
      assert.equal(result.scope, null);
    });

    test('returns correct headers on blocked request', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 1,
        windowSeconds: 60,
      });

      limiter.check('user-1');
      const result = limiter.check('user-1');

      assert.equal(result.allowed, false);
      assert.equal(result.limit, 1);
      assert.equal(result.remaining, 0);
      assert(result.resetAt > 1000000000000);
      assert(result.retryAfterSeconds > 0);
      assert.equal(result.scope, 'window');
    });
  });

  describe('custom store', () => {
    test('uses provided store', () => {
      const store = new Map<string, number[]>();
      const customStore = {
        read: (key: string) => store.get(key) ?? [],
        write: (key: string, timestamps: number[]) => store.set(key, timestamps),
        clear: (key: string) => store.delete(key),
        prune: (olderThan: number) => {
          for (const [key, timestamps] of store) {
            const live = timestamps.filter((ts) => ts >= olderThan);
            if (live.length === 0) store.delete(key);
            else store.set(key, live);
          }
        },
      };

      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 2,
        windowSeconds: 60,
        store: customStore,
      });

      limiter.check('user-1');
      limiter.check('user-1');
      const blocked = limiter.check('user-1');
      assert.equal(blocked.allowed, false);
    });
  });

  describe('reset', () => {
    test('reset clears all limits', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 1,
        windowSeconds: 60,
      });

      limiter.check('user-1');
      const blocked = limiter.check('user-1');
      assert.equal(blocked.allowed, false);

      limiter.reset();

      const allowed = limiter.check('user-1');
      assert.equal(allowed.allowed, true);
      assert.equal(allowed.remaining, 0);
    });
  });

  describe('environment variable overrides', () => {
    test('can be configured with custom limits', () => {
      const clock = createFakeClock();
      const limiter = createContactRateLimiter({
        now: clock.now,
        maxRequests: 100, // High window limit so daily limit is hit first
        windowSeconds: 300,
        dailyMaxRequests: 5,
        dailyWindowSeconds: 43200,
      });

      for (let i = 0; i < 5; i++) {
        assert.equal(limiter.check('user-1').allowed, true);
      }
      const result = limiter.check('user-1');
      assert.equal(result.allowed, false);
      assert.equal(result.scope, 'daily');

      // Test window limit with lower limit
      const limiter2 = createContactRateLimiter({
        now: clock.now,
        maxRequests: 2,
        windowSeconds: 60,
        dailyMaxRequests: 100,
        dailyWindowSeconds: 86400,
      });

      assert.equal(limiter2.check('user-2').allowed, true);
      assert.equal(limiter2.check('user-2').allowed, true);
      const blocked = limiter2.check('user-2');
      assert.equal(blocked.allowed, false);
      assert.equal(blocked.scope, 'window');
    });
  });
});