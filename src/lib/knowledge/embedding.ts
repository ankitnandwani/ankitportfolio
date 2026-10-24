import type { EmbedOptions } from '../gemini.ts';
import { withRetry } from '../retry.ts';

// The retry helper is shared with the LLM provider, so it lives outside the
// knowledge base. It is re-exported here because this module has always been
// its home.
export { isRetryableError, withRetry } from '../retry.ts';

/**
 * The number of dimensions the knowledge base stores.
 *
 * This has to match the `vector(768)` column in the knowledge_chunks table.
 * It also has to stay at or below 2000, the ceiling for indexing a pgvector
 * `vector` column.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Raised when an embedding has the wrong number of dimensions.
 */
export class EmbeddingDimensionError extends Error {
  constructor(expected: number, received: number) {
    super(
      `the embedding has ${received} dimensions, expected ${expected}. The ` +
        'embedding model has to be asked for the expected number of dimensions.'
    );
    this.name = 'EmbeddingDimensionError';
  }
}

/**
 * Turns text into embedding vectors.
 *
 * Kept as a type so the service can be exercised without calling Gemini.
 */
export type TextEmbedder = (
  texts: string[],
  options?: EmbedOptions
) => Promise<number[][]>;

/**
 * Normalises a vector to unit length.
 *
 * The Gemini embedding model does not normalise vectors that were truncated
 * to fewer dimensions, so this has to happen before the vector is stored.
 * Cosine similarity needs both sides of a comparison to be normalised.
 */
export function normalizeVector(vector: number[]): number[] {
  let sumOfSquares = 0;

  for (const value of vector) {
    if (!Number.isFinite(value)) {
      throw new Error('the embedding contains a value that is not a number');
    }
    sumOfSquares += value * value;
  }

  const magnitude = Math.sqrt(sumOfSquares);

  if (magnitude === 0) {
    throw new Error(
      'the embedding has no magnitude and cannot be normalised'
    );
  }

  return vector.map((value) => value / magnitude);
}

/**
 * Checks that a vector has the expected number of dimensions.
 *
 * @throws EmbeddingDimensionError when the length does not match.
 */
export function assertEmbeddingDimensions(
  vector: number[],
  expected: number = EMBEDDING_DIMENSIONS
): void {
  if (vector.length !== expected) {
    throw new EmbeddingDimensionError(expected, vector.length);
  }
}

/**
 * Checks that a vector is a usable embedding and normalises it.
 *
 * @param vector The raw vector from the model.
 * @param expected The number of dimensions it has to have.
 * @returns The normalised vector.
 */
export function prepareEmbedding(
  vector: number[],
  expected: number = EMBEDDING_DIMENSIONS
): number[] {
  assertEmbeddingDimensions(vector, expected);
  return normalizeVector(vector);
}

/**
 * Options for the embedding service.
 */
export interface EmbeddingServiceOptions {
  /**
   * The number of dimensions to ask the model for.
   */
  dimensions?: number;

  /**
   * What the embeddings will be used for.
   */
  taskType?: EmbedOptions['taskType'];

  /**
   * How many times a retryable failure is retried.
   */
  maxAttempts?: number;

  /**
   * The delay before the first retry, in milliseconds. It doubles after
   * every attempt.
   */
  baseDelayMs?: number;

  /**
   * Waits between retries. Used by the tests to avoid waiting.
   */
  wait?: (milliseconds: number) => Promise<void>;
}

/**
 * The default embedder.
 *
 * The Gemini module is loaded on demand so that importing this service does
 * not require the environment to be complete.
 */
export async function embedWithGemini(
  texts: string[],
  options?: EmbedOptions
): Promise<number[][]> {
  const { embedTexts } = await import('../gemini.ts');
  return embedTexts(texts, options);
}

/**
 * Creates an embedding service.
 *
 * @param embedder The function that talks to the model. Defaults to Gemini.
 * @param options Dimensions, task type and retry behaviour.
 */
export function createEmbeddingService(
  embedder: TextEmbedder = embedWithGemini,
  options: EmbeddingServiceOptions = {}
) {
  const dimensions = options.dimensions ?? EMBEDDING_DIMENSIONS;
  const taskType = options.taskType ?? 'RETRIEVAL_DOCUMENT';

  /**
   * Embeds a single text.
   *
   * @returns A normalised vector with the expected number of dimensions.
   */
  async function generateEmbedding(text: string): Promise<number[]> {
    const [vector] = await generateBatch([text]);
    return vector;
  }

  /**
   * Embeds several texts in one request.
   *
   * @returns One normalised vector per text, in the same order.
   */
  async function generateBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const vectors = await withRetry(
      () => embedder(texts, { taskType, outputDimensionality: dimensions }),
      {
        maxAttempts: options.maxAttempts,
        baseDelayMs: options.baseDelayMs,
        wait: options.wait,
      }
    );

    if (vectors.length !== texts.length) {
      throw new Error(
        `the model returned ${vectors.length} embeddings for ${texts.length} texts`
      );
    }

    return vectors.map((vector) => prepareEmbedding(vector, dimensions));
  }

  return { generateEmbedding, generateBatch, dimensions };
}

/**
 * Embeds a single text with Gemini.
 *
 * @param text The text to embed.
 * @param options Dimensions, task type and retry behaviour.
 * @returns A normalised vector with the expected number of dimensions.
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingServiceOptions = {}
): Promise<number[]> {
  const service = createEmbeddingService(embedWithGemini, options);
  return service.generateEmbedding(text);
}

/**
 * Embeds several texts with Gemini.
 *
 * @param texts The texts to embed.
 * @param options Dimensions, task type and retry behaviour.
 * @returns One normalised vector per text, in the same order.
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  options: EmbeddingServiceOptions = {}
): Promise<number[][]> {
  const service = createEmbeddingService(embedWithGemini, options);
  return service.generateBatch(texts);
}
