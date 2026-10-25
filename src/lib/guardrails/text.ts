/**
 * Text helpers the guardrails share.
 *
 * The comparison is done on tokens rather than on the raw text, so a phrase
 * is found whatever punctuation, casing or spacing is used. Every pattern is
 * matched the same way, which keeps the matching free of regular
 * expressions that could be slowed down by a long input.
 */

/**
 * Splits a text into the tokens that are compared.
 *
 * Everything that is not a letter or a digit becomes a separator, so
 * "CI/CD", "Node.js" and "C++" all become more than one token. The
 * comparison always applies the same rule to the pattern and to the text, so
 * both sides stay in step.
 *
 * @param text The text to split.
 * @returns The tokens of the text.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ]+/g, ' ')
    .split(' ')
    .filter((token) => token.length > 0);
}

/**
 * Removes the separators from a text.
 *
 * This catches a phrase that is written without spaces, such as
 * "ignorepreviousinstructions".
 *
 * @param text The text to squash.
 * @returns The text without separators.
 */
export function squash(text: string): string {
  return tokenize(text).join('');
}

/**
 * Reports whether a list of tokens contains a sequence of tokens.
 *
 * @param tokens The tokens of the text.
 * @param phrase The tokens of the phrase to look for.
 * @returns Whether the phrase is in the text.
 */
export function containsTokenSequence(
  tokens: string[],
  phrase: string[]
): boolean {
  if (phrase.length === 0 || phrase.length > tokens.length) return false;

  for (let start = 0; start + phrase.length <= tokens.length; start++) {
    let matched = true;

    for (let offset = 0; offset < phrase.length; offset++) {
      if (tokens[start + offset] !== phrase[offset]) {
        matched = false;
        break;
      }
    }

    if (matched) return true;
  }

  return false;
}

/**
 * The longest phrase the guardrails look for.
 */
export const MAX_PHRASE_LENGTH = 6;

/**
 * Builds an index of the phrases that are in a text.
 *
 * The index holds every run of one to `maxPhraseLength` words, so a phrase
 * is found with one lookup instead of a scan of the whole text. Without it,
 * every phrase would be compared against every position of the text, which
 * turns a long question into a slow one.
 *
 * @param tokens The tokens of the text.
 * @param maxPhraseLength The longest phrase to look for.
 * @returns The index of the phrases.
 */
export function buildPhraseIndex(
  tokens: string[],
  maxPhraseLength: number = MAX_PHRASE_LENGTH
): Set<string> {
  const index = new Set<string>();

  for (let start = 0; start < tokens.length; start++) {
    let phrase = '';

    for (
      let length = 1;
      length <= maxPhraseLength && start + length <= tokens.length;
      length++
    ) {
      const word = tokens[start + length - 1];
      phrase = phrase.length > 0 ? `${phrase} ${word}` : word;
      index.add(phrase);
    }
  }

  return index;
}

/**
 * Reports whether an index holds a phrase.
 *
 * @param index The index of the phrases of the text.
 * @param phrase The tokens of the phrase to look for.
 * @returns Whether the phrase is in the text.
 */
export function indexHasPhrase(
  index: Set<string>,
  phrase: string[]
): boolean {
  if (phrase.length === 0) return false;
  return index.has(phrase.join(' '));
}
