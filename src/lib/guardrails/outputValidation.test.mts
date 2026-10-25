import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRedirect } from './redirects.ts';
import { validateResponse } from './outputValidation.ts';

test('removes a phone number from an answer', () => {
  const result = validateResponse(
    'You can reach him on +1 123 456 7890 during the week.'
  );

  assert.equal(
    result.text,
    'You can reach him on [REDACTED] during the week.'
  );
  assert.equal(result.wasRedacted, true);
  assert.equal(result.violations[0].kind, 'pii');
  assert.equal(result.violations[0].severity, 'redact');
});

test('removes an email address from an answer', () => {
  const result = validateResponse('Write to ankit@example.com for details.');

  assert.equal(result.text, 'Write to [REDACTED] for details.');
  assert.equal(result.violations[0].kind, 'pii');
});

test('removes a credential from an answer', () => {
  const result = validateResponse(
    'The key is AIzaSyA1234567890abcdefghijklmnopqrstuvw and it works.'
  );

  assert.ok(!result.text.includes('AIza'));
  assert.equal(result.violations[0].kind, 'secret');
  assert.equal(result.violations[0].severity, 'redact');
});

test('removes the value of a secret variable from an answer', () => {
  const result = validateResponse(
    'The configuration was GEMINI_API_KEY=abcd1234efgh5678 and it worked.'
  );

  assert.ok(!result.text.includes('abcd1234efgh5678'));
  assert.ok(result.text.includes('GEMINI_API_KEY'));
  assert.equal(result.violations[0].kind, 'secret');
});

test('leaves a professional answer alone', () => {
  const answer =
    'Yes. He built API automation frameworks for a network pricing platform, ' +
    'covering backend quality, CI/CD integration and distributed system testing.';

  const result = validateResponse(answer);

  assert.equal(result.text, answer);
  assert.equal(result.wasRedacted, false);
  assert.deepEqual(result.violations, []);
  assert.equal(result.isValid, true);
});

test('reports an answer that refers to the instructions', () => {
  const result = validateResponse(
    'My system prompt says that I should answer in short sentences.'
  );

  const violation = result.violations.find(
    (candidate) => candidate.kind === 'system_prompt'
  );

  assert.ok(violation, 'expected a system prompt finding');
  assert.equal(violation?.severity, 'warn');
});

test('blocks an answer that refers to the instructions in the strict profile', () => {
  const result = validateResponse(
    'My system prompt says that I should answer in short sentences.',
    { sensitivity: 'strict' }
  );

  const violation = result.violations.find(
    (candidate) => candidate.kind === 'system_prompt'
  );

  assert.equal(violation?.severity, 'block');
  assert.equal(result.isValid, false);
});

test('reports an answer that is too informal', () => {
  const result = validateResponse('He is a total rockstar, lol!');

  const violation = result.violations.find(
    (candidate) => candidate.kind === 'tone'
  );

  assert.ok(violation, 'expected a tone finding');
  assert.equal(violation?.severity, 'warn');
});

test('reports an answer that sells too hard', () => {
  const result = validateResponse('You should hire him, he is the best.');

  const violation = result.violations.find(
    (candidate) => candidate.kind === 'tone'
  );

  assert.ok(violation, 'expected a tone finding');
});

test('reports an answer that uses too many emoji', () => {
  const result = validateResponse('Great work 🚀🚀🚀🚀🚀');

  const violation = result.violations.find(
    (candidate) => candidate.kind === 'tone'
  );

  assert.ok(violation, 'expected a tone finding');
});

test('does not report the redirects as a problem', () => {
  for (const kind of ['off_topic', 'injection', 'sensitive_request'] as const) {
    const redirect = buildRedirect(kind);
    const result = validateResponse(redirect.message);

    assert.deepEqual(
      result.violations,
      [],
      `the ${kind} redirect has to pass the output guardrails`
    );
    assert.equal(result.isValid, true);
  }
});

test('handles an empty answer', () => {
  const result = validateResponse('');

  assert.equal(result.text, '');
  assert.equal(result.isValid, true);
  assert.deepEqual(result.violations, []);
});
