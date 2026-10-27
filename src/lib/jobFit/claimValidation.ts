/**
 * The claim validation module for the job fit analysis.
 *
 * This module implements the deterministic checks that enforce the
 * Critical Job-Matching Rule (PRD §31): never fabricate experience,
 * never reject because of a gap. Every claim the analysis makes is
 * checked against the evidence, and unsupported claims are downgraded
 * to learning areas with the wording of PRD §88.
 */

import type {
  JobFitAnalysis,
  ClassifiedRequirement,
  FitEvidence,
  JobRequirement,
  RequirementClassification,
} from './types.ts';
import { UNSUPPORTED_REQUIREMENT_NOTE } from './limits.ts';

/**
 * The report of the claim validation.
 */
export interface ClaimValidationReport {
  /** The requirement identifiers that were downgraded. */
  downgradedRequirements: string[];
  /** The duration phrases that were removed from the narrative. */
  removedDurations: string[];
}

/**
 * Normalises text for comparison: lower case, collapse whitespace, remove punctuation.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a normalised quote appears in the normalised evidence text.
 * For quotes longer than 40 characters, checks as substring.
 * For shorter quotes, checks as a set of words.
 */
function quoteInEvidence(quote: string, evidenceText: string): boolean {
  const normQuote = normalise(quote);
  const normEvidence = normalise(evidenceText);

  if (normQuote.length > 40) {
    return normEvidence.includes(normQuote);
  }

  // For short quotes, check that all words appear in the evidence
  const quoteWords = normQuote.split(' ').filter((w) => w.length > 1);
  return quoteWords.every((word) => normEvidence.includes(word));
}

/**
 * Checks if a duration phrase appears in the evidence text.
 * Both the number and the unit must be present.
 */
function durationInEvidence(duration: string, evidenceText: string): boolean {
  // Normalise both and check if the duration words appear
  const normDuration = normalise(duration);
  const normEvidence = normalise(evidenceText);
  const durationWords = normDuration.split(' ').filter((w) => w.length > 0);
  // Both the number and the unit must be present in the evidence
  return durationWords.every((word) => normEvidence.includes(word));
}

/**
 * Finds duration phrases in text that claim experience for Ankit.
 * Returns an array of { phrase, sentenceIndex, sentence }.
 */
function findExperienceDurations(text: string): Array<{
  phrase: string;
  sentenceIndex: number;
  sentence: string;
}> {
  // Pattern for duration: number + unit of experience (years, months, etc.)
  // Only captures durations that are about experience/skills
  const durationPattern =
    /\b(\d+\+?\s*(?:years?|yrs?|months?|decades?))\b/gi;

  const results: Array<{
    phrase: string;
    sentenceIndex: number;
    sentence: string;
  }> = [];

  // Split into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    // Skip sentences that are clearly not about Ankit's experience
    // (e.g., company history, requirement counts, dates in education)
    const notAboutAnkitExperience =
      /company\s+(?:was\s+)?founded|requirement\s+count|\d{4}-\d{4}|\b(?:19|20)\d{2}\b/i.test(
        sentence
      );

    if (notAboutAnkitExperience) continue;

    let match: RegExpExecArray | null;
    while ((match = durationPattern.exec(sentence)) !== null) {
      results.push({
        phrase: match[1],
        sentenceIndex: i,
        sentence,
      });
    }
  }

  return results;
}

/**
 * Validates a single requirement's evidence quote.
 * Returns the (possibly corrected) requirement and whether it was downgraded.
 */
function validateRequirement(
  requirement: ClassifiedRequirement,
  evidence: FitEvidence[],
  allRequirements: JobRequirement[]
): { requirement: ClassifiedRequirement; downgraded: boolean } {
  // If no evidence IDs, nothing to validate
  if (requirement.evidenceIds.length === 0) {
    return { requirement, downgraded: false };
  }

  // Check that all evidence IDs exist
  const evidenceById = new Map(evidence.map((e) => [e.sourceId, e]));
  for (const id of requirement.evidenceIds) {
    if (!evidenceById.has(id)) {
      // Invented evidence ID - downgrade
      return {
        requirement: {
          ...requirement,
          classification: 'LEARNABLE',
          rationale: UNSUPPORTED_REQUIREMENT_NOTE,
          evidenceIds: [],
        },
        downgraded: true,
      };
    }
  }

  // Check each quote
  const originalReq = allRequirements.find((r) => r.id === requirement.requirementId);
  if (!originalReq) {
    return { requirement, downgraded: false };
  }

  // The model doesn't provide quotes directly, but we check if the requirement text
  // aligns with the evidence. The rationale should reference the evidence.
  // For this check, we verify the evidence actually supports the claim by checking
  // if key terms from the requirement appear in the cited evidence.
  const requirementKeyTerms = normalise(originalReq.text)
    .split(' ')
    .filter((w) => w.length > 2);

  let hasSupport = false;
  for (const id of requirement.evidenceIds) {
    const ev = evidenceById.get(id);
    if (!ev || !ev.content) continue;

    const normContent = normalise(ev.content);
    const matchingTerms = requirementKeyTerms.filter((term) =>
      normContent.includes(term)
    );

    if (matchingTerms.length >= 2 || matchingTerms.length / requirementKeyTerms.length > 0.3) {
      hasSupport = true;
      break;
    }
  }

  if (!hasSupport) {
    return {
      requirement: {
        ...requirement,
        classification: 'LEARNABLE',
        rationale: UNSUPPORTED_REQUIREMENT_NOTE,
        evidenceIds: [],
      },
      downgraded: true,
    };
  }

  return { requirement, downgraded: false };
}

