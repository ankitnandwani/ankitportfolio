import { detectPii } from './piiDetection.ts';
import { containsTokenSequence, tokenize } from './text.ts';
import type {
  GuardrailOptions,
  OutputValidationResult,
  OutputViolation,
} from './types.ts';

/**
 * The token that replaces a secret.
 */
const REDACTION_TOKEN = '[REDACTED]';

/**
 * Matches the shape of a Google API key.
 */
const GOOGLE_API_KEY_PATTERN = /AIza[0-9A-Za-z_-]{35}/g;

/**
 * Matches the shape of a key that starts with "sk".
 */
const SECRET_KEY_PATTERN = /sk-[A-Za-z0-9]{20,512}/g;

/**
 * Matches the shape of a token that is made of three parts.
 */
const TOKEN_PATTERN =
  /eyJ[A-Za-z0-9_-]{8,200}\.[A-Za-z0-9_-]{8,200}\.[A-Za-z0-9_-]{8,200}/g;

/**
 * Matches the name of an environment variable and the value it holds.
 */
const ENV_ASSIGNMENT_PATTERN =
  /\b([A-Z][A-Z0-9_]{3,64})\s*[=:]\s*["']?(?:[^\s"',;]{8,512})["']?/g;

/**
 * The names of the variables that hold a secret.
 *
 * A name with an underscore is treated as a secret as well, so a variable
 * that is added later is covered without changing this list.
 */
