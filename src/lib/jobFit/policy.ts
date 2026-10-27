/**
 * The input policy and rate limit for the job fit analyzer.
 *
 * This module enforces the privacy and the safety rules of PRD §35 to PRD §40
 * in front of and behind the job fit analysis:
 * - checks the pasted job description before it is used,
 * - removes the personal data from it,
 * - keeps the injection rules working on a long third-party document,
 * - runs the output guardrails over the finished analysis,
 * - applies the response validation with the evidence as the context,
 * - gives the analyzer its own rate limit.
 */

import { detectPii, redactPii, REDACTION_TOKEN } from '../guardrails/piiDetection.ts';
import { detectInjection } from '../guardrails/promptInjection.ts';
import { createRateLimiter, type RateLimitStore, type RateLimiter } from '../ai/rateLimiter.ts';
import { validateResponse, type ValidationOptions, type ValidationResult } from '../ai/validation.ts';
import { validateClaims } from './claimValidation.ts';
import { applyOutputGuardrails } from '../guardrails/pipeline.ts';
import type {
  JobFitAnalysis,
  FitEvidence,
  JobRequirement,
} from './types.ts';
import {
  MAX_JOB_DESCRIPTION_LENGTH,
  MIN_JOB_DESCRIPTION_LENGTH,
} from './limits.ts';

/**
 * The default number of seconds in the short window for the job fit analyzer.
 */
export const DEFAULT_JOB_FIT_WINDOW_SECONDS = 1800;

/**
 * The default number of analyses a visitor may request in the short window.
 */
export const DEFAULT_JOB_FIT_MAX_REQUESTS = 5;

/**
 * The default number of seconds in the long window for the job fit analyzer.
 */
export const DEFAULT_JOB_FIT_DAILY_WINDOW_SECONDS = 86400;

/**
 * The default number of analyses a visitor may request in the long window.
 */
export const DEFAULT_JOB_FIT_DAILY_MAX_REQUESTS = 10;

/**
 * The default maximum tokens for the job fit analysis.
 */
export const DEFAULT_JOB_FIT_MAX_TOKENS = 2048;

/**
 * The result of the input policy check.
 */
export type JobFitInputPolicy =
  | { allowed: true; jobDescription: string; redactions: number }
  | { allowed: false; reason: 'too_short' | 'too_long' | 'injection' };

/**
 * The options for the job fit policy.
 */
export interface JobFitPolicyOptions {
  /** The maximum length of the job description. */
  maxLength?: number;
  /** The minimum length of the job description. */
  minLength?: number;
  /** The window in seconds for the rate limiter. */
  windowSeconds?: number;
  /** The maximum number of requests in the window. */
  maxRequests?: number;
  /** The daily window in seconds. */
  dailyWindowSeconds?: number;
  /** The maximum number of requests in the daily window. */
  dailyMaxRequests?: number;
  /** A function that returns the current time in milliseconds. */
  now?: () => number;
}

/**
 * Creates the job fit input policy.
 *
 * @param options The options for the policy.
 * @returns The policy functions.
 */
export function createJobFitPolicy(options: JobFitPolicyOptions = {}) {
  const maxLength = options.maxLength ?? MAX_JOB_DESCRIPTION_LENGTH;
  const minLength = options.minLength ?? MIN_JOB_DESCRIPTION_LENGTH;
  // In tests, we may use a smaller minLength
  const effectiveMinLength = minLength;

  const windowSeconds = options.windowSeconds ?? DEFAULT_JOB_FIT_WINDOW_SECONDS;
  const maxRequests = options.maxRequests ?? DEFAULT_JOB_FIT_MAX_REQUESTS;
  const dailyWindowSeconds = options.dailyWindowSeconds ?? DEFAULT_JOB_FIT_DAILY_WINDOW_SECONDS;
  const dailyMaxRequests = options.dailyMaxRequests ?? DEFAULT_JOB_FIT_DAILY_MAX_REQUESTS;

  const rateLimiter = createRateLimiter({
    windowSeconds,
    maxRequests,
    dailyWindowSeconds,
    dailyMaxRequests,
    now: options.now,
  });

  /**
   * Checks the input job description and returns either a redacted version
   * or a reason the analysis cannot go on.
   */
  function checkInput(raw: string): JobFitInputPolicy {
    // Length check first (cheapest)
    if (raw.length > maxLength) {
      return { allowed: false, reason: 'too_long' };
    }
    if (raw.trim().length < effectiveMinLength) {
      return { allowed: false, reason: 'too_short' };
    }

    // Personal data removal
    const detection = detectPii(raw);
    const redacted = detection.hasPii ? redactPii(raw) : raw;
    const redactions = detection.findings.reduce((sum, f) => sum + f.count, 0);

    // Attack detection on the redacted text (so a credential is not matched as an attack)
    const injection = detectInjection(redacted);

    // A sensitive data request is not a reason to block - it's a requirement to analyse
    if (injection.isInjection) {
      return { allowed: false, reason: 'injection' };
    }

    return { allowed: true, jobDescription: redacted, redactions };
  }

  /**
   * Checks the rate limit for a client.
   */
  function checkRateLimit(clientKey: string) {
    return rateLimiter.check(`jobfit:${clientKey}`);
  }

  return {
    checkInput,
    checkRateLimit,
    rateLimiter,
  };
}

