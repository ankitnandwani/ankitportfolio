import test from 'node:test';
import assert from 'node:assert/strict';

import { containsPii, detectPii, piiTypes, redactPii } from './piiDetection.ts';

test('redacts the phone number formats PRD §37 names', () => {
  const formats = [
    '(123) 456-7890',
    '123-456-7890',
    '123.456.7890',
    '1234567890',
    '+1 123 456 7890',
    '+44 20 7946 0958',
  ];

  for (const format of formats) {
    assert.equal(
      redactPii(format),
      '[REDACTED]',
      `expected "${format}" to be redacted`
    );
  }
});

test('redacts a phone number that sits in a sentence', () => {
  assert.equal(
    redactPii('Call me on 98765 43210 today'),
    'Call me on [REDACTED] today'
  );
});

test('redacts an email address', () => {
  assert.equal(
    redactPii('Write to ankit.nandwani@example.com please'),
    'Write to [REDACTED] please'
  );
});

test('redacts several email addresses', () => {
  const result = detectPii('a@example.com and b@example.org');

  assert.equal(result.text, '[REDACTED] and [REDACTED]');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].type, 'email');
  assert.equal(result.findings[0].count, 2);
});

test('keeps the dates that look like numbers', () => {
  assert.equal(redactPii('Started 2021-01-01'), 'Started 2021-01-01');
  assert.equal(
    redactPii('Dates: 2021-01-01 - 2024-03-31'),
    'Dates: 2021-01-01 - 2024-03-31'
  );
});

test('leaves a text without personal data alone', () => {
  const text = 'He has ten years of experience in backend quality.';

  assert.equal(redactPii(text), text);
  assert.equal(containsPii(text), false);
  assert.deepEqual(piiTypes(text), []);
});

test('reports what it found', () => {
  const result = detectPii(
    'Call 123-456-7890 or write to ankit@example.com'
  );

  assert.equal(result.hasPii, true);
  assert.deepEqual(result.findings, [
    { type: 'phone', count: 1 },
    { type: 'email', count: 1 },
  ]);
});

test('does not mistake the digits of an address for a phone number', () => {
  // The email is removed first, so the digits inside it cannot be read as
  // a phone number.
  const result = detectPii('write to ankit1234567@example.com');

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].type, 'email');
  assert.equal(result.text, 'write to [REDACTED]');
});

test('handles an empty text', () => {
  const result = detectPii('');

  assert.equal(result.hasPii, false);
  assert.equal(result.text, '');
});
