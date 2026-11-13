/**
 * The ceilings of the size of the site.
 *
 * The measurement of the site lives in `scripts/measurePerformance.mts`, which
 * reads the output of a build and compares it with the numbers of this file.
 * Every number of this file was read on 2026-11-12 on a production build of
 * this repository, and the note of every rule says where its number came
 * from and when it was read.
 *
 * A rule of the kind `atMost` fails when the value is over its ceiling, and a
 * rule of the kind `atLeast` fails when the value is under its floor. A value
 * that is measured and that is not in this file is reported and is not a
 * failure: the budget grows on purpose, and a measure that is new never
 * breaks the build of the CI by accident.
 *
 * The ceiling of a size is a little above the size of today, so that a build
 * that is a little different does not fail the pipeline. The tasks of the
 * milestone make the site smaller, and a size that goes down never fails a
 * rule.
 */

/** What a number of a rule counts. */
export type BudgetUnit = 'bytes' | 'files' | 'seconds';

/** The direction of a rule. */
export type BudgetKind = 'atMost' | 'atLeast';

/** One rule of the budget. */
export interface BudgetLimit {
  /** The name of the rule, the same name the measurement uses. */
  name: string;
  /** The direction of the rule. */
  kind: BudgetKind;
  /** The number that is allowed. */
  limit: number;
  /** What the number counts. */
  unit: BudgetUnit;
  /** Where the number came from and when it was read. */
  note: string;
}

/** The routes of the API, whose answers are never to be kept. */
const API_ROUTES = ['chat', 'contact', 'job-fit', 'feedback', 'analytics'] as const;

/** The files of `public/` that the site serves by hand. */
const PUBLIC_FILES = [
  'README.md',
  'file.svg',
  'globe.svg',
  'next.svg',
  'resume.pdf',
  'vercel.svg',
  'window.svg',
] as const;

/**
 * The budget of the site.
 *
 * The name of a rule is the name of the measure of the script, and the
 * measures are:
 *
 * - `first-load-js:<page>` – the JavaScript the page sends in its first load
 * - `css:<page>` – the CSS the page sends
 * - `preloaded-fonts:<page>` – the number of the fonts the page preloads
 * - `html-size:<page>` – the HTML of the page, not compressed
 * - `html-gzip:<page>` – the HTML of the page, compressed
 * - `images:<page>` – the number of the pictures the page sends
 * - `cache-max-age:<page>` – the seconds the page is kept
 * - `cache-max-age:public/<file>` – the seconds the browser keeps a file of `public/`
 * - `cache-max-age:file/<file>` – the seconds the browser keeps another file of the site
 * - `cache-max-age:api/<route>` – the seconds the browser keeps the answer of an API route
 * - `build-client-js` – the JavaScript of the whole build
 * - `build-largest-chunk` – the biggest chunk of the build
 * - `build-css` – the CSS of the whole build
 * - `build-font-files` – the number of the font files of the build
 * - `build-font-bytes` – the size of the font files of the build
 */
