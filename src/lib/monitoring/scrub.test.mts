import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMonitoringSecrets,
  isPrivateFieldName,
  isPrivateHeaderName,
  redactSecrets,
  redactText,
  resetMonitoringSecrets,
  scrubEvent,
  scrubFailure,
  scrubHeaders,
  scrubUrl,
  scrubValue,
  setMonitoringSecrets,
} from './scrub.ts';
import { readMonitoringSecrets } from './config.ts';

/**
 * The bodies of the site, taken from the fixtures of M19.05.
 */
const CHAT_BODY = {
  message: 'What are Ankit main technical skills?',
  stream: false,
};

const JOB_DESCRIPTION_BODY = {
  jobDescription: [
    'Senior Software Engineer, Platform',
    '',
    'We are looking for a senior engineer to build and scale our internal platform.',
    '',
    'Requirements:',
    '- Design and build services in TypeScript and Node.js.',
  ].join('\n'),
};

const CONTACT_BODY = {
  name: 'Verification Recruiter',
  email: 'recruiter@example.com',
  company: 'Example Corporation',
  message: 'I would like to talk about a role on your platform team.',
};

const A_KEY = 'sk-live-0123456789abcdefghijklmnop';
const A_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

/**
 * Puts the secrets back the way they were after a test.
 */
function withSecrets(values: readonly string[], run: () => void): void {
  const before = getMonitoringSecrets();

  try {
    setMonitoringSecrets(values);
    run();
  } finally {
    resetMonitoringSecrets();
    setMonitoringSecrets(before);
  }
}

// ============================================================
// The fields that hold what a visitor wrote
// ============================================================

test('the fields that hold what a visitor wrote are known', () => {
  assert.equal(isPrivateFieldName('message'), true);
  assert.equal(isPrivateFieldName('history'), true);
  assert.equal(isPrivateFieldName('description'), true);
  assert.equal(isPrivateFieldName('jobDescription'), true);
  assert.equal(isPrivateFieldName('text'), true);
  assert.equal(isPrivateFieldName('answer'), true);
  assert.equal(isPrivateFieldName('question'), true);
  assert.equal(isPrivateFieldName('name'), true);
  assert.equal(isPrivateFieldName('email'), true);
  assert.equal(isPrivateFieldName('company'), true);
  assert.equal(isPrivateFieldName('comment'), true);
  assert.equal(isPrivateFieldName('feedback'), true);
  assert.equal(isPrivateFieldName('body'), true);
});

test('a field that holds nothing private is not known', () => {
  assert.equal(isPrivateFieldName('model'), false);
  assert.equal(isPrivateFieldName('route'), false);
  assert.equal(isPrivateFieldName('latencyMs'), false);
});

// ============================================================
// The headers that carry a secret
// ============================================================

test('the headers that carry a secret are known', () => {
  assert.equal(isPrivateHeaderName('authorization'), true);
  assert.equal(isPrivateHeaderName('Authorization'), true);
  assert.equal(isPrivateHeaderName('cookie'), true);
  assert.equal(isPrivateHeaderName('set-cookie'), true);
  assert.equal(isPrivateHeaderName('x-api-key'), true);
});

test('a header whose name holds a secret is known', () => {
  assert.equal(isPrivateHeaderName('x-auth-token'), true);
  assert.equal(isPrivateHeaderName('x-my-secret'), true);
  assert.equal(isPrivateHeaderName('x-session-key'), true);
  assert.equal(isPrivateHeaderName('x-user-password'), true);
});

test('a header that carries nothing is left alone', () => {
  assert.equal(isPrivateHeaderName('content-type'), false);
  assert.equal(isPrivateHeaderName('user-agent'), false);
  assert.equal(isPrivateHeaderName('accept-language'), false);
});

// ============================================================
// The bodies of the three free text forms
// ============================================================

test('the body of a chat message is not in the safe shape', () => {
  const safe = scrubFailure({ body: CHAT_BODY, route: 'chat' });

  assert.equal('body' in safe, false);
  assert.equal(JSON.stringify(safe).includes('What are Ankit main technical skills'), false);
});

test('the body of a job description is not in the safe shape', () => {
  const safe = scrubFailure({ body: JOB_DESCRIPTION_BODY, route: 'job-fit' });

  assert.equal('body' in safe, false);
  assert.equal(JSON.stringify(safe).includes('Senior Software Engineer'), false);
});

test('the body of a contact form is not in the safe shape', () => {
  const safe = scrubFailure({ body: CONTACT_BODY, route: 'contact' });

  assert.equal('body' in safe, false);
  assert.equal(JSON.stringify(safe).includes('recruiter@example.com'), false);
  assert.equal(JSON.stringify(safe).includes('Example Corporation'), false);
});

