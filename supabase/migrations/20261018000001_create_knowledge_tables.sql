-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_type TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('PUBLIC', 'PROFESSIONAL', 'CONFIDENTIAL', 'PRIVATE')),
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_chunks table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    -- 768 dimensions is the embedding size requested from Gemini. It also has
    -- to stay at or below 2000, because that is the ceiling for indexing a
    -- pgvector `vector` column. The Gemini model defaults to 3072 dimensions,
    -- so the embedding service must ask for 768 explicitly.
    embedding VECTOR(768),
    classification TEXT NOT NULL CHECK (classification IN ('PUBLIC', 'PROFESSIONAL', 'CONFIDENTIAL', 'PRIVATE')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering and vector search
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_classification ON knowledge_documents(classification);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_classification ON knowledge_chunks(classification);
-- For vector similarity search, we create an index on the embedding column.
-- HNSW is used rather than IVFFlat because IVFFlat has to cluster the existing
-- rows when the index is built. It would be created here on an empty table,
-- which leaves it without usable cluster centres until it is rebuilt by hand.
-- HNSW has no training step, so it works on an empty table and keeps up with
-- rows inserted afterwards.
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Row level security.
--
-- The knowledge base is written and read by server side code only, which uses
-- the service role key and bypasses row level security. Without these
-- statements the tables would also be readable through the public API with
-- the anon key, which would expose the content of every classification and
-- bypass the filtering the ingestion pipeline applies.
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
