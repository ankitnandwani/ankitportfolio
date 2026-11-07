import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAiFailureContext,
  classifyAiFailure,
  readAiFailureStatus,
  readAiModel,
} from './aiFailures.ts';
import { LLMConfigurationError, LLMError } from '../llm/provider.ts';

/**
 * A body of an answer of the API.
 *
 * The API refuses a request for its own reasons with a 400 and a reason that
 * is a fixed word, and it refuses a request because the key is wrong with a
 * 400 and another reason. The status alone cannot tell them apart.
 */
function apiBody(reason: string, code: number = 400): string {
  return JSON.stringify({
    error: {
      code,
      message: 'The request was refused.',
      details: [{ reason, metadata: {} }],
    },
  });
}

test('a failure of the configuration is told apart', () => {
  assert.equal(classifyAiFailure(new LLMConfigurationError('there is no key')), 'configuration');
});

test('a failure with the status 429 is a failure of the limit', () => {
  assert.equal(classifyAiFailure(new LLMError('too many requests', 429)), 'quota');
});

test('a failure with the status 408 is a failure of time', () => {
  assert.equal(classifyAiFailure(new LLMError('the model took too long', 408)), 'timeout');
});

test('a failure with the status 500 is a failure of the service', () => {
  assert.equal(classifyAiFailure(new LLMError('the service had a problem', 500)), 'unavailable');
});

test('a failure with the status 400 is a failure nothing is known about', () => {
  assert.equal(classifyAiFailure(new LLMError('the request was refused', 400)), 'unknown');
});

test('a failure that is not a failure at all does not throw', () => {
  assert.equal(classifyAiFailure('a text'), 'unknown');
  assert.equal(classifyAiFailure(undefined), 'unknown');
  assert.equal(classifyAiFailure(null), 'unknown');
  assert.equal(classifyAiFailure(42), 'unknown');
  assert.equal(classifyAiFailure({}), 'unknown');
  assert.equal(classifyAiFailure([]), 'unknown');
});

test('the text of the message is not read to decide', () => {
  // Two failures with the same status are the same kind, whatever they say.
  assert.equal(
    classifyAiFailure(new LLMError('the free tier is spent, try later', 400)),
    classifyAiFailure(new LLMError('something entirely different', 400))
  );

  // A message that says "quota" is not a failure of the limit when the
  // status does not say so.
  assert.equal(classifyAiFailure(new LLMError('quota exceeded, too many requests', 0)), 'unknown');

  // A message that says "timeout" is not a failure of time on its own.
  assert.equal(classifyAiFailure(new LLMError('the request timed out', 0)), 'unknown');
});

test('a refusal of the model is told apart', () => {
  assert.equal(
    classifyAiFailure(new LLMError('the request was refused', 400, 'safety')),
    'blocked'
  );
  assert.equal(
    classifyAiFailure(new LLMError('the request was refused', 400, 'PROHIBITED_CONTENT')),
    'blocked'
  );
  assert.equal(
    classifyAiFailure(new LLMError('the request was refused', 400, 'blocklist')),
    'blocked'
  );
});

test('a failure of the key is told apart from a refusal of the model', () => {
  assert.equal(
    classifyAiFailure(new LLMError('the key is not valid', 400, 'API_KEY_INVALID')),
    'configuration'
  );
  assert.equal(
    classifyAiFailure(new LLMError('the key is not valid', 400, 'permission_denied')),
    'configuration'
  );
});

test('the classification of a failure whose message is the body of an answer works', () => {
  // The body of a request that was refused for the key.
  assert.equal(classifyAiFailure(new Error(apiBody('API_KEY_INVALID'))), 'configuration');

  // The body of a request that was refused for the safety of the model.
  assert.equal(classifyAiFailure(new Error(apiBody('SAFETY'))), 'blocked');

  // The body of a request that was too many.
  assert.equal(classifyAiFailure(new Error(apiBody('RESOURCE_EXHAUSTED', 429))), 'quota');

  // The body of a request the service could not answer.
  assert.equal(classifyAiFailure(new Error(apiBody('INTERNAL', 503))), 'unavailable');
});

test('the status of a failure is read out of the body of an answer', () => {
  assert.equal(readAiFailureStatus(new Error(apiBody('API_KEY_INVALID'))), 400);
  assert.equal(readAiFailureStatus(new Error(apiBody('RESOURCE_EXHAUSTED', 429))), 429);
  assert.equal(readAiFailureStatus(new LLMError('boom', 408)), 408);
  assert.equal(readAiFailureStatus(new LLMConfigurationError('there is no key')), 0);
  assert.equal(readAiFailureStatus('not a failure'), 0);
});

test('the report of a failure of the model holds the kind, the status and the model', () => {
  const original = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = 'gemini-flash-lite-latest';

  try {
    const context = buildAiFailureContext(new LLMError('too many requests', 429), {
      queryId: 'abc-123',
    });

    assert.equal(context.kind, 'quota');
    assert.equal(context.status, 429);
    assert.equal(context.model, 'gemini-flash-lite-latest');
    assert.equal(context.queryId, 'abc-123');
    assert.equal(typeof context.timestamp, 'string');
  } finally {
    if (original === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = original;
    }
  }
});

test('the report of a failure of the model holds no question and no answer', () => {
  const context = buildAiFailureContext(new LLMError('boom', 500), { queryId: 'abc-123' });

  assert.deepEqual(Object.keys(context).sort(), [
    'kind',
    'model',
    'queryId',
    'status',
    'timestamp',
  ]);

  const text = JSON.stringify(context);

  assert.equal(text.includes('question'), false);
  assert.equal(text.includes('answer'), false);
  assert.equal(text.includes('prompt'), false);
  assert.equal(text.includes('chunks'), false);
});

test('a failure with no status is reported without a status', () => {
  const context = buildAiFailureContext(new LLMConfigurationError('there is no key'));

  assert.equal(context.kind, 'configuration');
  assert.equal(context.status, undefined);
});

test('the model that is reported is the one of the environment', () => {
  const original = process.env.GEMINI_MODEL;

  try {
    delete process.env.GEMINI_MODEL;
    assert.equal(readAiModel(), 'unknown');

    process.env.GEMINI_MODEL = '  gemini-flash-lite-latest  ';
    assert.equal(readAiModel(), 'gemini-flash-lite-latest');

    process.env.GEMINI_MODEL = '   ';
    assert.equal(readAiModel(), 'unknown');
  } finally {
    if (original === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = original;
    }
  }
});

test('a failure of the classification does not throw', () => {
  // A failure whose body cannot be read.
  assert.equal(classifyAiFailure(new Error('{not json')), 'unknown');

  // A failure whose body is a list instead of an object.
  assert.equal(classifyAiFailure(new Error('[1, 2, 3]')), 'unknown');

  // A failure whose details are not a list.
  assert.equal(
    classifyAiFailure(
      new Error(JSON.stringify({ error: { code: 400, details: { reason: 'safety' } } }))
    ),
    'unknown'
  );
});
