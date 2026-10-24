import { GoogleGenAI, type Content } from '@google/genai';

import { env } from './env.ts';
import { GeminiApiError, readErrorDetails } from './geminiErrors.ts';

// The error helpers live in their own module so that the LLM provider can use
// them without pulling in the environment. They are re-exported here because
// this module has always been their home.
export { GeminiApiError, readErrorDetails } from './geminiErrors.ts';

/**
 * The kind of task an embedding is produced for.
 *
 * The knowledge base stores documents that are searched later, so they use
 * RETRIEVAL_DOCUMENT. A question typed into the chat uses RETRIEVAL_QUERY.
 */
export type GeminiTaskType =
  | 'RETRIEVAL_DOCUMENT'
  | 'RETRIEVAL_QUERY'
  | 'SEMANTIC_SIMILARITY'
  | 'CLASSIFICATION'
  | 'CLUSTERING'
  | 'QUESTION_ANSWERING'
  | 'FACT_VERIFICATION'
  | 'CODE_RETRIEVAL_QUERY';

/**
 * Options for an embedding request.
 */
export interface EmbedOptions {
  /**
   * What the embedding will be used for. Defaults to RETRIEVAL_DOCUMENT.
   */
  taskType?: GeminiTaskType;

  /**
   * A title for the text. Only used with the RETRIEVAL_DOCUMENT task type.
   */
  title?: string;

  /**
   * The number of dimensions to ask the model for.
   */
  outputDimensionality?: number;
}

/**
 * The shared Gemini client.
 *
 * It is created on first use so that the API key stays out of the module
 * graph until an embedding is actually requested.
 */
let client: GoogleGenAI | null = null;

/**
 * Returns the shared Gemini client, creating it on first use.
 *
 * Creating it lazily keeps the API key out of the module graph until an
 * embedding is actually requested.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

/**
 * Replaces the shared client. Used by the tests.
 */
export function setGeminiClient(next: GoogleGenAI | null): void {
  client = next;
}

/**
 * Embeds one or more texts with the configured embedding model.
 *
 * @param texts The texts to embed. An empty list returns an empty list.
 * @param options Task type, title and output dimension.
 * @returns One vector per text, in the same order.
 */
export async function embedTexts(
  texts: string[],
  options: EmbedOptions = {}
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const config: EmbedOptions & { taskType: GeminiTaskType } = {
    taskType: options.taskType ?? 'RETRIEVAL_DOCUMENT',
  };

  if (options.title !== undefined) config.title = options.title;
  if (options.outputDimensionality !== undefined) {
    config.outputDimensionality = options.outputDimensionality;
  }

  try {
    // Each text has to be its own content object. An array of plain strings
    // is read as one content with several parts, which returns a single
    // embedding for the whole batch.
    const contents: Content[] = texts.map((text) => ({ parts: [{ text }] }));

    const response = await getGeminiClient().models.embedContent({
      model: env.GEMINI_EMBEDDING_MODEL,
      contents,
      config,
    });

    const embeddings = response.embeddings ?? [];

    return texts.map((_, index) => embeddings[index]?.values ?? []);
  } catch (error) {
    throw toGeminiApiError(error);
  }
}

/**
 * Converts an SDK error into a GeminiApiError with a status code.
 */
function toGeminiApiError(error: unknown): GeminiApiError {
  if (error instanceof GeminiApiError) return error;

  const { message, status } = readErrorDetails(error);

  return new GeminiApiError(message, status);
}