test('a field that holds the body is dropped wherever it is', () => {
  const safe = scrubFailure({
    extra: { body: CHAT_BODY, message: 'a question', model: 'gemini-flash-lite-latest' },
  });

  assert.equal('body' in safe.extra, false);
  assert.equal('message' in safe.extra, false);
  assert.equal(safe.extra.model, 'gemini-flash-lite-latest');
});

// ============================================================
// The personal data of a message
// ============================================================

test('an address of a mailbox is removed from the message of a failure', () => {
  const safe = scrubFailure({ message: 'Could not reach recruiter@example.com for the role.' });

  assert.equal(safe.message?.includes('recruiter@example.com'), false);
  assert.equal(safe.message?.includes('[REDACTED]'), true);
});

test('a number of a phone is removed from the message of a failure', () => {
  const safe = scrubFailure({ message: 'Call me on +1 555 123 4567 about the role.' });

  assert.equal(safe.message?.includes('555 123 4567'), false);
  assert.equal(safe.message?.includes('[REDACTED]'), true);
});

test('the personal data is removed from every string that is sent', () => {
  const safe = scrubFailure({
    message: 'Write to recruiter@example.com or call 555-123-4567',
    stack: 'at chat (recruiter@example.com:1:1)',
    route: 'chat',
  });

  const text = JSON.stringify(safe);

  assert.equal(text.includes('recruiter@example.com'), false);
  assert.equal(text.includes('555-123-4567'), false);
});

// ============================================================
// The secrets of the environment
// ============================================================

test('the value of the key of the language model is removed from the message', () => {
  withSecrets([A_KEY], () => {
    const safe = scrubFailure({ message: `The call failed with the key ${A_KEY} in it.` });

    assert.equal(safe.message?.includes(A_KEY), false);
    assert.equal(safe.message?.includes('[REDACTED]'), true);
  });
});

test('the value of the DSN is removed from the message', () => {
  withSecrets([A_DSN], () => {
    const safe = scrubFailure({ message: `The DSN of the project is ${A_DSN}.` });

    assert.equal(safe.message?.includes(A_DSN), false);
  });
});

test('a value that is the placeholder of the environment is not a secret', () => {
  withSecrets(['your_sentry_dsn'], () => {
    const text = 'The value your_sentry_dsn is still the placeholder.';
    const safe = scrubFailure({ message: text });

    assert.equal(safe.message, text);
  });
});

test('a placeholder of the environment is not looked for', () => {
  const values = readMonitoringSecrets({
    SENTRY_DSN: 'your_sentry_dsn',
    GEMINI_API_KEY: A_KEY,
    UPSTASH_REDIS_REST_TOKEN: 'your_upstash_redis_rest_token',
  });

  assert.equal(values.includes('your_sentry_dsn'), false);
  assert.equal(values.includes('your_upstash_redis_rest_token'), false);
  assert.equal(values.includes(A_KEY), true);
});

test('a value that is too short to be a secret is left out', () => {
  const values = readMonitoringSecrets({ GITHUB_TOKEN: 'abc' });

  assert.equal(values.includes('abc'), false);
});

test('the secrets of the environment are held once', () => {
  const before = getMonitoringSecrets();

  try {
    setMonitoringSecrets([A_KEY, A_DSN]);
    assert.equal(getMonitoringSecrets().length, 2);

    resetMonitoringSecrets();
    assert.equal(getMonitoringSecrets().length, 0);
  } finally {
    resetMonitoringSecrets();
    setMonitoringSecrets(before);
  }
});

test('the redaction of the secrets leaves a short value alone', () => {
  assert.equal(redactSecrets('the value is abc', ['abc']), 'the value is abc');
});

// ============================================================
// The headers of the request
// ============================================================

test('the headers that carry a token are not in the safe shape', () => {
  const safe = scrubFailure({
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer super-secret-token',
      cookie: 'session=abc',
      'set-cookie': 'session=abc',
      'x-api-key': 'key-123',
      'x-my-secret': 'nope',
    },
  });

  assert.equal('authorization' in safe.headers, false);
  assert.equal('cookie' in safe.headers, false);
  assert.equal('set-cookie' in safe.headers, false);
  assert.equal('x-api-key' in safe.headers, false);
  assert.equal('x-my-secret' in safe.headers, false);
  assert.equal(safe.headers['content-type'], 'application/json');
});

test('the headers that carry nothing are kept', () => {
  const headers = scrubHeaders({ 'user-agent': 'Mozilla/5.0', accept: 'application/json' });

  assert.equal(headers['user-agent'], 'Mozilla/5.0');
  assert.equal(headers.accept, 'application/json');
});

