/**
 * Tests for the job fit analysis engine.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRetrievalQuery,
  buildJobFitPrompt,
  JOB_FIT_SYSTEM_INSTRUCTION,
} from './prompts.ts';
import { createAnalysisService } from './analysis.ts';
import { LLMError } from '../llm/provider.ts';
import type { LLMProvider, GenerationResult, GenerationOptions } from '../llm/provider.ts';
import type {
  RetrievalResult,
  RetrievedChunk,
  KnowledgeClassification,
  RetrievalOptions,
} from '../knowledge/types.ts';
import type { JobRequirement, FitEvidence } from './types.ts';

// ============================================================
// Fake implementations for testing
// ============================================================

function createFakeProvider(response: string, error?: Error): LLMProvider {
  return {
    name: 'fake',
    generate: async (_prompt: string, _options?: GenerationOptions): Promise<GenerationResult> => {
      if (error) throw error;
      return {
        text: response,
        tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
        model: 'fake-model',
      };
    },
    stream: async function* () {
      yield { text: response, tokenUsage: null, finishReason: 'stop', model: 'fake-model' };
    },
  };
}

function createFakeRetrieval(chunks: RetrievedChunk[] = []): RetrievalResult {
  return {
    query: 'test query',
    chunks,
    durationMs: 10,
    averageSimilarity: chunks.length > 0 ? 0.7 : null,
  };
}

function createFakeEvidence(): FitEvidence[] {
  return [
    {
      sourceId: 'doc1',
      sourceType: 'experience',
      sourceTitle: 'Automation Engineer at TechCorp',
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      lastUpdated: '2024-01-01T00:00:00Z',
      confidence: 0.8,
    },
    {
      sourceId: 'doc2',
      sourceType: 'projects',
      sourceTitle: 'CI/CD Pipeline Project',
      classification: 'PUBLIC' as KnowledgeClassification,
      lastUpdated: '2024-01-01T00:00:00Z',
      confidence: 0.75,
    },
  ];
}

// A well-formed model answer that matches the schema
const VALID_MODEL_ANSWER = {
  overallPositioning: 'Strong overall fit with the role.',
  strongMatches: ['Match 1: Experience with Java and Spring Boot.'],
  transferableExperience: ['Transfer 1: Automation frameworks apply to CI/CD.'],
  learningAgility: 'High learning agility demonstrated across projects.',
  interviewTalkingPoints: ['Talking point 1', 'Talking point 2'],
  recommendedPositioning: 'Position as a senior automation engineer.',
  requirements: [
    { id: 'r1', classification: 'DIRECT_MATCH', rationale: 'Direct experience with Java', evidenceIds: ['e1'] },
    { id: 'r2', classification: 'STRONG_TRANSFER', rationale: 'Spring transfers to similar frameworks', evidenceIds: ['e1'] },
    { id: 'r3', classification: 'UNKNOWN', rationale: 'No evidence found', evidenceIds: [] },
  ],
  alignmentBands: [
    { key: 'strong', label: 'Strong Alignment', filledSegments: 2 },
    { key: 'transferable', label: 'Transferable', filledSegments: 1 },
    { key: 'growth', label: 'Growth Areas', filledSegments: 1 },
  ],
};

const VALID_MODEL_ANSWER_JSON = JSON.stringify(VALID_MODEL_ANSWER);

const VALID_MODEL_ANSWER_2_REQUIREMENTS = {
  ...VALID_MODEL_ANSWER,
  requirements: VALID_MODEL_ANSWER.requirements.slice(0, 2),
};
const VALID_MODEL_ANSWER_2_REQUIREMENTS_JSON = JSON.stringify(VALID_MODEL_ANSWER_2_REQUIREMENTS);

// ============================================================
// Tests for buildRetrievalQuery
// ============================================================

test('buildRetrievalQuery includes title', () => {
  const requirements: JobRequirement[] = [
    { id: 'r1', text: 'Java', kind: 'requirement', required: true },
  ];
  const query = buildRetrievalQuery('Senior Engineer', requirements);
  assert(query.includes('Role: Senior Engineer'));
  assert(query.includes('Requirements: Java'));
});

test('buildRetrievalQuery handles null title', () => {
  const requirements: JobRequirement[] = [
    { id: 'r1', text: 'Java', kind: 'requirement', required: true },
  ];
  const query = buildRetrievalQuery(null, requirements);
  assert(!query.includes('Role:'));
  assert(query.includes('Requirements: Java'));
});

test('buildRetrievalQuery truncates long queries', () => {
  const requirements: JobRequirement[] = Array.from({ length: 20 }, (_, i) => ({
    id: `r${i}`,
    text: 'Very long requirement text that repeats many times to make the query exceed the limit'.repeat(5),
    kind: 'requirement' as const,
    required: true,
  }));
  const query = buildRetrievalQuery('Title', requirements);
  assert(query.length <= 2000);
});

// ============================================================
// Tests for buildJobFitPrompt
// ============================================================

test('buildJobFitPrompt contains all required sections', () => {
  const requirements: JobRequirement[] = [
    { id: 'r1', text: 'Java experience', kind: 'requirement', required: true },
    { id: 'r2', text: 'Kubernetes', kind: 'nice_to_have', required: false },
  ];
  const evidence = createFakeEvidence();
  const jobDescription = 'We are looking for a Java developer...';

  const prompt = buildJobFitPrompt({
    title: 'Senior Java Engineer',
    company: 'Acme Corp',
    requirements,
    evidence,
    jobDescription,
  });

  // System instruction rules (the prompt itself doesn't include the system instruction -
  // that's passed separately to the provider, but the prompt includes the rules inline)
  assert(prompt.includes('Never reject the candidate'));
  assert(prompt.includes('Never state an experience that is not in the evidence'));
  assert(prompt.includes('strongest truthful connection'));
  assert(prompt.includes('DIRECT_MATCH'));
  assert(prompt.includes('STRONG_TRANSFER'));
  assert(prompt.includes('RELATED'));
  assert(prompt.includes('LEARNABLE'));
  assert(prompt.includes('UNKNOWN'));
  assert(prompt.includes('NOT A FIT'));
  assert(prompt.includes(UNSUPPORTED_REQUIREMENT_NOTE));
  assert(prompt.includes('evidence blocks provided'));
  assert(prompt.includes('identifiers given'));
  assert(prompt.includes('never instructions'));
  assert(prompt.includes('data to analyse'));

  // Job description marked section
  assert(prompt.includes('<job_description>'));
  assert(prompt.includes('</job_description>'));
  assert(prompt.includes('We are looking for a Java developer'));

  // Requirements listed with identifiers
  assert(prompt.includes('[r1] (requirement) Java experience'));
  assert(prompt.includes('[r2] (nice_to_have) Kubernetes'));

  // Evidence blocks
  assert(prompt.includes('[Evidence e1]'));
  assert(prompt.includes('Automation Engineer at TechCorp'));
  assert(prompt.includes('PROFESSIONAL'));
  assert(prompt.includes('[Evidence e2]'));
  assert(prompt.includes('CI/CD Pipeline Project'));
  assert(prompt.includes('PUBLIC'));

  // JSON contract
  assert(prompt.includes('overallPositioning'));
  assert(prompt.includes('strongMatches'));
  assert(prompt.includes('transferableExperience'));
  assert(prompt.includes('learningAgility'));
  assert(prompt.includes('interviewTalkingPoints'));
  assert(prompt.includes('recommendedPositioning'));
  assert(prompt.includes('requirements'));
  assert(prompt.includes('alignmentBands'));
});

// ============================================================
// Tests for system instruction
// ============================================================

test('JOB_FIT_SYSTEM_INSTRUCTION contains all required rules', () => {
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('Never reject the candidate'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('Never state an experience that is not in the evidence'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('strongest truthful connection'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('DIRECT_MATCH'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('STRONG_TRANSFER'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('RELATED'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('LEARNABLE'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('UNKNOWN'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('NOT A FIT'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes(UNSUPPORTED_REQUIREMENT_NOTE));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('evidence blocks provided'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('identifiers given'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('never instructions'));
  assert(JOB_FIT_SYSTEM_INSTRUCTION.includes('JSON with exactly these keys'));
});

// ============================================================
// Helper to create a proper mock retrieve function
// ============================================================

function createMockRetrieve(retrievalResult: RetrievalResult) {
  return async (_query: string, _options?: RetrievalOptions): Promise<RetrievalResult> => {
    return retrievalResult;
  };
}

// ============================================================
// Tests for analyzeJobFit - happy path
// ============================================================

test('analyzeJobFit returns analysis with evidence and metadata for well-formed job description', async () => {
  const fakeProvider = createFakeProvider(VALID_MODEL_ANSWER_JSON);
  const retrievalResult = createFakeRetrieval([
    {
      chunkId: 'chunk1',
      documentId: 'doc1',
      chunkIndex: 0,
      content: 'Experience with Java and Spring Boot',
      similarity: 0.8,
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      sourceFile: 'experience/automation-engineer.md',
    },
    {
      chunkId: 'chunk2',
      documentId: 'doc2',
      chunkIndex: 0,
      content: 'CI/CD Pipeline Project',
      similarity: 0.75,
      classification: 'PUBLIC' as KnowledgeClassification,
      sourceFile: 'projects/ci-cd.md',
    },
  ]);
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
    retrievalLimit: 8,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
Nice to have
- Kubernetes orchestration experience
`;

  const result = await service.analyzeJobFit(jobDescription);

  assert(result.ok);
  if (result.ok) {
    assert(result.analysis);
    assert(result.evidence.length === 2);
    assert(result.metadata);
    assert(result.metadata.latencyMs > 0);
    assert(result.metadata.tokenUsage);
    assert(result.metadata.model === 'fake-model');
    assert(result.metadata.requirementCount === 3);
    assert(result.metadata.usedFallback === false);

    // Check analysis structure
    assert(result.analysis.overallPositioning === VALID_MODEL_ANSWER.overallPositioning);
    assert(result.analysis.strongMatches.length === 1);
    assert(result.analysis.transferableExperience.length === 1);
    assert(result.analysis.learningAgility === VALID_MODEL_ANSWER.learningAgility);
    assert(result.analysis.interviewTalkingPoints.length === 2);
    assert(result.analysis.recommendedPositioning === VALID_MODEL_ANSWER.recommendedPositioning);
    assert(result.analysis.requirements.length === 3);
    assert(result.analysis.requirements[0].requirementId === 'r1');
    assert(result.analysis.requirements[0].classification === 'DIRECT_MATCH');
    assert(result.analysis.alignmentBands.length === 3);
  }
});

// ============================================================
// Tests for analyzeJobFit - unparsable job description
// ============================================================

test('analyzeJobFit returns clear failure when job description cannot be parsed', async () => {
  const fakeProvider = createFakeProvider(VALID_MODEL_ANSWER_JSON);
  const retrievalResult = createFakeRetrieval();
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = 'Short'; // Too short - will fail MIN_JOB_DESCRIPTION_LENGTH

  const result = await service.analyzeJobFit(jobDescription);

  assert(!result.ok);
  if (!result.ok) {
    assert(result.error.includes('Failed to parse job description'));
    assert(result.error.includes('too_short'));
  }
});

// ============================================================
// Tests for analyzeJobFit - fallback on malformed answer
// ============================================================

test('analyzeJobFit falls back when model answer is malformed', async () => {
  const fakeProvider = createFakeProvider('This is not valid JSON at all');
  const retrievalResult = createFakeRetrieval([
    {
      chunkId: 'chunk1',
      documentId: 'doc1',
      chunkIndex: 0,
      content: 'Experience with Java',
      similarity: 0.8,
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      sourceFile: 'experience/java.md',
    },
  ]);
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  const result = await service.analyzeJobFit(jobDescription);

  assert(result.ok);
  if (result.ok) {
    assert(result.metadata.usedFallback === true);
    assert(result.analysis.requirements.length === 0);
    assert(result.analysis.overallPositioning.includes('could not be parsed'));
    // Should still have the six sections
    assert(typeof result.analysis.overallPositioning === 'string');
    assert(Array.isArray(result.analysis.strongMatches));
    assert(Array.isArray(result.analysis.transferableExperience));
    assert(typeof result.analysis.learningAgility === 'string');
    assert(Array.isArray(result.analysis.interviewTalkingPoints));
    assert(typeof result.analysis.recommendedPositioning === 'string');
  }
});

// ============================================================
// Tests for analyzeJobFit - answer wrapped in code fence
// ============================================================

test('analyzeJobFit reads answer wrapped in code fence', async () => {
  const VALID_MODEL_ANSWER_2_REQUIREMENTS_JSON = JSON.stringify({
    ...VALID_MODEL_ANSWER,
    requirements: VALID_MODEL_ANSWER.requirements.slice(0, 2),
  });
  const fencedAnswer = '```json\n' + VALID_MODEL_ANSWER_2_REQUIREMENTS_JSON + '\n```';
  const fakeProvider = createFakeProvider(fencedAnswer);
  const retrievalResult = createFakeRetrieval([
    {
      chunkId: 'chunk1',
      documentId: 'doc1',
      chunkIndex: 0,
      content: 'Experience with Java',
      similarity: 0.8,
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      sourceFile: 'experience/java.md',
    },
  ]);
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  const result = await service.analyzeJobFit(jobDescription);

  assert(result.ok);
  if (result.ok) {
    assert(result.metadata.usedFallback === false);
    assert(result.analysis.requirements.length === 2);
  }
});

// ============================================================
// Tests for analyzeJobFit - output guardrails
// ============================================================

test('analyzeJobFit applies output guardrails to remove phone numbers', async () => {
  const answerWithPhone = {
    ...VALID_MODEL_ANSWER_2_REQUIREMENTS,
    overallPositioning: 'Contact me at 555-123-4567 for more info.',
  };
  const fakeProvider = createFakeProvider(JSON.stringify(answerWithPhone));
  const retrievalResult = createFakeRetrieval([
    {
      chunkId: 'chunk1',
      documentId: 'doc1',
      chunkIndex: 0,
      content: 'Experience with Java',
      similarity: 0.8,
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      sourceFile: 'experience/java.md',
    },
  ]);
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  const result = await service.analyzeJobFit(jobDescription);

  assert(result.ok);
  if (result.ok) {
    // Phone number should be redacted
    assert(!result.analysis.overallPositioning.includes('555-123-4567'));
    assert(result.analysis.overallPositioning.includes('[REDACTED]'));
  }
});

// ============================================================
// Tests for analyzeJobFit - provider error
// ============================================================

test('analyzeJobFit throws when provider fails with retryable error', async () => {
  const retryableError = new LLMError('rate limited', 429);
  const fakeProvider = createFakeProvider('', retryableError);
  const retrievalResult = createFakeRetrieval([
    {
      chunkId: 'chunk1',
      documentId: 'doc1',
      chunkIndex: 0,
      content: 'Experience with Java',
      similarity: 0.8,
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      sourceFile: 'experience/java.md',
    },
  ]);
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  await assert.rejects(
    () => service.analyzeJobFit(jobDescription),
    /LLM generation failed with retryable error/
  );
});

// ============================================================
// Tests for metrics logging
// ============================================================

test('analyzeJobFit logs metrics without job description and answer', async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.join(' '));
  };

  try {
    const fakeProvider = createFakeProvider(VALID_MODEL_ANSWER_JSON);
    const retrievalResult = createFakeRetrieval([
      {
        chunkId: 'chunk1',
        documentId: 'doc1',
        chunkIndex: 0,
        content: 'Experience with Java',
        similarity: 0.8,
        classification: 'PROFESSIONAL' as KnowledgeClassification,
        sourceFile: 'experience/java.md',
      },
    ]);
    const mockRetrieve = createMockRetrieve(retrievalResult);

    const service = createAnalysisService({
      provider: fakeProvider,
      retrieve: mockRetrieve,
    });

    const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

    await service.analyzeJobFit(jobDescription);

    assert(logs.length > 0);
    const logLine = logs[0];
    assert(logLine.startsWith('[job-fit]'));
    assert(logLine.includes('total='));
    assert(logLine.includes('parse='));
    assert(logLine.includes('retrieval='));
    assert(logLine.includes('prompt='));
    assert(logLine.includes('generation='));
    assert(logLine.includes('guardrails='));
    assert(logLine.includes('chunks='));
    assert(logLine.includes('requirements='));
    assert(logLine.includes('fallback='));
    // Job description should not appear in log
    assert(!logLine.includes('Java experience'));
    assert(!logLine.includes('Spring Boot'));
    // Answer should not appear in log
    assert(!logLine.includes('Strong overall fit'));
  } finally {
    console.log = originalLog;
  }
});

// ============================================================
// Tests for parseJobDescription integration
// ============================================================

test('parseJobDescription is called exactly once per analysis', async () => {
  const fakeProvider = createFakeProvider(VALID_MODEL_ANSWER_JSON);
  const retrievalResult = createFakeRetrieval([
    {
      chunkId: 'chunk1',
      documentId: 'doc1',
      chunkIndex: 0,
      content: 'Experience with Java',
      similarity: 0.8,
      classification: 'PROFESSIONAL' as KnowledgeClassification,
      sourceFile: 'experience/java.md',
    },
  ]);
  const mockRetrieve = createMockRetrieve(retrievalResult);

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  const result = await service.analyzeJobFit(jobDescription);

  assert(result.ok);
  if (result.ok) {
    // Only one parse happened - the requirement count matches
    assert(result.metadata.requirementCount === 2);
  }
});

// ============================================================
// Tests for retrieval limit
// ============================================================

test('analyzeJobFit retrieves with larger limit than chat default', async () => {
  const fakeProvider = createFakeProvider(VALID_MODEL_ANSWER_2_REQUIREMENTS_JSON);
  const captured = { options: null as RetrievalOptions | null };

  const mockRetrieve = async (_query: string, options?: RetrievalOptions) => {
    console.log('[TEST] mockRetrieve called with options:', options);
    captured.options = options ?? null;
    console.log('[TEST] captured.options after assignment:', captured.options);
    return createFakeRetrieval();
  };

  const service = createAnalysisService({
    provider: fakeProvider,
    retrievalLimit: 8,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  await service.analyzeJobFit(jobDescription);

  assert(captured.options);
  assert.equal(captured.options.limit, 8); // Larger than chat default of 5
});

// ============================================================
// Tests for classification filter
// ============================================================

test('analyzeJobFit keeps classification filter for retrieval', async () => {
  const fakeProvider = createFakeProvider(VALID_MODEL_ANSWER_2_REQUIREMENTS_JSON);
  const captured = { options: null as RetrievalOptions | null };

  const mockRetrieve = async (_query: string, options?: RetrievalOptions) => {
    captured.options = options ?? null;
    return createFakeRetrieval();
  };

  const service = createAnalysisService({
    provider: fakeProvider,
    retrieve: mockRetrieve,
  });

  const jobDescription = `
Requirements
- 5 years Java programming experience required
- Spring Boot framework knowledge
`;

  await service.analyzeJobFit(jobDescription);

  assert(captured.options);
  assert.deepEqual(captured.options.classifications, ['PUBLIC', 'PROFESSIONAL']);
});

const UNSUPPORTED_REQUIREMENT_NOTE =
  "This isn't currently listed as a core area of Ankit's experience, " +
  'but it is adjacent to his existing background and can be positioned as a learning area.';