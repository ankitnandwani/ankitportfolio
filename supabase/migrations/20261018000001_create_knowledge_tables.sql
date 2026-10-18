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
    embedding VECTOR(768), -- Assuming Gemini embedding dimension of 768
    classification TEXT NOT NULL CHECK (classification IN ('PUBLIC', 'PROFESSIONAL', 'CONFIDENTIAL', 'PRIVATE')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering and vector search
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_classification ON knowledge_documents(classification);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_classification ON knowledge_chunks(classification);
-- For vector similarity search, we create an index on the embedding column
-- Using ivfflat for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);