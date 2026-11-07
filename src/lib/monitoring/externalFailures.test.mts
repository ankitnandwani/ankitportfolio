import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import {
  buildExternalFailureContext,
  buildExternalFailureMessage,
  classifyExternalFailure,
  reportExternalFailure,
  resetExternalFailureCounts,
  setExternalFailureWindow,
  type ExternalFailure,
} from './externalFailures.ts';
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
      reports.push({ kind: 'exception', message: undefined, hint });
    },
    captureMessage: (message, hint) => {
      reports.push({ kind: 'message', message, hint });
    },
    flush: async () => {},
  };
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
 * A failure of the GitHub API.
 */
function githubFailure(overrides: Partial<ExternalFailure> = {}): ExternalFailure {
  return {
    service: 'github',
    kind: 'unavailable',
    what: 'cached',
    status: 503,
    repository: 'owner/repo',
    ...overrides,
  };
}

beforeEach(() => {
  resetExternalFailureCounts();
  setExternalFailureWindow(5 * 60 * 1000);
  setMonitoringClientFactory(null);
});

test('a failure of the GitHub API is reported with the cache as what answered', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () => reportExternalFailure(githubFailure()));

  assert.equal(reports.length, 1);
  assert.equal(reports[0].kind, 'message');

  assert.equal(reports[0].hint?.tags?.service, 'github');
  assert.equal(reports[0].hint?.tags?.kind, 'unavailable');
  assert.equal(reports[0].hint?.tags?.what, 'cached');
  assert.equal(reports[0].hint?.tags?.status, '503');

  // The reports of a service are grouped by the service and by the kind of
  // the failure, so an outage is one issue and not one issue per repository.
  assert.deepEqual(reports[0].hint?.fingerprint, ['github', 'unavailable']);

  assert.match(reports[0].message ?? '', /GitHub/);
  assert.match(reports[0].message ?? '', /owner\/repo/);
  assert.match(reports[0].message ?? '', /answered with what it had/);
});

test('a failure of the database is reported with nothing as what answered', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () =>
    reportExternalFailure({
      service: 'supabase',
      kind: 'unavailable',
      what: 'none',
    })
  );

  assert.equal(reports.length, 1);
  assert.equal(reports[0].hint?.tags?.service, 'supabase');
  assert.equal(reports[0].hint?.tags?.what, 'none');
  assert.deepEqual(reports[0].hint?.fingerprint, ['supabase', 'unavailable']);

  assert.match(reports[0].message ?? '', /no context of the retrieval/);
});

test('the report holds the name of the repository and not the address of the API', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () =>
    reportExternalFailure(
      githubFailure({
        url: 'https://api.github.com/repos/owner/repo?access_token=a_secret_value',
      })
    )
  );

  const text = JSON.stringify(reports[0]);

  assert.equal(text.includes('owner/repo'), true);
  assert.equal(text.includes('access_token'), false);
  assert.equal(text.includes('a_secret_value'), false);
  assert.equal(text.includes('api.github.com'), false);
});

test('an address of a service that holds no query is reported', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () =>
    reportExternalFailure(githubFailure({ url: 'https://api.github.com/repos/owner/repo' }))
  );

  assert.equal(reports[0].hint?.extra?.url, 'https://api.github.com/repos/owner/repo');
});

test('two failures inside the same window produce one report, and the count is added to the report that follows', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, async () => {
    await reportExternalFailure(githubFailure());
    await reportExternalFailure(githubFailure());

    // The failure repeats inside the window: one report and not two.
    assert.equal(reports.length, 1);

    // The window passes and the next failure reports the count of the ones
    // that piled up.
    setExternalFailureWindow(0);
    await reportExternalFailure(githubFailure());

    assert.equal(reports.length, 2);
    assert.equal(reports[1].hint?.extra?.count, 2);
    assert.match(reports[1].message ?? '', /2 failures/);
  });
});

test('the failures of two repositories are counted apart', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, async () => {
    await reportExternalFailure(githubFailure({ repository: 'owner/one' }));
    await reportExternalFailure(githubFailure({ repository: 'owner/two' }));

    // Each repository has its own window, so each one has its own report.
    assert.equal(reports.length, 2);
  });
});

