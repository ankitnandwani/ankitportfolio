/**
 * Manual ingestion trigger for the AI knowledge base.
 *
 * Run it with: npm run ingest
 *
 * It reads every knowledge source, writes the documents and chunks to
 * Supabase, and reports what it did. Running it again is safe: documents
 * whose content did not change are left untouched, and documents whose
 * content changed are updated in place with a new version.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import dotenv from 'dotenv';

import type { MarkdownSource } from '../src/lib/knowledge/ingestion.ts';

/**
 * Directory holding the markdown knowledge sources (PRD §33).
 */
const KNOWLEDGE_DIRECTORY = 'knowledge';

/**
 * Reads every markdown file below a directory.
 *
 * README files are documentation for the folder, not knowledge, so they are
 * skipped.
 */
async function collectMarkdownSources(
  directory: string
): Promise<MarkdownSource[]> {
  const sources: MarkdownSource[] = [];

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    // The knowledge directory is optional.
    return sources;
  }

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      sources.push(...(await collectMarkdownSources(fullPath)));
      continue;
    }

    if (!entry.name.toLowerCase().endsWith('.md')) continue;
    if (entry.name.toLowerCase() === 'readme.md') continue;

    sources.push({
      path: relative(process.cwd(), fullPath),
      content: await readFile(fullPath, 'utf8'),
    });
  }

  return sources;
}

/**
 * Runs the ingestion.
 */
async function main(): Promise<void> {
  // The environment has to be loaded before anything reads it.
  dotenv.config({ path: '.env.local' });

  const markdownSources = await collectMarkdownSources(KNOWLEDGE_DIRECTORY);

  console.log(
    `[ingest] ${markdownSources.length} markdown source(s) found in ${KNOWLEDGE_DIRECTORY}/`
  );

  const { ingestKnowledgeSources, logIngestionStats } = await import(
    '../src/lib/knowledge/ingestion.ts'
  );

  let store;
  try {
    ({ supabaseServiceRole: store } = await import('../src/lib/supabase.ts'));
  } catch (error) {
    console.error(
      '[ingest] the Supabase client could not be created. Check that .env.local ' +
        'contains the required values.'
    );
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const stats = await ingestKnowledgeSources(store, markdownSources);
  logIngestionStats(stats);

  if (stats.errors.length > 0) {
    process.exitCode = 1;
  }
}

await main();
