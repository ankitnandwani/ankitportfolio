import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * src/lib/env.ts validates every server-side variable when the module is
 * evaluated and throws when one is missing. The CI runner has no .env file,
 * so placeholder values are set before the service module is imported.
 * A value already present in the environment always wins.
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SITE_URL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
  'POSTHOG_KEY',
  'POSTHOG_HOST',
  'SENTRY_DSN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

for (const name of REQUIRED_ENV_VARS) {
  process.env[name] = process.env[name] ?? 'test-placeholder';
}

const { fetchGitHubRepoData } = await import('./githubService.ts');

/**
 * Builds a minimal Response stand-in so the service can be exercised without
 * network access.
 */
function jsonResponse(body: unknown, options?: { ok?: boolean; status?: number }): Response {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    statusText: options?.ok === false ? 'Not Found' : 'OK',
    json: async () => body,
  } as unknown as Response;
}

/**
 * Replaces globalThis.fetch for the duration of a test and restores it after.
 */
async function withFetch<T>(
  handler: (input: unknown) => Promise<Response>,
  run: () => Promise<T>
): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = ((input: unknown) => handler(input)) as unknown as typeof fetch;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

test('maps the GitHub API response onto GitHubRepoData', async () => {
  const requested: string[] = [];

  await withFetch(
    async (input) => {
      requested.push(String(input));
      return jsonResponse({
        stargazers_count: 42,
        forks_count: 7,
        language: 'TypeScript',
        description: 'A test repository',
        updated_at: '2024-01-01T00:00:00Z',
        open_issues: 3,
        subscribers_count: 11,
      });
    },
    async () => {
      const data = await fetchGitHubRepoData('https://github.com/testowner/testrepo');

      assert.deepEqual(data, {
        stars: 42,
        forks: 7,
        language: 'TypeScript',
        description: 'A test repository',
        updatedAt: '2024-01-01T00:00:00Z',
        open_issues: 3,
        subscribers_count: 11,
      });
    }
  );

  assert.equal(requested.length, 1);
  assert.match(requested[0], /\/repos\/testowner\/testrepo$/);
});

test('accepts the object identifier form', async () => {
  await withFetch(
    async () => jsonResponse({ stargazers_count: 1, forks_count: 2 }),
    async () => {
      const data = await fetchGitHubRepoData({ owner: 'objectowner', repo: 'objectrepo' });

      assert.equal(data?.stars, 1);
      assert.equal(data?.forks, 2);
      assert.equal(data?.language, null);
      assert.equal(data?.description, null);
    }
  );
});

test('returns null for an identifier it cannot parse, without calling the API', async () => {
  let called = false;

  await withFetch(
    async () => {
      called = true;
      return jsonResponse({});
    },
    async () => {
      assert.equal(await fetchGitHubRepoData('https://gitlab.com/owner/repo'), null);
      assert.equal(await fetchGitHubRepoData('not-a-repo'), null);
    }
  );

  assert.equal(called, false);
});

test('returns null when the GitHub API responds with an error', async () => {
  await withFetch(
    async () => jsonResponse({}, { ok: false, status: 404 }),
    async () => {
      assert.equal(await fetchGitHubRepoData('https://github.com/errorowner/errorepo'), null);
    }
  );
});

test('returns null when the network request throws', async () => {
  await withFetch(
    async () => {
      throw new Error('network unreachable');
    },
    async () => {
      assert.equal(await fetchGitHubRepoData('https://github.com/throwowner/throwrepo'), null);
    }
  );
});

test('caches a response so a repeated request does not call the API again', async () => {
  let calls = 0;

  await withFetch(
    async () => {
      calls++;
      return jsonResponse({ stargazers_count: 5, forks_count: 6 });
    },
    async () => {
      const identifier = 'https://github.com/cacheowner/cacherepo';

      const first = await fetchGitHubRepoData(identifier);
      const second = await fetchGitHubRepoData(identifier);

      assert.equal(first?.stars, 5);
      assert.deepEqual(second, first);
    }
  );

  assert.equal(calls, 1);
});
