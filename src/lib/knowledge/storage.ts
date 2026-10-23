import type { SupabaseClient } from '@supabase/supabase-js';

import { EMBEDDING_DIMENSIONS, assertEmbeddingDimensions } from './embedding.ts';

/**
 * A chunk that still needs an embedding.
 */
export interface ChunkAwaitingEmbedding {
  id: string;
  content: string;
}

/**
 * Finds the chunks that do not have an embedding yet.
 *
 * These are the chunks that were written by the ingestion pipeline and still
 * need to be embedded.
 *
 * @param store The store to read from.
 * @param limit The maximum number of chunks to return.
 */
export async function findChunksWithoutEmbeddings(
  store: SupabaseClient,
  limit = 500
): Promise<ChunkAwaitingEmbedding[]> {
  const { data, error } = await store
    .from('knowledge_chunks')
    .select('id, content')
    .is('embedding', null)
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []) as ChunkAwaitingEmbedding[];
}

/**
 * Counts the chunks that do not have an embedding yet.
 *
 * @param store The store to read from.
 */
export async function countChunksWithoutEmbeddings(
  store: SupabaseClient
): Promise<number> {
  const { count, error } = await store
    .from('knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  if (error) throw new Error(error.message);

  return count ?? 0;
}

/**
 * Writes the embedding of a single chunk.
 *
 * @param store The store to write to.
 * @param chunkId The chunk to update.
 * @param embedding The vector to store. It has to have the expected number of
 *                  dimensions, otherwise the database rejects it.
 */
export async function storeEmbedding(
  store: SupabaseClient,
  chunkId: string,
  embedding: number[]
): Promise<void> {
  assertEmbeddingDimensions(embedding, EMBEDDING_DIMENSIONS);

  const { error } = await store
    .from('knowledge_chunks')
    .update({ embedding })
    .eq('id', chunkId);

  if (error) throw new Error(error.message);
}

/**
 * Writes the embeddings of several chunks.
 *
 * @param store The store to write to.
 * @param entries The chunk id and vector pairs.
 * @returns How many chunks were written.
 */
export async function storeEmbeddings(
  store: SupabaseClient,
  entries: Array<{ chunkId: string; embedding: number[] }>
): Promise<number> {
  let written = 0;

  for (const entry of entries) {
    await storeEmbedding(store, entry.chunkId, entry.embedding);
    written++;
  }

  return written;
}
