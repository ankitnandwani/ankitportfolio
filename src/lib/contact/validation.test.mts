/**
 * Unit tests for the contact form validation logic.
 *
 * These tests use Node's built-in test runner and assert module.
 * They cover all validation rules for the contact form fields.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateContactForm,
  validateField,
  createSuccessResponse,
  createErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  contactFormRequestSchema,
} from './validation.ts';
import { CONTACT_FORM_LIMITS } from '../../data/contact.ts';
import type { ContactFormRequest, FieldErrors } from '../../data/contact.ts';

/**
 * A valid contact form request for testing.
 */
const validRequest: {
  name: string;
  email: string;
  company: string;
  message: string;
} = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  company: 'Acme Corp',
  message: 'This is a valid message with enough characters to pass validation.',
};

test('CONTACT_FORM_LIMITS has the correct values', () => {
  assert.equal(CONTACT_FORM_LIMITS.name.min, 1);
  assert.equal(CONTACT_FORM_LIMITS.name.max, 100);
  assert.equal(CONTACT_FORM_LIMITS.email.max, 254);
  assert.equal(CONTACT_FORM_LIMITS.company.max, 100);
  assert.equal(CONTACT_FORM_LIMITS.message.min, 10);
  assert.equal(CONTACT_FORM_LIMITS.message.max, 5000);
});

test('validateContactForm accepts valid input', () => {
  const result = validateContactForm(validRequest);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.name, 'John Doe');
    assert.equal(result.data.email, 'john.doe@example.com');
    assert.equal(result.data.company, 'Acme Corp');
    assert.equal(result.data.message, 'This is a valid message with enough characters to pass validation.');
  }
});

test('validateContactForm rejects empty name', () => {
  const result = validateContactForm({ ...validRequest, name: '' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.name);
    assert.ok(result.errors.name!.includes('required'));
  }
});

test('validateContactForm rejects name too long', () => {
  const longName = 'a'.repeat(101);
  const result = validateContactForm({ ...validRequest, name: longName });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.name);
    assert.ok(result.errors.name!.includes('100'));
  }
});

test('validateContactForm rejects name with invalid characters', () => {
  const invalidNames = ['John123', 'John@Doe', 'John_Doe', 'John!Doe'];
  for (const name of invalidNames) {
    const result = validateContactForm({ ...validRequest, name });
    assert.equal(result.ok, false, `Expected failure for name: ${name}`);
    if (!result.ok) {
      assert.ok(result.errors.name);
    }
  }
});

test('validateContactForm accepts name with Unicode characters', () => {
  const unicodeNames = ['José García', 'Naomi 中村', 'Jean-Luc O\'Connor', ' María-José '];
  for (const name of unicodeNames) {
    const result = validateContactForm({ ...validRequest, name });
    assert.equal(result.ok, true, `Expected success for name: ${name}`);
  }
});

test('validateContactForm accepts name with hyphens and apostrophes', () => {
  const names = ["O'Connor", 'Jean-Luc', 'Mary-Jane', "D'Angelo"];
  for (const name of names) {
    const result = validateContactForm({ ...validRequest, name });
    assert.equal(result.ok, true, `Expected success for name: ${name}`);
  }
});

test('validateContactForm rejects empty email', () => {
  const result = validateContactForm({ ...validRequest, email: '' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.email);
    assert.ok(result.errors.email!.includes('required'));
  }
});

test('validateContactForm rejects invalid email format', () => {
  const invalidEmails = ['not-an-email', 'missing@domain', '@nodomain.com', 'spaces in@email.com', 'double@@domain.com'];
  for (const email of invalidEmails) {
    const result = validateContactForm({ ...validRequest, email });
    assert.equal(result.ok, false, `Expected failure for email: ${email}`);
    if (!result.ok) {
      assert.ok(result.errors.email);
    }
  }
});

test('validateContactForm accepts valid email formats', () => {
  const validEmails = [
    'user@example.com',
    'user.name@domain.org',
    'user+tag@domain.co.uk',
    'user_name@sub.domain.com',
    'user-name@domain.io',
    'a@b.co',
  ];
  for (const email of validEmails) {
    const result = validateContactForm({ ...validRequest, email });
    assert.equal(result.ok, true, `Expected success for email: ${email}`);
  }
});

test('validateContactForm rejects email too long', () => {
  const longEmail = 'a'.repeat(250) + '@example.com';
  const result = validateContactForm({ ...validRequest, email: longEmail });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.email);
    assert.ok(result.errors.email!.includes('254'));
  }
});

test('validateContactForm accepts empty company (optional)', () => {
  const result = validateContactForm({ ...validRequest, company: '' });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.company, '');
  }
});

test('validateContactForm accepts company within limit', () => {
  const result = validateContactForm({ ...validRequest, company: 'A'.repeat(100) });
  assert.equal(result.ok, true);
});

