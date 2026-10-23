import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';

import { EMBEDDING_DIMENSIONS } from './embedding.ts';
import {
  countChunksWithoutEmbeddings,
  findChunksWithoutEmbeddings,
  storeEmbedding,
  storeEmbeddings,
} from './storage.ts';
import { FakeSupabase } from './testing/fakeSupabase.ts';

function asClient(fake: FakeSupabase): SupabaseClient {
  return fake as unknown as SupabaseClient;
}

/**
 * Builds a vector with a given length.
 */
function vectorOf(length: number, seed = 1): number[] {
  return Array.from({ length }, (_, index) => Math.sin(seed + index));
}

/**
 * Builds a fake that holds a few chunks, some with an embedding.
 */
function fakeWithChunks(): FakeSupabase {
  const fake = new FakeSupabase();

  fake.chunks.push(
    { id: 'chunk-1', content: 'first chunk', embedding: null },
    { id: 'chunk-2', content: 'second chunk', embedding: vectorOf(768) },
    { id: 'chunk-3', content: 'third chunk', embedding: null }
  );

  return fake;
}

test('finds the chunks that do not have an embedding', async () => {
  const fake = fakeWithChunks();

  const pending = await findChunksWithoutEmbeddings(asClient(fake));

  assert.equal(pending.length, 2);
  assert.deepEqual(
    pending.map((entry) => entry.content).sort(),
    ['first chunk', 'third chunk']
  );
});

test('counts the chunks that do not have an embedding', async () => {
  const fake = fakeWithChunks();

  assert.equal(await countChunksWithoutEmbeddings(asClient(fake)), 2);
});

test('writes the embedding of a chunk', async () => {
  const fake = fakeWithChunks();
  const embedding = vectorOf(EMBEDDING_DIMENSIONS, 5);

  await storeEmbedding(asClient(fake), 'chunk-1', embedding);

  const stored = fake.chunks.find((chunk) => chunk.id === 'chunk-1');
  assert.deepEqual(stored?.embedding, embedding);
});

test('writes the embeddings of several chunks', async () => {
  const fake = fakeWithChunks();
  const first = vectorOf(EMBEDDING_DIMENSIONS, 1);
  const second = vectorOf(EMBEDDING_DIMENSIONS, 2);

  const written = await storeEmbeddings(asClient(fake), [
    { chunkId: 'chunk-1', embedding: first },
    { chunkId: 'chunk-3', embedding: second },
  ]);

  assert.equal(written, 2);
  assert.equal(await countChunksWithoutEmbeddings(asClient(fake)), 0);
});

test('refuses to store an embedding with the wrong number of dimensions', async () => {
  const fake = fakeWithChunks();

  await assert.rejects(
    () => storeEmbedding(asClient(fake), 'chunk-1', vectorOf(3072)),
    /the embedding has 3072 dimensions, expected 768/
  );
});
