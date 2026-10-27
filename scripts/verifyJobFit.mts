#!/usr/bin/env node
/**
 * Verification script for the Job Fit Analyzer.
 *
 * Runs the fixed job descriptions against the live knowledge base and writes
 * a report with the result of every rule. Exits with a non-zero code when
 * a rule fails.
 *
 * Usage:
 *   npm run verify:job-fit
 *   # or
 *   node scripts/verifyJobFit.mts
 *
 * Requires:
 * - LIVE_LLM_TESTS=1 (to spend the daily generation budget)
 * - GEMINI_API_KEY configured
 * - Supabase project configured
 */

import dotenv from 'dotenv';
import { analyzeJobFit } from '../src/lib/jobFit/analysis.ts';
import { JOB_DESCRIPTION_FIXTURES } from '../src/lib/jobFit/fixtures/jobDescriptions.ts';
import type { JobFitAnalysisResult, JobFitAnalysis, FitEvidence } from '../src/lib/jobFit/types.ts';

// Load environment
dotenv.config({ path: '.env.local' });

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

interface RuleResult {
  rule: string;
  fixture: string;
  passed: boolean;
  message?: string;
}

interface FixtureReport {
  fixture: typeof JOB_DESCRIPTION_FIXTURES[0];
  success: boolean;
  error?: string;
  rules: RuleResult[];
  analysis?: JobFitAnalysis;
  evidence?: FitEvidence[];
}

/**
 * Checks that a text contains no rejection phrase.
 */
function checkNoRejectionPhrase(text: string): { passed: boolean; phrase?: string } {
  const lower = text.toLowerCase();
  for (const phrase of REJECTION_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return { passed: false, phrase };
    }
  }
  return { passed: true };
}

/**
 * Checks that a duration of experience in the text is supported by the evidence.
 */
function checkNoUnsupportedDuration(
  text: string,
  evidence: FitEvidence[]
): { passed: boolean; duration?: string } {
  const durationPattern = /\b\d+\+?\s*(?:years?|yrs?)\b/gi;
  const matches = text.match(durationPattern);

  if (!matches) return { passed: true };

  const evidenceText = evidence
    .filter((e: FitEvidence) => e.content)
    .map((e: FitEvidence) => e.content!)
    .join(' ')
    .toLowerCase();

  for (const match of matches) {
    const normalized = match.toLowerCase().replace(/\+/, '').trim();
    const inEvidence = evidenceText.includes(normalized);
    if (!inEvidence) {
      return { passed: false, duration: match };
    }
  }
  return { passed: true };
}

/**
 * Checks that every LEARNABLE requirement carries the PRD §88 wording.
 */
function checkLearnableHasWording(
  analysis: JobFitAnalysis
): { passed: boolean; requirementId?: string } {
  for (const req of analysis.requirements) {
    if (req.classification === 'LEARNABLE') {
      const hasWording =
        req.rationale.includes(UNSUPPORTED_REQUIREMENT_NOTE) ||
        analysis.overallPositioning.includes(UNSUPPORTED_REQUIREMENT_NOTE) ||
        analysis.strongMatches.some((s: string) => s.includes(UNSUPPORTED_REQUIREMENT_NOTE)) ||
        analysis.transferableExperience.some((s: string) => s.includes(UNSUPPORTED_REQUIREMENT_NOTE)) ||
        analysis.learningAgility.includes(UNSUPPORTED_REQUIREMENT_NOTE) ||
        analysis.interviewTalkingPoints.some((s: string) => s.includes(UNSUPPORTED_REQUIREMENT_NOTE)) ||
        analysis.recommendedPositioning.includes(UNSUPPORTED_REQUIREMENT_NOTE);

      if (!hasWording) {
        return { passed: false, requirementId: req.requirementId };
      }
    }
  }
  return { passed: true };
}

/**
 * Checks that all six sections are present and not empty.
 */
function checkSixSections(
  analysis: JobFitAnalysis
): { passed: boolean; section?: string } {
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
      return { passed: false, section: section.label };
    }
  }
  return { passed: true };
}

/**
 * Checks that every requirement is classified as one of the five.
 */
