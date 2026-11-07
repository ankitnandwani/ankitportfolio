import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';

import { EMBEDDING_DIMENSIONS, type TextEmbedder } from './embedding.ts';
import { createRetrievalService } from './retrieval.ts';
import { FakeSupabase } from './testing/fakeSupabase.ts';
import { setMonitoringClientFactory, type MonitoringClient, type MonitoringHint } from '../monitoring/capture.ts';

/**
 * A report the fake client received.
 */
interface Report {
  /** The text of the report. */
  message?: string;
  /** The hint that came with it. */
  hint?: MonitoringHint;
}

/**
 * A client that writes the reports down instead of sending them.
 */
function createFakeClient(reports: Report[]): MonitoringClient {
  return {
    captureException: () => {},
    captureMessage: (message, hint) => {
      reports.push({ message, hint });
    },
    flush: async () => {},
  };
}

/**
 * Runs something with the monitoring on.
 *
 * The configuration of the monitoring is read from the environment, so the
 * variable of the DSN is what turns it on.
 */
async function withMonitoring(run: () => Promise<void>): Promise<void> {
  const original = process.env.SENTRY_DSN;
  process.env.SENTRY_DSN = 'https://key@example.com/1';

  try {
    await run();
  } finally {
    if (original === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = original;
    }
  }
}

function asClient(fake: FakeSupabase): SupabaseClient {
  return fake as unknown as SupabaseClient;
}

/**
 * Builds a unit vector of a given length along the first axis.
 */
function axisVector(length: number, axis = 0): number[] {
  const vector = new Array<number>(length).fill(0);
  vector[axis] = 1;
  return vector;
}

/**
 * An embedder that always returns the same vector.
 */
function fixedEmbedder(vector: number[]): TextEmbedder {
  return async (texts) => texts.map(() => vector);
}

/**
 * Builds a fake with a few chunks across different classifications.
 */
function fakeWithChunks(): FakeSupabase {
  const fake = new FakeSupabase();

  fake.documents.push(
    { id: 'doc-public', title: 'Social Links', source_type: 'social_link', classification: 'PUBLIC' },
    { id: 'doc-pro', title: 'A Project', source_type: 'project', classification: 'PROFESSIONAL' },
    { id: 'doc-secret', title: 'A Secret', source_type: 'note', classification: 'CONFIDENTIAL' },
    { id: 'doc-private', title: 'A Private Note', source_type: 'note', classification: 'PRIVATE' }
  );

  fake.chunks.push(
    {
      id: 'chunk-public',
      document_id: 'doc-public',
      chunk_index: 0,
      content: 'public content',
      embedding: axisVector(EMBEDDING_DIMENSIONS, 0),
      classification: 'PUBLIC',
      metadata: { source_file: 'src/data/socialLinks.ts' },
    },
    {
      id: 'chunk-pro',
      document_id: 'doc-pro',
      chunk_index: 0,
      content: 'professional content',
      embedding: axisVector(EMBEDDING_DIMENSIONS, 1),
      classification: 'PROFESSIONAL',
      metadata: { source_file: 'src/data/projects.ts' },
    },
    {
      id: 'chunk-secret',
      document_id: 'doc-secret',
      chunk_index: 0,
      content: 'confidential content',
      embedding: axisVector(EMBEDDING_DIMENSIONS, 0),
      classification: 'CONFIDENTIAL',
      metadata: { source_file: 'src/data/notes.ts' },
    },
    {
      id: 'chunk-private',
      document_id: 'doc-private',
      chunk_index: 0,
      content: 'private content',
      embedding: axisVector(EMBEDDING_DIMENSIONS, 0),
      classification: 'PRIVATE',
      metadata: { source_file: 'src/data/notes.ts' },
    },
    {
      id: 'chunk-no-embedding',
      document_id: 'doc-pro',
      chunk_index: 1,
      content: 'content without an embedding',
      embedding: null,
      classification: 'PROFESSIONAL',
      metadata: { source_file: 'src/data/projects.ts' },
    }
  );

  return fake;
}

