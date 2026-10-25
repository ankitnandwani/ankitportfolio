/**
 * PII (Personally Identifiable Information) detection and redaction utilities.
 *
 * Specifically handles phone number redaction as required by PRD §37.
 */

/**
 * Matches a phone number in the formats listed below:
 *   US formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
 *   International: +1 123 456 7890, +44 20 7946 0958, etc.
 *
 * The pattern requires a run of at least seven digit-ish characters, so short
 * numbers such as years of experience or repository counts are left alone.
 *
 * The repetitions are bounded. An unbounded one would make the pattern go
 * back over the whole text for every position it starts at, which turns a
 * long run of digits into a slow check.
 */
const PHONE_NUMBER_PATTERN =
  /(?:\+?(\d{1,3})[-.\s]?)?\(?(\d{1,4})[-.\s]?\)?[\d\s.-]{6,64}(\d{1,4})/g;

/**
 * Date-like sequences that must never be treated as phone numbers.
 *
 * Career, education and certification data use ISO dates such as 2021-01-01.
 * Without this guard the phone pattern matches them, and the knowledge base
 * loses every date it contains.
 */
const DATE_PATTERN = /(\b\d{4}-\d{2}(?:-\d{2})?\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b)/g;

/**
 * Applies a transform to every part of the text that is not a date.
 *
 * Splitting on a pattern with a single capture group keeps the matched dates
 * at the odd indexes of the resulting array.
 */
function mapOutsideDates(
  text: string,
  transform: (segment: string) => string
): string {
  return text
    .split(DATE_PATTERN)
    .map((segment, index) => (index % 2 === 1 ? segment : transform(segment)))
    .join('');
}

/**
 * Reports whether any part of the text that is not a date satisfies a test.
 */
function someOutsideDates(
  text: string,
  predicate: (segment: string) => boolean
): boolean {
  return text
    .split(DATE_PATTERN)
    .some((segment, index) => index % 2 === 0 && predicate(segment));
}

/**
 * Redacts phone numbers from text.
 *
 * Matches various international phone number formats and replaces them with
 * [REDACTED]. Date-like sequences are preserved.
 *
 * @param text Input text that may contain phone numbers
 * @returns Text with phone numbers redacted
 */
export function redactPhoneNumbers(text: string): string {
  if (!text) return text;

  return mapOutsideDates(text, (segment) =>
    segment.replace(PHONE_NUMBER_PATTERN, '[REDACTED]')
  );
}

/**
 * Detects if text contains phone numbers.
 *
 * Date-like sequences do not count as phone numbers.
 *
 * @param text Input text to check
 * @returns True if phone numbers are detected
 */
export function containsPhoneNumbers(text: string): boolean {
  if (!text) return false;

  return someOutsideDates(
    text,
    (segment) => segment.match(PHONE_NUMBER_PATTERN) !== null
  );
}

/**
 * Redacts multiple types of PII.
 * Currently focuses on phone numbers, but can be extended.
 *
 * @param text Input text
 * @returns Text with PII redacted
 */
export function redactPII(text: string): string {
  const redacted = redactPhoneNumbers(text);
  // Future: add email redaction, SSN, etc.
  return redacted;
}