test('validateContactForm rejects company too long', () => {
  const result = validateContactForm({ ...validRequest, company: 'A'.repeat(101) });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.company);
    assert.ok(result.errors.company!.includes('100'));
  }
});

test('validateContactForm rejects empty message', () => {
  const result = validateContactForm({ ...validRequest, message: '' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.message);
    // Empty string fails min length check (10 chars), not a separate 'required' check
    assert.ok(result.errors.message!.includes('10') || result.errors.message!.includes('required'));
  }
});

test('validateContactForm rejects message too short', () => {
  const shortMessage = 'a'.repeat(9);
  const result = validateContactForm({ ...validRequest, message: shortMessage });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.message);
    assert.ok(result.errors.message!.includes('10'));
  }
});

test('validateContactForm accepts message at minimum length', () => {
  const minMessage = 'a'.repeat(10);
  const result = validateContactForm({ ...validRequest, message: minMessage });
  assert.equal(result.ok, true);
});

test('validateContactForm rejects message too long', () => {
  const longMessage = 'a'.repeat(5001);
  const result = validateContactForm({ ...validRequest, message: longMessage });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.message);
    assert.ok(result.errors.message!.includes('5000'));
  }
});

test('validateContactForm accepts message at maximum length', () => {
  const maxMessage = 'a'.repeat(5000);
  const result = validateContactForm({ ...validRequest, message: maxMessage });
  assert.equal(result.ok, true);
});

test('validateContactForm returns field errors for multiple invalid fields', () => {
  const result = validateContactForm({
    name: '',
    email: 'invalid',
    company: 'A'.repeat(101),
    message: 'short',
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.name);
    assert.ok(result.errors.email);
    assert.ok(result.errors.company);
    assert.ok(result.errors.message);
  }
});

test('validateField validates individual fields', () => {
  assert.equal(validateField('name', 'John Doe'), undefined);
  assert.ok(validateField('name', ''));
  assert.ok(validateField('name', 'a'.repeat(101)));

  assert.equal(validateField('email', 'test@example.com'), undefined);
  assert.ok(validateField('email', 'invalid'));
  assert.ok(validateField('email', ''));

  assert.equal(validateField('company', ''), undefined);
  assert.equal(validateField('company', 'Acme Corp'), undefined);
  assert.ok(validateField('company', 'A'.repeat(101)));

  assert.equal(validateField('message', 'Valid message here'), undefined);
  assert.ok(validateField('message', ''));
  assert.ok(validateField('message', 'short'));
  assert.ok(validateField('message', 'a'.repeat(5001)));
});

test('validateField returns error for unknown field', () => {
  const result = validateField('unknown' as 'name' | 'email' | 'company' | 'message', 'value');
  assert.equal(result, 'Unknown field.');
});

test('createSuccessResponse creates correct response', () => {
  const response = createSuccessResponse('Custom message');
  assert.equal(response.ok, true);
  assert.equal(response.message, 'Custom message');
});

test('createErrorResponse creates correct response', () => {
  const errors = { name: 'Name is required.', email: 'Invalid email.' };
  const response = createErrorResponse(errors);
  assert.equal(response.ok, false);
  assert.deepEqual(response.errors, errors);
});

test('isSuccessResponse identifies success responses', () => {
  assert.equal(isSuccessResponse({ ok: true, message: 'OK' }), true);
  assert.equal(isSuccessResponse({ ok: false, errors: {} }), false);
});

test('isErrorResponse identifies error responses', () => {
  assert.equal(isErrorResponse({ ok: false, errors: {} }), true);
  assert.equal(isErrorResponse({ ok: true, message: 'OK' }), false);
});

test('schema rejects extra fields in strict mode', () => {
  const strictSchema = contactFormRequestSchema.strict();
  const result = strictSchema.safeParse({
    ...validRequest,
    extraField: 'not allowed',
  });
  assert.equal(result.success, false);
});

test('validation is pure (no side effects)', () => {
  // Multiple validations should not affect each other
  const result1 = validateContactForm(validRequest);
  const result2 = validateContactForm(validRequest);
  assert.equal(result1.ok, true);
  assert.equal(result2.ok, true);
  assert.deepEqual(result1.data, result2.data);
});

test('validateContactForm handles missing fields gracefully', () => {
  const incomplete = { name: 'John', email: 'john@example.com', company: '', message: '' };
  const result = validateContactForm(incomplete);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.company || result.errors.message);
  }
});

test('company field is optional and defaults to empty string in validated data', () => {
  const requestWithoutCompany = { ...validRequest };
  delete (requestWithoutCompany as Record<string, unknown>).company;
  const result = validateContactForm(requestWithoutCompany);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.company, '');
  }
});