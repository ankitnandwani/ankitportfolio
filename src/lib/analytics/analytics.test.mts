import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAnalyticsConfig,
  initPostHog,
  setPostHogClientFactory,
  shutdownAnalytics,
  trackChatSessionStart,
  trackMessageSent,
  trackResponseReceived,
  trackFeedbackGiven,
  trackJobFitAnalysis,
  trackContactFormSubmission,
  trackRateLimitExceeded,
  markChatSessionStarted,
  type PostHogClient,
  type PostHogClientOptions,
  type PostHogEventMessage,
} from './analytics.ts';

const ORIGINAL_POSTHOG_KEY = process.env.POSTHOG_KEY;
const ORIGINAL_POSTHOG_HOST = process.env.POSTHOG_HOST;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

/**
 * The environment as a map that can be written to.
 *
 * `NODE_ENV` is a read only property of the type of the environment, so the
 * tests need a view of it that can be changed.
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
 * Sets the environment the code runs in, or removes it when the value is
 * undefined.
 */
function setNodeEnv(value: string | undefined): void {
  if (value === undefined) {
    delete mutableEnv.NODE_ENV;
  } else {
    mutableEnv.NODE_ENV = value;
  }
}

/**
 * A PostHog client that records what it is given.
 */
function createRecordingClient() {
  const captured: PostHogEventMessage[] = [];
  const options: PostHogClientOptions[] = [];
  const keys: string[] = [];
  let shutdownCalls = 0;

  const client: PostHogClient = {
    capture: (message) => {
      captured.push(message);
    },
    shutdown: async () => {
      shutdownCalls += 1;
    },
  };

  const factory = (key: string, clientOptions: PostHogClientOptions) => {
    keys.push(key);
    options.push(clientOptions);
    return client;
  };

  return {
    client,
    captured,
    options,
    keys,
    factory,
    get shutdownCalls() {
      return shutdownCalls;
    },
  };
}

/**
 * Collects what is written to the console while the function runs.
 */
async function captureConsoleLog<T>(
  run: () => Promise<T>
): Promise<{ result: T; lines: string[] }> {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map((arg) => String(arg)).join(' '));
  };

  try {
    const result = await run();
    return { result, lines };
  } finally {
    console.log = original;
  }
}

afterEach(() => {
  setCredentials(ORIGINAL_POSTHOG_KEY, ORIGINAL_POSTHOG_HOST);
  setNodeEnv(ORIGINAL_NODE_ENV);
  setPostHogClientFactory(null);
});

test('getAnalyticsConfig turns the analytics off when the credentials are not there', () => {
  setCredentials(undefined, undefined);

  const config = getAnalyticsConfig();

  assert.equal(config.enabled, false);
  assert.equal(config.posthogKey, undefined);
  assert.equal(config.posthogHost, undefined);
});

test('getAnalyticsConfig turns the analytics on when the credentials are there', () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');

  const config = getAnalyticsConfig();

  assert.equal(config.enabled, true);
  assert.equal(config.posthogKey, 'phc_abc123DEF456');
  assert.equal(config.posthogHost, 'https://eu.i.posthog.com');
});

test('getAnalyticsConfig treats the placeholder of the environment example as no credentials', () => {
  setCredentials('your_posthog_key', 'your_posthog_host');

  const config = getAnalyticsConfig();

  assert.equal(config.enabled, false);
});

test('getAnalyticsConfig keeps the console quiet in production', () => {
  setNodeEnv('production');

  assert.equal(getAnalyticsConfig().logToConsole, false);
});

test('initPostHog builds nothing when there are no credentials', async () => {
  setCredentials(undefined, undefined);

  const client = await initPostHog(getAnalyticsConfig());

  assert.equal(client, null);
});

test('initPostHog creates the client with the privacy and the flush settings', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await initPostHog(getAnalyticsConfig());

  assert.equal(recorder.keys.length, 1);
  assert.equal(recorder.keys[0], 'phc_abc123DEF456');
  assert.equal(recorder.options[0].host, 'https://eu.i.posthog.com');
  assert.equal(recorder.options[0].disableGeoip, true);
  assert.equal(recorder.options[0].flushInterval, 5000);
  assert.equal(recorder.options[0].flushAt, 20);
});

test('initPostHog keeps the client and does not build a second one', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  const first = await initPostHog(getAnalyticsConfig());
  const second = await initPostHog(getAnalyticsConfig());

  assert.equal(first, second);
  assert.equal(recorder.keys.length, 1);
});

test('initPostHog survives a client that cannot be built', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  setPostHogClientFactory(() => {
    throw new Error('the package is not there');
  });

  const client = await initPostHog(getAnalyticsConfig());

  assert.equal(client, null);
});

test('a server side event reaches PostHog when the credentials are there', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackChatSessionStart('session-1', 'a-user-agent');

  assert.equal(recorder.captured.length, 1);
  assert.equal(recorder.captured[0].event, 'chat_session_start');
  assert.equal(recorder.captured[0].distinctId, 'session-1');
  assert.ok(recorder.captured[0].timestamp instanceof Date);
  assert.equal(recorder.captured[0].properties?.session_id, 'session-1');
});

test('the event carries the name, the identity and the properties PostHog expects', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackMessageSent('session-2', 'query-1', 'skills', 'allow', 42);

  const message = recorder.captured[0];
  assert.equal(message.event, 'message_sent');
  assert.equal(message.distinctId, 'session-2');
  assert.equal(message.properties?.queryId, 'query-1');
  assert.equal(message.properties?.questionCategory, 'skills');
  assert.equal(message.properties?.guardrailAction, 'allow');
  assert.equal(message.properties?.messageLength, 42);
});

