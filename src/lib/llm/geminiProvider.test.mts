import test from 'node:test';
import assert from 'node:assert/strict';
import type { GoogleGenAI } from '@google/genai';

import { GeminiProvider } from './geminiProvider.ts';
import {
  LLMConfigurationError,
  LLMError,
  type LLMProvider,
} from './provider.ts';

/**
 * A request as it was sent to the API.
 */
interface RecordedRequest {
  model: string;
  contents: unknown;
  config: Record<string, unknown>;
}

/**
 * The double that stands in for the Gemini client.
 */
interface FakeClient {
  /**
   * The client to hand to the provider.
   */
  client: GoogleGenAI;

  /**
   * Every request that was made, in order.
   */
  requests: RecordedRequest[];
}

/**
 * Creates a double of the Gemini client.
 *
 * @param handlers The answers the double gives.
 */
function createFakeClient(handlers: {
  generate?: (
    request: RecordedRequest,
    attempt: number
  ) => unknown | Promise<unknown>;
  stream?: (
    request: RecordedRequest,
    attempt: number
  ) => AsyncGenerator<unknown>;
}): FakeClient {
  const requests: RecordedRequest[] = [];

  const client = {
    models: {
      async generateContent(params: RecordedRequest) {
        requests.push(params);
        return (await handlers.generate?.(params, requests.length - 1)) ?? {};
      },
      async generateContentStream(params: RecordedRequest) {
        requests.push(params);

        const stream = handlers.stream?.(params, requests.length - 1);
        if (!stream) throw new Error('the double has no stream handler');

        return stream;
      },
    },
  } as unknown as GoogleGenAI;

  return { client, requests };
}

/**
 * Reads the abort signal out of a recorded request.
 */
function signalOf(request: RecordedRequest): AbortSignal | undefined {
  return request.config.abortSignal as AbortSignal | undefined;
}

/**
 * Creates a provider that never waits between retries.
 */
function createProvider(
  client: GoogleGenAI,
  options: Partial<ConstructorParameters<typeof GeminiProvider>[0]> = {}
): GeminiProvider {
  return new GeminiProvider({
    apiKey: 'test-api-key',
    model: 'gemini-test-model',
    client,
    wait: async () => {},
    ...options,
  });
}

/**
 * Builds the failure the SDK reports for a rate limit.
 */
function rateLimitError(): Error {
  return new Error(
    JSON.stringify({
      error: { code: 429, message: 'Resource has been exhausted.' },
    })
  );
}

test('refuses to start without an API key', () => {
  assert.throws(
    () => new GeminiProvider({ apiKey: '   ', model: 'gemini-test-model' }),
    (error: unknown) =>
      error instanceof LLMConfigurationError &&
      error.message.includes('GEMINI_API_KEY')
  );
});

test('refuses to start without a model', () => {
  assert.throws(
    () => new GeminiProvider({ apiKey: 'test-api-key', model: '' }),
    (error: unknown) =>
      error instanceof LLMConfigurationError &&
      error.message.includes('GEMINI_MODEL')
  );
});

test('refuses a temperature that the API would reject', () => {
  assert.throws(
    () =>
      new GeminiProvider({
        apiKey: 'test-api-key',
        model: 'gemini-test-model',
        temperature: 5,
      }),
    (error: unknown) =>
      error instanceof LLMConfigurationError &&
      error.message.includes('between 0 and 2')
  );
});

test('refuses a topP that the API would reject', () => {
  assert.throws(
    () =>
      new GeminiProvider({
        apiKey: 'test-api-key',
        model: 'gemini-test-model',
        topP: 4,
      }),
    (error: unknown) =>
      error instanceof LLMConfigurationError &&
      error.message.includes('between 0 and 1')
  );
});

test('sends the model and the prompt to the API', async () => {
  const { client, requests } = createFakeClient({
    generate: () => ({ text: '4' }),
  });

  const provider = createProvider(client);
  const result = await provider.generate('What is 2+2?');

  assert.equal(result.text, '4');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].model, 'gemini-test-model');
  assert.deepEqual(requests[0].contents, [
    { role: 'user', parts: [{ text: 'What is 2+2?' }] },
  ]);
});

test('passes the generation options to the API', async () => {
  const { client, requests } = createFakeClient({
    generate: () => ({ text: 'answer' }),
  });

  const provider = createProvider(client);

  await provider.generate('What is 2+2?', {
    temperature: 0.2,
    maxTokens: 128,
    topP: 0.9,
    stopSequences: ['END'],
    systemInstruction: 'Answer in one sentence.',
  });

  const config = requests[0].config;

  assert.equal(config.temperature, 0.2);
  assert.equal(config.maxOutputTokens, 128);
  assert.equal(config.topP, 0.9);
  assert.deepEqual(config.stopSequences, ['END']);
  assert.equal(config.systemInstruction, 'Answer in one sentence.');
});

