/**
 * The contract for the job fit analysis.
 *
 * This module defines the types that the parser, the engine, the grounding
 * check, the route and the interface all share. It has no runtime
 * dependencies and no imports beyond the knowledge base types, so it can
 * be loaded by the test runner without a complete environment.
 */

import type { KnowledgeClassification } from '../knowledge/types.ts';

// Re-export for consumers
 export type { KnowledgeClassification };

/**
 * The classification of a single requirement from the job description.
 *
 * PRD §88 defines five classifications. The values are string literals so
 * the test runner can load this module (no enums, no parameter properties).
 */
export const REQUIREMENT_CLASSIFICATIONS = [
  'DIRECT_MATCH',
  'STRONG_TRANSFER',
  'RELATED',
  'LEARNABLE',
  'UNKNOWN',
] as const;

/**
 * The classification of a requirement.
 */
export type RequirementClassification =
  (typeof REQUIREMENT_CLASSIFICATIONS)[number];

/**
 * The kind of a requirement in the job description.
 */
export const REQUIREMENT_KINDS = [
  'responsibility',
  'requirement',
  'qualification',
  'nice_to_have',
  'other',
] as const;

/**
 * The kind of a requirement.
 */
export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];

/**
 * The three alignment bands of PRD §89.
 *
 * Each band has a label (for the interface) and a key (for the engine and
 * the schema).
 */
export interface AlignmentBand {
  /** The internal key of the band. */
  key: 'strong' | 'transferable' | 'growth';

  /** The human-readable label, as PRD §89 spells it. */
  label: string;

  /** How many of the four segments are filled (0 to 4). */
  filledSegments: number;
}

/**
 * The ordered list of alignment bands.
 */
export const ALIGNMENT_BANDS: AlignmentBand[] = [
  { key: 'strong', label: 'Strong Alignment', filledSegments: 0 },
  { key: 'transferable', label: 'Transferable', filledSegments: 0 },
  { key: 'growth', label: 'Growth Areas', filledSegments: 0 },
];

/**
 * A single requirement extracted from the job description.
 */
export interface JobRequirement {
  /** A stable identifier for this requirement (e.g. "r1", "r2"). */
  id: string;

  /** The text of the requirement as it appeared in the job description. */
  text: string;

  /** What kind of requirement this is. */
  kind: RequirementKind;

  /** Whether this requirement is required (true) or "nice to have" (false). */
  required: boolean;
}

/**
 * The result of parsing a job description.
 *
 * This is a discriminated union so the caller must handle both success
 * and failure cases.
 */
export type ParsedJobDescription =
  | { ok: true; title: string | null; company: string | null; requirements: JobRequirement[]; omittedRequirements: number }
  | { ok: false; reason: 'too_short' | 'too_long' | 'no_requirements' };

/**
 * A requirement plus its classification, rationale and evidence references.
 */
export interface ClassifiedRequirement {
  /** The identifier of the requirement this classification belongs to. */
  requirementId: string;

  /** The classification of this requirement. */
  classification: RequirementClassification;

  /** Why this classification was assigned. */
  rationale: string;

  /** The identifiers of the evidence that supports this classification. */
  evidenceIds: string[];
}

/**
 * An evidence reference as defined by PRD §43.
 *
 * The evidence reference carries the metadata the interface needs to show
 * the source of a claim. It does not carry the raw chunk id.
 */
export interface FitEvidence {
  /** The identifier of the source document. */
  sourceId: string;

  /** The type of the source (e.g. "experience", "projects", "skills"). */
  sourceType: string;

  /** The title of the source document. */
  sourceTitle: string;

  /** The classification of the source. */
  classification: KnowledgeClassification;

  /** When the source was last updated (ISO timestamp). */
  lastUpdated: string;

  /** The confidence of the match, between 0 and 1. */
  confidence: number;

  /** The text content of the evidence chunk. */
  content?: string;
}

/**
 * The six sections of the job fit analysis (PRD §30).
 *
 * The order is fixed so the interface and the engine cannot disagree.
 */
export const FIT_SECTIONS = [
  'overallPositioning',
  'strongMatches',
  'transferableExperience',
  'learningAgility',
  'interviewTalkingPoints',
  'recommendedPositioning',
] as const;

/**
 * The keys of the six sections.
 */
export type FitSectionKey = (typeof FIT_SECTIONS)[number];

/**
 * The structured job fit analysis returned by the engine.
 */
export interface JobFitAnalysis {
  /** A paragraph describing the overall fit. */
  overallPositioning: string;

  /** A list of paragraphs describing the strong matches. */
  strongMatches: string[];

  /** A list of paragraphs describing transferable experience. */
  transferableExperience: string[];

  /** A paragraph describing learning agility. */
  learningAgility: string;

  /** A list of interview talking points. */
  interviewTalkingPoints: string[];

  /** A paragraph with recommended positioning. */
  recommendedPositioning: string;

  /** Every requirement from the job description with its classification. */
  requirements: ClassifiedRequirement[];

  /** The alignment bands for the qualitative summary (PRD §89). */
  alignmentBands: AlignmentBand[];

  /** The evidence references cited in the analysis. */
  evidence: FitEvidence[];
}

/**
 * The shape of the request to the job fit API.
 *
 * The visitor only provides the job description. The model, temperature,
 * chunk count and other settings are fixed by the server.
 */
export interface JobFitRequest {
  /** The full text of the job description. */
  jobDescription: string;
}

/**
 * Options for the job fit analyzer policy.
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
 * Options for the analysis engine.
 */
export interface AnalyzeJobFitOptions {
  /** Optional retrieval limit override. */
  retrievalLimit?: number;
  /** Optional minimum similarity threshold override. */
  minSimilarity?: number;
  /** Optional client key for rate limiting. */
  clientKey?: string;
}

/**
 * Metadata returned with the analysis.
 */
export interface JobFitMetadata {
  /** How long the analysis took, in milliseconds. */
  latencyMs: number;

  /** Token usage from the LLM provider. */
  tokenUsage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };

  /** The model that produced the analysis. */
  model: string;

  /** How many requirements were found in the job description. */
  requirementCount: number;

  /** Whether the analysis was cut short because of the requirement limit. */
  truncated: boolean;

  /** Whether a fallback analysis was used because the model answer could not be parsed. */
  usedFallback: boolean;

  /** Number of PII redactions performed on the job description. */
  redactions: number;

  /** Rate limit information for the request. */
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: number;
    scope: 'window' | 'daily' | null;
  };

  /** The query ID for this analysis. */
  queryId?: string;
}

/**
 * The result of a job fit analysis.
 */
export type JobFitAnalysisResult =
  | { ok: true; analysis: JobFitAnalysis; evidence: FitEvidence[]; metadata: JobFitMetadata }
  | { ok: false; error: string; metadata: JobFitMetadata };

/**
 * The shape of the response from the job fit API.
 */
export interface JobFitResponse {
  /** The structured analysis. */
  analysis: JobFitAnalysis;

  /** The evidence references. */
  evidence: FitEvidence[];

  /** Metadata about the request. */
  metadata: JobFitMetadata;
}