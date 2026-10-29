import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateClientEvent,
  handleClientEvent,
  createAnalyticsRateLimiter,
  getAnalyticsRateLimiter,
  setAnalyticsRateLimiter,
  isSameOrigin,
  RATE_LIMIT_MESSAGE,
  type ClientEvent,
} from './proxy.ts';
import {
  setPostHogClientFactory,
  type PostHogClient,
  type PostHogClientOptions,
  type PostHogEventMessage,
} from './analytics.ts';
import { getRateLimiter } from '../ai/rateLimiter.ts';
import type { AnalyticsConfig } from './eventTypes.ts';

const SESSION_ID = '0e0aa843-c3d5-48f2-a407-ccb65152203a';
const QUERY_ID = '6b1f5c9e-2a4d-4c8b-9e3f-1d2c3b4a5e6f';

/**
 * A configuration with the analytics on and nothing written to the console.
 */
const ENABLED_CONFIG: AnalyticsConfig = {
  enabled: true,
  posthogKey: 'phc_test_key',
  posthogHost: 'https://eu.i.posthog.com',
  logToConsole: false,
};

/**
 * A valid event the browser may send.
 */
function validEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    eventType: 'cta_clicked',
    sessionId: SESSION_ID,
    queryId: QUERY_ID,
    ctaType: 'linkedin',
    targetDomain: 'linkedin.com',
    ...overrides,
  };
}

/**
 * A PostHog client that records what it is given.
 */
function createRecordingClient() {
  const captured: PostHogEventMessage[] = [];
  const options: PostHogClientOptions[] = [];
  let flushCalls = 0;

  const client: PostHogClient = {
    capture: (message) => {
      captured.push(message);
    },
    shutdown: async () => {},
    flush: async () => {
      flushCalls += 1;
    },
  };

  return {
    captured,
    options,
    get flushCalls() {
      return flushCalls;
    },
    factory: (_key: string, clientOptions: PostHogClientOptions) => {
      options.push(clientOptions);
      return client;
    },
  };
}

afterEach(() => {
  setPostHogClientFactory(null);
  setAnalyticsRateLimiter(null);
});

test('a valid event is accepted', () => {
  const result = validateClientEvent(validEvent());

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.event.eventType, 'cta_clicked');
  assert.equal(result.event.sessionId, SESSION_ID);
  assert.equal(result.event.queryId, QUERY_ID);
  assert.equal(result.event.ctaType, 'linkedin');
  assert.equal(result.event.targetDomain, 'linkedin.com');
});

test('an unknown event type is refused', () => {
  const result = validateClientEvent(validEvent({ eventType: 'page_view' }));

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error, 'Unknown event type');
});

test('an event without a type is refused', () => {
  const event = validEvent();
  delete event.eventType;

  const result = validateClientEvent(event);

  assert.equal(result.ok, false);
});

test('a missing field is refused', () => {
  for (const field of ['sessionId', 'queryId', 'ctaType', 'targetDomain']) {
    const event = validEvent();
    delete event[field];

    const result = validateClientEvent(event);

    assert.equal(result.ok, false, `${field} should be required`);
    if (result.ok) continue;
    assert.equal(result.error, 'Invalid event payload');
  }
});

test('a field that is not a string is refused', () => {
  const result = validateClientEvent(validEvent({ sessionId: 42 }));

  assert.equal(result.ok, false);
});

test('a session id that is not an identifier is refused', () => {
  const result = validateClientEvent(validEvent({ sessionId: 'not-an-identifier' }));

  assert.equal(result.ok, false);
});

test('a query id that is not an identifier is refused', () => {
  const result = validateClientEvent(validEvent({ queryId: 'not-an-identifier' }));

  assert.equal(result.ok, false);
});

test('a kind of call to action that is not known is refused', () => {
  const result = validateClientEvent(validEvent({ ctaType: 'something_else' }));

  assert.equal(result.ok, false);
});

test('an unknown field is refused rather than dropped', () => {
  const result = validateClientEvent(validEvent({ email: 'recruiter@example.com' }));

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error, 'Invalid event payload');
});

test('a target that is a path is refused', () => {
  const result = validateClientEvent(validEvent({ targetDomain: 'linkedin.com/in/somebody' }));

  assert.equal(result.ok, false);
});

test('a target that carries an e-mail address is refused', () => {
  const result = validateClientEvent(validEvent({ targetDomain: 'recruiter@example.com' }));

  assert.equal(result.ok, false);
});

test('a target that carries a port is refused', () => {
  const result = validateClientEvent(validEvent({ targetDomain: 'linkedin.com:8080' }));

  assert.equal(result.ok, false);
});

test('a target that carries a query is refused', () => {
  const result = validateClientEvent(validEvent({ targetDomain: 'linkedin.com?a=b' }));

  assert.equal(result.ok, false);
});

test('a target that is not a string is refused', () => {
  const result = validateClientEvent(validEvent({ targetDomain: 42 }));

  assert.equal(result.ok, false);
});

test('a body that is not an object is refused', () => {
  assert.equal(validateClientEvent(null).ok, false);
  assert.equal(validateClientEvent('a string').ok, false);
  assert.equal(validateClientEvent([]).ok, false);
  assert.equal(validateClientEvent(42).ok, false);
});

test('a target in capitals is accepted and brought down', () => {
  const result = validateClientEvent(validEvent({ targetDomain: 'LinkedIn.com' }));

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.event.targetDomain, 'linkedin.com');
});

test('a valid event is answered with the tracked message', async () => {
  const result = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, message: 'Event tracked' });
});

