import assert from 'node:assert/strict';
import test from 'node:test';

import { A_YEAR, AN_HOUR, CACHE_HEADERS } from './cacheHeaders.ts';
import { checkCacheRules } from './cacheRules.ts';

/**
 * The rule of the cache that is for an address.
 *
 * @param source The pattern of the addresses the rule is for.
 * @returns The value of the header of the cache.
 */
function cacheValueOf(source: string): string {
  const rule = CACHE_HEADERS.find((entry) => entry.source === source);

  assert.notEqual(rule, undefined);

  return rule?.headers[0]?.value ?? '';
}

test('the rule of the cache passes on the configuration that the repository holds', () => {
  const failures = checkCacheRules(
    [{ address: '/', cacheControl: cacheValueOf(CACHE_HEADERS[0].source) }],
    [{ address: '/api/chat', cacheControl: cacheValueOf('/api/:path*') }]
  );

  assert.equal(failures.length, 0);
});

test('a page keeps the long cache of the platform and gains the old copy', () => {
  const value = cacheValueOf(CACHE_HEADERS[0].source);

  assert.equal(value.includes(`s-maxage=${A_YEAR}`), true);
  assert.equal(value.includes('stale-while-revalidate'), true);
});

test('the rule of the pages leaves out the answers of the API and the code', () => {
  const source = CACHE_HEADERS[0].source;

  assert.equal(source.includes('api'), true);
  assert.equal(source.includes('_next'), true);
  assert.equal(source.includes('favicon'), true);
  assert.equal(source.includes('og-image'), true);
  assert.equal(source.includes('resume'), true);
});

test('the files that never change are kept for a year by the browser', () => {
  for (const source of ['/favicon.ico', '/og-image.png']) {
    const value = cacheValueOf(source);

    assert.equal(value.includes(`max-age=${A_YEAR}`), true);
    assert.equal(value.includes('immutable'), true);
  }
});

test('the CV of the owner is kept for an hour and is checked again', () => {
  const value = cacheValueOf('/resume.pdf');

  assert.equal(value.includes(`max-age=${AN_HOUR}`), true);
  assert.equal(value.includes('must-revalidate'), true);
});

test('the answers of the API are never kept', () => {
  assert.equal(cacheValueOf('/api/:path*'), 'no-store');
});

test('every rule of the cache sets the cache of the address', () => {
  for (const rule of CACHE_HEADERS) {
    assert.equal(rule.headers.length > 0, true);
    assert.equal(rule.headers[0].key, 'Cache-Control');
  }
});
