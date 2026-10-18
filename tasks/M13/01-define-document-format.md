# M13.01 — Define AI Knowledge Base Document Format and Schema

## Objective

Define the structure of knowledge base documents and create the corresponding Supabase database schema for storing documents and their vector embeddings. This establishes the foundation for the AI knowledge base that will power the assistant.

## Context

The AI knowledge base requires a structured way to store professional information from various sources (resume, projects, achievements, etc.) with metadata for filtering and retrieval. Following PRD §54 database schema recommendations and PRD §32-34 knowledge architecture, we need to define document format with classification, source type, and versioning, then implement the storage layer using Supabase PostgreSQL with pgvector for vector search.

## Requirements

- Define document format fields: title, source_type, classification, content, version, plus any additional metadata needed for filtering.
- Create Supabase tables: `knowledge_documents` and `knowledge_chunks` as outlined in PRD §54.
- Implement proper data types, constraints, and indexes for efficient querying.
- Ensure the schema supports metadata filtering by classification (PUBLIC/PROFESSIONAL), source_type, and other attributes.
- Include timestamps for tracking updates.
- The schema should align with the Single Source of Truth principle (PRD §57).

## Scope

### In scope
- Document format definition (JSON/TypeScript interface)
- Supabase SQL schema for knowledge_documents and knowledge_chunks tables
- Primary keys, foreign keys, indexes, and constraints
- Basic fields: id, title, source_type, classification, content, version, created_at, updated_at
- Embedding storage in knowledge_chunks (vector column)
- Document-chunk relationship (one-to-many)

### Out of scope
- Actual document ingestion pipeline (will be handled in M13.03)
- Embedding generation (will be handled in M13.04)
- Retrieval queries (will be handled in M13.05)
- UI components for chat interface
- LLM integration

## Dependencies

- Supabase project must be set up (environment variables configured)
- pgvector extension enabled in Supabase
- TypeScript types for document format

## Files / Areas Expected To Change
- `supabase/` directory (to be created) - migration files
- `src/lib/supabase.ts` (to be created) - Supabase client wrapper
- `src/types/knowledge.ts` (to be created) - TypeScript interfaces for knowledge base
- `src/lib/knowledge/schema.ts` (to be created) - Schema definitions

## Implementation Guidance
1. First, set up Supabase project if not already done (should be configured via environment variables).
2. Enable pgvector extension in Supabase via SQL: `create extension if not exists vector;`
3. Create migration files for the two tables:
   - knowledge_documents: id (uuid, primary key), title (text), source_type (text), classification (text), content (text), version (integer), created_at (timestamp), updated_at (timestamp)
   - knowledge_chunks: id (uuid, primary key), document_id (uuid, foreign key), chunk_index (integer), content (text), embedding (vector(768) - assuming Gemini embedding dimension), classification (text), metadata (jsonb), created_at (timestamp)
4. Add indexes: 
   - On knowledge_documents.classification for filtering
   - On knowledge_chunks using ivfflat or hnsw for vector similarity search (pgvector indexes)
5. Create TypeScript interfaces that match the database schema.
6. Establish foreign key relationship: knowledge_chunks.document_id references knowledge_documents.id with ON DELETE CASCADE.
7. Ensure RLS (Row Level Security) policies are configured appropriately for public access (since knowledge base should be readable by the public chatbot).

## Acceptance Criteria
- Supabase schema is successfully applied and tables are created.
- TypeScript interfaces accurately reflect the database structure.
- Foreign key constraint exists between knowledge_chunks and knowledge_documents.
- Indexes are created for efficient filtering and vector search.
- Schema supports storing document metadata and vector embeddings.
- No extraneous fields that aren't needed for MVP.

## Testing Requirements
- Verify database schema can be inspected via Supabase dashboard or psql.
- Test inserting a sample document and chunk to ensure constraints work.
- Verify that deleting a document cascades to delete its chunks.
- Test querying documents by classification and source_type.

## Security / Privacy Considerations
- Ensure classification field is used to restrict access to PUBLIC/PROFESSIONAL content only (CONFIDENTIAL/PRIVATE should never be stored in the public knowledge base).
- Implement RLS policies to prevent unauthorized writes (only admin/service role should be able to write).
- Ensure no PII is stored in the knowledge base (phone numbers, etc. should be redacted during ingestion - see M13.11).

## Performance / Accessibility Considerations
- Indexes should be designed for efficient vector search and metadata filtering.
- Consider using appropriate vector index type (ivfflat or hnsw) based on expected data size.
- Timestamp fields should be indexed for potential time-based queries.

## Definition of Done
- Supabase schema for knowledge_documents and knowledge_chunks is created and migrated.
- TypeScript interfaces defined for knowledge base entities.
- Supabase client wrapper can connect to the database.
- Basic CRUD operations can be performed via the client (insert document, insert chunk, query documents).
- Schema supports metadata filtering by classification and source_type.

## Related Requirements
- PRD §54: Database Schema (knowledge_documents, knowledge_chunks tables)
- PRD §32: AI Knowledge Architecture
- PRD §33: Initial Knowledge Sources
- PRD §34: Knowledge Classification
- PRD §57: Single Source of Truth