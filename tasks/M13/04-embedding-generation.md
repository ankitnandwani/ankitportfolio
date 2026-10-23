# M13.04 — Implement Embedding Generation and Vector Storage

## Objective

Implement embedding generation using the Gemini API and store the resulting vectors in Supabase with pgvector, enabling semantic search capabilities for the AI knowledge base.

## Context

To enable retrieval-augmented generation (RAG), document chunks must be converted into numerical embeddings that capture semantic meaning. Following PRD §32 (AI Knowledge Architecture) and PRD §49 (LLM Provider: Google Gemini API), we will use Gemini's embedding model to generate vectors. These vectors will be stored in the knowledge_chunks table using the pgvector extension for efficient similarity search.

## Requirements
- Install and configure the Google Generative AI SDK (@google/generative-ai) or use direct API calls.
- Implement a function that takes text content and returns an embedding vector using Gemini's embedding model.
- Handle API errors, rate limits, and retries appropriately.
- Generate embeddings for document chunks during ingestion or as a batch process.
- Store embeddings in the Supabase knowledge_chunks table in a vector column with appropriate dimensions.
- Ensure the embedding dimension matches what pgvector expects. The column is `VECTOR(768)`: the Gemini model must be asked for 768 dimensions explicitly, and 768 also has to stay at or below the 2000 dimension ceiling for indexing a pgvector `vector` column.
- Update existing chunks with embeddings (backfill) and handle new chunks.
- Consider batching embedding API calls for efficiency.

## Scope
### In scope
- Gemini embedding API integration
- Embedding generation function with error handling
- Batch processing of chunks for embedding generation
- Storage of embeddings in Supabase vector column
- Validation that embeddings are correctly stored and retrievable
- Logging of embedding generation metrics (tokens used, success/failure rates)

### Out of scope
- Alternative embedding models (we commit to Gemini for MVP)
- Real-time embedding generation on user query (could be done but we'll pre-generate for simplicity)
- Fine-tuning of embedding model
- Dimensionality reduction techniques

## Dependencies
- @google/generative-ai package (to be installed)
- Valid GEMINI_API_KEY environment variable
- Supabase client set up (M13.02)
- Knowledge chunks existing in database (from M13.03)

## Files / Areas Expected To Change
- `src/lib/gemini.ts` (to be created) - Gemini API wrapper for embeddings and generation
- `src/lib/knowledge/embedding.ts` (to be created) - Embedding service layer
- `src/lib/knowledge/storage.ts` (may be updated to handle vector storage) or create new
- `package.json` (to add @google/generative-ai dependency)
- May update ingestion pipeline to call embedding generation

## Implementation Guidance
1. Install @google/generative-ai: `npm install @google/generative-ai`
2. Create src/lib/gemini.ts:
   - Import { GoogleGenerativeAI } from '@google/generative-ai'
   - Initialize with GEMINI_API_KEY from environment
   - Export functions for embedding generation and text generation (for later use)
   - Consider creating a singleton instance
3. Create src/lib/knowledge/embedding.ts:
   - Function generateEmbedding(text: string): Promise<number[]> that calls Gemini's embedding model (e.g., "embedding-001")
   - Function batchGenerateEmbeddings(texts: string[]): Promise<number[][]> for efficiency
   - Error handling with retries (exponential backoff)
   - Log token usage if available
4. Create or update src/lib/knowledge/storage.ts:
   - Function to store embeddings: update knowledge_chunks set embedding = $1 where id = $2
   - Function to store a chunk with embedding in one operation
   - Consider using Supabase's upsert or update methods
5. Update the ingestion pipeline (M13.03) to generate embeddings for each chunk before storage, or create a separate batch job to process existing chunks without embeddings.
6. Verify the embedding dimension. `gemini-embedding-001` returns **3072** dimensions by default, so the request must set `output_dimensionality: 768` — otherwise every insert fails with `expected 768 dimensions, not 3072`. Note that `gemini-embedding-001` does not normalize truncated dimensions automatically (only `gemini-embedding-2` does), so a 768 dimension vector has to be normalized manually before it is stored.
7. Add validation to ensure embeddings are not null and have correct dimension before storage.

## Acceptance Criteria
- Gemini API key is validated and the SDK initializes successfully.
- Embedding generation function returns a 768-dimensional vector for sample text.
- Embeddings are stored in the knowledge_chunks.embedding column.
- At least one chunk has a non-null embedding after processing.
- Embedding generation handles API errors gracefully (retries, logging).
- Batch embedding generation works for multiple texts.

## Testing Requirements
- Test embedding generation with known text to ensure vector is produced.
- Verify embedding dimension is 768.
- Test storage and retrieval of embeddings from Supabase.
- Test error handling when API key is invalid or rate limited.
- Ensure batch processing works correctly.
- Check that embeddings are semantically similar for related texts (basic sanity check).

## Security / Privacy Considerations
- Gemini API key must be kept secret and never exposed to the client.
- Error messages should not reveal the API key or other sensitive information.
- Consider logging only metadata (token counts, success/failure) not the actual text content being embedded in production.
- Ensure compliance with Google's API usage policies.

## Performance / Accessibility Considerations
- Batch embedding generation to minimize API calls.
- Consider caching embeddings for unchanged content (using version field).
- Monitor API usage to stay within free tier limits.
- Embedding generation latency should be acceptable for background processing.

## Definition of Done
- @google/generative-ai is installed and configured.
- Embedding generation function works with Gemini API.
- Embeddings are stored in Supabase knowledge_chunks table.
- At least one knowledge chunk has a vector embedding stored.
- Embedding generation includes error handling and retries.
- Batch processing capability exists for efficiency.

## Related Requirements
- PRD §32: AI Knowledge Architecture
- PRD §49: LLM Provider – Google Gemini API
- PRD §51: Backend / data store – Supabase PostgreSQL with pgvector
- PRD §52: Vector Search – pgvector recommended
- PRD §83: Free‑tier focus