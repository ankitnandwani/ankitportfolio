import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEmbeddingService,
  EMBEDDING_DIMENSIONS,
  EmbeddingDimensionError,
  isRetryableError,
  normalizeVector,
  prepareEmbedding,
  type TextEmbedder,
} from './embedding.ts';

/**
 * Builds a vector with a given length.
 */
function vectorOf(length: number, seed = 1): number[] {
  return Array.from({ length }, (_, index) => Math.sin(seed + index));
}

/**
 * Builds an embedder that hands out the given vectors in order.
 */
function embedderOf(vectors: number[][]): TextEmbedder {
  const remaining = [...vectors];

  return async (texts) =>
    texts.map(() => {
      const vector = remaining.shift();
      if (!vector) throw new Error('the embedder ran out of vectors');
      return vector;
    });
}

/**
 * Builds an error that looks like a Gemini API failure.
 */
function apiError(status: number, message = 'failed'): Error {
  return Object.assign(new Error(message), { status });
}

test('normalises a vector to unit length', () => {
  const normalized = normalizeVector([3, 4]);

  assert.equal(normalized.length, 2);
  assert.equal(Math.hypot(...normalized), 1);
  assert.deepEqual(normalized, [0.6, 0.8]);
});

test('refuses to normalise a vector with no magnitude', () => {
  assert.throws(() => normalizeVector([0, 0, 0]), /no magnitude/);
});

test('refuses to normalise a vector with a value that is not a number', () => {
  assert.throws(() => normalizeVector([1, Number.NaN]), /not a number/);
  assert.throws(() => normalizeVector([1, Number.POSITIVE_INFINITY]), /not a number/);
});

test('rejects an embedding with the wrong number of dimensions', () => {
  assert.throws(
    () => prepareEmbedding(vectorOf(3072)),
    EmbeddingDimensionError
  );
  assert.throws(
    () => prepareEmbedding(vectorOf(3072)),
    /the embedding has 3072 dimensions, expected 768/
  );
});

test('generates an embedding with the expected number of dimensions', async () => {
  const service = createEmbeddingService(embedderOf([vectorOf(768)]));

  const embedding = await service.generateEmbedding('some text');

  assert.equal(embedding.length, EMBEDDING_DIMENSIONS);
});

test('generates a normalised embedding', async () => {
  const service = createEmbeddingService(embedderOf([vectorOf(768, 3)]));

  const embedding = await service.generateEmbedding('some text');

  assert.ok(Math.abs(Math.hypot(...embedding) - 1) < 1e-9);
});

test('asks the model for the expected number of dimensions', async () => {
  const calls: Array<{ texts: string[]; options?: unknown }> = [];

  const service = createEmbeddingService(async (texts, options) => {
    calls.push({ texts, options });
    return texts.map(() => vectorOf(768));
  });

  await service.generateEmbedding('some text');

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options, {
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 768,
  });
});

test('generates one embedding per text', async () => {
  const service = createEmbeddingService(
    embedderOf([vectorOf(768, 1), vectorOf(768, 2), vectorOf(768, 3)])
  );

  const embeddings = await service.generateBatch(['a', 'b', 'c']);

  assert.equal(embeddings.length, 3);
  for (const embedding of embeddings) {
    assert.equal(embedding.length, EMBEDDING_DIMENSIONS);
  }
});

test('rejects a response that does not match the number of texts', async () => {
  const service = createEmbeddingService(async () => [vectorOf(768)]);

  await assert.rejects(
    () => service.generateBatch(['a', 'b']),
    /returned 1 embeddings for 2 texts/
  );
});

test('returns nothing for an empty list of texts', async () => {
  const service = createEmbeddingService(async () => {
    throw new Error('the model should not be called');
  });

  assert.deepEqual(await service.generateBatch([]), []);
});

test('retries a rate limited request and succeeds', async () => {
  let attempts = 0;

  const service = createEmbeddingService(
    async () => {
      attempts++;
      if (attempts < 3) throw apiError(429, 'rate limited');
      return [vectorOf(768)];
    },
    { maxAttempts: 3, baseDelayMs: 0, wait: async () => {} }
  );

  const embedding = await service.generateEmbedding('some text');

  assert.equal(attempts, 3);
  assert.equal(embedding.length, EMBEDDING_DIMENSIONS);
});

test('gives up after the configured number of attempts', async () => {
  let attempts = 0;

  const service = createEmbeddingService(
    async () => {
      attempts++;
      throw apiError(503, 'service unavailable');
    },
    { maxAttempts: 2, baseDelayMs: 0, wait: async () => {} }
  );

  await assert.rejects(() => service.generateEmbedding('some text'), /unavailable/);
  assert.equal(attempts, 2);
});

test('does not retry a request that will fail the same way again', async () => {
  let attempts = 0;

  const service = createEmbeddingService(
    async () => {
      attempts++;
      throw apiError(400, 'bad request');
    },
    { maxAttempts: 5, baseDelayMs: 0, wait: async () => {} }
  );

  await assert.rejects(() => service.generateEmbedding('some text'), /bad request/);
  assert.equal(attempts, 1);
});

test('waits longer before every retry', async () => {
  const delays: number[] = [];

  const service = createEmbeddingService(
    async () => {
      throw apiError(429, 'rate limited');
    },
    {
      maxAttempts: 4,
      baseDelayMs: 100,
      wait: async (milliseconds) => {
        delays.push(milliseconds);
      },
    }
  );

  await assert.rejects(() => service.generateEmbedding('some text'));

  assert.deepEqual(delays, [100, 200, 400]);
});

test('knows which failures are worth retrying', () => {
  assert.equal(isRetryableError(apiError(429)), true);
  assert.equal(isRetryableError(apiError(500)), true);
  assert.equal(isRetryableError(apiError(503)), true);
  assert.equal(isRetryableError(apiError(408)), true);

  assert.equal(isRetryableError(apiError(400)), false);
  assert.equal(isRetryableError(apiError(401)), false);
  assert.equal(isRetryableError(apiError(404)), false);
  assert.equal(isRetryableError(new Error('no status')), false);
});
