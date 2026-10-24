import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

import { GeminiProvider } from './geminiProvider.ts';
import { createLLMProvider } from './factory.ts';
import { LLMError } from './provider.ts';

// The test runner does not load the environment, so it is read from the same
// file the scripts use.
dotenv.config({ path: '.env.local' });

/**
 * These tests call the real Gemini API.
 *
 * They are opt in. The free tier of the Gemini API allows twenty generation
 * requests a day, and a request over that limit is rejected for the rest of
 * the day. Running them on every `npm test` would spend that budget within a
 * few runs, so they only run when LIVE_LLM_TESTS is set to 1.
 *
 * Set LIVE_LLM_TESTS=1 in .env.local or on the command line to run them.
 */
const liveRequested = /^(1|true|yes)$/i.test(
  process.env.LIVE_LLM_TESTS ?? ''
);
const apiKey = process.env.GEMINI_API_KEY ?? '';
const model = process.env.GEMINI_MODEL ?? '';
const hasRealKey = apiKey.length > 0 && !apiKey.toLowerCase().startsWith('your_');

const skipReason = !liveRequested
  ? 'set LIVE_LLM_TESTS=1 to run the tests against the real Gemini API'
  : !hasRealKey
    ? 'no real GEMINI_API_KEY is configured'
    : false;

/**
 * Creates a provider that talks to the real API.
 */
function createLiveProvider(): GeminiProvider {
  return new GeminiProvider({
    apiKey,
    model,
    temperature: 0,
    maxAttempts: 2,
  });
}

test(
  'answers a simple question and reports what it used',
  { skip: skipReason },
  async () => {
    const provider = createLiveProvider();
    const result = await provider.generate(
      'What is 2+2? Answer with the number only.'
    );

    assert.ok(result.text.length > 0, 'expected an answer');
    assert.match(result.text, /4/);
    assert.equal(result.finishReason, 'stop');
    assert.equal(result.model, model);

    assert.ok(result.tokenUsage, 'expected the token usage to be reported');
    assert.ok(
      (result.tokenUsage?.promptTokens ?? 0) > 0,
      'expected the prompt to be counted'
    );
    assert.ok(
      (result.tokenUsage?.completionTokens ?? 0) > 0,
      'expected the answer to be counted'
    );
  }
);

test(
  'streams an answer in pieces',
  { skip: skipReason },
  async () => {
    const provider = createLiveProvider();
    const pieces: string[] = [];

    for await (const chunk of provider.stream(
      'What is 2+2? Answer with the number only.'
    )) {
      pieces.push(chunk.text);
    }

    assert.ok(pieces.length > 0, 'expected at least one piece');
    assert.match(pieces.join(''), /4/);
  }
);

test(
  'gives the same answer at a low temperature',
  { skip: skipReason },
  async () => {
    const provider = createLiveProvider();

    const first = await provider.generate(
      'What is 2+2? Answer with the number only.'
    );
    const second = await provider.generate(
      'What is 2+2? Answer with the number only.'
    );

    assert.match(first.text, /4/);
    assert.match(second.text, /4/);
    assert.equal(
      first.text,
      second.text,
      'a temperature of zero has to give the same answer every time'
    );
  }
);

test(
  'fails clearly when the API key is not valid',
  { skip: skipReason },
  async () => {
    const provider = new GeminiProvider({
      apiKey: 'not-a-valid-api-key',
      model,
      maxAttempts: 1,
    });

    await assert.rejects(
      () => provider.generate('What is 2+2?'),
      (error: unknown) => {
        assert.ok(error instanceof LLMError, 'expected a provider error');
        assert.ok(error.message.length > 0, 'expected a message');
        assert.ok(
          !error.message.includes('not-a-valid-api-key'),
          'the API key must not appear in the message'
        );
        return true;
      }
    );
  }
);

test(
  'can be created from the environment',
  { skip: skipReason },
  async () => {
    const provider = await createLLMProvider({ temperature: 0 });
    const result = await provider.generate(
      'What is 2+2? Answer with the number only.'
    );

    assert.match(result.text, /4/);
  }
);
