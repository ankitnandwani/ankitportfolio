import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * The Gemini client is created from the environment, so the environment has
 * to be complete before the module is loaded. The import below is dynamic
 * for that reason: a static import would be evaluated first.
 */
for (const name of [
  'NEXT_PUBLIC_SITE_URL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_EMBEDDING_MODEL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
  'POSTHOG_KEY',
  'POSTHOG_HOST',
  'SENTRY_DSN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]) {
  process.env[name] = process.env[name] ?? 'test-placeholder';
}

const {
  embedTexts,
  GeminiApiError,
  getGeminiClient,
  readErrorDetails,
  setGeminiClient,
} = await import('./gemini.ts');

test('reads the status and the message out of a plain SDK error', () => {
  const error = Object.assign(new Error('API key not valid.'), { status: 400 });

  assert.deepEqual(readErrorDetails(error), {
    message: 'API key not valid.',
    status: 400,
  });
});

test('reads the status out of an error that carries the whole response body', () => {
  const body = JSON.stringify({
    error: {
      code: 429,
      message: 'Resource has been exhausted.',
      status: 'RESOURCE_EXHAUSTED',
    },
  });

  assert.deepEqual(readErrorDetails(new Error(body)), {
    message: 'Resource has been exhausted.',
    status: 429,
  });
});

test('keeps the message when it is not JSON', () => {
  assert.deepEqual(readErrorDetails(new Error('the network is down')), {
    message: 'the network is down',
    status: 0,
  });
});

test('turns a request failure into an error with a status code', async () => {
  const body = JSON.stringify({
    error: { code: 429, message: 'Resource has been exhausted.' },
  });

  const { getGeminiClient: getClient, setGeminiClient: setClient } =
    await import('./gemini.ts');

  const original = getClient();

  setClient({
    models: {
      embedContent: async () => {
        throw new Error(body);
      },
    },
  } as unknown as ReturnType<typeof getClient>);

  try {
    await assert.rejects(
      () => embedTexts(['some text']),
      (error: unknown) => {
        assert.ok(error instanceof GeminiApiError);
        assert.equal(error.status, 429);
        assert.equal(error.message, 'Resource has been exhausted.');
        return true;
      }
    );
  } finally {
    setClient(original);
  }
});
