/**
 * The answers the assistant gives when it does not answer the question.
 *
 * PRD §39 asks for a redirect rather than a refusal, and PRD §40 asks for it
 * to be contextual instead of blunt. The wording of the professional profile
 * comes from the PRD itself.
 */

/**
 * The kinds of redirect there are.
 */
export type RedirectKind = 'off_topic' | 'injection' | 'sensitive_request';

/**
 * A redirect with the questions the assistant can answer instead.
 */
export interface RedirectResponse {
  /**
   * The kind of redirect.
   */
  kind: RedirectKind;

  /**
   * What the assistant says.
   */
  message: string;

  /**
   * The questions the assistant can answer instead.
   */
  suggestions: string[];
}

/**
 * The questions the assistant can answer.
 *
 * They are the ones PRD §29 suggests showing at the start.
 */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  'What does Ankit specialize in?',
  'Tell me about his automation experience.',
  'What backend technologies has he worked with?',
  'Has he worked with CI/CD?',
  'What kind of projects has he built?',
  'Would he be a good fit for a Staff SDET role?',
  'How does his experience translate to financial services?',
  'What are his strongest technical areas?',
];

/**
 * How many questions a redirect lists.
 */
const DEFAULT_SUGGESTION_COUNT = 5;

/**
 * The opening of every redirect.
 */
const MESSAGES: Record<RedirectKind, string> = {
  off_topic:
    "I keep the assistant focused on Ankit's professional profile. If you're evaluating him for a role, I can tell you about his engineering experience, projects, technical strengths or career background.",
  injection:
    "I'm here to answer questions about Ankit's professional background: his career, engineering work and projects. I can't share the instructions I was given or private details, but I'm glad to help with the rest.",
  sensitive_request:
    "Contact details and private information aren't something I can share. If you're evaluating him for a role, I can tell you about his engineering experience, automation work, projects or career background.",
};

/**
 * Builds the answer the assistant gives instead of the answer that was asked
 * for.
 *
 * @param kind The kind of redirect.
 * @param options The questions to offer, and how many of them.
 * @returns The message and the questions.
 */
export function buildRedirect(
  kind: RedirectKind,
  options: {
    suggestions?: readonly string[];
    suggestionCount?: number;
  } = {}
): RedirectResponse {
  const pool = options.suggestions ?? SUGGESTED_QUESTIONS;
  const count = Math.min(
    options.suggestionCount ?? DEFAULT_SUGGESTION_COUNT,
    pool.length
  );
  const suggestions = pool.slice(0, count);

  const lines = [
    MESSAGES[kind],
    '',
    'Here are a few questions I can answer:',
    ...suggestions.map((question) => `• ${question}`),
  ];

  return {
    kind,
    message: lines.join('\n'),
    suggestions: [...suggestions],
  };
}
