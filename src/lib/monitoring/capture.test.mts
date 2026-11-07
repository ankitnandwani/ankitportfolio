import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRouteContext,
  captureException,
  captureMessage,
  classifyFailure,
  setMonitoringClientFactory,
  type MonitoringClient,
  type MonitoringHint,
} from './capture.ts';
import type { MonitoringConfig } from './config.ts';

/**
 * The configuration of a monitoring that is on.
 */
const ON: MonitoringConfig = {
  enabled: true,
  dsn: 'https://key@example.com/1',
  environment: 'test',
  logToConsole: false,
};

/**
 * The configuration of a monitoring that is off.
 */
const OFF: MonitoringConfig = {
  enabled: false,
  environment: 'test',
  logToConsole: false,
};

/**
 * A report the fake client received.
 */
interface Report {
  /** What kind of report it was. */
  kind: 'exception' | 'message';
  /** The failure of an exception. */
  error: unknown;
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
      reports.push({ kind: 'message', message, error: undefined, hint });
    },
    flush: async () => {},
  };
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

test('a failure is reported with the context that was given', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  try {
    const error = new Error('the model is not configured');
    const context = buildRouteContext(
      'chat',
      { method: 'POST' },
      {
        status: 503,
        kind: 'llm_configuration_error',
        queryId: 'abc-123',
      }
    );

    await captureException(error, context, ON);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].kind, 'exception');
    assert.equal(reports[0].error, error);
    assert.equal(reports[0].hint?.tags?.route, 'chat');
    assert.equal(reports[0].hint?.tags?.kind, 'llm_configuration_error');
    assert.equal(reports[0].hint?.tags?.method, 'POST');
    assert.equal(reports[0].hint?.tags?.status, '503');
    assert.equal(reports[0].hint?.extra?.queryId, 'abc-123');
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the report holds nothing but the safe parts', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  try {
    const context = buildRouteContext(
      'chat',
      { method: 'POST' },
      {
        status: 500,
        kind: 'unknown_failure',
        queryId: 'abc-123',
      }
    );

    await captureException(new Error('boom'), context, ON);

    const hint = reports[0].hint;

    assert.deepEqual(Object.keys(hint?.tags ?? {}).sort(), ['kind', 'method', 'route', 'status']);
    assert.deepEqual(Object.keys(hint?.extra ?? {}).sort(), ['queryId', 'timestamp']);
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the report is grouped by the kind of the failure and by the route', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  try {
    const context = buildRouteContext(
      'job-fit',
      { method: 'POST' },
      {
        status: 503,
        kind: 'llm_unavailable',
        queryId: 'abc-123',
      }
    );

    await captureException(new Error('boom'), context, ON);

    assert.deepEqual(reports[0].hint?.fingerprint, ['llm_unavailable', 'job-fit']);
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the message of the parser does not hold the text of a visitor', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  try {
    const context = buildRouteContext(
      'feedback',
      { method: 'POST' },
      {
        status: 500,
        kind: 'unknown_failure',
      }
    );

    // The error of the parser of a body holds the first words of that body.
    const parseError = new SyntaxError(
      'Unexpected token \'n\', "what are your skills" is not valid JSON'
    );

    await captureException(parseError, context, ON);

    const reported = reports[0].error as Error;

    assert.equal(reported.message, 'The body of the request could not be read');
    assert.equal(reported.stack?.includes('what are your skills'), false);
    assert.equal((reported.stack?.split('\n').length ?? 0) > 1, true);
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the message of a failure is kept', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  try {
    const context = buildRouteContext(
      'chat',
      { method: 'POST' },
      {
        status: 503,
        kind: 'llm_configuration_error',
      }
    );

    const error = new Error('the model is not configured');

    await captureException(error, context, ON);

    assert.equal(reports[0].error, error);
    assert.equal((reports[0].error as Error).message, 'the model is not configured');
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('nothing is reported while the monitoring is off', async () => {
  let called = false;
  setMonitoringClientFactory(() => {
    called = true;
    return createFakeClient([]);
  });

  try {
    const context = buildRouteContext(
      'chat',
      { method: 'POST' },
      {
        status: 500,
        kind: 'unknown_failure',
      }
    );

    await captureException(new Error('boom'), context, OFF);
    await captureMessage('the service could not be reached', context, OFF);

    assert.equal(called, false);
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('a failure of the report does not throw', async () => {
  const context = buildRouteContext(
    'chat',
    { method: 'POST' },
    {
      status: 500,
      kind: 'unknown_failure',
    }
  );

  try {
    // The client cannot even be created.
    setMonitoringClientFactory(() => {
      throw new Error('the package is not there');
    });
    await assert.doesNotReject(() => captureException(new Error('boom'), context, ON));

    // The client fails while it reports.
    setMonitoringClientFactory(() => ({
      captureException: () => {
        throw new Error('the report failed');
      },
      captureMessage: () => {
        throw new Error('the report failed');
      },
    }));
    await assert.doesNotReject(() => captureException(new Error('boom'), context, ON));
    await assert.doesNotReject(() => captureMessage('a text', context, ON));
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the report is flushed before the answer goes out', async () => {
  let reported = false;
  let flushed = false;

  setMonitoringClientFactory(() => ({
    captureException: () => {
      reported = true;
    },
    captureMessage: () => {},
    flush: async () => {
      flushed = true;
    },
  }));

  try {
    const context = buildRouteContext(
      'chat',
      { method: 'POST' },
      {
        status: 500,
        kind: 'unknown_failure',
      }
    );

    await captureException(new Error('boom'), context, ON);

    assert.equal(reported, true);
    assert.equal(flushed, true);
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the line of the local log keeps the shape it has', async () => {
  const context = buildRouteContext(
    'chat',
    { method: 'POST' },
    {
      status: 500,
      kind: 'unknown_failure',
    }
  );

  const { lines } = await withConsole(() => captureException(new Error('boom'), context, OFF));

  assert.equal(lines.length, 1);
  assert.equal(lines[0][0], 'Chat API error:');
});

test('the line of the local log is written even when the monitoring is on', async () => {
  const context = buildRouteContext(
    'contact',
    { method: 'POST' },
    {
      status: 500,
      kind: 'unknown_failure',
    }
  );

  const { lines } = await withConsole(() => captureException(new Error('boom'), context, ON));

  assert.equal(lines.length, 1);
  assert.equal(lines[0][0], 'Contact form API error:');
});

test('a message is reported with its private parts removed', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  try {
    const context = buildRouteContext(
      'contact',
      { method: 'POST' },
      {
        status: 200,
        kind: 'unknown_failure',
      }
    );

    await captureMessage('the address is recruiter@example.com', context, ON);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].kind, 'message');
    assert.equal(reports[0].message, 'the address is [REDACTED]');
  } finally {
    setMonitoringClientFactory(null);
  }
});

test('the context of a route holds the name, the method and the identifier of the query', () => {
  const context = buildRouteContext(
    'job-fit',
    { method: 'POST' },
    {
      status: 503,
      kind: 'llm_unavailable',
      queryId: 'abc-123',
    }
  );

  assert.equal(context.route, 'job-fit');
  assert.equal(context.method, 'POST');
  assert.equal(context.status, 503);
  assert.equal(context.kind, 'llm_unavailable');
  assert.equal(context.queryId, 'abc-123');
  assert.equal(typeof context.timestamp, 'string');
});

test('the context of a route holds no address of a visitor and no body', () => {
  const context = buildRouteContext(
    'contact',
    { method: 'POST' },
    {
      status: 500,
      kind: 'unknown_failure',
    }
  );

  assert.deepEqual(Object.keys(context).sort(), [
    'kind',
    'method',
    'queryId',
    'route',
    'status',
    'timestamp',
  ]);
});

test('a request without a method still gives a context', () => {
  const context = buildRouteContext('feedback', {}, { status: 500, kind: 'unknown_failure' });

  assert.equal(context.method, 'UNKNOWN');
});

test('the kind of a failure is told apart', () => {
  assert.equal(classifyFailure(new Error('boom')), 'unknown_failure');
  assert.equal(classifyFailure('a text'), 'unknown_failure');
  assert.equal(classifyFailure(undefined), 'unknown_failure');

  const configuration = new Error('there is no key');
  configuration.name = 'LLMConfigurationError';
  assert.equal(classifyFailure(configuration), 'llm_configuration_error');

  const busy = new Error('the model is busy');
  busy.name = 'LLMError';
  (busy as { retryable?: boolean }).retryable = true;
  assert.equal(classifyFailure(busy), 'llm_unavailable');
});
