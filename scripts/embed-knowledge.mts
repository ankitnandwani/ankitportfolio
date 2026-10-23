/**
 * Generates the embeddings for the knowledge base chunks that do not have
 * one yet.
 *
 * Run it with: npm run embed
 *
 * It finds the chunks that are missing an embedding, asks Gemini for their
 * vectors, writes them back, and reports what it did. Running it again only
 * picks up the chunks that still need an embedding.
 */

import dotenv from 'dotenv';

import type { EmbeddingServiceOptions } from '../src/lib/knowledge/embedding.ts';

/**
 * How many chunks are embedded in a single request.
 */
const BATCH_SIZE = 20;

/**
 * Splits a list into batches of a fixed size.
 */
function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

/**
 * Runs the backfill.
 */
async function main(): Promise<void> {
  dotenv.config({ path: '.env.local' });

  const { supabaseServiceRole } = await import('../src/lib/supabase.ts');
  const {
    createEmbeddingService,
    EMBEDDING_DIMENSIONS,
  } = await import('../src/lib/knowledge/embedding.ts');
  const {
    countChunksWithoutEmbeddings,
    findChunksWithoutEmbeddings,
    storeEmbeddings,
  } = await import('../src/lib/knowledge/storage.ts');

  const service = createEmbeddingService(undefined, {
    maxAttempts: 3,
    baseDelayMs: 1000,
  } satisfies EmbeddingServiceOptions);

  const pending = await countChunksWithoutEmbeddings(supabaseServiceRole);

  console.log(
    `[embed] ${pending} chunk(s) are missing an embedding, ` +
      `${EMBEDDING_DIMENSIONS} dimensions each`
  );

  if (pending === 0) {
    console.log('[embed] nothing to do');
    return;
  }

  const chunks = await findChunksWithoutEmbeddings(supabaseServiceRole);

  let embedded = 0;
  let failed = 0;

  for (const batch of chunk(chunks, BATCH_SIZE)) {
    try {
      const vectors = await service.generateBatch(
        batch.map((entry) => entry.content)
      );

      await storeEmbeddings(
        supabaseServiceRole,
        batch.map((entry, index) => ({
          chunkId: entry.id,
          embedding: vectors[index],
        }))
      );

      embedded += batch.length;
      console.log(`[embed] embedded ${embedded}/${chunks.length}`);
    } catch (error) {
      failed += batch.length;
      console.error(
        `[embed] a batch of ${batch.length} chunk(s) failed: ` +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  console.log(`[embed] done: embedded=${embedded} failed=${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();
