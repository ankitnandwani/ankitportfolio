import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createRateLimiter,
  createMemoryRateLimitStore,
  type RateLimiterOptions,
} from './rateLimiter.ts';

/**
 * A clock the tests move by hand.
 */
function createClock(start = 1_700_000_000_000) {
  let current = start;

  return {
    now: () => current,
    advance(seconds: number) {
      current += seconds * 1000;
    },
  };
}

/**
 * Creates a limiter with short windows.
 */
function createTestLimiter(
  options: RateLimiterOptions = {},
  clock = createClock()
) {
  const limiter = createRateLimiter({
    windowSeconds: 60,
    maxRequests: 3,
    dailyWindowSeconds: 3600,
    dailyMaxRequests: 10,
    now: clock.now,
    ...options,
  });

  return { limiter, clock };
}

test('lets a request through when the visitor is under the limit', () => {
  const { limiter } = createTestLimiter();

  const result = limiter.check('visitor-1');

  assert.equal(result.allowed, true);
  assert.equal(result.limit, 3);
  assert.equal(result.remaining, 2);
  assert.equal(result.scope, null);
  assert.equal(result.retryAfterSeconds, 0);
});

test('blocks a visitor once the limit is reached', () => {
  const { limiter } = createTestLimiter();

  assert.equal(limiter.check('visitor-1').allowed, true);
  assert.equal(limiter.check('visitor-1').allowed, true);
  assert.equal(limiter.check('visitor-1').allowed, true);

  const blocked = limiter.check('visitor-1');

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.scope, 'window');
  assert.ok(blocked.retryAfterSeconds > 0);
  assert.ok(blocked.resetAt > blocked.retryAfterSeconds);
});

test('counts every visitor on its own', () => {
  const { limiter } = createTestLimiter();

  for (let round = 0; round < 3; round++) {
    assert.equal(limiter.check('visitor-1').allowed, true);
  }

  assert.equal(limiter.check('visitor-1').allowed, false);
  assert.equal(limiter.check('visitor-2').allowed, true);
});

test('lets a visitor through again once the window has passed', () => {
  const { limiter, clock } = createTestLimiter();

  for (let round = 0; round < 3; round++) {
    limiter.check('visitor-1');
  }

  assert.equal(limiter.check('visitor-1').allowed, false);

  clock.advance(61);

  const afterWindow = limiter.check('visitor-1');

  assert.equal(afterWindow.allowed, true);
  assert.equal(afterWindow.remaining, 2);
});

test('does not let a blocked request push the window further away', () => {
  const { limiter, clock } = createTestLimiter();

  for (let round = 0; round < 3; round++) {
    limiter.check('visitor-1');
  }

  const firstBlock = limiter.check('visitor-1');
  clock.advance(10);
  const secondBlock = limiter.check('visitor-1');

  assert.equal(firstBlock.resetAt, secondBlock.resetAt);
});

test('blocks a visitor that sends too much over a day', () => {
  const { limiter, clock } = createTestLimiter({
    maxRequests: 100,
    dailyMaxRequests: 4,
  });

  for (let round = 0; round < 4; round++) {
    assert.equal(limiter.check('visitor-1').allowed, true);
  }

  const blocked = limiter.check('visitor-1');

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.scope, 'daily');
  assert.equal(blocked.limit, 4);

  // The short window passes, but the day does not.
  clock.advance(61);

  const afterWindow = limiter.check('visitor-1');

  assert.equal(afterWindow.allowed, false);
  assert.equal(afterWindow.scope, 'daily');
});

test('lets a visitor through again once the day has passed', () => {
  const { limiter, clock } = createTestLimiter({
    maxRequests: 100,
    dailyMaxRequests: 2,
  });

  limiter.check('visitor-1');
  limiter.check('visitor-1');

  assert.equal(limiter.check('visitor-1').allowed, false);

  clock.advance(3601);

  assert.equal(limiter.check('visitor-1').allowed, true);
});

test('forgets the counts when it is reset', () => {
  const { limiter } = createTestLimiter();

  for (let round = 0; round < 3; round++) {
    limiter.check('visitor-1');
  }

  assert.equal(limiter.check('visitor-1').allowed, false);

  limiter.reset();

  assert.equal(limiter.check('visitor-1').allowed, true);
});

test('uses the limits PRD §48 suggests by default', () => {
  const limiter = createRateLimiter();

  const first = limiter.check('visitor-1');

  assert.equal(first.limit, 20);
  assert.equal(first.remaining, 19);
});

test('keeps the counts in the store it was given', () => {
  const store = createMemoryRateLimitStore();
  const { limiter } = createTestLimiter({ store });

  limiter.check('visitor-1');

  assert.equal(store.read('window:visitor-1').length, 1);
  assert.equal(store.read('daily:visitor-1').length, 1);
});

test('does not grow the store without a limit', () => {
  const store = createMemoryRateLimitStore();
  const { limiter } = createTestLimiter({ store, maxRequests: 1000 });

  for (let round = 0; round < 250; round++) {
    limiter.check(`visitor-${round}`);
  }

  // The store is cleaned up as it goes, so a visitor that never comes back
  // does not stay in it for ever.
  assert.ok(store.read('window:visitor-0').length <= 1);
});