test('uses the configured temperature when the call does not set one', async () => {
  const { client, requests } = createFakeClient({
    generate: () => ({ text: 'answer' }),
  });

  const provider = createProvider(client, { temperature: 0 });

  await provider.generate('What is 2+2?');
  assert.equal(requests[0].config.temperature, 0);

  await provider.generate('What is 2+2?', { temperature: 0.8 });
  assert.equal(requests[1].config.temperature, 0.8);
});

test('turns the thinking off when it is asked for', async () => {
  const { client, requests } = createFakeClient({
    generate: () => ({ text: 'answer' }),
  });

  const provider = createProvider(client, { thinkingBudget: 0 });
  await provider.generate('What is 2+2?');

  assert.deepEqual(requests[0].config.thinkingConfig, { thinkingBudget: 0 });
});

test('leaves the thinking to the model when no budget is set', async () => {
  const { client, requests } = createFakeClient({
    generate: () => ({ text: 'answer' }),
  });

  const provider = createProvider(client);
  await provider.generate('What is 2+2?');

  assert.equal(requests[0].config.thinkingConfig, undefined);
});

test('reports the finish reason and the token usage', async () => {
  const { client } = createFakeClient({
    generate: () => ({
      text: 'The answer is four.',
      candidates: [{ finishReason: 'STOP' }],
      usageMetadata: {
        promptTokenCount: 7,
        candidatesTokenCount: 5,
        totalTokenCount: 12,
      },
    }),
  });

  const provider = createProvider(client);
  const result = await provider.generate('What is 2+2?');

  assert.equal(result.finishReason, 'stop');
  assert.equal(result.model, 'gemini-test-model');
  assert.deepEqual(result.tokenUsage, {
    promptTokens: 7,
    completionTokens: 5,
    totalTokens: 12,
  });
});

test('reports no token usage when the API sends none', async () => {
  const { client } = createFakeClient({
    generate: () => ({ text: 'answer' }),
  });

  const provider = createProvider(client);
  const result = await provider.generate('What is 2+2?');

  assert.equal(result.tokenUsage, null);
});

test('maps the finish reasons of the API onto the provider ones', async () => {
  const cases: Array<[string | undefined, string]> = [
    ['STOP', 'stop'],
    ['MAX_TOKENS', 'max_tokens'],
    ['SAFETY', 'safety'],
    ['RECITATION', 'recitation'],
    ['SPII', 'spii'],
    ['OTHER', 'other'],
    [undefined, 'unknown'],
  ];

  for (const [reason, expected] of cases) {
    const { client } = createFakeClient({
      generate: () => ({
        text: 'answer',
        candidates: reason ? [{ finishReason: reason }] : [],
      }),
    });

    const provider = createProvider(client);
    const result = await provider.generate('What is 2+2?');

    assert.equal(result.finishReason, expected);
  }
});

test('retries a request that was rate limited', async () => {
  let attempts = 0;

  const { client } = createFakeClient({
    generate: () => {
      attempts += 1;
      if (attempts < 3) throw rateLimitError();
      return { text: 'recovered' };
    },
  });

  const provider = createProvider(client);
  const result = await provider.generate('What is 2+2?');

  assert.equal(attempts, 3);
  assert.equal(result.text, 'recovered');
});

test('retries a request when the API is unavailable', async () => {
  let attempts = 0;

  const { client } = createFakeClient({
    generate: () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error(
          JSON.stringify({ error: { code: 503, message: 'Service unavailable.' } })
        );
      }
      return { text: 'recovered' };
    },
  });

  const provider = createProvider(client);
  const result = await provider.generate('What is 2+2?');

  assert.equal(attempts, 2);
  assert.equal(result.text, 'recovered');
});

test('does not retry a request that was rejected', async () => {
  let attempts = 0;

  const { client } = createFakeClient({
    generate: () => {
      attempts += 1;
      throw new Error(
        JSON.stringify({ error: { code: 400, message: 'Invalid argument.' } })
      );
    },
  });

  const provider = createProvider(client);

  await assert.rejects(() => provider.generate('What is 2+2?'), LLMError);
  assert.equal(attempts, 1, 'a rejected request has to fail straight away');
});

test('explains a rejected API key without repeating it', async () => {
  const { client } = createFakeClient({
    generate: () => {
      throw new Error(
        JSON.stringify({
          error: { code: 400, message: 'API key not valid. Please pass a valid API key.' },
        })
      );
    },
  });

  const provider = createProvider(client, { apiKey: 'super-secret-key' });

  await assert.rejects(
    () => provider.generate('What is 2+2?'),
    (error: unknown) => {
      assert.ok(error instanceof LLMError);
      assert.match(error.message, /API key/i);
      assert.ok(
        !error.message.includes('super-secret-key'),
        'the API key must not appear in the message'
      );
      return true;
    }
  );
});

