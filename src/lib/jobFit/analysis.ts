/**
 * The job fit analysis engine.
 *
 * This module turns a parsed job description into the structured fit
 * analysis by retrieving evidence once, building a prompt, calling the
 * model, reading the answer through the schema, applying the output
 * guardrails, and returning the analysis with evidence and metadata.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { parseJobDescription } from './jdParser.ts';
import {
  buildRetrievalQuery,
  buildJobFitPrompt,
  JOB_FIT_SYSTEM_INSTRUCTION,
} from './prompts.ts';
import { retrieveChunks } from '../knowledge/retrieval.ts';
import {
  type RetrievalOptions,
  type RetrievalResult,
  type RetrievedChunk,
  type KnowledgeClassification,
  PUBLIC_CLASSIFICATIONS,
} from '../knowledge/types.ts';
import {
  type LLMProvider,
  type GenerationOptions,
  type GenerationResult,
  LLMError,
} from '../llm/provider.ts';
import { validateResponse } from '../guardrails/outputValidation.ts';
import { parseModelAnswer, buildClassifiedRequirements, buildAlignmentBands, type ModelAnswer } from './schema.ts';
import type {
  JobRequirement,
  ParsedJobDescription,
  JobFitAnalysis,
  FitEvidence,
  JobFitMetadata,
  JobFitAnalysisResult,
  AnalyzeJobFitOptions,
} from './types.ts';
import {
  MAX_ANALYSED_REQUIREMENTS,
  MAX_JOB_FIT_RESPONSE_TOKENS,
  UNSUPPORTED_REQUIREMENT_NOTE,
} from './limits.ts';

/**
 * Default number of chunks to retrieve for an analysis.
 *
 * This is larger than the chat's default of 5 because the analysis needs
 * evidence for many requirements at once.
 */
export const DEFAULT_ANALYSIS_RETRIEVAL_LIMIT = 8;

/**
 * The default temperature for the analysis generation.
 *
 * A low temperature keeps the structured answer consistent.
 */
export const DEFAULT_ANALYSIS_TEMPERATURE = 0.1;

/**
 * Builds the FitEvidence array from the retrieved chunks.
 */
function buildFitEvidence(chunks: RetrievalResult['chunks']): FitEvidence[] {
  return chunks.map((chunk: RetrievedChunk, index: number) => ({
    sourceId: chunk.documentId,
    sourceType: chunk.sourceFile ?? 'unknown',
    sourceTitle: chunk.sourceFile ?? `Document ${chunk.documentId.slice(0, 8)}`,
    classification: chunk.classification,
    lastUpdated: new Date().toISOString(), // The retrieval doesn't return updated_at; use current time as fallback
    confidence: chunk.similarity,
    content: chunk.content,
  }));
}

/**
 * Builds a fallback analysis when the model answer cannot be parsed.
 */
