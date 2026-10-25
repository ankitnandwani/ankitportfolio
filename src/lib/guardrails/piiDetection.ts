import { redactPhoneNumbers } from '../knowledge/pii.ts';
import type { PiiDetectionResult, PiiFinding, PiiType } from './types.ts';

/**
 * The token that replaces a piece of personal data.
 *
 * It is the same token the ingestion pipeline uses (PRD §37), so a phone
 * number looks the same wherever it is removed.
 */
export const REDACTION_TOKEN = '[REDACTED]';

/**
 * Matches an email address.
 *
 * The repetitions are bounded. An unbounded one would make the pattern go
 * back over the whole text for every position it starts at, which turns a
 * long question into a slow one.
 */
const EMAIL_PATTERN =
  /[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,63}/gi;

/**
 * Counts how many times a token appears in a text.
 */
function countToken(text: string, token: string): number {
  if (!text) return 0;

  let count = 0;
  let index = text.indexOf(token);

  while (index !== -1) {
    count += 1;
    index = text.indexOf(token, index + token.length);
  }

  return count;
}

/**
 * Counts how many email addresses a text holds.
 */
function countEmails(text: string): number {
  const matches = text.match(EMAIL_PATTERN);
  return matches ? matches.length : 0;
}

/**
 * Looks for personal data in a text and removes it.
 *
 * The phone numbers are handled by the redaction of the knowledge base, so
 * both places use the same rule and the same token. The email addresses are
 * added here, because PRD §36 lists private emails among the things that
 * must never be disclosed.
 *
 * The email addresses are removed first, because a phone number pattern
 * would otherwise match the digits inside an address.
 *
 * @param text The text to check.
 * @returns The text without the personal data, and what was found.
 */
export function detectPii(text: string): PiiDetectionResult {
  if (!text) {
    return { text: text ?? '', findings: [], hasPii: false };
  }

  const emailCount = countEmails(text);
  const withoutEmails = text.replace(EMAIL_PATTERN, REDACTION_TOKEN);

  const withoutPii = redactPhoneNumbers(withoutEmails);
  const phoneCount =
    countToken(withoutPii, REDACTION_TOKEN) - countToken(withoutEmails, REDACTION_TOKEN);

  const findings: PiiFinding[] = [];

  if (phoneCount > 0) findings.push({ type: 'phone', count: phoneCount });
  if (emailCount > 0) findings.push({ type: 'email', count: emailCount });

  return {
    text: withoutPii,
    findings,
    hasPii: findings.length > 0,
  };
}

/**
 * Removes the personal data from a text.
 *
 * @param text The text to clean.
 * @returns The text without the personal data.
 */
export function redactPii(text: string): string {
  return detectPii(text).text;
}

/**
 * Reports whether a text holds personal data.
 *
 * @param text The text to check.
 */
export function containsPii(text: string): boolean {
  return detectPii(text).hasPii;
}

/**
 * Reports the kinds of personal data a text holds.
 *
 * @param text The text to check.
 * @returns The kinds that were found.
 */
export function piiTypes(text: string): PiiType[] {
  return detectPii(text).findings.map((finding) => finding.type);
}