test('the report holds no credential', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));
  setMonitoringSecrets(['ghp_a_secret_token']);

  try {
    await withMonitoring(true, () =>
      reportExternalFailure(githubFailure({ repository: 'owner/ghp_a_secret_token' }))
    );

    assert.equal(JSON.stringify(reports[0]).includes('ghp_a_secret_token'), false);
  } finally {
    resetMonitoringSecrets();
  }
});

test('the monitoring being off means that nothing is sent and nothing throws', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(false, async () => {
    await reportExternalFailure(githubFailure());
    await reportExternalFailure({
      service: 'supabase',
      kind: 'unavailable',
      what: 'none',
    });
  });

  assert.equal(reports.length, 0);
});

test('a failure of the monitoring never throws', async () => {
  setMonitoringClientFactory(() => {
    throw new Error('the client could not be created');
  });

  await withMonitoring(true, async () => {
    await reportExternalFailure(githubFailure());
  });
});

test('the kind of a failure comes from the status the service reported', () => {
  assert.equal(classifyExternalFailure({ status: 404 }), 'not_found');
  assert.equal(classifyExternalFailure({ status: 429 }), 'rate_limited');
  assert.equal(classifyExternalFailure({ status: 408 }), 'timeout');
  assert.equal(classifyExternalFailure({ status: 500 }), 'unavailable');
  assert.equal(classifyExternalFailure({ status: 503 }), 'unavailable');
  assert.equal(classifyExternalFailure({ status: 401 }), 'unknown');
  assert.equal(classifyExternalFailure({ status: 403 }), 'unknown');
  assert.equal(classifyExternalFailure({ timeout: true }), 'timeout');
  assert.equal(classifyExternalFailure({ rateLimited: true }), 'rate_limited');
  assert.equal(classifyExternalFailure({ unreachable: true }), 'unavailable');
});

test('the message of the database is reduced to its kind', () => {
  assert.equal(classifyExternalFailure({ message: 'TypeError: fetch failed' }), 'unavailable');
  assert.equal(
    classifyExternalFailure({ message: 'Connection terminated unexpectedly' }),
    'unavailable'
  );
  assert.equal(classifyExternalFailure({ message: 'Query timed out' }), 'timeout');
  assert.equal(classifyExternalFailure({ message: 'Too many requests' }), 'rate_limited');

  // A message that names the shape of the database says nothing about the
  // kind of the failure.
  assert.equal(
    classifyExternalFailure({ message: 'relation "knowledge_chunks" does not exist' }),
    'unknown'
  );
  assert.equal(classifyExternalFailure({ message: 'the search failed' }), 'unknown');
  assert.equal(classifyExternalFailure({}), 'unknown');
});

test('the message of the service is not the report', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  await withMonitoring(true, () =>
    reportExternalFailure({
      service: 'supabase',
      kind: 'unknown',
      what: 'none',
    })
  );

  const text = JSON.stringify(reports[0]);

  assert.equal(text.includes('knowledge_chunks'), false);
  assert.equal(text.includes('constraint'), false);
});

test('the text of a report says what happened', () => {
  const text = buildExternalFailureMessage(
    {
      service: 'github',
      kind: 'unavailable',
      what: 'cached',
      repository: 'owner/repo',
    },
    3
  );

  assert.match(text, /GitHub/);
  assert.match(text, /owner\/repo/);
  assert.match(text, /unavailable/);
  assert.match(text, /answered with what it had/);
  assert.match(text, /3 failures/);
});

test('the context of a report holds only what is safe', () => {
  const context = buildExternalFailureContext(
    {
      service: 'github',
      kind: 'unavailable',
      what: 'cached',
      status: 503,
      requestId: 'ABCD:1234',
      repository: 'owner/repo',
    },
    1
  );

  assert.equal(context.kind, 'unavailable');
  assert.equal(context.status, 503);
  assert.deepEqual(context.fingerprint, ['github', 'unavailable']);
  assert.equal(context.tags?.service, 'github');
  assert.equal(context.tags?.what, 'cached');
  assert.equal(context.extra?.repository, 'owner/repo');
  assert.equal(context.extra?.requestId, 'ABCD:1234');
  assert.equal(context.extra?.count, 1);
});
