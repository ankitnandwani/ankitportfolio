import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_FALLBACK,
  validateResponse,
} from './validation.ts';

const GOOD_ANSWER =
  'Yes. He built API automation frameworks for a network pricing platform, ' +
  'covering backend quality, CI/CD integration and distributed system testing.';

test('accepts a professional answer', () => {
  const result = validateResponse(GOOD_ANSWER);

  assert.equal(result.isValid, true);
  assert.equal(result.text, GOOD_ANSWER);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('finds a phone number that got past the guardrails', () => {
  const result = validateResponse('You can reach him on 123-456-7890.');

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].kind, 'pii');
  assert.equal(result.errors[0].severity, 'error');
  assert.match(result.fallback, /Contact details/);
});

test('finds an email address that got past the guardrails', () => {
  const result = validateResponse('Write to ankit@example.com for details.');

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].kind, 'pii');
});

test('finds an empty answer', () => {
  const result = validateResponse('   ');

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].kind, 'empty');
  assert.match(result.fallback, /don't have enough information/);
});

test('finds an answer that is too long', () => {
  const result = validateResponse('a'.repeat(5000));

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].kind, 'length');
  assert.ok(result.text.length <= 4001, 'the answer has to be cut off');
  assert.match(result.fallback, /longer than it should be/);
});

test('reports an answer that is long but still shows it', () => {
  const answer = 'a'.repeat(2500);
  const result = validateResponse(answer);

  assert.equal(result.isValid, true);
  assert.equal(result.text, answer);
  assert.equal(result.warnings[0].kind, 'length');
  assert.equal(result.warnings[0].severity, 'warning');
});

test('reports an answer that is too informal', () => {
  const result = validateResponse('He is a total rockstar, lol!');

  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some((warning) => warning.kind === 'tone'));
});

test('reports an answer with too many exclamation marks', () => {
  const result = validateResponse('What a great answer!!! Wow!!!');

  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some((warning) => warning.kind === 'tone'));
});

test('reports details that are not in the context', () => {
  const result = validateResponse(
    'He worked on Kafka in 2019 and Kubernetes in 2021 and Docker in 2022.',
    { context: 'He worked on Java and Selenium.' }
  );

  const grounding = result.warnings.find(
    (warning) => warning.kind === 'grounding'
  );

  assert.ok(grounding, 'expected a grounding finding');
  assert.equal(result.isValid, true);
});

test('accepts an answer whose details are in the context', () => {
  const result = validateResponse(
    'He worked on Kafka in 2019 and Java in 2021.',
    { context: 'He worked on Kafka in 2019 and Java in 2021.' }
  );

  assert.equal(
    result.warnings.some((warning) => warning.kind === 'grounding'),
    false
  );
});

test('does not look for grounding without a context', () => {
  const result = validateResponse('He worked on Kafka in 2019.');

  assert.equal(
    result.warnings.some((warning) => warning.kind === 'grounding'),
    false
  );
});

test('keeps a fallback for an answer that cannot be shown', () => {
  const result = validateResponse('');

  assert.equal(result.fallback.length > 0, true);
  assert.equal(typeof result.fallback, 'string');
});

test('uses the fallback it was given', () => {
  const result = validateResponse('', { fallback: 'Please try again.' });

  assert.equal(result.fallback, 'Please try again.');
});

test('has a fallback for every kind of failure', () => {
  const failures: Array<[string, string]> = [
    ['empty', validateResponse('').fallback],
    ['pii', validateResponse('Call 123-456-7890').fallback],
    ['length', validateResponse('a'.repeat(5000)).fallback],
  ];

  for (const [kind, fallback] of failures) {
    assert.ok(fallback.length > 0, `the ${kind} fallback is missing`);
    assert.notEqual(
      fallback,
      DEFAULT_FALLBACK,
      `the ${kind} fallback should say what went wrong`
    );
  }
});