const SECRET_VARIABLE_NAMES = [
  'GEMINI_API_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
  'POSTHOG_KEY',
  'SENTRY_DSN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

/**
 * The phrases that show the instructions of the assistant.
 */
const SYSTEM_PROMPT_PHRASES = [
  'my system prompt',
  'system prompt is',
  'my instructions are',
  'i was instructed',
  'i was told to',
  'my guidelines are',
  'my rules are',
];

/**
 * The words that are too informal for the tone of the assistant.
 */
const SLANG_WORDS = [
  'lol',
  'lmao',
  'rofl',
  'dude',
  'bro',
  'yolo',
  'gonna',
  'wanna',
  'kinda',
  'btw',
  'imo',
  'tbh',
];

/**
 * The phrases that are too familiar for the tone of the assistant.
 */
const OVERFAMILIAR_PHRASES = [
  'my friend',
  'buddy',
  'bestie',
  'hey there',
  'fellow',
  'come on',
];

/**
 * The phrases that sell too hard.
 */
const AGGRESSIVE_SALES_PHRASES = [
  'you should hire him',
  'he is the best',
  'the best candidate',
  'no one else',
  'guaranteed',
  'perfect candidate',
  'world class',
  'best in the world',
  'you will not regret',
];

/**
 * The phrases that refuse instead of redirect.
 */
const DEFENSIVE_REFUSAL_PHRASES = [
  'i cannot help',
  'i cannot assist',
  'i refuse',
  'i am unable to assist',
  'i am not able to provide',
];

/**
 * The characters that count as an emoji.
 *
 * The range covers the symbols that are written in one place. The symbols
 * that need two places are counted through their first half.
 */
const EMOJI_PATTERN = /[\u2600-\u27BF\u2B00-\u2BFF\uFE0F]/g;
const EMOJI_ASTRAL_PATTERN = /[\uD800-\uDBFF]/g;
/**
 * How many emoji are too many.
 */
const MAX_EMOJI = 3;

/**
 * Counts how many times a pattern matches a text.
 */
function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Reports whether a text holds one of the phrases.
 *
 * @param tokens The tokens of the text.
 * @param phrase The phrase to look for.
 */
function holdsPhrase(tokens: string[], phrase: string): boolean {
  return containsTokenSequence(tokens, tokenize(phrase));
}

/**
 * Removes the secrets from a text.
 *
 * PRD §36 lists API keys, tokens and environment variables among the things
 * that must never be disclosed, so a value that looks like one is removed
 * before the answer leaves the server.
 *
 * @param text The text to clean.
 * @returns The text without the secrets, and how many were found.
 */
function redactSecrets(text: string): { text: string; count: number } {
  let count = 0;

  let cleaned = text.replace(GOOGLE_API_KEY_PATTERN, () => {
    count += 1;
    return REDACTION_TOKEN;
  });

  cleaned = cleaned.replace(SECRET_KEY_PATTERN, () => {
    count += 1;
    return REDACTION_TOKEN;
  });

  cleaned = cleaned.replace(TOKEN_PATTERN, () => {
    count += 1;
    return REDACTION_TOKEN;
  });

  cleaned = cleaned.replace(ENV_ASSIGNMENT_PATTERN, (match, name: string) => {
    const isSecret =
      SECRET_VARIABLE_NAMES.includes(name) || name.includes('_');

    if (!isSecret) return match;

    count += 1;
    return `${name}=${REDACTION_TOKEN}`;
  });

  return { text: cleaned, count };
}

/**
 * Counts the emoji in a text.
 */
function countEmoji(text: string): number {
  const symbols = countMatches(text, EMOJI_PATTERN);
  const astral = countMatches(text, EMOJI_ASTRAL_PATTERN);
  return symbols + astral;
}

/**
 * Looks at the tone of an answer.
 *
 * The findings are reported rather than acted on, because a warning should
 * not change an answer that is correct.
 *
 * @param text The answer.
 * @returns What was found.
 */
export function findToneViolations(text: string): OutputViolation[] {
  const violations: OutputViolation[] = [];
  const tokens = tokenize(text);

  const slang = SLANG_WORDS.filter((word) => tokens.includes(word));
  if (slang.length > 0) {
    violations.push({
      kind: 'tone',
      severity: 'warn',
      detail: 'informal wording',
      count: slang.length,
    });
  }

  const familiar = OVERFAMILIAR_PHRASES.filter((phrase) =>
    holdsPhrase(tokens, phrase)
  );
  if (familiar.length > 0) {
    violations.push({
      kind: 'tone',
      severity: 'warn',
      detail: 'over-familiar wording',
      count: familiar.length,
    });
  }

  const sales = AGGRESSIVE_SALES_PHRASES.filter((phrase) =>
    holdsPhrase(tokens, phrase)
  );
  if (sales.length > 0) {
    violations.push({
      kind: 'tone',
      severity: 'warn',
      detail: 'aggressive sales wording',
      count: sales.length,
    });
  }

  const refusals = DEFENSIVE_REFUSAL_PHRASES.filter((phrase) =>
    holdsPhrase(tokens, phrase)
  );
  if (refusals.length > 0) {
    violations.push({
      kind: 'tone',
      severity: 'warn',
      detail: 'a blunt refusal',
      count: refusals.length,
    });
  }

  const emoji = countEmoji(text);
  if (emoji > MAX_EMOJI) {
    violations.push({
      kind: 'tone',
      severity: 'warn',
      detail: 'too many emoji',
      count: emoji,
    });
  }

  return violations;
}

/**
 * Checks an answer before it is shown.
 *
 * The personal data and the secrets are removed, and the findings that
 * cannot be removed are reported.
 *
 * @param response The answer of the model.
 * @param options The options of the guardrails.
 * @returns The answer to show and what was found.
 */
export function validateResponse(
  response: string,
  options: GuardrailOptions = {}
): OutputValidationResult {
  if (!response) {
    return {
      text: response ?? '',
      isValid: true,
      violations: [],
      wasRedacted: false,
      fallback: options.fallback ?? "I don't have enough information in Ankit's professional profile to answer that accurately. I can tell you about his experience with automation, backend quality, cloud, CI/CD or his engineering projects.",
    };
  }

  const violations: OutputViolation[] = [];

  // The credentials are removed first. A key often holds a run of digits
  // that the phone number rule would match, and the rule would break the
  // shape of the key before it could be recognised.
  const secrets = redactSecrets(response);
  if (secrets.count > 0) {
    violations.push({
      kind: 'secret',
      severity: 'redact',
      detail: 'a credential',
      count: secrets.count,
    });
  }

  const pii = detectPii(secrets.text);
  if (pii.hasPii) {
    violations.push({
      kind: 'pii',
      severity: 'redact',
      detail: pii.findings
        .map((finding) => (finding.type === 'phone' ? 'a phone number' : 'an email address'))
        .join(' and '),
      count: pii.findings.reduce((sum: number, finding: typeof pii.findings[0]) => sum + finding.count, 0),
    });
  }

  const tokens = tokenize(pii.text);
  const promptPhrases = SYSTEM_PROMPT_PHRASES.filter((phrase) =>
    holdsPhrase(tokens, phrase)
  );
  if (promptPhrases.length > 0) {
    violations.push({
      kind: 'system_prompt',
      severity: options.sensitivity === 'strict' ? 'block' : 'warn',
      detail: 'the answer refers to the instructions',
      count: promptPhrases.length,
    });
  }

  violations.push(...findToneViolations(pii.text));

  const isValid = !violations.some(
    (violation) => violation.severity === 'block'
  );

  return {
    text: pii.text,
    isValid,
    violations,
    wasRedacted: pii.text !== response,
    fallback: options.fallback ?? "I don't have enough information in Ankit's professional profile to answer that accurately. I can tell you about his experience with automation, backend quality, cloud, CI/CD or his engineering projects.",
  };
}