test('cuts off a request that takes too long', async () => {
  const { client } = createFakeClient({
    generate: (request) =>
      new Promise((_resolve, reject) => {
        signalOf(request)?.addEventListener('abort', () =>
          reject(new Error('The operation was aborted.'))
        );
      }),
  });

  const provider = createProvider(client, { timeoutMs: 25, maxAttempts: 1 });

  await assert.rejects(
    () => provider.generate('What is 2+2?'),
    (error: unknown) =>
      error instanceof LLMError && /timed out/i.test(error.message)
  );
});

test('stops when the caller cancels the request', async () => {
  const controller = new AbortController();

  const { client } = createFakeClient({
    generate: (request) =>
      new Promise((_resolve, reject) => {
        signalOf(request)?.addEventListener('abort', () =>
          reject(new Error('The operation was aborted.'))
        );
      }),
  });

  const provider = createProvider(client, { maxAttempts: 1 });
  const pending = provider.generate('What is 2+2?', {
    signal: controller.signal,
  });

  controller.abort();

  await assert.rejects(
    () => pending,
    (error: unknown) =>
      error instanceof LLMError && /cancelled/i.test(error.message)
  );
});

test('refuses to answer an empty prompt', async () => {
  const { client, requests } = createFakeClient({
    generate: () => ({ text: 'answer' }),
  });

  const provider = createProvider(client);

  await assert.rejects(() => provider.generate('   '), LLMError);
  assert.equal(requests.length, 0, 'the API must not be called for an empty prompt');
});

test('delivers the pieces of a streamed answer as they arrive', async () => {
  let produced = 0;

  const { client } = createFakeClient({
    stream: async function* () {
      produced += 1;
      yield { text: '2 + ' };
      produced += 1;
      yield { text: '2 = 4' };
    },
  });

  const provider = createProvider(client);
  const seen: string[] = [];

  for await (const chunk of provider.stream('What is 2+2?')) {
    seen.push(chunk.text);

    assert.equal(
      produced,
      seen.length,
      'the next piece must not be produced before it is asked for'
    );
  }

  assert.deepEqual(seen, ['2 + ', '2 = 4']);
});

test('reports the token usage of a streamed answer', async () => {
  const { client } = createFakeClient({
    stream: async function* () {
      yield {
        text: 'four',
        candidates: [{ finishReason: 'STOP' }],
        usageMetadata: {
          promptTokenCount: 4,
          candidatesTokenCount: 2,
          totalTokenCount: 6,
        },
      };
    },
  });

  const provider = createProvider(client);

  for await (const chunk of provider.stream('What is 2+2?')) {
    assert.deepEqual(chunk.tokenUsage, {
      promptTokens: 4,
      completionTokens: 2,
      totalTokens: 6,
    });
    assert.equal(chunk.finishReason, 'stop');
  }
});

test('closes the underlying stream when the caller stops early', async () => {
  let released = false;

  const { client } = createFakeClient({
    stream: async function* () {
      try {
        yield { text: 'first' };
        yield { text: 'second' };
      } finally {
        released = true;
      }
    },
  });

  const provider = createProvider(client);

  for await (const chunk of provider.stream('What is 2+2?')) {
    assert.equal(chunk.text, 'first');
    break;
  }

  assert.equal(released, true, 'the underlying stream has to be closed');
});

test('retries a stream that failed before the first piece', async () => {
  let attempts = 0;

  const { client } = createFakeClient({
    stream: async function* () {
      attempts += 1;
      if (attempts === 1) throw rateLimitError();
      yield { text: 'recovered' };
    },
  });

  const provider = createProvider(client);
  const seen: string[] = [];

  for await (const chunk of provider.stream('What is 2+2?')) {
    seen.push(chunk.text);
  }

  assert.equal(attempts, 2);
  assert.deepEqual(seen, ['recovered']);
});

test('does not repeat a streamed answer that failed halfway through', async () => {
  let attempts = 0;

  const { client } = createFakeClient({
    stream: async function* () {
      attempts += 1;
      yield { text: 'partial' };
      throw rateLimitError();
    },
  });

  const provider = createProvider(client);
  const seen: string[] = [];

  await assert.rejects(async () => {
    for await (const chunk of provider.stream('What is 2+2?')) {
      seen.push(chunk.text);
    }
  }, LLMError);

  assert.equal(attempts, 1, 'the request must not be repeated after an answer was delivered');
  assert.deepEqual(seen, ['partial']);
});

test('implements the provider interface', () => {
  const { client } = createFakeClient({ generate: () => ({ text: 'answer' }) });

  const provider: LLMProvider = createProvider(client);

  assert.equal(provider.name, 'gemini');
  assert.equal(typeof provider.generate, 'function');
  assert.equal(typeof provider.stream, 'function');
});
