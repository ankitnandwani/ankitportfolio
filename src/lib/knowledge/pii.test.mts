import test from 'node:test';
import assert from 'node:assert/strict';
import { containsPhoneNumbers, redactPII, redactPhoneNumbers } from './pii.ts';

test('redacts US formatted phone numbers', () => {
  assert.equal(redactPhoneNumbers('(123) 456-7890'), '[REDACTED]');
  assert.equal(redactPhoneNumbers('123-456-7890'), '[REDACTED]');
  assert.equal(redactPhoneNumbers('123.456.7890'), '[REDACTED]');
  assert.equal(redactPhoneNumbers('1234567890'), '[REDACTED]');
});

test('redacts international phone numbers', () => {
  assert.equal(redactPhoneNumbers('+1 123 456 7890'), '[REDACTED]');
  assert.equal(redactPhoneNumbers('+44 20 7946 0958'), '[REDACTED]');
});

test('redacts a phone number embedded in a sentence', () => {
  assert.equal(
    redactPhoneNumbers('call me at 98765 43210 today'),
    'call me at [REDACTED] today'
  );
});

test('leaves text without phone numbers unchanged', () => {
  assert.equal(redactPhoneNumbers('no numbers here'), 'no numbers here');
  assert.equal(redactPhoneNumbers('version 2.0.1 released'), 'version 2.0.1 released');
});

test('detects whether text contains a phone number', () => {
  assert.equal(containsPhoneNumbers('+1 123 456 7890'), true);
  assert.equal(containsPhoneNumbers('(123) 456-7890'), true);
  assert.equal(containsPhoneNumbers('no numbers here'), false);
});

test('redactPII redacts phone numbers', () => {
  assert.equal(redactPII('call +1 123 456 7890 now'), 'call [REDACTED] now');
});

test.todo(
  'does not redact ISO dates: PRD 37 scopes redaction to phone numbers, but the current regex also matches dates such as 2021-01-01, which corrupts the career timeline, education and certification dates in the knowledge base'
);