export const PERFORMANCE_BUDGETS: Record<string, BudgetLimit> = {
  // The JavaScript of the first load of every page. It is the measure that
  // matters the most: it is what a visitor of a page of the site downloads
  // before the page is usable. The numbers were read on 2026-11-12, and the
  // ceilings are a little above them.
  'first-load-js:home': {
    name: 'first-load-js:home',
    kind: 'atMost',
    limit: 1_370_000,
    unit: 'bytes',
    note: 'The home page sent 1,336,092 bytes in fifteen files on 2026-11-12',
  },
  'first-load-js:contact': {
    name: 'first-load-js:contact',
    kind: 'atMost',
    limit: 1_330_000,
    unit: 'bytes',
    note: 'The page of the contact sent 1,294,610 bytes in fifteen files on 2026-11-12',
  },
  'first-load-js:design-system': {
    name: 'first-load-js:design-system',
    kind: 'atMost',
    limit: 1_030_000,
    unit: 'bytes',
    note: 'The page of the design system sent 1,003,808 bytes in fourteen files on 2026-11-12',
  },
  'first-load-js:job-fit': {
    name: 'first-load-js:job-fit',
    kind: 'atMost',
    limit: 1_040_000,
    unit: 'bytes',
    note: 'The page of the analyzer sent 1,013,080 bytes in fourteen files on 2026-11-12',
  },
  'first-load-js:projects': {
    name: 'first-load-js:projects',
    kind: 'atMost',
    limit: 1_340_000,
    unit: 'bytes',
    note: 'The page of the projects sent 1,303,996 bytes in fifteen files on 2026-11-12',
  },
  'first-load-js:resume': {
    name: 'first-load-js:resume',
    kind: 'atMost',
    limit: 1_050_000,
    unit: 'bytes',
    note: 'The page of the resume sent 1,022,523 bytes in fourteen files on 2026-11-12',
  },

  // The CSS of the site. It is one file and every page sends it.
  'css:home': {
    name: 'css:home',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'Every page sent the same file of 38,760 bytes on 2026-11-12',
  },
  'css:contact': {
    name: 'css:contact',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'Every page sent the same file of 38,760 bytes on 2026-11-12',
  },
  'css:design-system': {
    name: 'css:design-system',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'Every page sent the same file of 38,760 bytes on 2026-11-12',
  },
  'css:job-fit': {
    name: 'css:job-fit',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'Every page sent the same file of 38,760 bytes on 2026-11-12',
  },
  'css:projects': {
    name: 'css:projects',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'Every page sent the same file of 38,760 bytes on 2026-11-12',
  },
  'css:resume': {
    name: 'css:resume',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'Every page sent the same file of 38,760 bytes on 2026-11-12',
  },

  // The fonts that a page preloads. The layout loads two families today and
  // one of them is used by one page only, which is what M21.05 fixes.
  'preloaded-fonts:home': {
    name: 'preloaded-fonts:home',
    kind: 'atMost',
    limit: 2,
    unit: 'files',
    note: 'The home page preloaded two fonts on 2026-11-12',
  },
  'preloaded-fonts:contact': {
    name: 'preloaded-fonts:contact',
    kind: 'atMost',
    limit: 2,
    unit: 'files',
    note: 'The page of the contact preloaded two fonts on 2026-11-12',
  },
  'preloaded-fonts:design-system': {
    name: 'preloaded-fonts:design-system',
    kind: 'atMost',
    limit: 2,
    unit: 'files',
    note: 'The page of the design system preloaded two fonts on 2026-11-12',
  },
  'preloaded-fonts:job-fit': {
    name: 'preloaded-fonts:job-fit',
    kind: 'atMost',
    limit: 2,
    unit: 'files',
    note: 'The page of the analyzer preloaded two fonts on 2026-11-12',
  },
  'preloaded-fonts:projects': {
    name: 'preloaded-fonts:projects',
    kind: 'atMost',
    limit: 2,
    unit: 'files',
    note: 'The page of the projects preloaded two fonts on 2026-11-12',
  },
  'preloaded-fonts:resume': {
    name: 'preloaded-fonts:resume',
    kind: 'atMost',
    limit: 2,
    unit: 'files',
    note: 'The page of the resume preloaded two fonts on 2026-11-12',
  },

  // The HTML of every page, and the same HTML compressed.
  'html-size:home': {
    name: 'html-size:home',
    kind: 'atMost',
    limit: 126_000,
    unit: 'bytes',
    note: 'The home page sent 121,855 bytes of HTML on 2026-11-12',
  },
  'html-gzip:home': {
    name: 'html-gzip:home',
    kind: 'atMost',
    limit: 19_500,
    unit: 'bytes',
    note: 'The home page sent 18,911 bytes of HTML compressed on 2026-11-12',
  },
  'html-size:contact': {
    name: 'html-size:contact',
    kind: 'atMost',
    limit: 27_500,
    unit: 'bytes',
    note: 'The page of the contact sent 26,759 bytes of HTML on 2026-11-12',
  },
  'html-gzip:contact': {
    name: 'html-gzip:contact',
    kind: 'atMost',
    limit: 5_900,
    unit: 'bytes',
    note: 'The page of the contact sent 5,648 bytes of HTML compressed on 2026-11-12',
  },
  'html-size:design-system': {
    name: 'html-size:design-system',
    kind: 'atMost',
    limit: 37_500,
    unit: 'bytes',
    note: 'The page of the design system sent 36,277 bytes of HTML on 2026-11-12',
  },
  'html-gzip:design-system': {
    name: 'html-gzip:design-system',
    kind: 'atMost',
    limit: 6_700,
    unit: 'bytes',
    note: 'The page of the design system sent 6,453 bytes of HTML compressed on 2026-11-12',
  },
  'html-size:job-fit': {
    name: 'html-size:job-fit',
    kind: 'atMost',
    limit: 23_600,
    unit: 'bytes',
    note: 'The page of the analyzer sent 22,935 bytes of HTML on 2026-11-12',
  },
  'html-gzip:job-fit': {
    name: 'html-gzip:job-fit',
    kind: 'atMost',
    limit: 5_600,
    unit: 'bytes',
    note: 'The page of the analyzer sent 5,367 bytes of HTML compressed on 2026-11-12',
  },
  'html-size:projects': {
    name: 'html-size:projects',
    kind: 'atMost',
    limit: 63_000,
    unit: 'bytes',
    note: 'The page of the projects sent 61,574 bytes of HTML on 2026-11-12',
  },
  'html-gzip:projects': {
    name: 'html-gzip:projects',
    kind: 'atMost',
    limit: 9_100,
    unit: 'bytes',
    note: 'The page of the projects sent 8,778 bytes of HTML compressed on 2026-11-12',
  },
  'html-size:resume': {
    name: 'html-size:resume',
    kind: 'atMost',
    limit: 59_000,
    unit: 'bytes',
    note: 'The page of the resume sent 57,399 bytes of HTML on 2026-11-12',
  },
  'html-gzip:resume': {
    name: 'html-gzip:resume',
    kind: 'atMost',
    limit: 9_100,
    unit: 'bytes',
    note: 'The page of the resume sent 8,758 bytes of HTML compressed on 2026-11-12',
  },

  // The pictures of a page. There is none today: the site has no raster
  // image at all. A picture that is added to a page is a change of the site
  // and the ceiling is raised on purpose, with the note that says so.
  'images:home': {
    name: 'images:home',
    kind: 'atMost',
    limit: 0,
    unit: 'files',
    note: 'The home page sent no picture on 2026-11-12',
  },
  'images:contact': {
    name: 'images:contact',
    kind: 'atMost',
    limit: 0,
    unit: 'files',
    note: 'The page of the contact sent no picture on 2026-11-12',
  },
  'images:design-system': {
    name: 'images:design-system',
    kind: 'atMost',
    limit: 0,
    unit: 'files',
    note: 'The page of the design system sent no picture on 2026-11-12',
  },
  'images:job-fit': {
    name: 'images:job-fit',
    kind: 'atMost',
    limit: 0,
    unit: 'files',
    note: 'The page of the analyzer sent no picture on 2026-11-12',
  },
  'images:projects': {
    name: 'images:projects',
    kind: 'atMost',
    limit: 0,
    unit: 'files',
    note: 'The page of the projects sent no picture on 2026-11-12',
  },
  'images:resume': {
    name: 'images:resume',
    kind: 'atMost',
    limit: 0,
    unit: 'files',
    note: 'The page of the resume sent no picture on 2026-11-12',
  },

  // The whole build.
  'build-client-js': {
    name: 'build-client-js',
    kind: 'atMost',
    limit: 2_010_000,
    unit: 'bytes',
    note: 'The build held 1,965,463 bytes of client JavaScript in twenty-seven files on 2026-11-12',
  },
  'build-largest-chunk': {
    name: 'build-largest-chunk',
    kind: 'atMost',
    limit: 495_000,
    unit: 'bytes',
    note: 'The biggest chunk of the build was 483,541 bytes on 2026-11-12, and it is the SDK of the monitoring, which is loaded on its own',
  },
  'build-css': {
    name: 'build-css',
    kind: 'atMost',
    limit: 40_000,
    unit: 'bytes',
    note: 'The build held one file of CSS of 38,760 bytes on 2026-11-12',
  },
  'build-font-files': {
    name: 'build-font-files',
    kind: 'atMost',
    limit: 11,
    unit: 'files',
    note: 'The build held eleven files of fonts on 2026-11-12',
  },
  'build-font-bytes': {
    name: 'build-font-bytes',
    kind: 'atMost',
    limit: 150_000,
    unit: 'bytes',
    note: 'The fonts of the build held 146,464 bytes on 2026-11-12',
  },

  // The cache of the pages. The platform keeps them for a year, and the rule
  // says that it does not keep them for longer.
  'cache-max-age:home': {
    name: 'cache-max-age:home',
    kind: 'atMost',
    limit: 31_536_000,
    unit: 'seconds',
    note: 'The home page was served with s-maxage=31536000 on 2026-11-12',
  },
  'cache-max-age:contact': {
    name: 'cache-max-age:contact',
    kind: 'atMost',
    limit: 31_536_000,
    unit: 'seconds',
    note: 'The page of the contact was served with s-maxage=31536000 on 2026-11-12',
  },
  'cache-max-age:design-system': {
    name: 'cache-max-age:design-system',
    kind: 'atMost',
    limit: 31_536_000,
    unit: 'seconds',
    note: 'The page of the design system was served with s-maxage=31536000 on 2026-11-12',
  },
  'cache-max-age:job-fit': {
    name: 'cache-max-age:job-fit',
    kind: 'atMost',
    limit: 31_536_000,
    unit: 'seconds',
    note: 'The page of the analyzer was served with s-maxage=31536000 on 2026-11-12',
  },
  'cache-max-age:projects': {
    name: 'cache-max-age:projects',
    kind: 'atMost',
    limit: 31_536_000,
    unit: 'seconds',
    note: 'The page of the projects was served with s-maxage=31536000 on 2026-11-12',
  },
  'cache-max-age:resume': {
    name: 'cache-max-age:resume',
    kind: 'atMost',
    limit: 31_536_000,
    unit: 'seconds',
    note: 'The page of the resume was served with s-maxage=31536000 on 2026-11-12',
  },

  // The cache of the files of `public/`. The browser asks for them on every
  // visit today, and the floor of zero says what the state of today is. The
  // task of the cache of the milestone sets the rule of the files and raises
  // this floor on purpose.
  ...Object.fromEntries(
    PUBLIC_FILES.map((file) => [
      `cache-max-age:public/${file}`,
      {
        name: `cache-max-age:public/${file}`,
        kind: 'atLeast',
        limit: 0,
        unit: 'seconds',
        note: `The browser kept public/${file} for 0 seconds on 2026-11-12, and asked for it on every visit`,
      } satisfies BudgetLimit,
    ])
  ),

  // The cache of the answers of the API. They carry what a visitor wrote, and
  // they are never to be kept.
  ...Object.fromEntries(
    API_ROUTES.map((route) => [
      `cache-max-age:api/${route}`,
      {
        name: `cache-max-age:api/${route}`,
        kind: 'atMost',
        limit: 0,
        unit: 'seconds',
        note: `The answer of /api/${route} was not kept on 2026-11-12`,
      } satisfies BudgetLimit,
    ])
  ),

  // The other files of the site. The icon of the site is asked for on every
  // visit today, and the floor of zero says what the state of today is.
  'cache-max-age:file/favicon.ico': {
    name: 'cache-max-age:file/favicon.ico',
    kind: 'atLeast',
    limit: 0,
    unit: 'seconds',
    note: 'The browser kept the icon of the site for 0 seconds on 2026-11-12, and asked for it on every visit',
  },
};

