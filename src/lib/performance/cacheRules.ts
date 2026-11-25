/**
 * The rule of the cache.
 *
 * A page of the site is kept by the platform for a long time, and a copy that
 * is a little old may be served while the platform makes the new one, so that
 * a visitor is never the first one to wait for a page.
 *
 * An answer of the API carries what a visitor wrote and what the model
 * answered, and it is never to be kept by a browser and by a cache.
 *
 * The numbers of the cache are in `src/lib/performance/budgets.ts`: the
 * seconds that the browser keeps a file and the seconds that the platform
 * keeps a page. The rules that a number cannot say are here: the window of
 * the old copy of a page and the mark of the answers of the API.
 */

/** The seconds of a year, the long cache of the platform and of the code. */
export const LONG_CACHE_SECONDS = 31_536_000;

/** The cache of one address. */
export interface CacheHeader {
  /** The address, such as `/` or `/api/chat`. */
  address: string;
  /** The value of the header of the cache. */
  cacheControl: string;
}

/** An address whose cache is not the way it is used. */
export interface CacheRuleFailure {
  /** The address. */
  address: string;
  /** What is wrong with the cache of the address. */
  note: string;
}

/**
 * Reads the number of seconds of a directive of a header of the cache.
 *
 * @param cacheControl The value of the header.
 * @param directive The name of the directive, such as `max-age`.
 * @returns The number of seconds, or null when the directive is not there.
 */
function readSeconds(cacheControl: string, directive: string): number | null {
  const match = new RegExp(`(?:^|,)\\s*${directive}\\s*=\\s*(\\d+)`, 'i').exec(cacheControl);

  return match ? Number(match[1]) : null;
}

/**
 * Says whether a header lets an old copy be served while the new one is made.
 *
 * @param cacheControl The value of the header.
 * @returns True when the header has the directive.
 */
export function hasStaleWhileRevalidate(cacheControl: string): boolean {
  return /(?:^|,)\s*stale-while-revalidate\b/i.test(cacheControl);
}

/**
 * Says whether a header keeps an answer.
 *
 * An answer is kept when the browser or the platform is told to keep it for
 * a time that is not zero. A header that says `no-store` keeps nothing, and a
 * header that says nothing at all keeps nothing either.
 *
 * @param cacheControl The value of the header.
 * @returns True when the header keeps the answer.
 */
export function keepsAnAnswer(cacheControl: string): boolean {
  const browser = readSeconds(cacheControl, 'max-age');
  const shared = readSeconds(cacheControl, 's-maxage');

  return (browser !== null && browser > 0) || (shared !== null && shared > 0);
}

/**
 * Says whether a header marks an answer as not to be kept.
 *
 * @param cacheControl The value of the header.
 * @returns True when the header says `no-store`.
 */
export function marksAsNotToBeKept(cacheControl: string): boolean {
  return /(?:^|,)\s*no-store\b/i.test(cacheControl);
}

/**
 * Checks the cache of the pages and of the answers of the API.
 *
 * A page keeps the long cache of the platform and gains the window of the old
 * copy. An answer of the API is marked as not to be kept, and it is not kept
 * by any directive of time.
 *
 * @param pages The pages of the site and the header of their cache.
 * @param apiRoutes The routes of the API and the header of their cache.
 * @returns The addresses whose cache is not the way it is used.
 */
export function checkCacheRules(
  pages: CacheHeader[],
  apiRoutes: CacheHeader[]
): CacheRuleFailure[] {
  const failures: CacheRuleFailure[] = [];

  for (const page of pages) {
    const shared = readSeconds(page.cacheControl, 's-maxage');

    if (shared === null || shared < LONG_CACHE_SECONDS) {
      failures.push({
        address: page.address,
        note: `the page does not keep the long cache of the platform: the header says "${page.cacheControl}"`,
      });
    }

    if (!hasStaleWhileRevalidate(page.cacheControl)) {
      failures.push({
        address: page.address,
        note: `the page does not let an old copy be served while the new one is made: the header says "${page.cacheControl}"`,
      });
    }
  }

  for (const route of apiRoutes) {
    if (!marksAsNotToBeKept(route.cacheControl)) {
      failures.push({
        address: route.address,
        note: `the answer of the route of the API is not marked as not to be kept: the header says "${route.cacheControl}"`,
      });
    }

    if (keepsAnAnswer(route.cacheControl)) {
      failures.push({
        address: route.address,
        note: `the answer of the route of the API is kept: the header says "${route.cacheControl}"`,
      });
    }
  }

  return failures;
}
