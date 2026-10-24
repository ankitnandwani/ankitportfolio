-- Vector similarity search over the knowledge base.
--
-- The search runs inside the database so that the HNSW index on the
-- embedding column can be used, and so that the classification filter can
-- never be bypassed by the caller. Only the classifications that are passed
-- in are ever selected, and the default is the pair that PRD 34 allows for
-- the public chatbot.

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding vector(768),
    match_count integer DEFAULT 5,
    match_threshold double precision DEFAULT 0.3,
    allowed_classifications text[] DEFAULT ARRAY['PUBLIC', 'PROFESSIONAL']::text[],
    allowed_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    similarity double precision,
    classification text,
    source_file text
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id,
        c.document_id,
        c.chunk_index,
        c.content,
        1 - (c.embedding <=> query_embedding) AS similarity,
        c.classification,
        c.metadata ->> 'source_file' AS source_file
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
      AND c.classification = ANY(allowed_classifications)
      AND (allowed_source_types IS NULL OR d.source_type = ANY(allowed_source_types))
      AND 1 - (c.embedding <=> query_embedding) >= match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- The function is called with the service role key from the server, which
-- bypasses row level security. It is revoked from the public roles so that
-- it cannot be reached with the publishable key. PostgreSQL grants execute
-- on new functions to PUBLIC, so that grant has to be revoked as well.
REVOKE ALL ON FUNCTION match_knowledge_chunks(vector, integer, double precision, text[], text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION match_knowledge_chunks(vector, integer, double precision, text[], text[]) TO service_role;