/** A rule that was not met. */
export interface BudgetFailure {
  /** The name of the rule. */
  name: string;
  /** The direction of the rule. */
  kind: BudgetKind;
  /** The number that was measured. */
  measured: number;
  /** The number that was allowed. */
  limit: number;
  /** What the number counts. */
  unit: BudgetUnit;
}

/** The result of the comparison of a measurement with the budget. */
export interface BudgetEvaluation {
  /** Every measure that was read, by name. */
  measured: Record<string, number>;
  /** The rules that were not met. */
  failures: BudgetFailure[];
  /** The measures that were read and that are not in the budget. */
  withoutBudget: string[];
}

/**
 * Compares a measurement with the budget.
 *
 * The measurement is a map of the name of a measure and of its value. A
 * measure that is in the budget and that is over its ceiling, or under its
 * floor, is a failure. A measure that is not in the budget is reported and is
 * not a failure. A rule of the budget that was not measured is not a failure
 * either: it is left alone and it is not reported, because a rule that the
 * script did not read is a rule that the script cannot judge.
 *
 * @param measured The measures that were read.
 * @param budgets The budget to compare them with.
 * @returns The measures, the rules that were not met and the measures that
 *   are not in the budget.
 */
export function evaluateBudgets(
  measured: Record<string, number>,
  budgets: Record<string, BudgetLimit> = PERFORMANCE_BUDGETS
): BudgetEvaluation {
  const failures: BudgetFailure[] = [];
  const withoutBudget: string[] = [];

  for (const [name, value] of Object.entries(measured)) {
    const rule = budgets[name];

    if (!rule) {
      withoutBudget.push(name);
      continue;
    }

    const broken = rule.kind === 'atMost' ? value > rule.limit : value < rule.limit;

    if (broken) {
      failures.push({
        name,
        kind: rule.kind,
        measured: value,
        limit: rule.limit,
        unit: rule.unit,
      });
    }
  }

  return { measured, failures, withoutBudget };
}

/**
 * Writes a number of bytes in a way a person reads it.
 *
 * @param bytes The number of bytes.
 * @returns The number, in kilobytes or in megabytes when it is big enough.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return `${bytes} bytes`;
  }

  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(2)} MB (${bytes} bytes)`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} kB (${bytes} bytes)`;
  }

  return `${bytes} bytes`;
}

/**
 * Writes a number of seconds in a way a person reads it.
 *
 * @param seconds The number of seconds.
 * @returns The number, in the unit that fits it.
 */
export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return `${seconds} seconds`;
  }

  if (seconds >= 86_400) {
    return `${(seconds / 86_400).toFixed(1)} days (${seconds} seconds)`;
  }

  if (seconds >= 3600) {
    return `${(seconds / 3600).toFixed(1)} hours (${seconds} seconds)`;
  }

  if (seconds >= 60) {
    return `${(seconds / 60).toFixed(1)} minutes (${seconds} seconds)`;
  }

  return `${seconds} seconds`;
}