function buildFallbackAnalysis(
  evidence: FitEvidence[],
  requirementCount: number
): JobFitAnalysis {
  const strongMatchTexts = evidence.slice(0, 3).map(
    (e) =>
      `Found relevant experience in ${e.sourceTitle} (${e.classification}).`
  );

  return {
    overallPositioning:
      'This analysis is based on the professional information retrieved from Ankit\'s approved knowledge base. The model answer could not be parsed, so the per-requirement classification is not available.',
    strongMatches: strongMatchTexts.length > 0 ? strongMatchTexts : ['No specific strong matches identified from the retrieved evidence.'],
    transferableExperience: [
      'Transferable experience is derived from the retrieved professional information. Specific mappings are not available due to a parsing failure.'
    ],
    learningAgility:
      'Learning agility is not assessed in this fallback analysis. The fixed wording for unsupported requirements applies: ' +
      UNSUPPORTED_REQUIREMENT_NOTE,
    interviewTalkingPoints: [
      'Discuss the retrieved professional experience during the interview.',
      'Be prepared to explain how your background maps to the requirements.'
    ],
    recommendedPositioning:
      'Position yourself based on the professional experience documented in the knowledge base. For requirements without direct evidence, use the standard learning area framing.',
    requirements: [],
    alignmentBands: [
      { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
      { key: 'transferable', label: 'Transferable', filledSegments: 0 },
      { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
    ],
    evidence,
  };
}

/**
 * Applies the output guardrails to all text fields of the analysis.
 */
async function applyGuardrailsToAnalysis(
  analysis: JobFitAnalysis
): Promise<JobFitAnalysis> {
  const textFields: Array<keyof JobFitAnalysis> = [
    'overallPositioning',
    'learningAgility',
    'recommendedPositioning',
  ];

  const guarded = { ...analysis };

  for (const field of textFields) {
    const result = validateResponse(analysis[field] as string);
    (guarded as Record<string, unknown>)[field] = result.text;
  }

  // Guard the arrays
  guarded.strongMatches = await Promise.all(
    analysis.strongMatches.map(async (text) => {
      const result = validateResponse(text);
      return result.text;
    })
  );

  guarded.transferableExperience = await Promise.all(
    analysis.transferableExperience.map(async (text) => {
      const result = validateResponse(text);
      return result.text;
    })
  );

  guarded.interviewTalkingPoints = await Promise.all(
    analysis.interviewTalkingPoints.map(async (text) => {
      const result = validateResponse(text);
      return result.text;
    })
  );

  return guarded;
}

/**
 * The options for the analysis service.
 */
export interface AnalysisServiceOptions {
  /** The LLM provider to use. */
  provider?: LLMProvider;
  /** A custom retrieval function for testing. */
  retrieve?: (query: string, options?: RetrievalOptions) => Promise<RetrievalResult>;
  /** The Supabase client for retrieval (used when retrieve is not provided). */
  store?: SupabaseClient;
  /** A function that returns the current time in milliseconds. */
  clock?: () => number;
  /** The maximum number of chunks to retrieve. */
  retrievalLimit?: number;
  /** The minimum similarity threshold for retrieval. */
  minSimilarity?: number;
  /** The temperature for generation. */
  temperature?: number;
  /** The maximum tokens for the answer. */
  maxTokens?: number;
  /** The timeout for the generation in milliseconds. */
  timeoutMs?: number;
}

/**
 * Creates the job fit analysis service with injected dependencies.
 */
export function createAnalysisService(options: AnalysisServiceOptions = {}) {
  const {
    provider,
    store,
    retrieve,
    clock = () => Date.now(),
    retrievalLimit = DEFAULT_ANALYSIS_RETRIEVAL_LIMIT,
    minSimilarity,
    temperature = DEFAULT_ANALYSIS_TEMPERATURE,
    maxTokens = MAX_JOB_FIT_RESPONSE_TOKENS,
    timeoutMs = 120000,
  } = options;

  /**
   * Analyzes a job description against the knowledge base.
   */
  async function analyzeJobFit(
    jobDescription: string,
    options: AnalyzeJobFitOptions = {}
  ): Promise<JobFitAnalysisResult> {
    const startedAt = clock();

    // Stage 1: Parse
    const parseStartedAt = clock();
    const parsed = parseJobDescription(jobDescription);
    const parseMs = clock() - parseStartedAt;

    if (!parsed.ok) {
      return {
        ok: false,
        error: `Failed to parse job description: ${parsed.reason}`,
        metadata: {
          latencyMs: clock() - startedAt,
          tokenUsage: { promptTokens: null, completionTokens: null, totalTokens: null },
          model: 'none',
          requirementCount: 0,
          truncated: false,
          usedFallback: false,
        },
      };
    }

    const requirements = parsed.requirements;
    const requirementCount = requirements.length;
    const truncated = parsed.omittedRequirements > 0;

    // Stage 2: Build retrieval query
    const query = buildRetrievalQuery(parsed.title, requirements);

    // Stage 3: Retrieve
    const retrievalStartedAt = clock();
    const retrievalOptions: RetrievalOptions = {
      limit: retrievalLimit,
      minSimilarity,
      logMetrics: false, // We log our own metrics
      classifications: PUBLIC_CLASSIFICATIONS,
    };
    const retrieval = retrieve
      ? await retrieve(query, retrievalOptions)
      : await retrieveChunks(query, retrievalOptions, store);
    const retrievalMs = clock() - retrievalStartedAt;

    // Stage 4: Build prompt and evidence
    const promptStartedAt = clock();
    const evidence = buildFitEvidence(retrieval.chunks);
    const prompt = buildJobFitPrompt({
      title: parsed.title,
      company: parsed.company,
      requirements,
      evidence,
      jobDescription,
    });
    const promptMs = clock() - promptStartedAt;

    // Stage 5: Generate
    const generationStartedAt = clock();
    let model: string;
    let tokenUsage: GenerationResult['tokenUsage'];
    let modelAnswer: ModelAnswer;
    let usedFallback = false;
    let generationText: string;

    try {
      const generationOptions: GenerationOptions = {
        temperature,
        maxTokens,
        timeoutMs,
        systemInstruction: JOB_FIT_SYSTEM_INSTRUCTION,
      };

      const { getLLMProvider } = await import('../llm/factory.ts');
      const llmProvider = provider ?? await getLLMProvider();
      const generation = await llmProvider.generate(prompt, generationOptions);

      model = generation.model;
      tokenUsage = generation.tokenUsage;
      generationText = generation.text;

      // Stage 6: Parse the answer
      const requirementIds = requirements.map((r) => r.id);
      const parsedAnswer = parseModelAnswer(generationText, requirementIds);

      if (parsedAnswer.ok) {
        modelAnswer = parsedAnswer.value;
      } else {
        // Fallback
        usedFallback = true;
        modelAnswer = {
          overallPositioning: '',
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
        };
      }
    } catch (error) {
      if (error instanceof LLMError && error.retryable) {
        throw new Error(`LLM generation failed with retryable error: ${error.message}`);
      }
      throw error;
    }
    const generationMs = clock() - generationStartedAt;

    // Stage 7: Build the analysis from the model answer
    const analysisBuiltFromModel = !usedFallback;

    let analysis: JobFitAnalysis;
    if (analysisBuiltFromModel) {
      analysis = {
        overallPositioning: modelAnswer.overallPositioning,
        strongMatches: modelAnswer.strongMatches,
        transferableExperience: modelAnswer.transferableExperience,
        learningAgility: modelAnswer.learningAgility,
        interviewTalkingPoints: modelAnswer.interviewTalkingPoints,
        recommendedPositioning: modelAnswer.recommendedPositioning,
        requirements: buildClassifiedRequirements(modelAnswer),
        alignmentBands: buildAlignmentBands(modelAnswer),
        evidence,
      };
    } else {
      analysis = buildFallbackAnalysis(evidence, requirementCount);
    }

    // Stage 8: Apply output guardrails
    const guardrailsStartedAt = clock();
    analysis = await applyGuardrailsToAnalysis(analysis);
    const guardrailsMs = clock() - guardrailsStartedAt;

    const totalMs = clock() - startedAt;

    // Log metrics
    console.log(
      `[job-fit] total=${totalMs}ms parse=${parseMs}ms retrieval=${retrievalMs}ms ` +
        `prompt=${promptMs}ms generation=${generationMs}ms guardrails=${guardrailsMs}ms ` +
        `chunks=${retrieval.chunks.length} requirements=${requirementCount} fallback=${usedFallback ? 'yes' : 'no'}`
    );

    return {
      ok: true,
      analysis,
      evidence,
      metadata: {
        latencyMs: totalMs,
        tokenUsage: {
          promptTokens: tokenUsage?.promptTokens ?? null,
          completionTokens: tokenUsage?.completionTokens ?? null,
          totalTokens: tokenUsage?.totalTokens ?? null,
        },
        model,
        requirementCount,
        truncated,
        usedFallback,
      },
    };
  }

  return { analyzeJobFit };
}

/**
 * The default service instance using environment defaults.
 */
let defaultService: ReturnType<typeof createAnalysisService> | null = null;

/**
 * Returns the default analysis service, creating it on first use.
 */
export function getAnalysisService(): ReturnType<typeof createAnalysisService> {
  if (!defaultService) {
    defaultService = createAnalysisService();
  }
  return defaultService;
}

/**
 * Replaces the default service. Used by tests.
 */
export function setAnalysisService(service: ReturnType<typeof createAnalysisService> | null): void {
  defaultService = service;
}

/**
 * Convenience function that uses the default service.
 */
export async function analyzeJobFit(
  jobDescription: string,
  options?: AnalyzeJobFitOptions
): Promise<JobFitAnalysisResult> {
  return getAnalysisService().analyzeJobFit(jobDescription, options);
}