/**
 * Validates and corrects durations in a single narrative field.
 * Returns the corrected text and the list of removed duration phrases.
 */
function validateDurationsInText(
  text: string,
  evidence: FitEvidence[]
): { text: string; removed: string[] } {
  const durations = findExperienceDurations(text);
  if (durations.length === 0) {
    return { text, removed: [] };
  }

  // Build combined evidence text for checking
  const evidenceText = evidence
    .filter((e) => e.content)
    .map((e) => e.content!)
    .join(' ');

  let correctedText = text;
  const removed: string[] = [];

  // Process in reverse order to maintain correct indices
  for (let i = durations.length - 1; i >= 0; i--) {
    const { phrase, sentenceIndex, sentence } = durations[i];

    if (!durationInEvidence(phrase, evidenceText)) {
      // Remove the phrase from the sentence
      const phraseRegex = new RegExp(`\\b${phrase.replace(/\+/g, '\\+')}\\b`, 'i');
      let newSentence = sentence.replace(phraseRegex, '').trim();

      // Clean up double spaces, leading/trailing punctuation
      newSentence = newSentence
        .replace(/\s+/g, ' ')
        .replace(/^\s*[,;:]\s*/, '')
        .replace(/\s*[,;:]\s*$/, '')
        .trim();

      // If sentence is now empty or just punctuation, drop it
      if (!newSentence || /^[.!?]*$/.test(newSentence)) {
        // Remove the entire sentence
        const sentences = correctedText.split(/(?<=[.!?])\s+/);
        if (sentenceIndex < sentences.length) {
          sentences.splice(sentenceIndex, 1);
          correctedText = sentences.join(' ');
        }
      } else {
        // Replace the sentence
        const sentences = correctedText.split(/(?<=[.!?])\s+/);
        if (sentenceIndex < sentences.length) {
          sentences[sentenceIndex] = newSentence;
          correctedText = sentences.join(' ');
        }
      }
      removed.push(phrase);
    }
  }

  return { text: correctedText, removed };
}

/**
 * Runs the full claim validation on the analysis.
 * Returns the corrected analysis and a report.
 */
export function validateClaims(
  analysis: JobFitAnalysis,
  evidence: FitEvidence[],
  requirements: JobRequirement[]
): { analysis: JobFitAnalysis; report: ClaimValidationReport } {
  const report: ClaimValidationReport = {
    downgradedRequirements: [],
    removedDurations: [],
  };

  // Validate each requirement
  const correctedRequirements: ClassifiedRequirement[] = [];
  for (const req of analysis.requirements) {
    const { requirement, downgraded } = validateRequirement(
      req,
      evidence,
      requirements
    );
    if (downgraded) {
      report.downgradedRequirements.push(req.requirementId);
    }
    correctedRequirements.push(requirement);
  }

  // Validate durations in all narrative fields
  const correctedAnalysis: JobFitAnalysis = { ...analysis, requirements: correctedRequirements };

  // overallPositioning (string)
  {
    const { text, removed } = validateDurationsInText(correctedAnalysis.overallPositioning, evidence);
    correctedAnalysis.overallPositioning = text;
    report.removedDurations.push(...removed);
  }

  // strongMatches (string[])
  {
    const correctedArray: string[] = [];
    for (const item of correctedAnalysis.strongMatches) {
      const { text, removed } = validateDurationsInText(item, evidence);
      if (text.trim()) correctedArray.push(text);
      report.removedDurations.push(...removed);
    }
    correctedAnalysis.strongMatches = correctedArray;
  }

  // transferableExperience (string[])
  {
    const correctedArray: string[] = [];
    for (const item of correctedAnalysis.transferableExperience) {
      const { text, removed } = validateDurationsInText(item, evidence);
      if (text.trim()) correctedArray.push(text);
      report.removedDurations.push(...removed);
    }
    correctedAnalysis.transferableExperience = correctedArray;
  }

  // learningAgility (string)
  {
    const { text, removed } = validateDurationsInText(correctedAnalysis.learningAgility, evidence);
    correctedAnalysis.learningAgility = text;
    report.removedDurations.push(...removed);
  }

  // interviewTalkingPoints (string[])
  {
    const correctedArray: string[] = [];
    for (const item of correctedAnalysis.interviewTalkingPoints) {
      const { text, removed } = validateDurationsInText(item, evidence);
      if (text.trim()) correctedArray.push(text);
      report.removedDurations.push(...removed);
    }
    correctedAnalysis.interviewTalkingPoints = correctedArray;
  }

  // recommendedPositioning (string)
  {
    const { text, removed } = validateDurationsInText(correctedAnalysis.recommendedPositioning, evidence);
    correctedAnalysis.recommendedPositioning = text;
    report.removedDurations.push(...removed);
  }

  return { analysis: correctedAnalysis, report };
}