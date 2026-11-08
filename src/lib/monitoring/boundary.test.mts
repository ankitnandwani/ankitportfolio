import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import {
  BOUNDARY_FAILURE_KIND,
  BOUNDARY_FAILURE_MESSAGE,
  buildBoundaryFailureContext,
  buildSafeBoundaryError,
  readBoundaryErrorName,
  readBoundaryStackFrames,
  reportBoundaryFailure,
  type BoundaryFailure,
} from './boundary.ts';
import {
  setMonitoringClientFactory,
  type MonitoringClient,
  type MonitoringHint,
} from './capture.ts';
import { resetMonitoringSecrets, setMonitoringSecrets } from './scrub.ts';

/**
 * A report the fake client received.
 */
interface Report {
  /** What kind of report it was. */
  kind: 'exception' | 'message';
  /** The failure of an exception. */
  error?: unknown;
  /** The text of a message. */
  message?: string;
  /** The hint that came with it. */
  hint?: MonitoringHint;
}

/**
 * A client that writes the reports down instead of sending them.
 */
function createFakeClient(reports: Report[]): MonitoringClient {
  return {
    captureException: (error, hint) => {
      reports.push({ kind: 'exception', error, hint });
    },
    captureMessage: (message, hint) => {
      reports.push({ kind: 'message', message, hint });
    },
    flush: async () => {},
  };
}

/**
 * Everything a report holds, as one text.
 *
 * An error holds nothing that JSON can read, so its name, its message and
 * its stack are added by hand. A test that looks for something that must not
 * be there has to look everywhere the report can hold it.
 */
function reportText(report: Report | undefined): string {
  if (!report) {
    return '';
  }

  const error = report.error as Error | undefined;

  return [
    JSON.stringify(report.hint ?? {}),
    report.message ?? '',
    error?.name ?? '',
    error?.message ?? '',
    error?.stack ?? '',
  ].join('\n');
}

/**
 * Runs something with the monitoring on or off.
 *
 * The configuration of the monitoring is read from the environment, so the
 * variable of the DSN is what turns it on and off.
 */
async function withMonitoring(on: boolean, run: () => Promise<void>): Promise<void> {
  const original = process.env.SENTRY_DSN;

  if (on) {
    process.env.SENTRY_DSN = 'https://key@example.com/1';
  } else {
    delete process.env.SENTRY_DSN;
  }

  try {
    await run();
  } finally {
    if (original === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = original;
    }
  }
}

/**
 * Runs something while the lines of the console are caught.
 */
async function withConsole<T>(run: () => Promise<T>): Promise<{ result: T; lines: unknown[][] }> {
  const lines: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args);
  };

  try {
    const result = await run();
    return { result, lines };
  } finally {
    console.error = original;
  }
}

/**
 * A failure that a boundary caught.
 */
function boundaryFailure(overrides: Partial<BoundaryFailure> = {}): BoundaryFailure {
  return {
    scope: 'routes',
    error: new Error('the page could not be read'),
    digest: 'abc123',
    ...overrides,
  };
}

beforeEach(() => {
  setMonitoringClientFactory(null);
  resetMonitoringSecrets();
});

test('the failure of a boundary is reported with the part of the page and the digest', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure()));

  assert.equal(reports.length, 1);
  assert.equal(reports[0].kind, 'exception');

  assert.equal(reports[0].hint?.tags?.scope, 'routes');
  assert.equal(reports[0].hint?.tags?.kind, BOUNDARY_FAILURE_KIND);
  assert.equal(reports[0].hint?.extra?.digest, 'abc123');
});

test('the reports of a boundary are grouped by the kind and by the part of the page', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () =>
    reportBoundaryFailure(boundaryFailure({ scope: 'root', digest: 'another-one' }))
  );

  // The digest is different every time, so it is not part of the grouping.
  assert.deepEqual(reports[0].hint?.fingerprint, [BOUNDARY_FAILURE_KIND, 'root']);
});

test('the report holds no message of the failure and no text of the page', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  const error = new Error('the project "Ankit is a recruiter at DP World" was not found');
  error.stack =
    'Error: the project "Ankit is a recruiter at DP World" was not found\n    at Card (page.tsx:1:1)';

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure({ error })));

  const text = reportText(reports[0]);

  assert.equal(text.includes('Ankit is a recruiter'), false);
  assert.equal(text.includes('not found'), false);
  assert.equal(text.includes(BOUNDARY_FAILURE_MESSAGE), true);
});

