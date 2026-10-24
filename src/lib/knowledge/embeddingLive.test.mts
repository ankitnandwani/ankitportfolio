import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

import {
  EMBEDDING_DIMENSIONS,
  batchGenerateEmbeddings,
} from './embedding.ts';

// The test runner does not load the environment, so the key is read from the
// same file the scripts use.
dotenv.config({ path: '.env.local' });

/**
 * These tests call the real Gemini API.
 *
 * They are skipped unless a real API key is configured, so the suite stays
 * green on a machine that has no key. Set GEMINI_API_KEY in .env.local and
 * run `npm test` to include them.
 */
const apiKey = process.env.GEMINI_API_KEY ?? '';
const hasRealKey = apiKey.length > 0 && !apiKey.toLowerCase().startsWith('your_');

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index++) {
    dot += a[index] * b[index];
    magnitudeA += a[index] * a[index];
    magnitudeB += b[index] * b[index];
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

test(
  'the live model returns a 768 dimension vector',
  { skip: hasRealKey ? false : 'no real GEMINI_API_KEY is configured' },
  async () => {
    const [embedding] = await batchGenerateEmbeddings([
      'A short piece of knowledge base content.',
    ]);

    assert.equal(embedding.length, EMBEDDING_DIMENSIONS);
    assert.ok(Math.abs(Math.hypot(...embedding) - 1) < 1e-6);
  }
);

test(
  'related texts are closer than unrelated ones',
  { skip: hasRealKey ? false : 'no real GEMINI_API_KEY is configured' },
  async () => {
    const vectors = await batchGenerateEmbeddings([
      'Automation testing for a network pricing API using Selenium and Java.',
      'Automated API testing built with Selenium and Java for pricing systems.',
      'Sourdough bread needs a starter, flour, water and patience.',
    ]);

    const [api, apiParaphrase, bread] = vectors;

    const related = cosineSimilarity(api, apiParaphrase);
    const unrelated = cosineSimilarity(api, bread);

    assert.ok(
      related > unrelated,
      `expected the related pair (${related.toFixed(4)}) to be closer than the unrelated pair (${unrelated.toFixed(4)})`
    );
  }
);