// ============================================================
// What survives the scrubbing
// ============================================================

test('the useful parts survive the scrubbing', () => {
  const safe = scrubFailure({
    errorName: 'LLMError',
    message: 'The model is not available.',
    kind: 'ai_failure',
    route: 'chat',
    method: 'POST',
    status: 500,
    timestamp: '2026-11-04T00:00:00.000Z',
    queryId: '797ccc4d-1111-4222-8333-444444444444',
    stack: 'at chat (/app/api/chat/route.ts:42:11)',
  });

  assert.equal(safe.errorName, 'LLMError');
  assert.equal(safe.message, 'The model is not available.');
  assert.equal(safe.kind, 'ai_failure');
  assert.equal(safe.route, 'chat');
  assert.equal(safe.method, 'POST');
  assert.equal(safe.status, 500);
  assert.equal(safe.timestamp, '2026-11-04T00:00:00.000Z');
  assert.equal(safe.queryId, '797ccc4d-1111-4222-8333-444444444444');
  assert.match(safe.stack ?? '', /route\.ts:42:11/);
});

test('a part that is not there is null', () => {
  const safe = scrubFailure({ route: 'chat' });

  assert.equal(safe.errorName, null);
  assert.equal(safe.message, null);
  assert.equal(safe.status, null);
  assert.equal(safe.queryId, null);
  assert.deepEqual(safe.headers, {});
});

// ============================================================
// The scrubbing never throws
// ============================================================

test('the scrubbing of a value that is not an object does not throw', () => {
  const safe = scrubFailure(undefined as never);

  assert.equal(safe.route, null);
  assert.equal(safe.message, null);
});

test('the scrubbing of a failure with nothing in it does not throw', () => {
  const safe = scrubFailure({});

  assert.equal(safe.message, null);
  assert.equal(safe.status, null);
});

test('the scrubbing of a value of any shape does not throw', () => {
  assert.equal(scrubValue('a text'), 'a text');
  assert.equal(scrubValue(42), 42);
  assert.equal(scrubValue(true), true);
  assert.equal(scrubValue(null), null);
  assert.equal(scrubValue(undefined), undefined);
  assert.doesNotThrow(() => scrubValue(() => undefined));
  assert.doesNotThrow(() => scrubValue(Symbol('x')));
});

// ============================================================
// The event of the SDK
// ============================================================

/**
 * An event of the SDK with the shapes that really happen.
 */
function buildEvent() {
  return {
    event_id: 'abc123',
    timestamp: 1_700_000_000,
    platform: 'node',
    level: 'error',
    logger: 'app/api/chat',
    transaction: 'POST /api/chat',
    environment: 'production',
    release: 'abc1234',
    user: {
      id: 'visitor-1',
      ip_address: '203.0.113.5',
      email: 'recruiter@example.com',
    },
    request: {
      url: 'https://ankitnandwani.com/api/chat?token=secret-value',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer super-secret-token',
        cookie: 'session=abc',
        'x-api-key': 'key-123',
        'x-forwarded-for': '203.0.113.5',
        'x-real-ip': '203.0.113.5',
      },
      data: CHAT_BODY,
    },
    exception: {
      values: [
        {
          type: 'Error',
          value: 'Call me on +1 555 123 4567 or email me at recruiter@example.com',
        },
      ],
    },
    extra: {
      body: CHAT_BODY,
      model: 'gemini-flash-lite-latest',
    },
    breadcrumbs: [{ message: 'What are Ankit main technical skills?', category: 'console' }],
    sdk: { name: 'sentry.javascript.nextjs', version: '11.10.0' },
    fingerprint: ['llm_unavailable', 'chat'],
  };
}

test('the user of a visitor is never sent', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;

  assert.equal('user' in clean, false);
});

test('the body of the request is never sent', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;
  const request = clean.request as Record<string, unknown>;

  assert.equal('data' in request, false);
  assert.equal(JSON.stringify(clean).includes('What are Ankit main technical skills'), false);
});

test('the query of the address is left out', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;
  const request = clean.request as Record<string, unknown>;

  assert.equal(request.url, 'https://ankitnandwani.com/api/chat');
});

test('the headers that carry a secret are never sent', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;
  const request = clean.request as Record<string, unknown>;
  const headers = request.headers as Record<string, string>;

  assert.equal('authorization' in headers, false);
  assert.equal('cookie' in headers, false);
  assert.equal('x-api-key' in headers, false);
  assert.equal(headers['content-type'], 'application/json');
});