test('returns the chunks that are closest to the question', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 1)),
    asClient(fake)
  );

  const result = await service.retrieve('a professional question', {
    logMetrics: false,
  });

  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0].content, 'professional content');
  assert.ok(result.chunks[0].similarity > 0.99);
});

test('never returns confidential or private content', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    asClient(fake)
  );

  const result = await service.retrieve('a question', { logMetrics: false });

  const classifications = result.chunks.map((chunk) => chunk.classification);

  assert.ok(!classifications.includes('CONFIDENTIAL'));
  assert.ok(!classifications.includes('PRIVATE'));
  assert.ok(classifications.every((value) => value === 'PUBLIC' || value === 'PROFESSIONAL'));
});

test('skips chunks that do not have an embedding', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 1)),
    asClient(fake)
  );

  const result = await service.retrieve('a question', { logMetrics: false });

  assert.ok(
    !result.chunks.some((chunk) => chunk.content === 'content without an embedding')
  );
});

test('returns no more than the requested number of chunks', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    asClient(fake)
  );

  const result = await service.retrieve('a question', { limit: 1, logMetrics: false });

  assert.equal(result.chunks.length, 1);
});

test('can restrict the search to certain source types', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    asClient(fake)
  );

  const result = await service.retrieve('a question', {
    sourceTypes: ['social_link'],
    logMetrics: false,
  });

  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0].sourceFile, 'src/data/socialLinks.ts');
});

test('returns nothing when nothing is similar enough', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 5)),
    asClient(fake)
  );

  const result = await service.retrieve('an unrelated question', {
    minSimilarity: 0.9,
    logMetrics: false,
  });

  assert.equal(result.chunks.length, 0);
  assert.equal(result.averageSimilarity, null);
});

test('returns nothing for an empty question', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    asClient(fake)
  );

  const result = await service.retrieve('   ', { logMetrics: false });

  assert.equal(result.chunks.length, 0);
});

test('reports the average similarity of the results', async () => {
  const fake = fakeWithChunks();
  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    asClient(fake)
  );

  const result = await service.retrieve('a question', { logMetrics: false });

  assert.ok(result.averageSimilarity !== null);
  assert.ok(result.averageSimilarity! > 0);
  assert.ok(result.durationMs >= 0);
});

test('reports a failure from the database', async () => {
  const fake = fakeWithChunks();
  const failing = {
    rpc: async () => ({ data: null, error: { message: 'the search failed' } }),
  } as unknown as SupabaseClient;

  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    failing
  );

  await assert.rejects(
    () => service.retrieve('a question', { logMetrics: false }),
    /the search failed/
  );
});

test('a failure of the database is reported with nothing as what answered', async () => {
  const reports: Report[] = [];
  setMonitoringClientFactory(() => createFakeClient(reports));

  const failing = {
    rpc: async () => ({
      data: null,
      error: { message: 'relation "knowledge_chunks" does not exist' },
    }),
  } as unknown as SupabaseClient;

  const service = createRetrievalService(
    fixedEmbedder(axisVector(EMBEDDING_DIMENSIONS, 0)),
    failing
  );

  try {
    await withMonitoring(async () => {
      await assert.rejects(
        () => service.retrieve('a question', { logMetrics: false }),
        /knowledge_chunks/
      );
    });

    assert.equal(reports.length, 1);
    assert.equal(reports[0].hint?.tags?.service, 'supabase');
    assert.equal(reports[0].hint?.tags?.what, 'none');
    assert.deepEqual(reports[0].hint?.fingerprint, ['supabase', 'unknown']);

    // The message of the database is not the report: it can name a table, a
    // column or a constraint.
    assert.equal(JSON.stringify(reports[0]).includes('knowledge_chunks'), false);
  } finally {
    setMonitoringClientFactory(null);
  }
});
