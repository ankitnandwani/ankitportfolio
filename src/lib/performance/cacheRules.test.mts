import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkCacheRules,
  hasStaleWhileRevalidate,
  keepsAnAnswer,
  marksAsNotToBeKept,
  type CacheHeader,
} from './cacheRules.ts';

/** The header of a page that keeps the long cache and the old copy. */
const PAGE_HEADER = 'public, s-maxage=31536000, stale-while-revalidate=31536000';

/** The header of an answer that is not to be kept. */
const API_HEADER = 'no-store';

/**
 * A page of the site, with the header of its cache.
 *
 * @param address The address of the page.
 * @param cacheControl The header of the cache.
 * @returns The cache of the page.
 */
function page(address: string, cacheControl: string): CacheHeader {
  return { address, cacheControl };
}

test('a page that keeps the long cache and the old copy passes', () => {
  const failures = checkCacheRules([page('/', PAGE_HEADER)], [page('/api/chat', API_HEADER)]);

  assert.equal(failures.length, 0);
});

test('a page without the old copy fails', () => {
  const failures = checkCacheRules(
    [page('/', 'public, s-maxage=31536000')],
    [page('/api/chat', API_HEADER)]
  );

  assert.equal(failures.length, 1);
  assert.equal(failures[0].address, '/');
  assert.equal(failures[0].note.includes('old copy'), true);
});

test('a page without the long cache of the platform fails', () => {
  const failures = checkCacheRules(
    [page('/', 'public, s-maxage=60, stale-while-revalidate=60')],
    [page('/api/chat', API_HEADER)]
  );

  assert.equal(failures.length, 1);
  assert.equal(failures[0].note.includes('long cache'), true);
});

test('an answer of the API that is not marked as not to be kept fails', () => {
  const failures = checkCacheRules(
    [page('/', PAGE_HEADER)],
    [page('/api/feedback', 'public, max-age=0, must-revalidate')]
  );

  assert.equal(failures.length, 1);
  assert.equal(failures[0].address, '/api/feedback');
  assert.equal(failures[0].note.includes('not marked'), true);
});

test('an answer of the API that is kept fails', () => {
  const failures = checkCacheRules(
    [page('/', PAGE_HEADER)],
    [page('/api/chat', 'public, max-age=3600')]
  );

  assert.equal(failures.length, 2);
  assert.equal(failures[1].note.includes('is kept'), true);
});

test('every address that breaks the rule is told apart', () => {
  const failures = checkCacheRules(
    [page('/', 's-maxage=31536000'), page('/contact', 's-maxage=31536000')],
    [page('/api/chat', ''), page('/api/contact', 'public, s-maxage=60')]
  );

  assert.deepEqual(
    failures.map((failure) => failure.address),
    ['/', '/contact', '/api/chat', '/api/contact', '/api/contact']
  );
});

test('the window of the old copy is found', () => {
  assert.equal(hasStaleWhileRevalidate(PAGE_HEADER), true);
  assert.equal(hasStaleWhileRevalidate('public, s-maxage=31536000'), false);
  assert.equal(hasStaleWhileRevalidate('no-store'), false);
});

test('an answer that is kept is found', () => {
  assert.equal(keepsAnAnswer('public, max-age=3600'), true);
  assert.equal(keepsAnAnswer('public, s-maxage=31536000'), true);
  assert.equal(keepsAnAnswer('public, max-age=0, must-revalidate'), false);
  assert.equal(keepsAnAnswer('no-store'), false);
  assert.equal(keepsAnAnswer(''), false);
});

test('an answer that is marked as not to be kept is found', () => {
  assert.equal(marksAsNotToBeKept('no-store'), true);
  assert.equal(marksAsNotToBeKept('public, max-age=0, no-store'), true);
  assert.equal(marksAsNotToBeKept('public, max-age=0'), false);
});