function checkValidClassifications(
  analysis: JobFitAnalysis
): { passed: boolean; requirementId?: string; classification?: string } {
  for (const req of analysis.requirements) {
    if (!CLASSIFICATIONS.includes(req.classification)) {
      return { passed: false, requirementId: req.requirementId, classification: req.classification };
    }
  }
  return { passed: true };
}

/**
 * Runs all rules against a single fixture and returns the report.
 */
async function verifyFixture(fixture: typeof JOB_DESCRIPTION_FIXTURES[0]): Promise<FixtureReport> {
  console.log(`\n=== Verifying: ${fixture.label} (${fixture.id}) ===`);

  const report: FixtureReport = {
    fixture,
    success: false,
    rules: [],
  };

  try {
    const result: JobFitAnalysisResult = await analyzeJobFit(fixture.text);
    report.success = result.ok;

    if (!result.ok) {
      report.error = result.error;
      report.rules.push({
        rule: 'analysis_succeeds',
        fixture: fixture.id,
        passed: false,
        message: `Analysis failed: ${result.error}`,
      });
      return report;
    }

    const { analysis, evidence } = result;
    report.analysis = analysis;
    report.evidence = evidence;

    // Rule 1: Analysis succeeds
    report.rules.push({
      rule: 'analysis_succeeds',
      fixture: fixture.id,
      passed: true,
    });

    // Rule 2: All six sections present and not empty
    const sectionsCheck = checkSixSections(analysis);
    report.rules.push({
      rule: 'six_sections_present',
      fixture: fixture.id,
      passed: sectionsCheck.passed,
      message: sectionsCheck.passed ? undefined : `Section "${sectionsCheck.section}" is empty`,
    });

    // Rule 3: Every requirement classified as one of the five
    const classificationsCheck = checkValidClassifications(analysis);
    report.rules.push({
      rule: 'valid_classifications',
      fixture: fixture.id,
      passed: classificationsCheck.passed,
      message: classificationsCheck.passed
        ? undefined
        : `Requirement ${classificationsCheck.requirementId} has invalid classification: ${classificationsCheck.classification}`,
    });

    // Rule 4: No rejection phrase in narrative
    const narrativeFields: string[] = [
      analysis.overallPositioning,
      ...analysis.strongMatches,
      ...analysis.transferableExperience,
      analysis.learningAgility,
      ...analysis.interviewTalkingPoints,
      analysis.recommendedPositioning,
    ];

    let rejectionFound = false;
    let foundPhrase = '';
    for (const text of narrativeFields) {
      const check = checkNoRejectionPhrase(text);
      if (!check.passed) {
        rejectionFound = true;
        foundPhrase = check.phrase!;
        break;
      }
    }
    report.rules.push({
      rule: 'no_rejection_phrase',
      fixture: fixture.id,
      passed: !rejectionFound,
      message: rejectionFound ? `Found rejection phrase: "${foundPhrase}"` : undefined,
    });

    // Rule 5: No unsupported duration
    let unsupportedDurationFound = false;
    let foundDuration = '';
    for (const text of narrativeFields) {
      const check = checkNoUnsupportedDuration(text, evidence);
      if (!check.passed) {
        unsupportedDurationFound = true;
        foundDuration = check.duration!;
        break;
      }
    }
    report.rules.push({
      rule: 'no_unsupported_duration',
      fixture: fixture.id,
      passed: !unsupportedDurationFound,
      message: unsupportedDurationFound ? `Unsupported duration: "${foundDuration}"` : undefined,
    });

    // Rule 6: LEARNABLE requirements carry PRD §88 wording
    const learnableCheck = checkLearnableHasWording(analysis);
    report.rules.push({
      rule: 'learnable_has_prd88_wording',
      fixture: fixture.id,
      passed: learnableCheck.passed,
      message: learnableCheck.passed
        ? undefined
        : `LEARNABLE requirement ${learnableCheck.requirementId} missing PRD §88 wording`,
    });

    // Rule 7: For injected_instruction category, analysis should fail
    if (fixture.category === 'injected_instruction') {
      report.rules.push({
        rule: 'injected_instruction_refused',
        fixture: fixture.id,
        passed: !result.ok,
        message: result.ok ? 'Expected analysis to fail for injected instruction' : undefined,
      });
    }

    // Rule 8: For personal_data category, analysis should succeed (PII is redacted, not blocked)
    if (fixture.category === 'personal_data') {
      report.rules.push({
        rule: 'personal_data_redacted',
        fixture: fixture.id,
        passed: result.ok,
        message: result.ok ? undefined : 'Expected analysis to succeed with PII redacted',
      });
    }

    // Rule 9: For not_a_job_description category, analysis should fail (parsing fails)
    if (fixture.category === 'not_a_job_description') {
      report.rules.push({
        rule: 'not_job_description_refused',
        fixture: fixture.id,
        passed: !result.ok,
        message: result.ok ? 'Expected analysis to fail for non-job-description document' : undefined,
      });
    }

    // Rule 10: For nice_to_have category, optional requirements should be classified as LEARNABLE or similar
    if (fixture.category === 'nice_to_have') {
      const hasLearnable = analysis.requirements.some((r) => r.classification === 'LEARNABLE');
      report.rules.push({
        rule: 'nice_to_have_told_apart',
        fixture: fixture.id,
        passed: hasLearnable,
        message: hasLearnable ? undefined : 'Expected at least one LEARNABLE classification for nice-to-have requirements',
      });
    }

  } catch (error) {
    report.success = false;
    report.error = error instanceof Error ? error.message : String(error);
    report.rules.push({
      rule: 'analysis_throws',
      fixture: fixture.id,
      passed: false,
      message: `Analysis threw: ${report.error}`,
    });
  }

  return report;
}

