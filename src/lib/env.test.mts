import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `src/lib/env.ts` validates the environment when the module is evaluated and
 * throws when a variable is missing. A test cannot import it twice with two
 * different environments, because the module is only evaluated once. The
 * validation is therefore checked in a child process, which starts with a
 * clean environment every time.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The variables the server side schema of `src/lib/env.ts` requires.
 *
 * This list has to match that schema. A variable that becomes required has to
 * be added here, and a variable that stops being required has to be taken
 * out, so the test fails loudly when the two disagree.
 */
const REQUIRED_ENV_VARS: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: 'https://example.com',
  GEMINI_API_KEY: 'test-key',
  GEMINI_MODEL: 'test-model',
  GEMINI_EMBEDDING_MODEL: 'test-embedding-model',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  GITHUB_TOKEN: 'test-github-token',
  SENTRY_DSN: 'https://example@sentry.example.com/1',
  UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
};

/**
 * Builds the environment of the child process.
 *
 * @param overrides The variables to set, or to remove when the value is null.
 */
function buildEnv(overrides: Record<string, string | null> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...REQUIRED_ENV_VARS };

  // The analytics credentials are optional, so they are removed unless the
  // test asks for them.
  delete env.POSTHOG_KEY;
  delete env.POSTHOG_HOST;

  for (const [name, value] of Object.entries(overrides)) {
    if (value === null) {
      delete env[name];
    } else {
      env[name] = value;
    }
  }

  return env;
}

/**
 * The script the child process runs. It loads the environment module and
 * writes what it found.
 */
const LOAD_ENV_SCRIPT =
  "const m = await import('./src/lib/env.ts');" +
  "console.log(JSON.stringify({ key: m.env.POSTHOG_KEY ?? null, host: m.env.POSTHOG_HOST ?? null }));";

/**
 * Loads the environment module in a child process.
 *
 * @param env The environment of the child process.
 * @returns The standard output of the child process.
 */
function loadEnv(env: NodeJS.ProcessEnv): string {
  return execFileSync(
    process.execPath,
    ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--input-type=module', '-e', LOAD_ENV_SCRIPT],
    { cwd: REPO_ROOT, env, encoding: 'utf8' }
  );
}

test('the environment loads without the analytics credentials', () => {
  const output = loadEnv(buildEnv());

  const parsed = JSON.parse(output.trim().split('\n').pop() ?? '{}');
  assert.equal(parsed.key, null);
  assert.equal(parsed.host, null);
});

test('the environment loads with the analytics credentials', () => {
  const output = loadEnv(
    buildEnv({
      POSTHOG_KEY: 'phc_abc123DEF456',
      POSTHOG_HOST: 'https://eu.i.posthog.com',
    })
  );

  const parsed = JSON.parse(output.trim().split('\n').pop() ?? '{}');
  assert.equal(parsed.key, 'phc_abc123DEF456');
  assert.equal(parsed.host, 'https://eu.i.posthog.com');
});

test('the environment still refuses to load without a required variable', () => {
  const env = buildEnv();
  delete env.GEMINI_API_KEY;

  let message = '';
  try {
    loadEnv(env);
    assert.fail('the environment module should have refused to load');
  } catch (error) {
    const failure = error as { stderr?: string; message?: string };
    message = `${failure.stderr ?? ''}${failure.message ?? ''}`;
  }

  assert.match(message, /GEMINI_API_KEY/);
});

test('the environment does not name the analytics credentials when they are missing', () => {
  let message = '';
  try {
    loadEnv(buildEnv());
    assert.fail('the environment module should have refused to load');
  } catch (error) {
    const failure = error as { stderr?: string; message?: string };
    message = `${failure.stderr ?? ''}${failure.message ?? ''}`;
  }

  assert.equal(message.includes('POSTHOG_KEY'), false);
  assert.equal(message.includes('POSTHOG_HOST'), false);
});
