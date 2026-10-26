#!/usr/bin/env node
/**
 * Scan Knowledge Base for PII
 *
 * Queries the Supabase knowledge_chunks table and checks for phone number
 * patterns that may have been missed during ingestion. Logs any findings.
 *
 * Usage: npm run scan:kb
 */

import { createClient } from '@supabase/supabase-js';
import { containsPhoneNumbers } from '../src/lib/knowledge/pii.ts';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * The phone number pattern used in the ingestion pipeline.
 * Must match the one in src/lib/knowledge/pii.ts
 */
const PHONE_NUMBER_PATTERN =
  /(?:\+?(\d{1,3})[-.\s]?)?\(?(\d{1,4})[-.\s]?\)?[\d\s.-]{6,64}(\d{1,4})/g;

const DATE_PATTERN = /(\b\d{4}-\d{2}(?:-\d{2})?\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b)/g;

function mapOutsideDates(
  text: string,
  transform: (segment: string) => string
): string {
  return text
    .split(DATE_PATTERN)
    .map((segment, index) => (index % 2 === 1 ? segment : transform(segment)))
    .join('');
}

function detectPhoneNumbersInText(text: string): string[] {
  const matches: string[] = [];

  const checkSegment = (segment: string) => {
    const segmentMatches = segment.match(PHONE_NUMBER_PATTERN);
    if (segmentMatches) {
      matches.push(...segmentMatches);
    }
  };

  mapOutsideDates(text, (segment) => {
    checkSegment(segment);
    return segment;
  });

  return matches;
}

async function scanKnowledgeBase(): Promise<void> {
  console.log('[scan] Starting knowledge base scan for phone numbers...');

  let totalChunks = 0;
  let chunksWithPhoneNumbers = 0;
  let totalPhoneNumbers = 0;
  let page = 0;
  const pageSize = 100;

  while (true) {
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, document_id, knowledge_documents!inner(title, source_type)')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('[scan] Error fetching chunks:', error);
      process.exit(1);
    }

    if (!chunks || chunks.length === 0) {
      break;
    }

    for (const chunk of chunks) {
      totalChunks++;
      const phoneNumbers = detectPhoneNumbersInText(chunk.content);

      if (phoneNumbers.length > 0) {
        chunksWithPhoneNumbers++;
        totalPhoneNumbers += phoneNumbers.length;
        const doc = Array.isArray(chunk.knowledge_documents)
          ? chunk.knowledge_documents[0]
          : chunk.knowledge_documents;
        const docTitle = doc?.title ?? 'unknown';
        console.warn(
          `[scan] ⚠️  Chunk ${chunk.id} (doc: ${docTitle}) contains ${phoneNumbers.length} phone number(s):`
        );
        for (const phone of phoneNumbers) {
          console.warn(`  - ${phone}`);
        }
      }
    }

    console.log(`[scan] Processed ${totalChunks} chunks...`);
    page++;
  }

  console.log('\n[scan] ==================== SUMMARY ====================');
  console.log(`[scan] Total chunks scanned: ${totalChunks}`);
  console.log(`[scan] Chunks with phone numbers: ${chunksWithPhoneNumbers}`);
  console.log(`[scan] Total phone numbers found: ${totalPhoneNumbers}`);

  if (totalPhoneNumbers === 0) {
    console.log('[scan] ✅ No phone numbers found in knowledge base!');
  } else {
    console.log('[scan] ❌ Phone numbers detected - ingestion pipeline needs review');
    process.exit(1);
  }

  // Also scan documents table
  console.log('\n[scan] Scanning knowledge_documents table...');
  let totalDocs = 0;
  let docsWithPhoneNumbers = 0;
  let page2 = 0;

  while (true) {
    const { data: docs, error } = await supabase
      .from('knowledge_documents')
      .select('id, title, source_type, content')
      .range(page2 * pageSize, (page2 + 1) * pageSize - 1);

    if (error) {
      console.error('[scan] Error fetching documents:', error);
      process.exit(1);
    }

    if (!docs || docs.length === 0) {
      break;
    }

    for (const doc of docs) {
      totalDocs++;
      if (doc.content && containsPhoneNumbers(doc.content)) {
        docsWithPhoneNumbers++;
        console.warn(
          `[scan] ⚠️  Document ${doc.id} (${doc.source_type}: ${doc.title}) contains phone numbers`
        );
      }
    }

    page2++;
  }

  console.log(`[scan] Total documents scanned: ${totalDocs}`);
  console.log(`[scan] Documents with phone numbers: ${docsWithPhoneNumbers}`);

  if (docsWithPhoneNumbers > 0) {
    process.exit(1);
  }

  console.log('\n[scan] ✅ Scan complete - no phone numbers found!');
}

scanKnowledgeBase().catch((error) => {
  console.error('[scan] Fatal error:', error);
  process.exit(1);
});