test('the response event reaches PostHog', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackResponseReceived(
    'session-3',
    'query-2',
    true,
    5,
    0.72,
    1200,
    1500,
    { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    'gemini-flash-lite-latest',
    false,
    false,
    'output_allowed',
    0.8
  );

  assert.equal(recorder.captured[0].event, 'response_received');
  assert.equal(recorder.captured[0].distinctId, 'session-3');
  assert.equal(recorder.captured[0].properties?.chunksRetrieved, 5);
  assert.equal(recorder.captured[0].properties?.model, 'gemini-flash-lite-latest');
});

test('the job fit event reaches PostHog', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackJobFitAnalysis('session-4', 'query-3', {
    queryId: 'query-3',
    success: true,
    requirementCount: 12,
    analysedRequirementCount: 12,
    directMatchCount: 4,
    strongTransferCount: 3,
    relatedCount: 2,
    learnableCount: 2,
    unknownCount: 1,
    chunksRetrieved: 8,
    averageSimilarity: 0.71,
    retrievalSuccess: true,
    latencyMs: 3100,
    tokenUsage: { promptTokens: 1800, completionTokens: 640, totalTokens: 2440 },
    model: 'gemini-flash-lite-latest',
    usedFallback: false,
    replacedBySafeFallback: false,
    correctedClaims: 1,
    redactions: 0,
    rateLimitScope: null,
  });

  assert.equal(recorder.captured[0].event, 'job_fit_analysis');
  // The job fit event carries its group of properties in a `properties`
  // object of its own, the way the interface of the event describes it.
  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.directMatchCount, 4);
  assert.equal(properties?.requirementCount, 12);
});

test('the contact form event reaches PostHog', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackContactFormSubmission('session-5', 'query-4', {
    queryId: 'query-4',
    success: true,
    fieldsPresent: { name: true, email: true, company: true, message: true },
    rateLimitScope: null,
  });

  assert.equal(recorder.captured[0].event, 'contact_form_submission');
  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.success, true);
});

test('the rate limit event reaches PostHog', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackRateLimitExceeded('session-6', 'query-5', 'window', 'chat', 42);

  assert.equal(recorder.captured[0].event, 'rate_limit_exceeded');
  assert.equal(recorder.captured[0].distinctId, 'session-6');
  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  assert.equal(properties?.scope, 'window');
  assert.equal(properties?.endpoint, 'chat');
  assert.equal(properties?.retryAfterSeconds, 42);
  assert.equal(properties?.queryId, 'query-5');
});

test('the rate limit event carries no personal data', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackRateLimitExceeded('session-7', 'query-6', 'daily', 'contact', 120);

  const properties = recorder.captured[0].properties?.properties as
    | Record<string, unknown>
    | undefined;
  // The event carries only the scope, the endpoint and the wait. The limits
  // themselves are not part of it.
  assert.deepEqual(Object.keys(properties ?? {}).sort(), [
    'endpoint',
    'queryId',
    'retryAfterSeconds',
    'scope',
  ]);
});

test('the chat of a session starts only once', () => {
  const sessionId = `session-chat-${Math.random()}`;

  assert.equal(markChatSessionStarted(sessionId), true);
  assert.equal(markChatSessionStarted(sessionId), false);
  assert.equal(markChatSessionStarted(sessionId), false);
});

test('the chat of one session does not start the chat of another', () => {
  const first = `session-chat-a-${Math.random()}`;
  const second = `session-chat-b-${Math.random()}`;

  assert.equal(markChatSessionStarted(first), true);
  assert.equal(markChatSessionStarted(second), true);
});

test('nothing is sent when there are no credentials', async () => {
  setCredentials(undefined, undefined);
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackChatSessionStart('session-8');

  assert.equal(recorder.captured.length, 0);
  assert.equal(recorder.keys.length, 0);
});

test('the event is written to the console when the analytics are off', async () => {
  setCredentials(undefined, undefined);

  const { lines } = await captureConsoleLog(async () => {
    await trackChatSessionStart('session-9');
  });

  assert.equal(lines.length, 1);
  assert.match(lines[0], /chat_session_start/);
});

test('the feedback comment is redacted before it is sent', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackFeedbackGiven(
    'session-8',
    'query-5',
    'up',
    'Call me on +1 555 123 4567 or email me at recruiter@example.com',
    false
  );

  const comment = String(recorder.captured[0].properties?.comment ?? '');
  assert.equal(comment.includes('recruiter@example.com'), false);
  assert.equal(comment.includes('555'), false);
  assert.match(comment, /\[REDACTED\]/);
});

test('no event carries personal data', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackMessageSent('session-9', 'query-6', 'profile', 'allow', 10);
  await trackFeedbackGiven('session-9', 'query-6', 'down', 'reach me at a@b.com', false);

  const serialised = JSON.stringify(recorder.captured);
  assert.equal(serialised.includes('a@b.com'), false);
  assert.equal(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(serialised), false);
});

test('shutdownAnalytics flushes the pending events and drops the client', async () => {
  setCredentials('phc_abc123DEF456', 'https://eu.i.posthog.com');
  const recorder = createRecordingClient();
  setPostHogClientFactory(recorder.factory);

  await trackChatSessionStart('session-10');
  await shutdownAnalytics();

  assert.equal(recorder.shutdownCalls, 1);

  // The next event builds a new client, because the old one was dropped.
  await trackChatSessionStart('session-11');
  assert.equal(recorder.keys.length, 2);
});

test('shutdownAnalytics does nothing when there is no client', async () => {
  setCredentials(undefined, undefined);

  await shutdownAnalytics();

  assert.ok(true);
});
