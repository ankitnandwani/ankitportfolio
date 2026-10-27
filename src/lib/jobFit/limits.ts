/**
 * The input limits and fixed wording for the job fit analysis.
 *
 * These values are defined in one place so a change to any of them is
 * deliberate and visible. They are used by the parser, the engine, the
 * route and the tests.
 */

/**
 * The largest job description the analyzer accepts, in characters.
 *
 * A job description is usually far shorter. The limit exists so a pasted
 * document cannot become an unbounded prompt.
 */
export const MAX_JOB_DESCRIPTION_LENGTH = 12000;

/**
 * The smallest job description worth analysing, in characters.
 *
 * Below this there is nothing meaningful to map.
 */
export const MIN_JOB_DESCRIPTION_LENGTH = 80;

/**
 * The largest number of requirements that are analysed in one request.
 *
 * The limit keeps one analysis inside the context and the cost budget of
 * PRD §84.
 */
export const MAX_ANALYSED_REQUIREMENTS = 40;

/**
 * The largest number of tokens the model may use for the answer.
 *
 * The answer is JSON with six sections and one entry per requirement, so
 * it is larger than a chat answer.
 */
export const MAX_JOB_FIT_RESPONSE_TOKENS = 2048;

/**
 * The wording for an unsupported requirement (PRD §88).
 *
 * PRD §88 says: "When a requirement cannot be supported by evidence, the
 * response must say: 'This isn't currently listed as a core area of
 * Ankit's experience, but it is adjacent to his existing background and
 * can be positioned as a learning area.'"
 *
 * This constant is the single source of truth. M17.04 substitutes this
 * for a claim the evidence does not support, so the phrase has to be in
 * one place.
 */
export const UNSUPPORTED_REQUIREMENT_NOTE =
  "This isn't currently listed as a core area of Ankit's experience, " +
  'but it is adjacent to his existing background and can be positioned as a learning area.';