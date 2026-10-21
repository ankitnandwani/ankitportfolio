/**
 * PII (Personally Identifiable Information) detection and redaction utilities.
 * 
 * Specifically handles phone number redaction as required by PRD §37.
 */

/**
 * Redacts phone numbers from text.
 * 
 * Matches various international phone number formats and replaces them with [REDACTED].
 * 
 * @param text Input text that may contain phone numbers
 * @returns Text with phone numbers redacted
 */
export function redactPhoneNumbers(text: string): string {
  if (!text) return text;
  
  // Regex to match phone numbers in various formats:
  // US formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  // International: +1 123 456 7890, +44 20 7946 0958, etc.
  // Also matches numbers with extensions: 123-456-7890 x123

  // More precise regex for common phone patterns
  const precisePhoneRegex = /(?:\+?(\d{1,3})[-.\s]?)?\(?(\d{1,4})[-.\s]?\)?[\d\s.-]{6,}(\d{1,4})/g;
  
  // Replace all matches with [REDACTED]
  return text.replace(precisePhoneRegex, '[REDACTED]');
}

/**
 * Detects if text contains phone numbers.
 * 
 * @param text Input text to check
 * @returns True if phone numbers are detected
 */
export function containsPhoneNumbers(text: string): boolean {
  if (!text) return false;
  
  const phoneRegex = /(?:\+?(\d{1,3})[-.\s]?)?\(?(\d{1,4})[-.\s]?\)?[\d\s.-]{6,}(\d{1,4})/g;
  return phoneRegex.test(text);
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
