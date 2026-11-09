import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';

import {
  COMMON_FORBIDDEN_PATTERNS,
  FORBIDDEN_PATTERNS,
  MONITORING_FIXTURES,
  checkMonitoringRules,
  toMessageView,
  toPayloadView,
  type MonitoringPayload,
} from './monitoringFixtures.ts';
import {
  setMonitoringClientFactory,
  type MonitoringClient,
  type MonitoringHint,
} from '../capture.ts';
import type { MonitoringConfig } from '../config.ts';

/**
 * The configuration the cases are built with.
 *
 * The address of the service is not a real one, because the reports are
 * caught before they are sent.
 */
const CAPTURE_CONFIG: MonitoringConfig = {
  enabled: true,
  dsn: 'https://verification@example.invalid/1',
  environment: 'development',
  release: undefined,
  logToConsole: false,
};

/**
 * A report that the recording client received.
 */
interface CapturedReport {
  kind: 'exception' | 'message';
  error?: unknown;
  message?: string;
  hint?: MonitoringHint;
}

/**
 * The reports that were caught.
 */
const captured: CapturedReport[] = [];

/**
 * A client of the monitoring that keeps what it is given.
 */
const recordingClient: MonitoringClient = {
  captureException: (error, hint) => {
    captured.push({ kind: 'exception', error, hint });
  },
  captureMessage: (message, hint) => {
    captured.push({ kind: 'message', message, hint });
  },
  flush: async () => {},
};

/**
 * A client of the monitoring that fails, so the capture can be shown to stay
 * quiet when the service cannot be reached.
 */
const failingClient: MonitoringClient = {
  captureException: () => {
    throw new Error('the service cannot be reached');
  },
  captureMessage: () => {
    throw new Error('the service cannot be reached');
  },
  flush: async () => {},
};

/**
 * Runs something while the lines of the console are kept to themselves.
 */
async function withQuietConsole<T>(run: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => {};

  try {
    return await run();
  } finally {
    console.error = original;
  }
}

/**
 * Puts the reports that were caught into the shape of a report.
 */
function readCapturedPayload(): MonitoringPayload | null {
  const report = captured[0];

  if (!report) {
    return null;
  }

  if (report.kind === 'message') {
    return toMessageView(report.message ?? '', report.hint);
  }

  return toPayloadView(report.error, report.hint);
}

/**
 * Builds the report of a case with the function of the site.
 *
 * @param index The number of the case.
 * @returns The report, or null when there was none.
 */
async function buildPayload(index: number): Promise<MonitoringPayload | null> {
  const fixture = MONITORING_FIXTURES[index];
  captured.length = 0;

  if (!fixture.build) {
    return null;
  }

  // The case whose client fails gets a client that fails, the way the script
  // gives it one.
  setMonitoringClientFactory(() => (fixture.clientThrows ? failingClient : recordingClient));

  const build = fixture.build;
  await withQuietConsole(async () => {
    await build(CAPTURE_CONFIG);
  });

  // A report of a slow operation goes out on its own.
  await new Promise((resolve) => setTimeout(resolve, 50));

  setMonitoringClientFactory(() => recordingClient);

  return readCapturedPayload();
}

before(() => {
  // The reporters that read the configuration of the monitoring read the
  // environment, so it has to hold an address of the service.
  process.env.SENTRY_DSN = CAPTURE_CONFIG.dsn as string;
  setMonitoringClientFactory(() => recordingClient);
});

after(() => {
  delete process.env.SENTRY_DSN;
  setMonitoringClientFactory(null);
});

test('every case has a name of its own', () => {
  const ids = MONITORING_FIXTURES.map((fixture) => fixture.id);

  assert.equal(new Set(ids).size, ids.length);
});

test('every case says what it is about and what it expects', () => {
  for (const fixture of MONITORING_FIXTURES) {
    assert.ok(fixture.id.length > 0, 'A case has no name');
    assert.ok(fixture.label.length > 0, `The case ${fixture.id} has no label`);
    assert.ok(fixture.category.length > 0, `The case ${fixture.id} has no category`);

    const hasSomethingToDo = fixture.build !== undefined || fixture.request !== undefined;
    assert.equal(hasSomethingToDo, true, `The case ${fixture.id} does nothing`);
  }
});

