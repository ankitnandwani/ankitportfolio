import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { createRateLimiter } from '../ai/rateLimiter.ts';
import { setPostHogClientFactory } from './analytics.ts';
import { reportRateLimitExceeded } from './rateLimit.ts';
import type { PostHogClient, PostHogEventMessage } from './analytics.ts';

const ORIGINAL_POSTHOG_KEY = process.env.POSTHOG_KEY;
const ORIGINAL_POSTHOG_HOST = process.env.POSTHOG_HOST;

/**
 * The environment as a map that can be written to.
 */
const mutableEnv = process.env as Record<string, string | undefined>;

/**
 * Sets the PostHog credentials, or removes them when the value is undefined.
 */
function setCredentials(key: string | undefined, host: string | undefined): void {
  if (key === undefined) {
    delete mutableEnv.POSTHOG_KEY;
  } else {
    mutableEnv.POSTHOG_KEY = key;
  }

  if (host === undefined) {
    delete mutableEnv.POSTHOG_HOST;
  } else {
    mutableEnv.POSTHOG_HOST = host;
  }
}

/**
 * A PostHog client that records what it is given.
 */
function createRecordingClient() {
  const captured: PostHogEventMessage[] = [];

  const client: PostHogClient = {
    capture: (message) => {
      captured.push(message);
    },
    shutdown: async () => {},
  };

  const factory = () => client;

  return { client, captured, factory };
}

afterEach(() => {
  setCredentials(ORIGINAL_POSTHOG_KEY, ORIGINAL_POSTHOG_HOST);
  setPostHogClientFactory(null);
});

test('the event of a refusal reaches PostHog', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await reportRateLimitExceeded('session-1', 'chat', {
    scope: 'window',
    retryAfterSeconds: 60,
  });

  assert.equal(recorder.captured.length, 1);
  assert.equal(recorder.captured[0].event, 'rate_limit_exceeded');
  assert.equal(recorder.captured[0].distinctId, 'session-1');

  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.scope, 'window');
  assert.equal(properties?.endpoint, 'chat');
  assert.equal(properties?.retryAfterSeconds, 60);
});

test('the event of a refusal names the part of the site that was asked for', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await reportRateLimitExceeded('session-2', 'job-fit', {
    scope: 'daily',
    retryAfterSeconds: 3600,
  });

  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.endpoint, 'job-fit');
  assert.equal(properties?.scope, 'daily');
});

test('the event of a refusal carries an identifier of its own', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await reportRateLimitExceeded('session-3', 'contact', {
    scope: 'window',
    retryAfterSeconds: 30,
  });

  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  // The identifier is made for the refusal, so it is not the identifier of a
  // request that was never made.
  assert.equal(typeof properties?.queryId, 'string');
  assert.equal(String(properties?.queryId).length > 0, true);
});

test('the short window is meant when the limiter does not say which was reached', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await reportRateLimitExceeded('session-4', 'chat', {
    scope: null,
    retryAfterSeconds: 10,
  });

  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.scope, 'window');
});

test('a refusal by the limiter fires the event', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  // The limiter is the one the routes use, with a limit of two requests.
  const limiter = createRateLimiter({
    windowSeconds: 3600,
    maxRequests: 2,
    dailyWindowSeconds: 86400,
    dailyMaxRequests: 10,
  });

  const first = limiter.check('visitor-1');
  const second = limiter.check('visitor-1');
  const third = limiter.check('visitor-1');

  // The first two go through, the third is refused.
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);

  // The route refuses the request and says so before the answer goes out.
  await reportRateLimitExceeded('session-5', 'chat', third);

  assert.equal(recorder.captured.length, 1);
  assert.equal(recorder.captured[0].event, 'rate_limit_exceeded');

  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.scope, 'window');
  assert.equal(properties?.endpoint, 'chat');
  assert.equal(properties?.retryAfterSeconds, third.retryAfterSeconds);
});

test('nothing is sent when there are no credentials', async () => {
  setCredentials(undefined, undefined);
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await reportRateLimitExceeded('session-6', 'chat', {
    scope: 'window',
    retryAfterSeconds: 60,
  });

  assert.equal(recorder.captured.length, 0);
});
