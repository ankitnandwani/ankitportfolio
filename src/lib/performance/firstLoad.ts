/**
 * The rules of the first load of the site.
 *
 * The first load is the JavaScript that the browser downloads before the page
 * of the site answers to the visitor. A part of the site belongs there and a
 * part of it does not:
 *
 * - The hero is the first thing of the home page and it is the biggest piece
 *   of content of the page. It has to be in the first load.
 * - The launcher of the chat is the button that opens the chat of the site.
 *   It has to be in the first load, so that the button is there the moment
 *   the page is.
 * - The panel of the chat and the body of the command palette are loaded when
 *   the visitor asks for them. They have not to be in the first load.
 *
 * The rule is checked on the build and not on the source: a rule on the source
 * cannot tell that a part of the site is in the first load, because the first
 * load is a property of the build.
 *
 * The markers are the words of the code that only one part of the site has.
 * They survive the minifier, because they are the text of the page and of the
 * attributes of the page, and they are written the way they are in the
 * source, so that the rule does not break when the form of the attributes
 * changes in the build.
 */

/** Where a part of the site is expected to be. */
export type FirstLoadExpectation = 'inFirstLoad' | 'outOfFirstLoad';

/** Where the rule is checked. */
export type FirstLoadScope = 'every' | 'home';

/** One rule of the first load. */
export interface FirstLoadRule {
  /** The name of the rule. */
  name: string;
  /** The words of the code that only this part of the site has. */
  marker: string;
  /** Where the part of the site is expected to be. */
  expectation: FirstLoadExpectation;
  /** The pages the rule is checked on. */
  scope: FirstLoadScope;
  /** Why the rule is what it is. */
  note: string;
}

/** The rules of the first load of the site. */
export const FIRST_LOAD_RULES: FirstLoadRule[] = [
  {
    name: 'hero',
    marker: 'ANKIT NANDWANI',
    expectation: 'inFirstLoad',
    scope: 'home',
    note: 'The hero is the first thing of the home page and the biggest piece of content of the page',
  },
  {
    name: 'chat-launcher',
    marker: 'chat-panel',
    expectation: 'inFirstLoad',
    scope: 'every',
    note: 'The button that opens the chat has to be there the moment the page is',
  },
  {
    name: 'chat-panel',
    marker: 'Chat message input',
    expectation: 'outOfFirstLoad',
    scope: 'every',
    note: 'The panel of the chat is loaded when the chat is opened, and it is not rendered when the chat is closed',
  },
  {
    name: 'command-palette-body',
    marker: 'Search commands...',
    expectation: 'outOfFirstLoad',
    scope: 'every',
    note: 'The body of the palette is loaded when the palette is opened, and it is not rendered when the palette is closed',
  },
];

/** One file of the first load. */
export interface FirstLoadChunk {
  /** The name of the file. */
  name: string;
  /** The content of the file. */
  content: string;
}

/** A rule of the first load that was not met. */
export interface FirstLoadFailure {
  /** The name of the rule. */
  name: string;
  /** Where the part of the site was expected to be. */
  expectation: FirstLoadExpectation;
  /** Where the part of the site was found. */
  found: FirstLoadExpectation;
  /** The words the rule looked for. */
  marker: string;
  /** Why the rule is what it is. */
  note: string;
}

/** The result of the check of the rules of the first load. */
export interface FirstLoadEvaluation {
  /** The number of the rules that were checked. */
  checked: number;
  /** The rules that were not met. */
  failures: FirstLoadFailure[];
}

/**
 * Checks the rules of the first load against the files of the first load.
 *
 * A rule that expects a part of the site to be in the first load fails when
 * its words are in none of the files, and a rule that expects a part of the
 * site to be out of the first load fails when its words are in one of them.
 *
 * @param chunks The files of the first load, with their content.
 * @param rules The rules to check.
 * @returns The number of the rules that were checked and the rules that were
 *   not met.
 */
export function evaluateFirstLoadRules(
  chunks: FirstLoadChunk[],
  rules: FirstLoadRule[] = FIRST_LOAD_RULES
): FirstLoadEvaluation {
  const failures: FirstLoadFailure[] = [];

  for (const rule of rules) {
    const found = chunks.some((chunk) => chunk.content.includes(rule.marker));
    const expectedFound = rule.expectation === 'inFirstLoad';

    if (found !== expectedFound) {
      failures.push({
        name: rule.name,
        expectation: rule.expectation,
        found: found ? 'inFirstLoad' : 'outOfFirstLoad',
        marker: rule.marker,
        note: rule.note,
      });
    }
  }

  return { checked: rules.length, failures };
}

/**
 * The rules that are checked on a page.
 *
 * @param route The route of the page.
 * @param rules The rules of the first load.
 * @returns The rules that are checked on that page.
 */
export function getFirstLoadRulesForRoute(
  route: string,
  rules: FirstLoadRule[] = FIRST_LOAD_RULES
): FirstLoadRule[] {
  if (route === '/') {
    return rules;
  }

  return rules.filter((rule) => rule.scope === 'every');
}