test('the report holds no value of a field and no answer of the chat', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  const error = new Error('the answer of the chat was: my email is recruiter@example.com');
  error.stack =
    'Error: the answer of the chat was: my email is recruiter@example.com\n    at Chat (chat.tsx:1:1)';

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure({ error })));

  const text = reportText(reports[0]);

  assert.equal(text.includes('recruiter@example.com'), false);
  assert.equal(text.includes('my email'), false);
});

test('the frames of the stack are kept, because a frame is a place in the code', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  const error = new Error('something private');
  error.stack =
    'Error: something private\n    at Card (page.tsx:12:3)\n    at render (next.js:4:5)';

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure({ error })));

  const reported = reports[0].error as Error;

  assert.equal(reported.stack?.includes('at Card (page.tsx:12:3)'), true);
  assert.equal(reported.stack?.includes('something private'), false);
});

test('the name of an error is kept when it is the name of a class of code', () => {
  assert.equal(readBoundaryErrorName(new TypeError('a type is wrong')), 'TypeError');
  assert.equal(readBoundaryErrorName(new Error('a failure')), 'Error');
});

test('a name of an error that holds something else is left out', () => {
  assert.equal(readBoundaryErrorName({ name: 'the name of a visitor' }), undefined);
  assert.equal(readBoundaryErrorName({ name: '' }), undefined);
  assert.equal(readBoundaryErrorName('not an error'), undefined);
  assert.equal(readBoundaryErrorName(undefined), undefined);
});

test('a stack without frames is left out', () => {
  assert.equal(readBoundaryStackFrames({ stack: 'Error: a failure' }), undefined);
  assert.equal(readBoundaryStackFrames({ stack: '' }), undefined);
  assert.equal(readBoundaryStackFrames(undefined), undefined);
});

test('the failure that is safe to report says what happened and where', () => {
  const error = new Error('the real message');
  error.name = 'TypeError';
  error.stack = 'TypeError: the real message\n    at Card (page.tsx:12:3)';

  const safe = buildSafeBoundaryError(error);

  assert.equal(safe.message, BOUNDARY_FAILURE_MESSAGE);
  assert.equal(safe.name, 'TypeError');
  assert.equal(safe.stack?.includes('the real message'), false);
  assert.equal(safe.stack?.includes('at Card (page.tsx:12:3)'), true);
});

test('the context of the report holds the digest in the extra parts and not in the tags', () => {
  const context = buildBoundaryFailureContext(boundaryFailure({ digest: 'abc123' }));

  assert.equal(context.digest, 'abc123');
  assert.equal(context.tags?.digest, undefined);
  assert.equal(context.level, 'error');
  assert.equal(context.kind, BOUNDARY_FAILURE_KIND);
});

test('a failure with no digest is reported without one', () => {
  const context = buildBoundaryFailureContext(boundaryFailure({ digest: undefined }));

  assert.equal(context.digest, undefined);
});

test('the digest of Next.js survives the redaction, because it is a hash', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  // The digest of Next.js is a number, and a number of that length looks like
  // a phone number to the redaction of the personal data.
  const digest = '172938475610293847';

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure({ digest })));

  assert.equal(reports[0].hint?.extra?.digest, digest);
});

test('a digest that is not a digest is left out', () => {
  const context = buildBoundaryFailureContext(
    boundaryFailure({ digest: 'the email of the visitor is recruiter@example.com' })
  );

  assert.equal(context.digest, undefined);
});

test('the monitoring being off sends nothing and throws nothing', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(false, () => reportBoundaryFailure(boundaryFailure()));

  assert.equal(reports.length, 0);
});

test('the failure is written to the log of the machine even when the monitoring is off', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  const { lines } = await withConsole(() =>
    withMonitoring(false, () => reportBoundaryFailure(boundaryFailure()))
  );

  assert.equal(lines.length, 1);
  assert.equal(reports.length, 0);
});

test('a failure of the monitoring never reaches the visitor', async () => {
  setMonitoringClientFactory(() => {
    throw new Error('the monitoring is broken');
  });

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure()));
});

test('a secret of the environment is not in the report', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));
  setMonitoringSecrets(['a_secret_value_that_is_long']);

  const error = new Error('the key a_secret_value_that_is_long was refused');
  error.stack =
    'Error: the key a_secret_value_that_is_long was refused\n    at Card (page.tsx:1:1)';

  await withMonitoring(true, () => reportBoundaryFailure(boundaryFailure({ error })));

  const text = reportText(reports[0]);

  assert.equal(text.includes('a_secret_value_that_is_long'), false);
});