test('the patterns of the privacy catch what they are there for', () => {
  // The samples are of the reserved ranges of the documentation, so they
  // cannot belong to a person.
  const cases: [RegExp, string][] = [
    [FORBIDDEN_PATTERNS.email, 'recruiter@example.com'],
    [FORBIDDEN_PATTERNS.phoneWithParts, '+1 555 123 4567'],
    [FORBIDDEN_PATTERNS.phoneDigits, '5551234567'],
    [FORBIDDEN_PATTERNS.ipv4, '203.0.113.7'],
    [FORBIDDEN_PATTERNS.dsn, 'https://abc123@o1.ingest.sentry.io/2'],
    [FORBIDDEN_PATTERNS.modelKey, 'AIzaSyA1234567890abcdefghijklmnop'],
    [
      FORBIDDEN_PATTERNS.serviceKey,
      'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.abcdefghijklmnopqrst',
    ],
    [FORBIDDEN_PATTERNS.token, 'ghp_1234567890abcdefghij'],
  ];

  for (const [pattern, sample] of cases) {
    assert.equal(
      pattern.test(`the text holds ${sample}`),
      true,
      `The pattern does not catch the sample: ${pattern.source}`
    );
  }
});

test('the patterns of the privacy do not catch an ordinary text', () => {
  const text = 'The chat took 34239 ms, which is longer than the threshold of 30000 ms.';

  for (const pattern of COMMON_FORBIDDEN_PATTERNS) {
    assert.equal(
      pattern.test(text),
      false,
      `The pattern catches an ordinary text: ${pattern.source}`
    );
  }
});

test('the rules of the privacy catch a report that holds something private', () => {
  const payload = toPayloadView(new Error('the visitor is recruiter@example.com'), {
    tags: { route: 'chat' },
  });

  const rules = checkMonitoringRules(payload, MONITORING_FIXTURES[0]);
  const failed = rules.filter((rule) => !rule.passed);

  assert.equal(failed.length > 0, true);
  assert.equal(
    failed.some((rule) => rule.rule.startsWith('no_pii:')),
    true,
    'The address of the mailbox was not caught'
  );
});

test('the rules of the privacy catch a report that holds a secret', () => {
  const payload = toPayloadView(new Error('the key was a_secret_value_that_is_long'), {
    tags: { route: 'chat' },
  });

  const rules = checkMonitoringRules(payload, MONITORING_FIXTURES[0], [
    'a_secret_value_that_is_long',
  ]);
  const failed = rules.filter((rule) => !rule.passed);

  assert.equal(
    failed.some((rule) => rule.rule === 'no_secret'),
    true,
    'The secret was not caught'
  );
});

test('the message of a rule never holds what it found', () => {
  const payload = toPayloadView(new Error('the visitor is recruiter@example.com'), {
    tags: { route: 'chat' },
  });

  const rules = checkMonitoringRules(payload, MONITORING_FIXTURES[0]);

  for (const rule of rules) {
    assert.equal(
      (rule.message ?? '').includes('recruiter@example.com'),
      false,
      'The message of a rule holds the value it found'
    );
  }
});

test('the report of every case holds nothing private', async () => {
  for (let index = 0; index < MONITORING_FIXTURES.length; index++) {
    const fixture = MONITORING_FIXTURES[index];
    const payload = await buildPayload(index);

    if (fixture.expectsNoReport) {
      assert.equal(payload, null, `The case ${fixture.id} produced a report`);
      continue;
    }

    assert.ok(payload, `The case ${fixture.id} produced no report`);

    const rules = checkMonitoringRules(payload, fixture);
    const failed = rules.filter((rule) => !rule.passed);

    assert.equal(
      failed.length,
      0,
      `The case ${fixture.id} failed: ${failed.map((rule) => rule.rule).join(', ')}`
    );
  }
});

test('the report of a case that expects none is not produced', async () => {
  for (let index = 0; index < MONITORING_FIXTURES.length; index++) {
    const fixture = MONITORING_FIXTURES[index];

    if (!fixture.expectsNoReport) {
      continue;
    }

    const payload = await buildPayload(index);

    assert.equal(payload, null, `The case ${fixture.id} produced a report`);
  }
});
