/**
 * Tests for the claim validation module.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateClaims } from './claimValidation.ts';
import type { JobFitAnalysis, FitEvidence, ClassifiedRequirement, JobRequirement, KnowledgeClassification } from './types.ts';
import { UNSUPPORTED_REQUIREMENT_NOTE } from './limits.ts';

// Test evidence
const TEST_EVIDENCE: FitEvidence[] = [
  {
    sourceId: 'doc1',
    sourceType: 'experience',
    sourceTitle: 'Automation Engineer at TechCorp',
    classification: 'PROFESSIONAL' as KnowledgeClassification,
    lastUpdated: '2024-01-01T00:00:00Z',
    confidence: 0.8,
    content: 'Ankit has 5 years of Java experience and built automation frameworks using Spring Boot.',
  },
  {
    sourceId: 'doc2',
    sourceType: 'projects',
    sourceTitle: 'CI/CD Pipeline Project',
    classification: 'PUBLIC' as KnowledgeClassification,
    lastUpdated: '2024-01-01T00:00:00Z',
    confidence: 0.75,
    content: 'Ankit designed CI/CD pipelines with 3 years of Kubernetes experience.',
  },
];

const TEST_REQUIREMENTS: JobRequirement[] = [
  { id: 'r1', text: 'Java programming experience', kind: 'requirement', required: true },
  { id: 'r2', text: 'Kubernetes orchestration', kind: 'requirement', required: true },
  { id: 'r3', text: 'Python scripting', kind: 'requirement', required: false },
];

const BASE_ANALYSIS: JobFitAnalysis = {
  overallPositioning: 'Ankit has 5 years of Java experience and strong automation skills.',
  strongMatches: ['Ankit has 5 years of Java experience.', 'Ankit has 3 years of Kubernetes experience.'],
  transferableExperience: ['Transferable: 5 years of Java applies to backend roles.'],
  learningAgility: 'Ankit has 2 years of learning new frameworks quickly.',
  interviewTalkingPoints: ['Talk about 5 years Java experience.', 'Discuss 3 years Kubernetes.'],
  recommendedPositioning: 'Position as senior engineer with 5 years Java and 3 years Kubernetes.',
  requirements: [
    { requirementId: 'r1', classification: 'DIRECT_MATCH', rationale: 'Direct Java experience', evidenceIds: ['doc1'] },
    { requirementId: 'r2', classification: 'DIRECT_MATCH', rationale: 'Direct Kubernetes experience', evidenceIds: ['doc2'] },
    { requirementId: 'r3', classification: 'LEARNABLE' as const, rationale: 'Learning area', evidenceIds: [] },
  ],
  alignmentBands: [
    { key: 'strong', label: 'Strong Alignment', filledSegments: 2 },
    { key: 'transferable', label: 'Transferable', filledSegments: 1 },
    { key: 'growth', label: 'Growth Areas', filledSegments: 1 },
  ],
  evidence: TEST_EVIDENCE,
};

// ============================================================
// Tests for validateClaims - requirements
// ============================================================

test('validateClaims keeps supported requirement', () => {
  const analysis = { ...BASE_ANALYSIS };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  const req1 = corrected.requirements.find((r) => r.requirementId === 'r1');
  assert(req1);
  assert.equal(req1.classification, 'DIRECT_MATCH');
  assert(report.downgradedRequirements.length === 0);
});

test('validateClaims downgrades requirement with invented evidence ID', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    requirements: [
      { requirementId: 'r1', classification: 'DIRECT_MATCH' as const, rationale: 'Direct', evidenceIds: ['nonexistent'] },
    ],
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  const req1 = corrected.requirements[0];
  assert.equal(req1.classification, 'LEARNABLE');
  assert.equal(req1.rationale, UNSUPPORTED_REQUIREMENT_NOTE);
  assert.equal(req1.evidenceIds.length, 0);
  assert(report.downgradedRequirements.includes('r1'));
});

test('validateClaims downgrades requirement without evidence support', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    requirements: [
      { requirementId: 'r3', classification: 'DIRECT_MATCH' as const, rationale: 'Direct', evidenceIds: ['doc1'] },
    ],
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  const req3 = corrected.requirements[0];
  assert.equal(req3.classification, 'LEARNABLE');
  assert.equal(req3.rationale, UNSUPPORTED_REQUIREMENT_NOTE);
  assert.equal(req3.evidenceIds.length, 0);
  assert(report.downgradedRequirements.includes('r3'));
});

test('validateClaims keeps requirement with no evidence IDs', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    requirements: [
      { requirementId: 'r3', classification: 'LEARNABLE' as const, rationale: 'Learning area', evidenceIds: [] },
    ],
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  const req3 = corrected.requirements[0];
  assert.equal(req3.classification, 'LEARNABLE');
  assert(report.downgradedRequirements.length === 0);
});

// ============================================================
// Tests for validateClaims - durations
// ============================================================

test('validateClaims keeps supported durations in all fields', () => {
  // Create an analysis with ONLY durations that are in the evidence
  const analysis: JobFitAnalysis = {
    overallPositioning: 'Ankit has 5 years of Java experience and 3 years of Kubernetes.',
    strongMatches: ['Ankit has 5 years of Java experience.', 'Ankit has 3 years of Kubernetes experience.'],
    transferableExperience: ['Transferable: 5 years of Java applies to backend roles.'],
    learningAgility: 'Ankit learns quickly with 5 years of Java foundation.',
    interviewTalkingPoints: ['Talk about 5 years Java experience.', 'Discuss 3 years Kubernetes.'],
    recommendedPositioning: 'Position as senior engineer with 5 years Java and 3 years Kubernetes.',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 2 },
      { key: 'transferable', label: 'Transferable', filledSegments: 1 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 1 },
    ],
    evidence: TEST_EVIDENCE,
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(corrected.overallPositioning.includes('5 years'));
  assert(corrected.overallPositioning.includes('3 years'));
  assert(report.removedDurations.length === 0);
});

test('validateClaims removes unsupported duration from overallPositioning', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    overallPositioning: 'Ankit has 10 years of Java experience.',
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(!corrected.overallPositioning.includes('10 years'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims removes unsupported duration from strongMatches', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    strongMatches: ['Ankit has 10 years of Java experience.'],
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(!corrected.strongMatches[0].includes('10 years'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims removes unsupported duration from transferableExperience', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    transferableExperience: ['Transferable: 10 years Java applies to backend.'],
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(!corrected.transferableExperience[0].includes('10 years'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims removes unsupported duration from learningAgility', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    learningAgility: 'Ankit has 10 years of learning agility.',
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(!corrected.learningAgility.includes('10 years'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims removes unsupported duration from interviewTalkingPoints', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    interviewTalkingPoints: ['Talk about 10 years Java.'],
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(!corrected.interviewTalkingPoints[0].includes('10 years'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims removes unsupported duration from recommendedPositioning', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    recommendedPositioning: 'Position with 10 years Java.',
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(!corrected.recommendedPositioning.includes('10 years'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims removes unsupported duration and keeps remaining sentence', () => {
  const analysis: JobFitAnalysis = {
    overallPositioning: 'Ankit has 10 years of Java.',
    strongMatches: [],
    transferableExperience: [],
    learningAgility: '',
    interviewTalkingPoints: [],
    recommendedPositioning: '',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
      { key: 'transferable', label: 'Transferable', filledSegments: 0 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
    ],
    evidence: TEST_EVIDENCE,
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  // Duration removed, but sentence structure remains (implementation removes phrase only)
  assert(!corrected.overallPositioning.includes('10 years'));
  assert(corrected.overallPositioning.includes('Java'));
  assert(report.removedDurations.includes('10 years'));
});

test('validateClaims keeps non-experience durations', () => {
  const analysis: JobFitAnalysis = {
    overallPositioning: 'The company was founded 20 years ago. Ankit has 5 years Java.',
    strongMatches: [],
    transferableExperience: [],
    learningAgility: '',
    interviewTalkingPoints: [],
    recommendedPositioning: '',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
      { key: 'transferable', label: 'Transferable', filledSegments: 0 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
    ],
    evidence: TEST_EVIDENCE,
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(corrected.overallPositioning.includes('20 years'));
  assert(report.removedDurations.length === 0);
});

test('validateClaims keeps requirement count numbers', () => {
  const analysis: JobFitAnalysis = {
    overallPositioning: 'Found 5 requirements matching Ankit profile.',
    strongMatches: [],
    transferableExperience: [],
    learningAgility: '',
    interviewTalkingPoints: [],
    recommendedPositioning: '',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
      { key: 'transferable', label: 'Transferable', filledSegments: 0 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
    ],
    evidence: TEST_EVIDENCE,
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(corrected.overallPositioning.includes('5 requirements'));
  assert(report.removedDurations.length === 0);
});

test('validateClaims keeps education years', () => {
  const analysis: JobFitAnalysis = {
    overallPositioning: 'BS Computer Science 2015. Ankit has 5 years Java.',
    strongMatches: [],
    transferableExperience: [],
    learningAgility: '',
    interviewTalkingPoints: [],
    recommendedPositioning: '',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
      { key: 'transferable', label: 'Transferable', filledSegments: 0 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
    ],
    evidence: TEST_EVIDENCE,
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(corrected.overallPositioning.includes('2015'));
  assert(report.removedDurations.length === 0);
});

test('validateClaims keeps years in job titles', () => {
  const analysis: JobFitAnalysis = {
    overallPositioning: 'Senior Engineer 2019-2023. Ankit has 5 years Java.',
    strongMatches: [],
    transferableExperience: [],
    learningAgility: '',
    interviewTalkingPoints: [],
    recommendedPositioning: '',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
      { key: 'transferable', label: 'Transferable', filledSegments: 0 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
    ],
    evidence: TEST_EVIDENCE,
  };
  const { analysis: corrected, report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(corrected.overallPositioning.includes('2019-2023'));
  assert(report.removedDurations.length === 0);
});

// ============================================================
// Tests for report
// ============================================================

test('validateClaims reports downgraded requirements', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    requirements: [
      { requirementId: 'r1', classification: 'DIRECT_MATCH' as const, rationale: 'Direct', evidenceIds: ['doc1'] },
      { requirementId: 'r2', classification: 'DIRECT_MATCH' as const, rationale: 'Direct', evidenceIds: ['nonexistent'] },
    ],
  };
  const { report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(report.downgradedRequirements.includes('r2'));
  assert(!report.downgradedRequirements.includes('r1'));
});

test('validateClaims reports removed durations', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    overallPositioning: 'Ankit has 10 years Java and 2 years Python.',
    strongMatches: ['Ankit has 3 years Kubernetes.'],
  };
  const { report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  assert(report.removedDurations.includes('10 years'));
  assert(report.removedDurations.includes('2 years'));
  // 3 years Kubernetes is in evidence (doc2), so should not be removed
  assert(!report.removedDurations.includes('3 years'));
});

test('validateClaims report holds no analysis text', () => {
  const analysis = {
    ...BASE_ANALYSIS,
    overallPositioning: 'Ankit has 10 years Java experience.',
  };
  const { report } = validateClaims(analysis, TEST_EVIDENCE, TEST_REQUIREMENTS);

  // Report should not contain the full analysis text
  assert(!JSON.stringify(report).includes('Ankit has 10 years Java experience'));
});

// ============================================================
// Performance test
// ============================================================

test('validateClaims is fast on large analysis', () => {
  // Build analysis with 40 requirements
  const largeRequirements: ClassifiedRequirement[] = Array.from({ length: 40 }, (_, i) => ({
    requirementId: `r${i + 1}`,
    classification: 'DIRECT_MATCH',
    rationale: 'Direct experience',
    evidenceIds: ['doc1'],
  }));

  const largeAnalysis: JobFitAnalysis = {
    ...BASE_ANALYSIS,
    requirements: largeRequirements,
    overallPositioning: 'Ankit has 5 years Java. '.repeat(10),
    strongMatches: ['Ankit has 5 years Java. '.repeat(5)],
    transferableExperience: ['Ankit has 5 years Java. '.repeat(5)],
    learningAgility: 'Ankit has 5 years Java. '.repeat(5),
    interviewTalkingPoints: ['Ankit has 5 years Java. '.repeat(5)],
    recommendedPositioning: 'Ankit has 5 years Java. '.repeat(5),
  };

  const start = Date.now();
  validateClaims(largeAnalysis, TEST_EVIDENCE, TEST_REQUIREMENTS);
  const elapsed = Date.now() - start;

  assert(elapsed < 1000, `Validation took ${elapsed}ms, should be under 1s`);
});