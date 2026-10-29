import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isConfiguredValue,
  isPlaceholderValue,
  isValidPostHogHost,
  readAnalyticsConfig,
} from './config.ts';

test('isPlaceholderValue recognises the placeholder of the environment example', () => {
  assert.equal(isPlaceholderValue('your_posthog_key'), true);
  assert.equal(isPlaceholderValue('your_posthog_host'), true);
  assert.equal(isPlaceholderValue('your-key'), true);
});

test('isPlaceholderValue recognises the other ways a placeholder is written', () => {
  assert.equal(isPlaceholderValue('<your_key>'), true);
  assert.equal(isPlaceholderValue('changeme'), true);
  assert.equal(isPlaceholderValue('change_me'), true);
  assert.equal(isPlaceholderValue('TODO'), true);
  assert.equal(isPlaceholderValue('tbd'), true);
  assert.equal(isPlaceholderValue('none'), true);
  assert.equal(isPlaceholderValue('null'), true);
  assert.equal(isPlaceholderValue('undefined'), true);
  assert.equal(isPlaceholderValue('xxxx'), true);
  assert.equal(isPlaceholderValue('placeholder'), true);
  assert.equal(isPlaceholderValue('test-placeholder'), true);
});

test('isPlaceholderValue recognises an empty value', () => {
  assert.equal(isPlaceholderValue(''), true);
  assert.equal(isPlaceholderValue('   '), true);
});

test('isPlaceholderValue leaves a real credential alone', () => {
  assert.equal(isPlaceholderValue('phc_abc123DEF456'), false);
  assert.equal(isPlaceholderValue('https://eu.i.posthog.com'), false);
});

test('isConfiguredValue is false for a value that is not there', () => {
  assert.equal(isConfiguredValue(undefined), false);
  assert.equal(isConfiguredValue(null), false);
  assert.equal(isConfiguredValue(''), false);
});

test('isConfiguredValue is false for a placeholder', () => {
  assert.equal(isConfiguredValue('your_posthog_key'), false);
  assert.equal(isConfiguredValue('test-placeholder'), false);
});

test('isConfiguredValue is true for a real credential', () => {
  assert.equal(isConfiguredValue('phc_abc123DEF456'), true);
});

test('isValidPostHogHost rejects a value that is not there', () => {
  assert.equal(isValidPostHogHost(undefined), false);
  assert.equal(isValidPostHogHost(null), false);
  assert.equal(isValidPostHogHost(''), false);
});

test('isValidPostHogHost rejects a placeholder', () => {
  assert.equal(isValidPostHogHost('your_posthog_host'), false);
});

test('isValidPostHogHost rejects a string that is not a url', () => {
  assert.equal(isValidPostHogHost('eu.i.posthog.com'), false);
  assert.equal(isValidPostHogHost('not a host'), false);
});

test('isValidPostHogHost rejects a protocol that is not http', () => {
  assert.equal(isValidPostHogHost('ftp://eu.i.posthog.com'), false);
});

test('isValidPostHogHost accepts an http or https url', () => {
  assert.equal(isValidPostHogHost('https://eu.i.posthog.com'), true);
  assert.equal(isValidPostHogHost('https://us.i.posthog.com'), true);
  assert.equal(isValidPostHogHost('http://localhost:8000'), true);
});

test('readAnalyticsConfig turns the analytics off when there are no credentials', () => {
  const config = readAnalyticsConfig({});

  assert.equal(config.enabled, false);
  assert.equal(config.posthogKey, undefined);
  assert.equal(config.posthogHost, undefined);
});

test('readAnalyticsConfig turns the analytics on when the credentials are there', () => {
  const config = readAnalyticsConfig({
    posthogKey: 'phc_abc123DEF456',
    posthogHost: 'https://eu.i.posthog.com',
  });

  assert.equal(config.enabled, true);
  assert.equal(config.posthogKey, 'phc_abc123DEF456');
  assert.equal(config.posthogHost, 'https://eu.i.posthog.com');
});

test('readAnalyticsConfig treats a placeholder as no credentials', () => {
  const config = readAnalyticsConfig({
    posthogKey: 'your_posthog_key',
    posthogHost: 'your_posthog_host',
  });

  assert.equal(config.enabled, false);
  assert.equal(config.posthogKey, undefined);
  assert.equal(config.posthogHost, undefined);
});

test('readAnalyticsConfig treats a host that is not a url as no credentials', () => {
  const config = readAnalyticsConfig({
    posthogKey: 'phc_abc123DEF456',
    posthogHost: 'your_posthog_host',
  });

  assert.equal(config.enabled, false);
  assert.equal(config.posthogKey, undefined);
});

test('readAnalyticsConfig treats a key that is a placeholder as no credentials', () => {
  const config = readAnalyticsConfig({
    posthogKey: 'your_posthog_key',
    posthogHost: 'https://eu.i.posthog.com',
  });

  assert.equal(config.enabled, false);
  assert.equal(config.posthogHost, undefined);
});

test('readAnalyticsConfig turns the analytics off in the browser', () => {
  const config = readAnalyticsConfig(
    {
      posthogKey: 'phc_abc123DEF456',
      posthogHost: 'https://eu.i.posthog.com',
    },
    { isBrowser: true }
  );

  assert.equal(config.enabled, false);
  assert.equal(config.posthogKey, undefined);
  assert.equal(config.posthogHost, undefined);
});

test('readAnalyticsConfig writes to the console outside production', () => {
  const config = readAnalyticsConfig({ nodeEnv: 'development' });
  assert.equal(config.logToConsole, true);
});

test('readAnalyticsConfig keeps the console quiet in production', () => {
  const config = readAnalyticsConfig({ nodeEnv: 'production' });
  assert.equal(config.logToConsole, false);
});

test('readAnalyticsConfig reads the console flag from a missing environment as development', () => {
  const config = readAnalyticsConfig({});
  assert.equal(config.logToConsole, true);
});
