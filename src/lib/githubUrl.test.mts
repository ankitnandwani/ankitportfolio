import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubUrl } from './githubUrl.ts';

test('parses an https GitHub URL', () => {
  assert.deepEqual(parseGitHubUrl('https://github.com/owner/repo'), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('ignores a trailing slash', () => {
  assert.deepEqual(parseGitHubUrl('https://github.com/owner/repo/'), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('trims surrounding whitespace', () => {
  assert.deepEqual(parseGitHubUrl('  https://github.com/owner/repo  '), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('strips the .git suffix from a URL', () => {
  assert.deepEqual(parseGitHubUrl('https://github.com/owner/repo.git'), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('parses an SSH style URL', () => {
  assert.deepEqual(parseGitHubUrl('git@github.com:owner/repo.git'), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('parses the bare owner/repo form', () => {
  assert.deepEqual(parseGitHubUrl('owner/repo'), { owner: 'owner', repo: 'repo' });
});

test('takes only the owner and repo from a deeper path', () => {
  assert.deepEqual(parseGitHubUrl('https://github.com/owner/repo/issues/12'), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('returns null for a host that is not github.com', () => {
  assert.equal(parseGitHubUrl('https://gitlab.com/owner/repo'), null);
});

test('returns null when the URL has no repository segment', () => {
  assert.equal(parseGitHubUrl('https://github.com/owner'), null);
  assert.equal(parseGitHubUrl('https://github.com/'), null);
});

test('returns null for input that is not a repository reference', () => {
  assert.equal(parseGitHubUrl('not-a-repo'), null);
  assert.equal(parseGitHubUrl(''), null);
});

test('returns null rather than throwing for malformed input', () => {
  assert.equal(parseGitHubUrl('https://'), null);
});
