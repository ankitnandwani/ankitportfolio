import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMonitoringOptions, isValidSentryDsn, readMonitoringConfig } from './config.ts';

const A_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

test('isValidSentryDsn rejects a value that is not there', () => {
  assert.equal(isValidSentryDsn(undefined), false);
  assert.equal(isValidSentryDsn(null), false);
  assert.equal(isValidSentryDsn(''), false);
  assert.equal(isValidSentryDsn('   '), false);
});

test('isValidSentryDsn rejects the placeholder of the environment example', () => {
  assert.equal(isValidSentryDsn('your_sentry_dsn'), false);
});

test('isValidSentryDsn rejects a value that is not a url', () => {
  assert.equal(isValidSentryDsn('not-a-url'), false);
  assert.equal(isValidSentryDsn('example@sentry.example.com/1'), false);
});

test('isValidSentryDsn rejects a url that is not http or https', () => {
  assert.equal(isValidSentryDsn('ftp://example@sentry.example.com/1'), false);
  assert.equal(isValidSentryDsn('file:///tmp/sentry'), false);
});

test('isValidSentryDsn accepts a real looking DSN', () => {
  assert.equal(isValidSentryDsn(A_DSN), true);
  assert.equal(isValidSentryDsn(`  ${A_DSN}  `), true);
});

test('the monitoring is off when there is no DSN', () => {
  const config = readMonitoringConfig({ nodeEnv: 'production' });

  assert.equal(config.enabled, false);
});

test('the monitoring is off when the DSN is the placeholder of the environment example', () => {
  const config = readMonitoringConfig({
    sentryDsn: 'your_sentry_dsn',
    nodeEnv: 'production',
  });

  assert.equal(config.enabled, false);
});

test('the monitoring is off when the DSN is not a url', () => {
  const config = readMonitoringConfig({
    sentryDsn: 'not-a-url',
    nodeEnv: 'production',
  });

  assert.equal(config.enabled, false);
});

test('the DSN is not carried while the monitoring is off', () => {
  const config = readMonitoringConfig({
    sentryDsn: 'your_sentry_dsn',
    nodeEnv: 'production',
  });

  assert.equal(config.dsn, undefined);
});

test('the monitoring is on when the DSN is a real url', () => {
  const config = readMonitoringConfig({
    sentryDsn: A_DSN,
    nodeEnv: 'production',
  });

  assert.equal(config.enabled, true);
  assert.equal(config.dsn, A_DSN);
});

test('the DSN is trimmed', () => {
  const config = readMonitoringConfig({
    sentryDsn: `  ${A_DSN}  `,
    nodeEnv: 'production',
  });

  assert.equal(config.dsn, A_DSN);
});

test('the environment is named after the build', () => {
  assert.equal(readMonitoringConfig({ nodeEnv: 'production' }).environment, 'production');
  assert.equal(readMonitoringConfig({ nodeEnv: 'development' }).environment, 'development');
  assert.equal(readMonitoringConfig({}).environment, 'development');
});

test('the release is carried when there is one', () => {
  const config = readMonitoringConfig({ nodeEnv: 'production', release: 'abc1234' });

  assert.equal(config.release, 'abc1234');
});

test('the release is not carried when there is none', () => {
  assert.equal(readMonitoringConfig({ nodeEnv: 'production' }).release, undefined);
  assert.equal(readMonitoringConfig({ nodeEnv: 'production', release: '  ' }).release, undefined);
});

test('the failures are written to the console outside of production', () => {
  assert.equal(readMonitoringConfig({ nodeEnv: 'development' }).logToConsole, true);
  assert.equal(readMonitoringConfig({ nodeEnv: 'production' }).logToConsole, false);
});

test('the SDK never gets the personal data of the visitor', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production' })
  );

  assert.equal(options.sendDefaultPii, false);
});

test('the session recording is off', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production' })
  );

  assert.equal(options.replaysSessionSampleRate, 0);
  assert.equal(options.replaysOnErrorSampleRate, 0);
});

test('the tracing is off', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production' })
  );

  assert.equal(options.tracesSampleRate, 0);
});

test('the options carry the environment and the release', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production', release: 'abc1234' })
  );

  assert.equal(options.dsn, A_DSN);
  assert.equal(options.environment, 'production');
  assert.equal(options.release, 'abc1234');
});

test('the options carry no DSN while the monitoring is off', () => {
  const options = buildMonitoringOptions(readMonitoringConfig({ nodeEnv: 'production' }));

  assert.equal(options.dsn, undefined);
});

test('the options carry the hook that scrubs the event before it leaves', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production' })
  );

  assert.equal(typeof options.beforeSend, 'function');
});

test('the hook removes the private parts of an event', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production' })
  );

  const event = {
    event_id: 'abc123',
    user: { id: 'visitor-1', email: 'recruiter@example.com' },
    request: { url: 'https://ankitnandwani.com/api/chat?token=x', method: 'POST' },
    extra: { body: { message: 'What are Ankit main technical skills?' } },
  };

  const clean = options.beforeSend?.(event) as Record<string, unknown>;

  assert.equal('user' in clean, false);
  assert.equal('body' in (clean.extra as Record<string, unknown>), false);
  assert.equal(JSON.stringify(clean).includes('What are Ankit main technical skills'), false);
});

test('the hook is called the way the SDK calls it, with a hint', () => {
  const options = buildMonitoringOptions(
    readMonitoringConfig({ sentryDsn: A_DSN, nodeEnv: 'production' })
  );

  const event = {
    event_id: 'abc123',
    user: { id: 'visitor-1', email: 'recruiter@example.com' },
    extra: { body: { message: 'What are Ankit main technical skills?' } },
  };

  const hook = options.beforeSend as (event: unknown, hint: unknown) => unknown;
  const clean = hook(event, { captureContext: { name: 'chat' } }) as Record<string, unknown>;

  assert.notEqual(clean, undefined);
  assert.equal('user' in clean, false);
  assert.equal(JSON.stringify(clean).includes('What are Ankit main technical skills'), false);
});
