# M13.05 — Implement Vector Search Retrieval with Metadata Filtering

## Objective

Implement vector similarity search using pgvector in Supabase with metadata filtering capabilities to retrieve the most relevant knowledge chunks for a given query, forming the retrieval component of the RAG pipeline.

## Context

Once knowledge chunks are embedded and stored, the system needs to find the most relevant pieces of information for a user's question. Following PRD §32 (AI Knowledge Architecture) and PRD §52 (Vector Search: pgvector recommended), we will implement a retrieval function that converts a query into an embedding, performs similarity search against stored vectors, and filters results by metadata (classification, source_type, etc.) to ensure only appropriate content is used for generation.

## Requirements
- Generate query embedding from user text using the same Gemini embedding model.
- Perform vector similarity search in Supabase using pgvector distance functions (cosine similarity or Euclidean distance).
- Implement metadata filtering to restrict results to PUBLIC and PROFESSIONAL classifications (excluding CONFIDENTIAL/PRIVATE).
- Allow additional filtering by source_type if needed (e.g., only from projects or resume).
- Return top-k most relevant chunks with similarity scores.
- Handle cases where no relevant chunks are found.
- Ensure the retrieval function is efficient and scalable for the expected knowledge base size.
- Log retrieval metrics (query time, number of results, etc.).

## Scope
### In scope
- Query embedding generation using Gemini API
- Vector similarity search implementation with pgvector
- Metadata filtering (classification, source_type, version)
- Top-k results retrieval with similarity scores
- Error handling for empty results or API failures
- Integration with Supabase client
- Logging of retrieval performance

### Out of scope
- Advanced reranking techniques (though basic similarity search is sufficient for MVP)
- Query expansion or rewriting
- Hybrid search combining vector and keyword search
- Persistent query caching (could be added later)

## Dependencies
- Embedding generation implemented (M13.04)
- Knowledge chunks with embeddings stored in database (M13.04)
- Supabase client set up (M13.02)
- Gemini API access

## Files / Areas Expected To Change
- `src/lib/knowledge/retrieval.ts` (to be created) - Main retrieval service
- `src/lib/knowledge/types.ts` (to be created) - Types for retrieval results
- May update `src/lib/gemini.ts` to ensure embedding function is accessible
- May update `src/lib/knowledge/storage.ts` if helper functions are needed

## Implementation Guidance
1. Choose similarity metric: cosine similarity is common for embeddings. Supabase pgvector supports `<=>` (Euclidean distance), `<#>` (negative inner product), and `<=>` can be used for cosine via normalization. We'll use cosine similarity: 1 - (embedding <=> query_embedding) or use the vector similarity functions.
2. Create retrieval function:
   - Input: query text, options (limit, filters)
   - Steps:
     a. Generate embedding for query text using Gemini embedding function.
     b. Construct Supabase query:
        - Select from knowledge_chunks
        - Join with knowledge_documents to get document metadata (title, source_type, classification, etc.)
        - Filter by classification IN ('PUBLIC', 'PROFESSIONAL')
        - Apply additional filters if provided (source_type, version range)
        - Order by embedding <=> query_embedding (ascending for Euclidean distance, or use similarity)
        - Limit to k results (e.g., 5-10)
     c. Execute query and return results with similarity score.
3. Consider creating a database function or using Supabase's rpc for complex queries, but direct querying is fine for MVP.
4. Handle the case where embeddings might be null (should not happen if ingestion is complete).
5. Add logging for query duration, number of results, and average similarity score.
6. Test with sample queries to ensure relevant chunks are returned.

## Acceptance Criteria
- Retrieval function successfully generates query embedding.
- Vector similarity search returns chunks ordered by relevance.
- Metadata filtering correctly excludes CONFIDENTIAL and PRIVATE content.
- Top-k results are returned with similarity scores.
- Retrieval works for queries related to professional knowledge (e.g., "What is Ankit's automation experience?").
- Error handling for missing embeddings or API failures.

## Testing Requirements
- Test query embedding generation produces valid vectors.
- Test retrieval with a known query that should match specific chunks.
- Verify that filtering by classification works (insert a CONFIDENTIAL chunk and ensure it's not returned).
- Test top-k limit returns correct number of results.
- Test performance with expected data size (should be fast for few hundred chunks).
- Ensure no SQL injection vulnerabilities.

## Security / Privacy Considerations
- Metadata filtering is critical: ensure CONFIDENTIAL and PRIVATE classifications are never returned.
- Classification field must be trusted; ensure ingestion sets it correctly.
- Avoid leaking information through error messages (e.g., don't reveal why a chunk was filtered out).
- Consider adding database-level row security as an additional layer.

## Performance / Accessibility Considerations
- Ensure proper indexes on knowledge_chunks.embedding column for vector search (ivfflat or hnsw).
- Index on knowledge_documents.classification for filtering.
- Consider limiting query complexity to maintain consistent performance.
- For small knowledge bases (<1000 chunks), brute force search may be acceptable but indexes are still recommended.

## Definition of Done
- Retrieval function can generate query embedding using Gemini API.
- Vector similarity search is performed against stored chunk embeddings.
- Results are filtered by classification (PUBLIC/PROFESSIONAL only).
- Function returns top-k chunks with relevance scores.
- Retrieval works for sample professional queries and excludes inappropriate content.
- Performance is acceptable for the expected knowledge base size.

## Related Requirements
- PRD §32: AI Knowledge Architecture
- PRD §34: Knowledge Classification
- PRD §37: Resume Phone Number Protection (indirect, via filtering)
- PRD §38: Prompt Injection Defense (retrieval provides context to prevent hallucination)
- PRD §39: Off-Topic Conversation Handling
- PRD §40: Professional Conversation Redirect
- PRD §43: AI Source Grounding
- PRD §52: Vector Search – pgvector recommended