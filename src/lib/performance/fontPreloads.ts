/**
 * The rule of the preloads of the fonts.
 *
 * A family of fonts that a page does not use must not be preloaded by that
 * page. The preload asks the browser for bytes that the page will never draw,
 * and it takes the place of the bytes of the family that the page does use.
 *
 * The rule is read out of the build:
 *
 * - the CSS of the build says which file of the media belongs to which family
 *   and which class of CSS gives the variable of the family;
 * - the HTML of a page says which files the page preloads, which classes the
 *   shell of the page gives to the `html` and to the `body`, and which classes
 *   the content of the page gives to its own elements.
 *
 * The shell of the page is the layout of the site, and the shell holds the
 * family of the text of the site. A family that the shell holds besides that
 * one is a family that only some pages need, and the rule says that the shell
 * holds one family and no more.
 *
 * The rule has three sides:
 *
 * - the shell of a page holds one family of fonts and no more;
 * - a page must not preload a family that neither the shell nor the content
 *   of the page uses;
 * - a page must preload the family of the site, because the family of the
 *   site is the text of the page.
 *
 * The rule is a rule on the build, and the measurement of the site reads the
 * build and fails when a page breaks it. The measurement is in
 * `scripts/measurePerformance.mts`.
 */

/** A family of fonts, as the build shows it. */
export interface FontFamily {
  /** The name of the family, such as `Geist Mono`. */
  name: string;
  /** The variable of CSS that holds the family, such as `--font-geist-mono`. */
  variable: string;
  /** The class of CSS that gives the variable, such as `geist_mono_…__variable`. */
  className: string;
  /** The files of the family in the build, such as `797e433a….woff2`. */
  files: string[];
}

/** What the HTML of a page says about the fonts. */
export interface PageFontUsage {
  /** The route of the page, such as `/design-system`. */
  route: string;
  /** The files of the fonts that the page preloads. */
  preloaded: string[];
  /** The classes that the shell of the page gives to the `html` and to the `body`. */
  shellClasses: string[];
  /** The classes that the content of the page gives to its own elements. */
  pageClasses: string[];
}

/** The three ways in which a page can break the rule. */
export type FontPreloadFailureKind =
  /** The shell of the page holds more than one family of fonts. */
  | 'extra-shell-family'
  /** The page preloads a family that it does not use. */
  | 'unused-preload'
  /** The page uses the family of the site and does not preload it. */
  | 'missing-site-preload';

/** A page that breaks the rule. */
export interface FontPreloadFailure {
  /** The way in which the page breaks the rule. */
  kind: FontPreloadFailureKind;
  /** The route of the page. */
  route: string;
  /** The name of the family. */
  family: string;
  /** Why the page breaks the rule. */
  note: string;
}

/**
 * Finds the family that a file of the media belongs to.
 *
 * @param families The families of the build.
 * @param file The name of the file of the media, such as `797e433a….woff2`.
 * @returns The family that owns the file, or null when no family owns it.
 */
export function findFamilyOfFile(families: FontFamily[], file: string): FontFamily | null {
  return families.find((family) => family.files.includes(file)) ?? null;
}

/**
 * Finds the families that a list of classes holds.
 *
 * @param families The families of the build.
 * @param classes The classes of the elements of the page.
 * @returns The families whose class is in the list.
 */
export function findFamiliesOfClasses(families: FontFamily[], classes: string[]): FontFamily[] {
  const names = new Set(classes);

  return families.filter((family) => names.has(family.className));
}

/**
 * Checks the preloads of the fonts of every page.
 *
 * @param families The families of the build.
 * @param pages What the HTML of every page says about the fonts.
 * @returns The pages that break the rule, with the reason.
 */
export function checkFontPreloads(
  families: FontFamily[],
  pages: PageFontUsage[]
): FontPreloadFailure[] {
  const failures: FontPreloadFailure[] = [];

  for (const page of pages) {
    const shell = findFamiliesOfClasses(families, page.shellClasses);
    const used = findFamiliesOfClasses(families, page.pageClasses);

    if (shell.length > 1) {
      failures.push({
        kind: 'extra-shell-family',
        route: page.route,
        family: shell.map((family) => family.name).join(', '),
        note: `the shell of the page holds ${shell.length} families of fonts: the layout holds the family of the text of the site and the families that only some pages need belong to those pages`,
      });
    }

    const allowed = new Set([...shell, ...used].map((family) => family.name));

    for (const file of page.preloaded) {
      const family = findFamilyOfFile(families, file);

      if (!family || allowed.has(family.name)) {
        continue;
      }

      failures.push({
        kind: 'unused-preload',
        route: page.route,
        family: family.name,
        note: `the page preloads ${file} of the family ${family.name} and does not use it`,
      });
    }

    for (const family of shell) {
      const preloaded = page.preloaded.some((file) => family.files.includes(file));

      if (preloaded) {
        continue;
      }

      failures.push({
        kind: 'missing-site-preload',
        route: page.route,
        family: family.name,
        note: `the shell of the page gives the family ${family.name} to the site and the page does not preload it`,
      });
    }
  }

  return failures;
}
