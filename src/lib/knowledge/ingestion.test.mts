import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ingestKnowledgeSources } from './ingestion.ts';
import { FakeSupabase } from './testing/fakeSupabase.ts';

/**
 * The fake is structurally compatible with the parts of the Supabase client
 * the pipeline uses, but not with the full client type.
 */
function asClient(fake: FakeSupabase): SupabaseClient {
  return fake as unknown as SupabaseClient;
}

/**
 * A phone number that must never reach the knowledge base (PRD §37).
 */
const PHONE_NUMBER = '+1 123 456 7890';

test('ingests every knowledge source without errors', async () => {
  const fake = new FakeSupabase();

  const stats = await ingestKnowledgeSources(asClient(fake));

  assert.deepEqual(stats.errors, []);
  assert.ok(stats.documentsCreated > 0, 'expected documents to be created');
  assert.ok(stats.chunksCreated > 0, 'expected chunks to be created');
  assert.equal(stats.documentsUpdated, 0);
  assert.equal(stats.documentsUnchanged, 0);
});

test('stores a document for each knowledge source type', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  const sourceTypes = new Set(
    fake.documents.map((document) => document.source_type as string)
  );

  for (const expected of [
    'project',
    'achievement',
    'resume_summary',
    'education',
    'certification',
    'career_timeline',
    'professional_snapshot',
    'capability_area',
    'social_link',
  ]) {
    assert.ok(sourceTypes.has(expected), `expected a "${expected}" document`);
  }
});

test('skips sources that hold no content yet', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  const sourceTypes = new Set(
    fake.documents.map((document) => document.source_type as string)
  );

  // The skills and testimonial sources are still empty placeholders, so they
  // must not produce empty documents.
  assert.equal(sourceTypes.has('skill'), false);
  assert.equal(sourceTypes.has('testimonial'), false);
});

test('classifies social links as PUBLIC and professional content as PROFESSIONAL', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  for (const document of fake.documents) {
    if (document.source_type === 'social_link') {
      assert.equal(document.classification, 'PUBLIC');
    } else {
      assert.equal(document.classification, 'PROFESSIONAL');
    }
  }
});

test('links every chunk to a stored document', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  const documentIds = new Set(fake.documents.map((document) => document.id));

  assert.ok(fake.chunks.length > 0, 'expected chunks to be stored');
  for (const chunk of fake.chunks) {
    assert.ok(
      documentIds.has(chunk.document_id as string),
      'every chunk must reference an existing document'
    );
  }
});

test('records the chunk index and the source file on every chunk', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  for (const chunk of fake.chunks) {
    assert.equal(typeof chunk.chunk_index, 'number');
    assert.equal(typeof chunk.metadata, 'object');
    assert.ok(
      typeof (chunk.metadata as Record<string, unknown>).source_file === 'string'
    );
  }
});

test('leaves the embedding null until it has been generated', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  for (const chunk of fake.chunks) {
    assert.equal(
      chunk.embedding,
      null,
      'the embedding must be null, because a pgvector column rejects a vector with the wrong number of dimensions'
    );
  }
});

test('does not leak a phone number into the stored content', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake), [
    {
      path: 'knowledge/contact.md',
      content: [
        '---',
        'title: Contact',
        'source_type: public_bio',
        'classification: PUBLIC',
        '---',
        '',
        `Reach me on ${PHONE_NUMBER} for anything urgent.`,
      ].join('\n'),
    },
  ]);

  const stored = [
    ...fake.documents.map((document) => document.content as string),
    ...fake.chunks.map((chunk) => chunk.content as string),
  ].join('\n');

  assert.ok(!stored.includes(PHONE_NUMBER), 'the phone number must be redacted');
  assert.ok(stored.includes('[REDACTED]'), 'the phone number must be replaced');
});

test('keeps dates in the stored content', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  const careerDocument = fake.documents.find(
    (document) => document.source_type === 'career_timeline'
  );

  assert.ok(careerDocument, 'expected a career timeline document');
  assert.match(
    careerDocument.content as string,
    /\d{4}-\d{2}-\d{2}/,
    'ISO dates must survive redaction'
  );
});

test('is idempotent: a second run does not duplicate anything', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));
  const documentsAfterFirstRun = fake.documents.length;
  const chunksAfterFirstRun = fake.chunks.length;

  const second = await ingestKnowledgeSources(asClient(fake));

  assert.deepEqual(second.errors, []);
  assert.equal(second.documentsCreated, 0);
  assert.equal(second.documentsUpdated, 0);
  assert.equal(second.documentsUnchanged, second.documentsUnchanged);
  assert.ok(second.documentsUnchanged > 0, 'expected documents to be untouched');
  assert.equal(second.chunksCreated, 0);
  assert.equal(fake.documents.length, documentsAfterFirstRun);
  assert.equal(fake.chunks.length, chunksAfterFirstRun);
});

test('updates a document in place and bumps its version when the content changes', async () => {
  const fake = new FakeSupabase();

  await ingestKnowledgeSources(asClient(fake));

  const project = fake.documents.find(
    (document) => document.source_type === 'project'
  );
  assert.ok(project, 'expected a project document');

  const originalVersion = project.version as number;
  const originalChunkCount = fake.chunks.filter(
    (chunk) => chunk.document_id === project.id
  ).length;

  // Simulate the source data changing.
  await fake
    .from('knowledge_documents')
    .update({ content: 'Project: changed' })
    .eq('id', project.id);

  const second = await ingestKnowledgeSources(asClient(fake));

  assert.equal(second.documentsUpdated, 1);
  assert.equal(second.documentsCreated, 0);
  assert.ok(second.chunksCreated > 0, 'expected the chunks to be rewritten');

  const updated = fake.documents.find((document) => document.id === project.id);
  assert.ok(updated, 'expected the document to still exist');
  assert.equal(updated.version as number, originalVersion + 1);

  const chunks = fake.chunks.filter(
    (chunk) => chunk.document_id === project.id
  );
  assert.equal(chunks.length, originalChunkCount);
  assert.ok(
    chunks.every((chunk) => !String(chunk.content).includes('Project: changed')),
    'the stale chunks must have been replaced'
  );
});
