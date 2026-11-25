/**
 * The cache of the site, as the rules of it.
 *
 * The rule of every file is written by the use of it and not by its name: a
 * file that never changes is kept for a long time, a file that the owner
 * replaces is kept for a short time and is checked again, and an answer of
 * the API is never kept.
 *
 * The rules live here and not in `next.config.ts`, so that the tests of the
 * repository can read them without loading the framework and the monitoring
 * of it. The configuration of the site uses them as they are.
 */

/** The seconds of a year, the long cache of the platform and of the code. */
export const A_YEAR = 31_536_000;

/** The seconds of an hour, the cache of the file that the owner replaces. */
export const AN_HOUR = 3_600;

/** One rule of the cache: the addresses it is for and the headers they get. */
export interface CacheHeaderRule {
  /** The pattern of the addresses the rule is for. */
  source: string;
  /** The headers that the addresses get. */
  headers: { key: string; value: string }[];
}

/** The rules of the cache of the site. */
export const CACHE_HEADERS: CacheHeaderRule[] = [
  {
    // The pages of the site. The long cache of the platform is kept, and the
    // window of the old copy is added: a visitor is served a copy that is a
    // little old while the platform makes the new one, and is never the
    // first one to wait for a page.
    //
    // The answers of the API and the files of their own rules are left out,
    // and so is everything under `/_next/`, whose name holds the sum of its
    // bytes and which the platform already keeps for a year.
    source: '/((?!api|_next|favicon\\.ico|og-image\\.png|resume\\.pdf).*)',
    headers: [
      {
        key: 'Cache-Control',
        value: `public, s-maxage=${A_YEAR}, stale-while-revalidate=${A_YEAR}`,
      },
    ],
  },
  {
    // The icon of the site. It changes a few times a year at most.
    source: '/favicon.ico',
    headers: [{ key: 'Cache-Control', value: `public, max-age=${A_YEAR}, immutable` }],
  },
  {
    // The picture of the social networks. It is made once and it is in the
    // repository, and it changes when the site changes its look.
    source: '/og-image.png',
    headers: [{ key: 'Cache-Control', value: `public, max-age=${A_YEAR}, immutable` }],
  },
  {
    // The CV of the owner. He replaces it, so it is kept for an hour and is
    // checked again: the new CV is seen the same day.
    source: '/resume.pdf',
    headers: [{ key: 'Cache-Control', value: `public, max-age=${AN_HOUR}, must-revalidate` }],
  },
  {
    // The answers of the API. They carry what a visitor wrote and what the
    // model answered, and they are never to be kept by a browser and by a
    // cache.
    source: '/api/:path*',
    headers: [{ key: 'Cache-Control', value: 'no-store' }],
  },
];
