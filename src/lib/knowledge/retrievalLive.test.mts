import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { EMBEDDING_DIMENSIONS } from './embedding.ts';
import { MATCH_FUNCTION, retrieveChunks } from './retrieval.ts';

// The test runner does not load the environment, so it is read from the same
// file the scripts use.
dotenv.config({ path: '.env.local' });

/**
 * These tests run against the live knowledge base.
 *
 * They are skipped unless the Supabase project is configured and the search
 * function has been installed, so the suite stays green on a machine that
 * has no project, and turns green on its own once the migration is applied.
 */
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const hasProject =
  supabaseUrl.length > 0 && !supabaseUrl.toLowerCase().startsWith('your_');

/**
 * Returns the service role client.
 */
async function serviceClient(): Promise<SupabaseClient> {
  const { supabaseServiceRole } = await import('../supabase.ts');
  return supabaseServiceRole;
}

/**
 * Reports whether the search function has been installed in the project.
 */
async function isSearchInstalled(): Promise<boolean> {
  if (!hasProject) return false;

  try {
    const store = await serviceClient();
    const { error } = await store.rpc(MATCH_FUNCTION, {
      query_embedding: new Array<number>(EMBEDDING_DIMENSIONS).fill(0),
      match_count: 1,
      match_threshold: 1,
      allowed_classifications: ['PUBLIC'],
      allowed_source_types: null,
    });

    return !error || !/could not find the function/i.test(error.message);
  } catch {
    return false;
  }
}

const skipReason = (await isSearchInstalled())
  ? false
  : hasProject
    ? 'the match_knowledge_chunks function is not installed in the project'
    : 'no Supabase project is configured';

test(
  'finds the chunks that answer a professional question',
  { skip: skipReason },
  async () => {
    const store = await serviceClient();

    const result = await retrieveChunks(
      'What is Ankit’s automation experience?',
      { limit: 5, logMetrics: false },
      store
    );

    assert.ok(result.chunks.length > 0, 'expected at least one chunk');
    assert.ok(
      result.averageSimilarity !== null && result.averageSimilarity > 0.3,
      `expected a similarity above 0.3, got ${result.averageSimilarity}`
    );
  }
);

test(
  'returns the chunks closest to the question first',
  { skip: skipReason },
  async () => {
    const store = await serviceClient();

    const result = await retrieveChunks(
      'What projects has Ankit built for network pricing APIs?',
      { limit: 5, logMetrics: false },
      store
    );

    assert.ok(result.chunks.length > 1, 'expected more than one chunk');

    for (let index = 1; index < result.chunks.length; index++) {
      assert.ok(
        result.chunks[index - 1].similarity >= result.chunks[index].similarity,
        'the chunks have to be ordered by similarity'
      );
    }
  }
);

test(
  'never returns confidential or private content',
  { skip: skipReason },
  async () => {
    const store = await serviceClient();

    const result = await retrieveChunks(
      'Tell me everything about Ankit',
      { limit: 20, logMetrics: false },
      store
    );

    for (const chunk of result.chunks) {
      assert.ok(
        chunk.classification === 'PUBLIC' || chunk.classification === 'PROFESSIONAL',
        `unexpected classification ${chunk.classification}`
      );
    }
  }
);

test(
  'respects the requested number of chunks',
  { skip: skipReason },
  async () => {
    const store = await serviceClient();

    const result = await retrieveChunks(
      'What are Ankit’s skills?',
      { limit: 2, logMetrics: false },
      store
    );

    assert.ok(result.chunks.length <= 2);
  }
);

test(
  'can restrict the search to one source type',
  { skip: skipReason },
  async () => {
    const store = await serviceClient();

    const result = await retrieveChunks(
      'Where can I find Ankit on social media?',
      { limit: 10, sourceTypes: ['social_link'], logMetrics: false },
      store
    );

    assert.ok(result.chunks.length > 0);
    for (const chunk of result.chunks) {
      assert.equal(chunk.sourceFile, 'src/data/socialLinks.ts');
    }
  }
);

test(
  'searches quickly enough for a chat response',
  { skip: skipReason },
  async () => {
    const store = await serviceClient();

    const result = await retrieveChunks(
      'What is Ankit’s professional background?',
      { limit: 5, logMetrics: false },
      store
    );

    assert.ok(
      result.durationMs < 5000,
      `the search took ${result.durationMs}ms`
    );
  }
);
