import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkFontPreloads,
  findFamiliesOfClasses,
  findFamilyOfFile,
  type FontFamily,
  type PageFontUsage,
} from './fontPreloads.ts';

/** The class that gives the variable of the family of the site. */
const SITE_CLASS = 'geist_a71539c9-module__T19VSG__variable';

/** The class that gives the variable of the family of the monospaced letters. */
const MONO_CLASS = 'geist_mono_4e26fe1b-module__-_Fr9q__variable';

/** The file of the family of the site. */
const SITE_FILE = 'caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2';

/** The file of the family of the monospaced letters. */
const MONO_FILE = '797e433ab948586e-s.p.0r6juujl39pe6.woff2';

/** The two families of the site, as the build shows them. */
const FAMILIES: FontFamily[] = [
  {
    name: 'Geist',
    variable: '--font-geist-sans',
    className: SITE_CLASS,
    files: [SITE_FILE],
  },
  {
    name: 'Geist Mono',
    variable: '--font-geist-mono',
    className: MONO_CLASS,
    files: [MONO_FILE],
  },
];

/**
 * A page of the site, as the HTML of the page says of it.
 *
 * @param route The route of the page.
 * @param preloaded The files that the page preloads.
 * @param pageClasses The classes that the content of the page gives to its elements.
 * @param shellClasses The classes that the shell of the page gives to its elements.
 * @returns What the page says about the fonts.
 */
function page(
  route: string,
  preloaded: string[],
  pageClasses: string[] = [],
  shellClasses: string[] = [SITE_CLASS]
): PageFontUsage {
  return { route, preloaded, shellClasses, pageClasses };
}

test('a page that preloads the family of the monospaced letters and does not use it fails', () => {
  const failures = checkFontPreloads(FAMILIES, [page('/', [SITE_FILE, MONO_FILE])]);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].kind, 'unused-preload');
  assert.equal(failures[0].route, '/');
  assert.equal(failures[0].family, 'Geist Mono');
});

test('a page that preloads only the family of the site passes', () => {
  const failures = checkFontPreloads(FAMILIES, [page('/', [SITE_FILE])]);

  assert.equal(failures.length, 0);
});

test('a page that uses the family of the monospaced letters and preloads it passes', () => {
  const failures = checkFontPreloads(FAMILIES, [
    page('/design-system', [SITE_FILE, MONO_FILE], [MONO_CLASS]),
  ]);

  assert.equal(failures.length, 0);
});

test('a page that uses the family of the monospaced letters and does not preload it passes', () => {
  const failures = checkFontPreloads(FAMILIES, [page('/', [SITE_FILE], [MONO_CLASS])]);

  assert.equal(failures.length, 0);
});

test('a page that does not preload the family of the site fails', () => {
  const failures = checkFontPreloads(FAMILIES, [page('/', [])]);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].kind, 'missing-site-preload');
  assert.equal(failures[0].family, 'Geist');
});

test('a shell that holds a family besides the family of the site fails', () => {
  const failures = checkFontPreloads(FAMILIES, [
    page('/', [SITE_FILE, MONO_FILE], [], [SITE_CLASS, MONO_CLASS]),
  ]);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].kind, 'extra-shell-family');
  assert.equal(failures[0].family, 'Geist, Geist Mono');
});

test('a file that belongs to no family is not counted', () => {
  const failures = checkFontPreloads(FAMILIES, [
    page('/', [SITE_FILE, 'a-file-of-another-family.woff2']),
  ]);

  assert.equal(failures.length, 0);
});

test('every page that breaks the rule is told apart', () => {
  const failures = checkFontPreloads(FAMILIES, [
    page('/', [SITE_FILE, MONO_FILE]),
    page('/contact', [SITE_FILE]),
    page('/projects', [MONO_FILE]),
  ]);

  assert.equal(failures.length, 3);
  assert.deepEqual(
    failures.map((failure) => `${failure.route}:${failure.kind}`),
    ['/:unused-preload', '/projects:unused-preload', '/projects:missing-site-preload']
  );
});

test('the family of a file of the media is found', () => {
  const family = findFamilyOfFile(FAMILIES, MONO_FILE);

  assert.equal(family?.name, 'Geist Mono');
  assert.equal(family?.variable, '--font-geist-mono');
});

test('a file that belongs to no family has no family', () => {
  assert.equal(findFamilyOfFile(FAMILIES, 'a-file-of-another-family.woff2'), null);
});

test('the families of a list of classes are found', () => {
  const found = findFamiliesOfClasses(FAMILIES, [MONO_CLASS, 'h-full', 'antialiased']);

  assert.equal(found.length, 1);
  assert.equal(found[0].name, 'Geist Mono');
});
