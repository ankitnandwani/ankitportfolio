import { detectPii } from '../guardrails/piiDetection.ts';
import { findToneViolations } from '../guardrails/outputValidation.ts';

/**
 * The kinds of finding the response validation reports.
 */
export type ValidationIssueKind =
  | 'empty'
  | 'pii'
  | 'length'
  | 'tone'
  | 'grounding';

/**
 * How bad a finding is.
 *
 * An error means the answer is not shown and the safe fallback is used
 * instead. A warning is reported but the answer is still shown, because an
 * answer that is a little too informal is still a correct answer.
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * One finding of the response validation.
 */
export interface ValidationIssue {
  /**
   * The kind of finding.
   */
  kind: ValidationIssueKind;

  /**
   * How bad it is.
   */
  severity: ValidationSeverity;

  /**
   * What was found, without the text itself.
   */
  message: string;

  /**
   * How many times it was found.
   */
  count: number;
}

/**
 * The result of checking an answer.
 */
export interface ValidationResult {
  /**
   * Whether the answer may be shown as it is.
   */
  isValid: boolean;

  /**
   * The answer that is safe to show. It is cut off at the length limit.
   */
  text: string;

  /**
   * The findings that keep the answer from being shown.
   */
  errors: ValidationIssue[];

  /**
   * The findings that are only reported.
   */
  warnings: ValidationIssue[];

  /**
   * The answer to show instead when the answer cannot be shown.
   */
  fallback: string;
}

/**
 * The options of the response validation.
 */
export interface ValidationOptions {
  /**
   * The largest number of characters an answer may have.
   */
  maxLength?: number;

  /**
   * The number of characters above which an answer is called long.
   */
  verboseLength?: number;

  /**
   * The context the answer was built from. It is used for the grounding
   * check. The check is skipped when there is no context.
   */
  context?: string;

  /**
   * The answer to show instead of an answer that cannot be shown.
   */
  fallback?: string;
}

/**
 * The largest number of characters an answer may have by default.
 *
 * The model is asked for at most 1024 tokens, which is roughly four
 * thousand characters, so a legitimate answer never reaches this limit.
 */
export const DEFAULT_MAX_RESPONSE_LENGTH = 4000;

/**
 * The number of characters above which an answer is called long.
 *
 * PRD §42 asks for concise answers, so a long answer is reported even when
 * it is still shown.
 */
export const DEFAULT_VERBOSE_LENGTH = 2000;

/**
 * The answer that is shown when an answer cannot be shown.
 */
export const DEFAULT_FALLBACK =
  "I want to ensure I provide accurate information. You can ask about Ankit's professional experience in a different way, and I can walk you through his engineering work, projects or career background.";

/**
 * The answer that is shown for each kind of failure.
 */
const FALLBACKS: Record<ValidationIssueKind, string> = {
  empty:
    "I don't have enough information in Ankit's professional profile to answer that accurately. I can tell you about his experience with automation, backend quality, cloud, CI/CD or his engineering projects.",
  pii: "Contact details and private information aren't something I can share. If you're evaluating him for a role, I can tell you about his engineering experience, automation work, projects or career background.",
  length:
    "That answer was longer than it should be. Ask about one area at a time and I'll give you a focused answer.",
  tone: DEFAULT_FALLBACK,
  grounding: DEFAULT_FALLBACK,
};

/**
 * Matches a number with at least two digits.
 */
const NUMBER_PATTERN = /\b\d{2,}\b/g;

/**
 * Matches a word that is written in capitals, such as an acronym.
 */
const ACRONYM_PATTERN = /\b[A-Z]{3,}\b/g;

/**
 * Matches an exclamation mark.
 */
const EXCLAMATION_PATTERN = /!/g;

/**
 * How many exclamation marks are too many.
 */
const MAX_EXCLAMATIONS = 2;

/**
 * Finds the numbers and the acronyms of an answer.
 *
 * These are the parts of an answer that have to come from the context, so
 * they are the parts that can be checked against it.
 */
function findClaims(text: string): string[] {
  const claims = new Set<string>();

  for (const match of text.match(NUMBER_PATTERN) ?? []) {
    claims.add(match);
  }

  for (const match of text.match(ACRONYM_PATTERN) ?? []) {
    claims.add(match);
  }

  return [...claims];
}

/**
 * Checks an answer before it is shown.
 *
 * This is the last layer before the answer leaves the server. The guardrails
 * of M13.07 already remove the personal data and the credentials, so this
 * layer is what catches anything that got past them.
 *
 * @param response The answer of the model.
 * @param options The limits, the context and the fallback.
 * @returns What was found and the answer that is safe to show.
 */
export function validateResponse(
  response: string,
  options: ValidationOptions = {}
): ValidationResult {
  const maxLength = options.maxLength ?? DEFAULT_MAX_RESPONSE_LENGTH;
  const verboseLength = options.verboseLength ?? DEFAULT_VERBOSE_LENGTH;
  const genericFallback = options.fallback;

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const text = (response ?? '').trim();

  if (text.length === 0) {
    errors.push({
      kind: 'empty',
      severity: 'error',
      message: 'the answer is empty',
      count: 1,
    });
  }

  // The personal data has to be gone by now. If it is not, something got
  // past the guardrails and the answer is not shown at all.
  const pii = detectPii(text);
  if (pii.hasPii) {
    errors.push({
      kind: 'pii',
      severity: 'error',
      message: pii.findings
        .map((finding) =>
          finding.type === 'phone' ? 'a phone number' : 'an email address'
        )
        .join(' and '),
      count: pii.findings.reduce((sum, finding) => sum + finding.count, 0),
    });
  }

  let shown = text;

  if (text.length > maxLength) {
    errors.push({
      kind: 'length',
      severity: 'error',
      message: `the answer is longer than ${maxLength} characters`,
      count: text.length,
    });

    shown = `${text.slice(0, maxLength).trimEnd()}…`;
  } else if (text.length > verboseLength) {
    warnings.push({
      kind: 'length',
      severity: 'warning',
      message: `the answer is longer than ${verboseLength} characters`,
      count: text.length,
    });
  }

  const tone = findToneViolations(text);
  if (tone.length > 0) {
    warnings.push({
      kind: 'tone',
      severity: 'warning',
      message: tone
        .map((violation) => violation.detail)
        .join(', '),
      count: tone.length,
    });
  }

  const exclamations = (text.match(EXCLAMATION_PATTERN) ?? []).length;
  if (exclamations > MAX_EXCLAMATIONS) {
    warnings.push({
      kind: 'tone',
      severity: 'warning',
      message: 'too many exclamation marks',
      count: exclamations,
    });
  }

  if (options.context) {
    const claims = findClaims(text);
    const context = options.context.toLowerCase();
    const ungrounded = claims.filter(
      (claim) => !context.includes(claim.toLowerCase())
    );

    if (claims.length >= 3 && ungrounded.length > 0) {
      warnings.push({
        kind: 'grounding',
        severity: 'warning',
        message: 'the answer mentions details that are not in the context',
        count: ungrounded.length,
      });
    }
  }

  // A fallback that was given wins over the ones for each kind, because
  // the caller provided it on purpose.
  const fallbackKind = errors[0]?.kind;
  const fallback = genericFallback
    ? genericFallback
    : fallbackKind
      ? FALLBACKS[fallbackKind] ?? DEFAULT_FALLBACK
      : DEFAULT_FALLBACK;

  return {
    isValid: errors.length === 0,
    text: shown,
    errors,
    warnings,
    fallback,
  };
}
