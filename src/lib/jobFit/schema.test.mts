/**
 * Unit tests for the job fit schema and limits.
 *
 * These tests use Node's built-in test runner and assert module. They
 * cover the zod schema, the parser, the limits and the fixed wording.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  modelAnswerSchema,
  parseModelAnswer,
  buildClassifiedRequirements,
  buildAlignmentBands,
} from './schema.ts';
import {
  MAX_JOB_DESCRIPTION_LENGTH,
  MIN_JOB_DESCRIPTION_LENGTH,
  MAX_ANALYSED_REQUIREMENTS,
  MAX_JOB_FIT_RESPONSE_TOKENS,
  UNSUPPORTED_REQUIREMENT_NOTE,
} from './limits.ts';

/**
 * A minimal valid model answer for testing.
 */
const validModelAnswer: {
  overallPositioning: string;
  strongMatches: string[];
  transferableExperience: string[];
  learningAgility: string;
  interviewTalkingPoints: string[];
  recommendedPositioning: string;
  requirements: Array<{
    id: string;
    classification: 'DIRECT_MATCH' | 'STRONG_TRANSFER' | 'RELATED' | 'LEARNABLE' | 'UNKNOWN';
    rationale: string;
    evidenceIds: string[];
  }>;
  alignmentBands: Array<{
    key: 'strong' | 'transferable' | 'growth';
    label: string;
    filledSegments: number;
  }>;
} = {
  overallPositioning: 'Strong overall fit.',
  strongMatches: ['Match 1', 'Match 2'],
  transferableExperience: ['Transfer 1'],
  learningAgility: 'High learning agility.',
  interviewTalkingPoints: ['Point 1'],
  recommendedPositioning: 'Position as senior engineer.',
  requirements: [
    {
      id: 'r1',
      classification: 'DIRECT_MATCH',
      rationale: 'Direct experience with this.',
      evidenceIds: ['e1'],
    },
    {
      id: 'r2',
      classification: 'STRONG_TRANSFER',
      rationale: 'Strong transferable skills.',
      evidenceIds: ['e2'],
    },
  ],
  alignmentBands: [
    { key: 'strong', label: 'Strong Alignment', filledSegments: 2 },
    { key: 'transferable', label: 'Transferable', filledSegments: 1 },
    { key: 'growth', label: 'Growth Areas', filledSegments: 1 },
  ],
};

const requirementIds = ['r1', 'r2'];

test('schema accepts a complete valid answer', () => {
  const result = modelAnswerSchema.safeParse(validModelAnswer);
  assert.equal(result.success, true);
});

test('schema rejects a missing section', () => {
  const rest = { ...validModelAnswer };
  delete (rest as Record<string, unknown>).overallPositioning;
  const result = modelAnswerSchema.safeParse(rest);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.path.includes('overallPositioning')));
  }
});

test('schema rejects a section of the wrong kind', () => {
  const bad = { ...validModelAnswer, strongMatches: 'not an array' };
  const result = modelAnswerSchema.safeParse(bad);
  assert.equal(result.success, false);
});

test('schema rejects an unknown classification', () => {
  const bad = {
    ...validModelAnswer,
    requirements: [{ ...validModelAnswer.requirements[0], classification: 'INVALID' }],
  };
  const result = modelAnswerSchema.safeParse(bad);
  assert.equal(result.success, false);
});

test('schema rejects an empty requirement list', () => {
  const bad = { ...validModelAnswer, requirements: [] };
  const result = modelAnswerSchema.safeParse(bad);
  assert.equal(result.success, false);
});



test('parser returns failure for text that is not JSON', () => {
  const result = parseModelAnswer('not json at all', requirementIds);
  assert.equal(result.ok, false);
  assert.ok(result.error.includes('valid JSON'));
});

test('parser reads an answer wrapped in a code fence', () => {
  const fenced = '```json\n' + JSON.stringify(validModelAnswer) + '\n```';
  const result = parseModelAnswer(fenced, requirementIds);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.overallPositioning, validModelAnswer.overallPositioning);
  }
});

test('parser reads an answer wrapped in a plain code fence', () => {
  const fenced = '```\n' + JSON.stringify(validModelAnswer) + '\n```';
  const result = parseModelAnswer(fenced, requirementIds);
  assert.equal(result.ok, true);
});

test('parser never throws for malformed input', () => {
  // These should all return { ok: false } instead of throwing
  const inputs = [
    'not json',
    '{}',
    '{"overallPositioning": "x"}',
    '{"requirements": [{"id": "r1", "classification": "BAD", "rationale": "x", "evidenceIds": []}]}',
    '',
  ];
  for (const input of inputs) {
    const result = parseModelAnswer(input, requirementIds);
    assert.equal(typeof result, 'object');
    assert.ok('ok' in result);
  }
});

test('parser rejects an answer with an unknown requirement id', () => {
  const bad = {
    ...validModelAnswer,
    requirements: [{ ...validModelAnswer.requirements[0], id: 'r99' }],
  };
  const result = parseModelAnswer(JSON.stringify(bad), requirementIds);
  assert.equal(result.ok, false);
  assert.ok(result.error.includes('unknown requirement id'));
});

test('parser rejects alignment bands with wrong keys', () => {
  const bad = {
    ...validModelAnswer,
    alignmentBands: [
      { key: 'wrong', label: 'X', filledSegments: 1 },
      { key: 'transferable', label: 'Y', filledSegments: 1 },
      { key: 'growth', label: 'Z', filledSegments: 1 },
    ],
  };
  const result = parseModelAnswer(JSON.stringify(bad), requirementIds);
  assert.equal(result.ok, false);
  // The schema rejects invalid enum values before the custom check runs
  assert.ok(
    result.error.includes('unexpected key') ||
    result.error.includes('Invalid option') ||
    result.error.includes('expected one of')
  );
});

test('limits have the documented values', () => {
  assert.equal(MAX_JOB_DESCRIPTION_LENGTH, 12000);
  assert.equal(MIN_JOB_DESCRIPTION_LENGTH, 80);
  assert.equal(MAX_ANALYSED_REQUIREMENTS, 40);
  assert.equal(MAX_JOB_FIT_RESPONSE_TOKENS, 2048);
});

test('UNSUPPORTED_REQUIREMENT_NOTE matches PRD §88 wording', () => {
  assert.equal(
    UNSUPPORTED_REQUIREMENT_NOTE,
    "This isn't currently listed as a core area of Ankit's experience, " +
      'but it is adjacent to his existing background and can be positioned as a learning area.'
  );
});

test('buildClassifiedRequirements maps correctly', () => {
  const classified = buildClassifiedRequirements(validModelAnswer);
  assert.equal(classified.length, 2);
  assert.equal(classified[0].requirementId, 'r1');
  assert.equal(classified[0].classification, 'DIRECT_MATCH');
  assert.equal(classified[0].rationale, 'Direct experience with this.');
  assert.deepEqual(classified[0].evidenceIds, ['e1']);
});

test('buildAlignmentBands maps correctly', () => {
  const bands = buildAlignmentBands(validModelAnswer);
  assert.equal(bands.length, 3);
  assert.equal(bands[0].key, 'strong');
  assert.equal(bands[0].label, 'Strong Alignment');
  assert.equal(bands[0].filledSegments, 2);
  assert.equal(bands[1].key, 'transferable');
  assert.equal(bands[2].key, 'growth');
});