test('the address of the visitor in a header is never sent', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;
  const request = clean.request as Record<string, unknown>;
  const headers = request.headers as Record<string, string>;

  assert.equal('x-forwarded-for' in headers, false);
  assert.equal('x-real-ip' in headers, false);
  assert.equal(JSON.stringify(clean).includes('203.0.113.5'), false);
});

test('the fingerprint that groups the reports is kept', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;

  assert.deepEqual(clean.fingerprint, ['llm_unavailable', 'chat']);
});

test('the personal data of the failure is removed', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;
  const exception = clean.exception as { values: { value: string }[] };
  const text = JSON.stringify(clean);

  assert.equal(exception.values[0].value.includes('555 123 4567'), false);
  assert.equal(exception.values[0].value.includes('recruiter@example.com'), false);
  assert.equal(text.includes('recruiter@example.com'), false);
});

test('the parts of the event that are worth reporting are kept', () => {
  const clean = scrubEvent(buildEvent()) as Record<string, unknown>;

  assert.equal(clean.event_id, 'abc123');
  assert.equal(clean.level, 'error');
  assert.equal(clean.transaction, 'POST /api/chat');
  assert.equal(clean.environment, 'production');
  assert.equal(clean.release, 'abc1234');
  assert.equal((clean.sdk as { name: string }).name, 'sentry.javascript.nextjs');
  assert.equal((clean.extra as Record<string, unknown>).model, 'gemini-flash-lite-latest');
});

test('the scrubbing of an event that is not an event does not throw', () => {
  assert.doesNotThrow(() => scrubEvent(undefined));
  assert.doesNotThrow(() => scrubEvent('a text'));
  assert.doesNotThrow(() => scrubEvent([1, 2, 3]));
});

test('the hook of the SDK is called with a hint, and the hint is not a list of secrets', () => {
  const hint = { captureContext: { name: 'chat' }, mechanism: { handled: true } };

  let clean: unknown;

  assert.doesNotThrow(() => {
    clean = scrubEvent(buildEvent(), hint as never);
  });

  assert.notEqual(clean, undefined);
  assert.equal('user' in (clean as Record<string, unknown>), false);
  assert.equal(JSON.stringify(clean).includes('recruiter@example.com'), false);
});

test('the secrets of the environment are removed when the hook is called with a hint', () => {
  withSecrets([A_KEY], () => {
    const event = { event_id: 'abc123', extra: { note: `the key ${A_KEY} was in it` } };
    const clean = scrubEvent(event, { captureContext: {} } as never) as Record<string, unknown>;

    assert.equal(JSON.stringify(clean).includes(A_KEY), false);
    assert.equal(JSON.stringify(clean).includes('[REDACTED]'), true);
  });
});

test('an event that cannot be read is not lost', () => {
  const hostile = {
    event_id: 'abc123',
    level: 'error',
    get extra(): unknown {
      throw new Error('the field cannot be read');
    },
  };

  const clean = scrubEvent(hostile) as Record<string, unknown>;

  assert.notEqual(clean, undefined);
  assert.equal(clean.event_id, 'abc123');
  assert.equal(clean.level, 'error');
  assert.equal((clean.tags as Record<string, unknown>).scrubbing, 'failed');
});

test('the scrubbing of an event never gives nothing back', () => {
  const hostile = {
    get event_id(): string {
      throw new Error('the field cannot be read');
    },
  };

  const clean = scrubEvent(hostile) as Record<string, unknown>;

  assert.notEqual(clean, undefined);
  assert.equal(typeof clean, 'object');
});

test('the address of a request without a query is left alone', () => {
  assert.equal(
    scrubUrl('https://ankitnandwani.com/api/chat'),
    'https://ankitnandwani.com/api/chat'
  );
  assert.equal(scrubUrl(undefined), undefined);
});

test('the redaction of a text leaves a text without private data alone', () => {
  assert.equal(redactText('nothing private here'), 'nothing private here');
});

test('the digest of a failure of a page survives the scrubbing, because it is a hash', () => {
  const event = buildEvent();
  (event.extra as Record<string, unknown>).digest = '172938475610293847';

  const clean = scrubEvent(event) as Record<string, unknown>;

  assert.equal((clean.extra as Record<string, unknown>).digest, '172938475610293847');
});

test('a text in the part of the digest is cleaned like any other text', () => {
  const event = buildEvent();
  (event.extra as Record<string, unknown>).digest =
    'the email of the visitor is recruiter@example.com';

  const clean = scrubEvent(event) as Record<string, unknown>;
  const text = JSON.stringify(clean);

  assert.equal(text.includes('recruiter@example.com'), false);
});