test('a valid event is sent on to PostHog', async () => {
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  const result = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.status, 200);
  assert.equal(recorder.captured.length, 1);
  assert.equal(recorder.captured[0].event, 'cta_clicked');
  assert.equal(recorder.captured[0].distinctId, SESSION_ID);
  assert.equal(recorder.captured[0].properties?.ctaType, 'linkedin');
  assert.equal(recorder.captured[0].properties?.targetDomain, 'linkedin.com');
  assert.equal(recorder.options[0].disableGeoip, true);
});

test('the limit headers are sent with a successful answer', async () => {
  const result = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.headers['X-RateLimit-Limit'], '100');
  assert.ok(Number(result.headers['X-RateLimit-Remaining']) >= 0);
  assert.ok(Number(result.headers['X-RateLimit-Reset']) > 0);
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('the limit headers are sent with a refused answer', async () => {
  const result = await handleClientEvent(validEvent({ eventType: 'page_view' }), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.status, 400);
  assert.equal(result.headers['X-RateLimit-Limit'], '100');
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('an unknown event type is answered with the bad request', async () => {
  const result = await handleClientEvent(validEvent({ eventType: 'page_view' }), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { ok: false, error: 'Unknown event type' });
});

test('a missing field is answered with the bad request', async () => {
  const event = validEvent();
  delete event.ctaType;

  const result = await handleClientEvent(event, {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { ok: false, error: 'Invalid event payload' });
});

test('an event that carries personal data is answered with the bad request', async () => {
  const result = await handleClientEvent(
    validEvent({ targetDomain: 'recruiter@example.com' }),
    { clientKey: 'client-1', config: ENABLED_CONFIG }
  );

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { ok: false, error: 'Invalid event payload' });
});

test('the visitor is counted against the limit of the proxy', async () => {
  const limiter = createAnalyticsRateLimiter({
    windowSeconds: 60,
    maxRequests: 2,
    dailyWindowSeconds: 3600,
    dailyMaxRequests: 10,
  });

  const first = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    limiter,
    config: ENABLED_CONFIG,
  });
  const second = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    limiter,
    config: ENABLED_CONFIG,
  });
  const third = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    limiter,
    config: ENABLED_CONFIG,
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(third.status, 429);
});

test('the event is flushed before the answer goes out', async () => {
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  const result = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
  });

  assert.equal(result.status, 200);
  // A serverless function is put to sleep as soon as it has answered, so an
  // event that is still queued when the answer goes out can be lost.
  assert.equal(recorder.flushCalls, 1);
});

test('a visitor that is turned away gets the retry header and a friendly message', async () => {
  const limiter = createAnalyticsRateLimiter({
    windowSeconds: 60,
    maxRequests: 1,
    dailyWindowSeconds: 3600,
    dailyMaxRequests: 10,
  });

  await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    limiter,
    config: ENABLED_CONFIG,
  });
  const second = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    limiter,
    config: ENABLED_CONFIG,
  });

  assert.equal(second.status, 429);
  assert.deepEqual(second.body, { ok: false, error: RATE_LIMIT_MESSAGE });
  assert.ok(Number(second.headers['Retry-After']) >= 0);
  assert.equal(second.headers['Cache-Control'], 'no-store');
});

test('the visitor is counted under a name of its own', async () => {
  const limiter = createAnalyticsRateLimiter({
    windowSeconds: 60,
    maxRequests: 1,
    dailyWindowSeconds: 3600,
    dailyMaxRequests: 10,
  });

  await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    limiter,
    config: ENABLED_CONFIG,
  });
  const second = await handleClientEvent(validEvent(), {
    clientKey: 'client-2',
    limiter,
    config: ENABLED_CONFIG,
  });

  assert.equal(second.status, 200);
});

test('a sending that fails is answered with the server error', async () => {
  const result = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
    send: async () => {
      throw new Error('the sending failed');
    },
  });

  assert.equal(result.status, 500);
  assert.deepEqual(result.body, {
    ok: false,
    error: 'Something went wrong while tracking the event.',
  });
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('the reason of a failure is not shown', async () => {
  const result = await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
    send: async () => {
      throw new Error('the key is phc_secret and the host is internal');
    },
  });

  assert.equal(JSON.stringify(result.body).includes('phc_secret'), false);
  assert.equal(JSON.stringify(result.body).includes('internal'), false);
});

test('the event that was sent on holds nothing but the checked fields', async () => {
  const sent: ClientEvent[] = [];

  await handleClientEvent(validEvent(), {
    clientKey: 'client-1',
    config: ENABLED_CONFIG,
    send: async (event) => {
      sent.push(event);
    },
  });

  assert.equal(sent.length, 1);
  assert.deepEqual(Object.keys(sent[0]).sort(), [
    'ctaType',
    'eventType',
    'queryId',
    'sessionId',
    'targetDomain',
  ]);
});

test('the proxy has a limiter of its own', () => {
  // The limiter of the proxy is not the limiter of the chat, so the events
  // of a visitor never use up the allowance of the messages.
  assert.notEqual(getAnalyticsRateLimiter(), getRateLimiter());
});

test('a request from the site itself is allowed', () => {
  assert.equal(isSameOrigin('https://ankitnandwani.com', 'ankitnandwani.com'), true);
});

test('a request without an origin is allowed', () => {
  assert.equal(isSameOrigin(null, 'ankitnandwani.com'), true);
  assert.equal(isSameOrigin('https://ankitnandwani.com', null), true);
});

test('a request from another site is refused', () => {
  assert.equal(isSameOrigin('https://example.com', 'ankitnandwani.com'), false);
  assert.equal(isSameOrigin('not a url', 'ankitnandwani.com'), false);
});
