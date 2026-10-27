/**
 * The zod schema for the model's JSON answer and the parser function.
 *
 * The model is asked to return JSON with a specific shape. This module
 * validates that shape and parses the model's text (which may be wrapped
 * in a code fence) into the analysis structure. A malformed answer is an
 * expected condition, so the parser never throws; it returns a result
 * object that says whether it succeeded.
 */

import { z } from 'zod';

import type {
  ClassifiedRequirement,
  AlignmentBand,
} from './types.ts';

/**
 * The zod schema for a single classified requirement in the model's answer.
 */
const classifiedRequirementSchema = z.object({
  id: z.string().min(1),
  classification: z.enum([
    'DIRECT_MATCH',
    'STRONG_TRANSFER',
    'RELATED',
    'LEARNABLE',
    'UNKNOWN',
  ]),
  rationale: z.string().min(1),
  evidenceIds: z.array(z.string()).min(0),
});

/**
 * The zod schema for the alignment bands in the model's answer.
 */
const alignmentBandSchema = z.object({
  key: z.enum(['strong', 'transferable', 'growth']),
  label: z.string().min(1),
  filledSegments: z.number().int().min(0).max(4),
});

/**
 * The zod schema for the complete model answer.
 */
export const modelAnswerSchema = z.object({
  overallPositioning: z.string().min(1),
  strongMatches: z.array(z.string().min(1)).min(0),
  transferableExperience: z.array(z.string().min(1)).min(0),
  learningAgility: z.string().min(1),
  interviewTalkingPoints: z.array(z.string().min(1)).min(0),
  recommendedPositioning: z.string().min(1),
  requirements: z.array(classifiedRequirementSchema).min(1),
  alignmentBands: z.array(alignmentBandSchema).length(3),
});

/**
 * The type of the validated model answer.
 */
export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

/**
 * The result of parsing the model's text.
 *
 * This never throws. A malformed answer is an expected condition.
 */
export type ParseResult =
  | { ok: true; value: ModelAnswer }
  | { ok: false; error: string };

/**
 * Strips a markdown code fence from the text if present.
 *
 * The model may wrap the JSON in ```json ... ``` or ``` ... ```.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

/**
 * Parses the model's text into the structured answer.
 *
 * @param text The raw text from the model.
 * @param requirementIds The list of requirement identifiers that were sent
 *   to the model, used to validate that the answer does not invent
 *   requirements.
 * @returns A result object with either the parsed value or an error.
 */
export function parseModelAnswer(
  text: string,
  requirementIds: string[]
): ParseResult {
  const cleaned = stripCodeFence(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, error: 'The model did not return valid JSON.' };
  }

  const result = modelAnswerSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return { ok: false, error: `The model answer is malformed: ${issues}` };
  }

  const value = result.data;

  // Validate that every requirement id in the answer exists in the sent list.
  const allowedIds = new Set(requirementIds);
  for (const req of value.requirements) {
    if (!allowedIds.has(req.id)) {
      return {
        ok: false,
        error: `The model referenced an unknown requirement id: ${req.id}`,
      };
    }
  }

  // Validate that the alignment bands have the correct keys in order.
  const expectedKeys = ['strong', 'transferable', 'growth'] as const;
  for (let i = 0; i < 3; i++) {
    if (value.alignmentBands[i].key !== expectedKeys[i]) {
      return {
        ok: false,
        error: `Alignment band ${i} has an unexpected key: ${value.alignmentBands[i].key}`,
      };
    }
  }

  return { ok: true, value };
}

/**
 * Builds the classified requirements for the final analysis from the
 * validated model answer.
 *
 * @param modelAnswer The validated answer from the model.
 * @returns The classified requirements for the analysis.
 */
export function buildClassifiedRequirements(
  modelAnswer: ModelAnswer
): ClassifiedRequirement[] {
  return modelAnswer.requirements.map((req) => ({
    requirementId: req.id,
    classification: req.classification,
    rationale: req.rationale,
    evidenceIds: req.evidenceIds,
  }));
}

/**
 * Builds the alignment bands for the final analysis from the validated
 * model answer.
 *
 * @param modelAnswer The validated answer from the model.
 * @returns The alignment bands for the analysis.
 */
export function buildAlignmentBands(
  modelAnswer: ModelAnswer
): AlignmentBand[] {
  return modelAnswer.alignmentBands.map((band) => ({
    key: band.key,
    label: band.label,
    filledSegments: band.filledSegments,
  }));
}