import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import {
  DEFAULT_PERFORMANCE_THRESHOLDS,
  readPerformanceThreshold,
  reportSlowOperation,
  startPerformanceMeasurement,
  type PerformanceReport,
} from './performance.ts';
import {
  setMonitoringClientFactory,
  type MonitoringClient,
  type MonitoringHint,
} from './capture.ts';

/**
 * A report the fake client received.
 */
interface Report {
  /** The text of the report. */
  message?: string;
  /** The hint that came with it. */
  hint?: MonitoringHint;
}

/**
 * A client that writes the reports down instead of sending them.
 */
function createFakeClient(reports: Report[]): MonitoringClient {
  return {
    captureException: () => {},
    captureMessage: (message, hint) => {
      reports.push({ message, hint });
    },
    flush: async () => {},
  };
}

/**
 * A clock that the test moves by hand.
 *
 * It stands in for the clock of the machine, so a test can say that an
 * operation took two thousand milliseconds without waiting two seconds.
 */
function fakeClock(): { now: () => number; advance: (milliseconds: number) => void } {
  let time = 1_000;

  return {
    now: () => time,
    advance: (milliseconds: number) => {
      time += milliseconds;
    },
  };
}

/**
 * Runs something with the monitoring on.
 *
 * The configuration of the monitoring is read from the environment, so the
 * variable of the DSN is what turns it on.
 */
async function withMonitoring(on: boolean, run: () => void | Promise<void>): Promise<void> {
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

beforeEach(() => {
  setMonitoringClientFactory(null);
});

test('an operation under the threshold is not reported', async () => {
  const reports: PerformanceReport[] = [];
  const clock = fakeClock();

  await withMonitoring(true, () => {
    const measurement = startPerformanceMeasurement('chat', 30_000, {
      clock: clock.now,
      reporter: (report) => reports.push(report),
    });

    clock.advance(2_000);
    measurement.end();
  });

  assert.equal(reports.length, 0);
});

test('an operation over the threshold is reported with the duration and the threshold', async () => {
  const reports: PerformanceReport[] = [];
  const clock = fakeClock();

  await withMonitoring(true, () => {
    const measurement = startPerformanceMeasurement('chat', 30_000, {
      clock: clock.now,
      reporter: (report) => reports.push(report),
    });

    clock.advance(32_000);
    measurement.end();
  });

  assert.equal(reports.length, 1);
  assert.equal(reports[0].operation, 'chat');
  assert.equal(reports[0].durationMs, 32_000);
  assert.equal(reports[0].thresholdMs, 30_000);
});

test('an operation that takes exactly the threshold is not reported', async () => {
  const reports: PerformanceReport[] = [];
  const clock = fakeClock();

  await withMonitoring(true, () => {
    const measurement = startPerformanceMeasurement('chat', 30_000, {
      clock: clock.now,
      reporter: (report) => reports.push(report),
    });

    clock.advance(30_000);
    measurement.end();
  });

  assert.equal(reports.length, 0);
});

test('the report holds the identifier of the query when there is one', async () => {
  const reports: PerformanceReport[] = [];
  const clock = fakeClock();

  await withMonitoring(true, () => {
    const measurement = startPerformanceMeasurement('chat', 1_000, {
      queryId: 'abc-123',
      route: 'chat',
      clock: clock.now,
      reporter: (report) => reports.push(report),
    });

    clock.advance(2_000);
    measurement.end();
  });

  assert.equal(reports[0].queryId, 'abc-123');
  assert.equal(reports[0].route, 'chat');
});

test('the report holds no question and no answer', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () => {
    reportSlowOperation('chat', 32_000, 30_000, { queryId: 'abc-123', route: 'chat' });
  });

  assert.equal(reports.length, 1);

  const text = JSON.stringify(reports[0]);

  assert.equal(text.includes('question'), false);
  assert.equal(text.includes('answer'), false);
  assert.equal(text.includes('description'), false);
  assert.equal(text.includes('form'), false);

  // The report holds the name of the operation, the duration, the threshold
  // and the identifier of the query, and nothing else.
  assert.equal(reports[0].hint?.tags?.operation, 'chat');
  assert.equal(reports[0].hint?.tags?.durationMs, '32000');
  assert.equal(reports[0].hint?.tags?.thresholdMs, '30000');
  assert.equal(reports[0].hint?.tags?.route, 'chat');
  assert.equal(reports[0].hint?.extra?.queryId, 'abc-123');

  // The reports of an operation are grouped by its name, so the slow answer
  // of every day is one issue.
  assert.deepEqual(reports[0].hint?.fingerprint, ['chat']);
});