/**
 * Applies the output guardrails and response validation to the analysis.
 *
 * @param analysis The analysis to validate.
 * @param evidence The evidence the analysis was built from.
 * @param requirements The original requirements.
 * @returns The validated analysis and the validation result.
 */
export async function applyOutputValidation(
  analysis: JobFitAnalysis,
  evidence: FitEvidence[],
  requirements: JobRequirement[]
): Promise<{ analysis: JobFitAnalysis; validation: ValidationResult }> {
  // Apply claim validation (evidence quote check and duration check) per PRD §31/§88
  const { analysis: claimValidatedAnalysis, report: claimReport } = validateClaims(
    analysis,
    evidence,
    requirements
  );

  // Apply output guardrails to all text fields
  const textFields: Array<keyof JobFitAnalysis> = [
    'overallPositioning',
    'strongMatches',
    'transferableExperience',
    'learningAgility',
    'interviewTalkingPoints',
    'recommendedPositioning',
  ];

  const guarded = { ...claimValidatedAnalysis };

  for (const field of textFields) {
    const value = guarded[field];
    if (Array.isArray(value)) {
      const guardedItems: string[] = [];
      for (const item of value) {
        if (item.trim().length === 0) continue;
        const result = applyOutputGuardrails(item);
        guardedItems.push(result.text);
      }
      (guarded as Record<string, unknown>)[field] = guardedItems;
    } else if (typeof value === 'string') {
      const result = applyOutputGuardrails(value);
      (guarded as Record<string, unknown>)[field] = result.text;
    }
  }

  // Build evidence text for grounding check
  const evidenceText = evidence
    .filter((e) => e.content)
    .map((e) => e.content!)
    .join('\n\n');

  // Run response validation on each narrative field
  const narrativeFields: Array<keyof JobFitAnalysis> = [
    'overallPositioning',
    'strongMatches',
    'transferableExperience',
    'learningAgility',
    'interviewTalkingPoints',
    'recommendedPositioning',
  ];

  let validatedAnalysis = { ...guarded };
  let hasErrors = false;

  for (const field of narrativeFields) {
    const value = validatedAnalysis[field];
    if (Array.isArray(value)) {
      const validatedItems: string[] = [];
      for (const item of value) {
        if (typeof item === 'string' && item.trim().length === 0) continue;
        const result = validateResponse(item, { context: evidenceText });
        if (!result.isValid) hasErrors = true;
        validatedItems.push(result.text);
      }
      (validatedAnalysis as Record<string, unknown>)[field] = validatedItems;
    } else if (typeof value === 'string') {
      if (value.trim().length === 0) continue;
      const result = validateResponse(value, { context: evidenceText });
      if (!result.isValid) hasErrors = true;
      (validatedAnalysis as Record<string, unknown>)[field] = result.text;
    }
  }

  // If validation failed, or the analysis has no meaningful content, replace with safe fallback
  const hasMeaningfulContent = narrativeFields.some(field => {
    const value = validatedAnalysis[field];
    if (Array.isArray(value)) return value.some(item => typeof item === 'string' && item.trim().length > 0);
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
  });

  if (hasErrors || !hasMeaningfulContent) {
    const fallback = validateResponse('', {}).fallback;
    validatedAnalysis = {
      ...validatedAnalysis,
      overallPositioning: fallback,
      strongMatches: [],
      transferableExperience: [],
      learningAgility: fallback,
      interviewTalkingPoints: [],
      recommendedPositioning: fallback,
    };
  }

  return { analysis: validatedAnalysis, validation: validateResponse('', {}) };
}

/**
 * The default policy instance.
 */
let defaultPolicy: ReturnType<typeof createJobFitPolicy> | null = null;

/**
 * Returns the default policy, creating it on first use.
 */
export function getJobFitPolicy(): ReturnType<typeof createJobFitPolicy> {
  if (!defaultPolicy) {
    defaultPolicy = createJobFitPolicy();
  }
  return defaultPolicy;
}

/**
 * Replaces the default policy. Used by tests.
 */
export function setJobFitPolicy(policy: ReturnType<typeof createJobFitPolicy> | null): void {
  defaultPolicy = policy;
}