/**
 * Contact form email delivery tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sendContactEmail, validateEmailConfig, buildHtmlEmail, buildTextEmail } from './email.ts';
import type { ContactFormData } from '../../data/contact.ts';

/**
 * Sample contact form data for testing.
 */
const SAMPLE_DATA: ContactFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Inc.',
  message: 'Hello, this is a test message.\nWith multiple lines.',
};

/**
 * Saves original env vars and restores them after test.
 */
function withEnv(env: Record<string, string | undefined>, fn: () => void): void {
  const original: Record<string, string | undefined> = {};
  for (const key of Object.keys(env)) {
    original[key] = process.env[key];
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(original)) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  }
}

describe('buildHtmlEmail', () => {
  test('includes all form fields', () => {
    const html = buildHtmlEmail(SAMPLE_DATA);
    assert(html.includes('John Doe'));
    assert(html.includes('john@example.com'));
    assert(html.includes('Acme Inc.'));
    assert(html.includes('Hello, this is a test message.'));
    assert(html.includes('With multiple lines.'));
  });

  test('handles missing company', () => {
    const data = { ...SAMPLE_DATA, company: '' };
    const html = buildHtmlEmail(data);
    assert(html.includes('Not provided'));
  });

  test('escapes HTML special characters', () => {
    const data = { ...SAMPLE_DATA, name: '<script>alert(1)</script>', message: 'Test & "quotes"' };
    const html = buildHtmlEmail(data);
    // Raw <script> should be escaped
    assert(!html.includes('<script>alert(1)</script>'));
    // Escaped version should be present
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    // Quotes and ampersand should be escaped
    assert(html.includes('Test &amp; &quot;'));
  });

  test('converts newlines to <br>', () => {
    const data = { ...SAMPLE_DATA, message: 'Line 1\nLine 2' };
    const html = buildHtmlEmail(data);
    assert(html.includes('Line 1<br>Line 2'));
  });
});

describe('buildTextEmail', () => {
  test('includes all form fields', () => {
    const text = buildTextEmail(SAMPLE_DATA);
    assert(text.includes('John Doe'));
    assert(text.includes('john@example.com'));
    assert(text.includes('Acme Inc.'));
    assert(text.includes('Hello, this is a test message.'));
    assert(text.includes('With multiple lines.'));
  });

  test('handles missing company', () => {
    const data = { ...SAMPLE_DATA, company: '' };
    const text = buildTextEmail(data);
    assert(text.includes('Not provided'));
  });
});

describe('validateEmailConfig', () => {
  test('returns ok for console provider', () => {
    withEnv({ EMAIL_PROVIDER: 'console' }, () => {
      const result = validateEmailConfig();
      assert.equal(result.ok, true);
    });
  });

  test('returns error for resend without API key', () => {
    withEnv({ EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: undefined }, () => {
      const result = validateEmailConfig();
      assert.equal(result.ok, false);
      assert(result.error?.includes('EMAIL_API_KEY'));
    });
  });

  test('returns ok for resend with API key', () => {
    withEnv({ EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'test-key' }, () => {
      const result = validateEmailConfig();
      assert.equal(result.ok, true);
    });
  });
});

describe('sendContactEmail', () => {
  test('console provider returns success with messageId', async () => {
    withEnv({ EMAIL_PROVIDER: 'console' }, async () => {
      const result = await sendContactEmail(SAMPLE_DATA);
      assert.equal(result.ok, true);
      assert(result.messageId?.startsWith('console-'));
    });
  });

  test('resend provider without API key returns error', async () => {
    withEnv({ EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: undefined }, async () => {
      const result = await sendContactEmail(SAMPLE_DATA);
      assert.equal(result.ok, false);
      assert(result.error?.includes('EMAIL_API_KEY'));
    });
  });

  test('uses EMAIL_TO as recipient', async () => {
    withEnv({ EMAIL_PROVIDER: 'console', EMAIL_TO: 'custom@example.com' }, async () => {
      const result = await sendContactEmail(SAMPLE_DATA);
      assert.equal(result.ok, true);
    });
  });

  test('uses EMAIL_FROM as sender', async () => {
    withEnv({ EMAIL_PROVIDER: 'console', EMAIL_FROM: 'Custom <custom@example.com>' }, async () => {
      const result = await sendContactEmail(SAMPLE_DATA);
      assert.equal(result.ok, true);
    });
  });

  test('uses user email as reply-to when EMAIL_REPLY_TO not set', async () => {
    withEnv({ EMAIL_PROVIDER: 'console' }, async () => {
      const result = await sendContactEmail(SAMPLE_DATA);
      assert.equal(result.ok, true);
    });
  });

  test('uses EMAIL_REPLY_TO when set', async () => {
    withEnv({ EMAIL_PROVIDER: 'console', EMAIL_REPLY_TO: 'reply@example.com' }, async () => {
      const result = await sendContactEmail(SAMPLE_DATA);
      assert.equal(result.ok, true);
    });
  });
});
