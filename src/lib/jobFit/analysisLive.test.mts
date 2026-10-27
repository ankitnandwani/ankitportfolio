/**
 * Live end-to-end test of the Job Fit Analyzer against the real knowledge base.
 *
 * This test is opt-in. The free tier of the Gemini API allows twenty generation
 * requests a day, and a request over that limit is rejected for the rest of
 * the day. Running it on every `npm test` would spend that budget within a
 * few runs, so it only runs when LIVE_LLM_TESTS is set to 1.
 *
 * The test analyses one fixture job description and asserts the contract:
 * - the six sections are present and not empty
 * - every requirement is classified as one of the five classifications
 * - no rejection phrase appears in the narrative
 * - no unsupported duration appears
 * - every LEARNABLE requirement carries the PRD §88 wording
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

import { analyzeJobFit } from './analysis.ts';
import { JOB_DESCRIPTION_FIXTURES } from './fixtures/jobDescriptions.ts';
import type { JobFitAnalysisResult, JobFitAnalysis, FitEvidence } from './types.ts';

// The test runner does not load the environment, so it is read from the same
// file the scripts use.
dotenv.config({ path: '.env.local' });

/**
 * These tests call the real Gemini API and the real knowledge base.
 *
 * They are skipped unless:
 * - LIVE_LLM_TESTS is set to 1
 * - A real GEMINI_API_KEY is configured
 * - A Supabase project is configured
 */
const liveRequested = /^(1|true|yes)$/i.test(
  process.env.LIVE_LLM_TESTS ?? ''
);
const apiKey = process.env.GEMINI_API_KEY ?? '';
const hasRealKey = apiKey.length > 0 && !apiKey.toLowerCase().startsWith('your_');

const skipReason = !liveRequested
  ? 'set LIVE_LLM_TESTS=1 to run the tests against the real Gemini API'
  : !hasRealKey
    ? 'no real GEMINI_API_KEY is configured'
    : false;

/**
 * The five classifications of PRD §88.
 */
const CLASSIFICATIONS = [
  'DIRECT_MATCH',
  'STRONG_TRANSFER',
  'RELATED',
  'LEARNABLE',
  'UNKNOWN',
] as const;

/**
 * Phrases that constitute a rejection (PRD §88 forbids them).
 */
const REJECTION_PHRASES = [
  'not a fit',
  'not a match',
  'does not meet',
  'lacks the required',
  'cannot meet',
  'unable to meet',
  'does not qualify',
  'is not qualified',
  'falls short',
  'not suitable',
  'not a strong match',
  'would not be a match',
  'would not be a fit',
  'poor fit',
  'weak fit',
  'inadequate',
  'insufficient experience',
  'missing required',
  'no experience with',
  'never worked with',
  'has no experience',
] as const;

/**
 * The fixed wording for an unsupported requirement (PRD §88).
 */
const UNSUPPORTED_REQUIREMENT_NOTE =
  "This isn't currently listed as a core area of Ankit's experience, " +
  'but it is adjacent to his existing background and can be positioned as a learning area.';

/**
 * Checks that a text contains no rejection phrase.
 */
function assertNoRejectionPhrase(text: string, context: string): void {
  const lower = text.toLowerCase();
  for (const phrase of REJECTION_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      throw new Error(
        `Rejection phrase "${phrase}" found in ${context}: ${text.slice(0, 200)}`
      );
    }
  }
}

/**
 * Checks that a duration of experience (e.g., "5 years", "3+ years") in the text
 * is supported by the evidence. This is a heuristic that looks for number+years patterns.
 */
function assertNoUnsupportedDuration(
  text: string,
  evidence: FitEvidence[],
  context: string
): void {
  const durationPattern = /\b\d+\+?\s*(?:years?|yrs?)\b/gi;
  const matches = text.match(durationPattern);

  if (!matches) return;

  // Collect all experience-like text from evidence
  const evidenceText = evidence
    .filter((e: FitEvidence) => e.content)
    .map((e: FitEvidence) => e.content!)
    .join(' ')
    .toLowerCase();

  for (const match of matches) {
    const normalized = match.toLowerCase().replace(/\+/, '').trim();
    // Check if this specific duration appears in evidence
    const inEvidence = evidenceText.includes(normalized);
    if (!inEvidence) {
      throw new Error(
        `Unsupported duration "${match}" found in ${context}: ${text.slice(0, 200)}`
      );
    }
  }
}

/**
 * Checks that every LEARNABLE requirement carries the PRD §88 wording.
 */
