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

test('preserves ISO dates instead of redacting them', () => {
  assert.equal(redactPhoneNumbers('2021-01-01'), '2021-01-01');
  assert.equal(
    redactPhoneNumbers('Dates: 2021-01-01 - 2024-03-31'),
    'Dates: 2021-01-01 - 2024-03-31'
  );
});

test('redacts a phone number that sits next to a date', () => {
  assert.equal(
    redactPhoneNumbers('Started 2021-01-01, reachable on +1 123 456 7890'),
    'Started 2021-01-01, reachable on [REDACTED]'
  );
});

test('does not count a date as a phone number', () => {
  assert.equal(containsPhoneNumbers('2021-01-01'), false);
  assert.equal(containsPhoneNumbers('Dates: 2021-01-01 - 2024-03-31'), false);
});

test('detects whether text contains a phone number', () => {
  assert.equal(containsPhoneNumbers('+1 123 456 7890'), true);
  assert.equal(containsPhoneNumbers('(123) 456-7890'), true);
  assert.equal(containsPhoneNumbers('no numbers here'), false);
});

test('redactPII redacts phone numbers', () => {
  assert.equal(redactPII('call +1 123 456 7890 now'), 'call [REDACTED] now');
});