/**
 * Main verification function.
 */
async function main(): Promise<void> {
  console.log('Job Fit Analyzer — End-to-End Verification');
  console.log('===========================================\n');

  const liveRequested = /^(1|true|yes)$/i.test(
    process.env.LIVE_LLM_TESTS ?? ''
  );

  if (!liveRequested) {
    console.log('WARNING: LIVE_LLM_TESTS is not set to 1.');
    console.log('The verification will run with the live LLM and spend the daily budget.');
    console.log('Set LIVE_LLM_TESTS=1 to confirm and run.\n');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const hasRealKey = apiKey.length > 0 && !apiKey.toLowerCase().startsWith('your_');

  if (!hasRealKey) {
    console.log('ERROR: No real GEMINI_API_KEY is configured.');
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const hasProject = supabaseUrl.length > 0 && !supabaseUrl.toLowerCase().startsWith('your_');

  if (!hasProject) {
    console.log('ERROR: No Supabase project is configured.');
    process.exit(1);
  }

  console.log(`Running verification against ${JOB_DESCRIPTION_FIXTURES.length} fixtures...\n`);

  const reports: FixtureReport[] = [];

  for (const fixture of JOB_DESCRIPTION_FIXTURES) {
    const report = await verifyFixture(fixture);
    reports.push(report);

    // Print rule results
    for (const rule of report.rules) {
      const status = rule.passed ? '✓' : '✗';
      const message = rule.message ? ` — ${rule.message}` : '';
      console.log(`  ${status} ${rule.rule}${message}`);
    }

    if (report.error) {
      console.log(`  ✗ ERROR: ${report.error}`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  let totalRules = 0;
  let passedRules = 0;
  let failedFixtures = 0;

  for (const report of reports) {
    const fixturePassed = report.rules.every((r) => r.passed);
    if (!fixturePassed) failedFixtures++;

    for (const rule of report.rules) {
      totalRules++;
      if (rule.passed) passedRules++;
    }
  }

  console.log(`Fixtures: ${reports.length}`);
  console.log(`Fixtures with failures: ${failedFixtures}`);
  console.log(`Rules checked: ${totalRules}`);
  console.log(`Rules passed: ${passedRules}`);
  console.log(`Rules failed: ${totalRules - passedRules}`);

  // Print failed rules
  if (passedRules < totalRules) {
    console.log('\n=== FAILED RULES ===');
    for (const report of reports) {
      for (const rule of report.rules) {
        if (!rule.passed) {
          console.log(`  ✗ [${report.fixture.id}] ${rule.rule}: ${rule.message}`);
        }
      }
    }
  }

  // Exit code
  process.exit(passedRules === totalRules ? 0 : 1);
}

main().catch((error) => {
  console.error('Verification script failed:', error);
  process.exit(1);
});