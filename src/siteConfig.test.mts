import test from 'node:test';
import assert from 'node:assert/strict';

import { getSiteHost, getSiteUrl, siteConfig } from './siteConfig.ts';

test('getSiteHost reads the host of a full address', () => {
  assert.equal(getSiteHost('https://ankitnandwani.com'), 'ankitnandwani.com');
});

test('getSiteHost leaves out the path, the scheme and the query', () => {
  assert.equal(getSiteHost('https://ankitnandwani.com/resume?a=1'), 'ankitnandwani.com');
  assert.equal(getSiteHost('http://localhost:3000'), 'localhost');
});

test('getSiteHost leaves out the port of a local address', () => {
  assert.equal(getSiteHost('http://localhost:3000/job-fit'), 'localhost');
});

test('getSiteHost falls back to the known address when the value cannot be read', () => {
  // A value that is still a placeholder is not an address, and the code
  // must not fail over a setting that has not been filled in.
  assert.equal(getSiteHost('your_site_url'), 'ankitnandwani.com');
  assert.equal(getSiteHost(''), 'ankitnandwani.com');
  assert.equal(getSiteHost('not a url'), 'ankitnandwani.com');
});

test('getSiteHost reads the host of the site when no address is given', () => {
  const host = getSiteHost();

  assert.equal(host.length > 0, true);
  // The host never carries a scheme, so it is a bare hostname.
  assert.equal(host.includes('://'), false);
  assert.equal(host.includes('/'), false);
});

test('getSiteUrl reads the address of the site', () => {
  assert.equal(getSiteUrl('https://ankitnandwani.com').href, 'https://ankitnandwani.com/');
  assert.equal(getSiteUrl('http://localhost:3000').href, 'http://localhost:3000/');
});

test('getSiteUrl falls back to the known address when the value cannot be read', () => {
  // A value that is still a placeholder is not an address, and the build
  // must not fail over a setting that has not been filled in.
  assert.equal(getSiteUrl('your_site_url').href, 'https://ankitnandwani.com/');
  assert.equal(getSiteUrl('').href, 'https://ankitnandwani.com/');
  assert.equal(getSiteUrl('not a url').href, 'https://ankitnandwani.com/');
  assert.equal(getSiteUrl('ftp://ankitnandwani.com').href, 'https://ankitnandwani.com/');
});

test('getSiteUrl reads the address of the site when no address is given', () => {
  const url = getSiteUrl();

  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname.length > 0, true);
});

test('siteConfig keeps the address of the site', () => {
  assert.equal(typeof siteConfig.url, 'string');
  assert.equal(siteConfig.url.length > 0, true);
});