test('the monitoring being off means that nothing is sent and nothing throws', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(false, () => {
    reportSlowOperation('chat', 32_000, 30_000, { queryId: 'abc-123' });
  });

  assert.equal(reports.length, 0);
});

test('a failure of the reporter never reaches the visitor', async () => {
  await withMonitoring(true, () => {
    reportSlowOperation('chat', 32_000, 30_000, {
      reporter: () => {
        throw new Error('the reporter could not be created');
      },
    });
  });
});

test('a measurement can be ended only once', async () => {
  const reports: PerformanceReport[] = [];
  const clock = fakeClock();

  await withMonitoring(true, () => {
    const measurement = startPerformanceMeasurement('chat', 1_000, {
      clock: clock.now,
      reporter: (report) => reports.push(report),
    });

    clock.advance(2_000);
    measurement.end();
    measurement.end();
  });

  assert.equal(reports.length, 1);
});

test('a threshold that is not a number in the environment is ignored', () => {
  const original = process.env.PERFORMANCE_CHAT_THRESHOLD_MS;

  try {
    delete process.env.PERFORMANCE_CHAT_THRESHOLD_MS;
    assert.equal(readPerformanceThreshold('chat'), DEFAULT_PERFORMANCE_THRESHOLDS.chat);

    process.env.PERFORMANCE_CHAT_THRESHOLD_MS = 'not a number';
    assert.equal(readPerformanceThreshold('chat'), DEFAULT_PERFORMANCE_THRESHOLDS.chat);

    process.env.PERFORMANCE_CHAT_THRESHOLD_MS = '0';
    assert.equal(readPerformanceThreshold('chat'), DEFAULT_PERFORMANCE_THRESHOLDS.chat);

    process.env.PERFORMANCE_CHAT_THRESHOLD_MS = '-5';
    assert.equal(readPerformanceThreshold('chat'), DEFAULT_PERFORMANCE_THRESHOLDS.chat);

    process.env.PERFORMANCE_CHAT_THRESHOLD_MS = '';
    assert.equal(readPerformanceThreshold('chat'), DEFAULT_PERFORMANCE_THRESHOLDS.chat);

    process.env.PERFORMANCE_CHAT_THRESHOLD_MS = '45000';
    assert.equal(readPerformanceThreshold('chat'), 45_000);
  } finally {
    if (original === undefined) {
      delete process.env.PERFORMANCE_CHAT_THRESHOLD_MS;
    } else {
      process.env.PERFORMANCE_CHAT_THRESHOLD_MS = original;
    }
  }
});

test('the chat has a longer threshold than the form', () => {
  assert.equal(DEFAULT_PERFORMANCE_THRESHOLDS.chat, DEFAULT_PERFORMANCE_THRESHOLDS['job-fit']);
  assert.ok(DEFAULT_PERFORMANCE_THRESHOLDS.contact < DEFAULT_PERFORMANCE_THRESHOLDS.chat);
  assert.ok(DEFAULT_PERFORMANCE_THRESHOLDS.generation < DEFAULT_PERFORMANCE_THRESHOLDS.chat);
  assert.ok(DEFAULT_PERFORMANCE_THRESHOLDS.retrieval < DEFAULT_PERFORMANCE_THRESHOLDS.chat);
});