function assertLearnableHasWording(analysis: JobFitAnalysis): void {
  for (const req of analysis.requirements) {
    if (req.classification === 'LEARNABLE') {
      // Check that at least one of the rationale or the sections contains the wording
      const hasWording =
        req.rationale.includes(UNSUPPORTED_REQUIREMENT_NOTE) ||
        analysis.overallPositioning.includes(UNSUPPORTED_REQUIREMENT_NOTE) ||
        analysis.strongMatches.some((s: string) => s.includes(UNSUPPORTED_REQUIREMENT_NOTE)) ||
        analysis.transferableExperience.some((s: string) => s.includes(UNSUPPORTED_REQUIREMENT_NOTE)) ||
        analysis.learningAgility.includes(UNSUPPORTED_REQUIREMENT_NOTE) ||
        analysis.interviewTalkingPoints.some((s: string) => s.includes(UNSUPPORTED_REQUIREMENT_NOTE)) ||
        analysis.recommendedPositioning.includes(UNSUPPORTED_REQUIREMENT_NOTE);

      if (!hasWording) {
        throw new Error(
          `LEARNABLE requirement ${req.requirementId} does not carry the PRD §88 wording. Rationale: ${req.rationale}`
        );
      }
    }
  }
}

/**
 * Checks that the analysis has all six sections and they are not empty.
 */
function assertSixSections(analysis: JobFitAnalysis): void {
  const sections = [
    { key: 'overallPositioning', label: 'overallPositioning', value: analysis.overallPositioning },
    { key: 'strongMatches', label: 'strongMatches', value: analysis.strongMatches.join('\n') },
    { key: 'transferableExperience', label: 'transferableExperience', value: analysis.transferableExperience.join('\n') },
    { key: 'learningAgility', label: 'learningAgility', value: analysis.learningAgility },
    { key: 'interviewTalkingPoints', label: 'interviewTalkingPoints', value: analysis.interviewTalkingPoints.join('\n') },
    { key: 'recommendedPositioning', label: 'recommendedPositioning', value: analysis.recommendedPositioning },
  ];

  for (const section of sections) {
    if (!section.value || section.value.trim().length === 0) {
      throw new Error(`Section ${section.label} is empty`);
    }
  }
}

/**
 * Checks that every requirement is classified as one of the five classifications.
 */
function assertValidClassifications(analysis: JobFitAnalysis): void {
  for (const req of analysis.requirements) {
    if (!CLASSIFICATIONS.includes(req.classification)) {
      throw new Error(`Requirement ${req.requirementId} has invalid classification: ${req.classification}`);
    }
  }
}

test(
  'analyses a job description against the live knowledge base and produces a valid fit narrative',
  { skip: skipReason },
  async () => {
    // Use the strong_match fixture
    const fixture = JOB_DESCRIPTION_FIXTURES.find((f) => f.id === 'strong_match');
    assert.ok(fixture, 'strong_match fixture must exist');

    // Run the analysis
    const result: JobFitAnalysisResult = await analyzeJobFit(fixture.text);

    // The analysis must succeed
    assert.ok(result.ok, `Analysis failed: ${result.ok ? '' : result.error}`);

    if (!result.ok) return; // TypeScript narrows the type

    const { analysis, evidence } = result;

    // 1. All six sections present and not empty
    assertSixSections(analysis);

    // 2. Every requirement classified as one of the five
    assertValidClassifications(analysis);

    // 3. No rejection phrase anywhere in the narrative
    const narrativeFields: string[] = [
      analysis.overallPositioning,
      ...analysis.strongMatches,
      ...analysis.transferableExperience,
      analysis.learningAgility,
      ...analysis.interviewTalkingPoints,
      analysis.recommendedPositioning,
    ];

    for (const text of narrativeFields) {
      assertNoRejectionPhrase(text, 'narrative');
    }

    // 4. No unsupported duration in the narrative
    for (const text of narrativeFields) {
      assertNoUnsupportedDuration(text, evidence, 'narrative');
    }

    // 5. Every LEARNABLE requirement carries the PRD §88 wording
    assertLearnableHasWording(analysis);

    // Log summary for manual inspection
    console.log(`[job-fit live] Requirements: ${analysis.requirements.length}`);
    console.log(`[job-fit live] Evidence chunks: ${evidence.length}`);
    console.log(`[job-fit live] Classifications: ${analysis.requirements.map((r) => r.classification).join(', ')}`);
  }
);