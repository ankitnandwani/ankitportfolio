/**
 * The classification levels allowed by the knowledge base (PRD §34).
 */
export type KnowledgeClassification =
  | 'PUBLIC'
  | 'PROFESSIONAL'
  | 'CONFIDENTIAL'
  | 'PRIVATE';

/**
 * The classifications that may be retrieved for the public chatbot.
 *
 * PRD §34 allows only PUBLIC and PROFESSIONAL content to reach the public
 * inference pipeline.
 */
export const PUBLIC_CLASSIFICATIONS: KnowledgeClassification[] = [
  'PUBLIC',
  'PROFESSIONAL',
];

/**
 * A chunk that was returned by a search.
 */
export interface RetrievedChunk {
  /**
   * The id of the chunk.
   */
  chunkId: string;

  /**
   * The id of the document the chunk belongs to.
   */
  documentId: string;

  /**
   * The position of the chunk inside its document.
   */
  chunkIndex: number;

  /**
   * The text of the chunk.
   */
  content: string;

  /**
   * How similar the chunk is to the query, between 0 and 1 for normalised
   * vectors. Higher is closer.
   */
  similarity: number;

  /**
   * The classification of the chunk.
   */
  classification: KnowledgeClassification;

  /**
   * The file the content came from, when it is known.
   */
  sourceFile: string | null;
}

/**
 * Options for a retrieval request.
 */
export interface RetrievalOptions {
  /**
   * The maximum number of chunks to return. Defaults to 5.
   */
  limit?: number;

  /**
   * The lowest similarity a chunk may have to be returned.
   * Defaults to 0.3.
   */
  minSimilarity?: number;

  /**
   * The classifications to search. Defaults to PUBLIC and PROFESSIONAL.
   */
  classifications?: KnowledgeClassification[];

  /**
   * Restricts the search to these source types. All of them when omitted.
   */
  sourceTypes?: string[];

  /**
   * Whether to log the retrieval metrics. Defaults to true.
   */
  logMetrics?: boolean;
}

/**
 * The outcome of a retrieval request.
 */
export interface RetrievalResult {
  /**
   * The query the search was made for.
   */
  query: string;

  /**
   * The chunks that matched, closest first.
   */
  chunks: RetrievedChunk[];

  /**
   * How long the search took, in milliseconds.
   */
  durationMs: number;

  /**
   * The average similarity of the returned chunks, or null when there were
   * none.
   */
  averageSimilarity: number | null;
}
