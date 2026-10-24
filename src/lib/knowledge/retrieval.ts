import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createEmbeddingService,
  embedWithGemini,
  EMBEDDING_DIMENSIONS,
  type TextEmbedder,
} from './embedding.ts';
import {
  PUBLIC_CLASSIFICATIONS,
  type KnowledgeClassification,
  type RetrievalOptions,
  type RetrievalResult,
  type RetrievedChunk,
} from './types.ts';

/**
 * The default number of chunks a retrieval returns.
 */
export const DEFAULT_RETRIEVAL_LIMIT = 5;

/**
 * The default lowest similarity a chunk may have to be returned.
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.3;

/**
 * The name of the database function that performs the search.
 */
export const MATCH_FUNCTION = 'match_knowledge_chunks';

/**
 * A row as it is returned by the match function.
 */
interface MatchRow {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
  classification: string;
  source_file: string | null;
}

/**
 * Returns the store to search in.
 *
 * The Supabase client is loaded on demand so that importing this module does
 * not require the environment to be complete.
 */
async function resolveStore(store?: SupabaseClient): Promise<SupabaseClient> {
  if (store) return store;

  const { supabaseServiceRole } = await import('../supabase.ts');
  return supabaseServiceRole;
}

/**
 * Converts a row from the match function into a retrieved chunk.
 */
function toRetrievedChunk(row: MatchRow): RetrievedChunk {
  return {
    chunkId: row.chunk_id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    similarity: Number(row.similarity),
    classification: row.classification as KnowledgeClassification,
    sourceFile: row.source_file ?? null,
  };
}

/**
 * Creates a retrieval service.
 *
 * @param embedder Turns the question into a vector.
 * @param store The store to search.
 */
export function createRetrievalService(
  embedder: TextEmbedder,
  store?: SupabaseClient
) {
  // The question is embedded with the retrieval task type, which differs
  // from the document task type the stored chunks were created with.
  const embedderService = createEmbeddingService(embedder, {
    taskType: 'RETRIEVAL_QUERY',
    dimensions: EMBEDDING_DIMENSIONS,
  });

  /**
   * Searches the knowledge base for the chunks that are closest to a question.
   *
   * @param query The question to search for.
   * @param options Limit, similarity threshold and filters.
   * @returns The matching chunks, closest first, and the search metrics.
   */
  async function retrieve(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    const startedAt = Date.now();

    const limit = options.limit ?? DEFAULT_RETRIEVAL_LIMIT;
    const minSimilarity = options.minSimilarity ?? DEFAULT_SIMILARITY_THRESHOLD;
    const classifications = options.classifications ?? PUBLIC_CLASSIFICATIONS;

    const result: RetrievalResult = {
      query,
      chunks: [],
      durationMs: 0,
      averageSimilarity: null,
    };

    const trimmed = query.trim();

    // An empty question cannot be embedded and has no meaning.
    if (!trimmed) {
      result.durationMs = Date.now() - startedAt;
      return result;
    }

    const embedding = await embedderService.generateEmbedding(trimmed);
    const target = await resolveStore(store);

    const { data, error } = await target.rpc(MATCH_FUNCTION, {
      query_embedding: embedding,
      match_count: limit,
      match_threshold: minSimilarity,
      allowed_classifications: classifications,
      allowed_source_types: options.sourceTypes ?? null,
    });

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as MatchRow[];
    result.chunks = rows.map(toRetrievedChunk);

    if (result.chunks.length > 0) {
      const total = result.chunks.reduce(
        (sum, chunk) => sum + chunk.similarity,
        0
      );
      result.averageSimilarity = total / result.chunks.length;
    }

    result.durationMs = Date.now() - startedAt;

    if (options.logMetrics !== false) {
      console.log(
        `[retrieval] query="${trimmed.slice(0, 60)}" ` +
          `results=${result.chunks.length} ` +
          `avg_similarity=${
            result.averageSimilarity === null
              ? 'n/a'
              : result.averageSimilarity.toFixed(3)
          } ` +
          `duration=${result.durationMs}ms`
      );
    }

    return result;
  }

  return { retrieve };
}

/**
 * Searches the knowledge base for the chunks that are closest to a question.
 *
 * @param query The question to search for.
 * @param options Limit, similarity threshold and filters.
 * @param store The store to search. Defaults to the Supabase service role
 *              client, which is created on demand.
 * @returns The matching chunks, closest first, and the search metrics.
 */
export async function retrieveChunks(
  query: string,
  options: RetrievalOptions = {},
  store?: SupabaseClient
): Promise<RetrievalResult> {
  const service = createRetrievalService(embedWithGemini, store);
  return service.retrieve(query, options);
}
