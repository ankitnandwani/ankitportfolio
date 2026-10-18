# M13.03 — Implement Document Ingestion Pipeline

## Objective

Create a document ingestion pipeline that processes professional knowledge sources (resume, projects, achievements, etc.) into structured chunks with metadata, preparing them for embedding generation and storage in the AI knowledge base.

## Context

The AI knowledge base requires raw content to be broken down into semantically meaningful chunks that can be embedded and retrieved efficiently. Following PRD §32 (AI Knowledge Architecture) and PRD §33 (Initial Knowledge Sources), we need to process documents from sources like resume data, project descriptions, achievement details, and other approved professional information. The pipeline should extract metadata (source_type, classification, version) and split content into appropriate chunks while preserving context.

## Requirements
- Define chunking strategy (e.g., by paragraph, section, or fixed token size with overlap).
- Extract metadata from source documents: source_type (resume, project, achievement, etc.), classification (PUBLIC/PROFESSIONAL), version.
- Handle different input formats (JSON data files, markdown files, etc.).
- Ensure chunk content is clean and free of PII (phone numbers redacted).
- Store chunks with appropriate metadata linking back to source documents.
- Support incremental updates (versioning) to track when source data changes.
- Log ingestion statistics for monitoring.

## Scope
### In scope
- Document processing functions for each knowledge source type
- Chunking algorithm with configurable parameters
- Metadata extraction and enrichment
- PII detection and redaction (specifically phone numbers as per PRD §37)
- Version tracking for documents
- Error handling and logging
- Functions to persist documents and chunks via Supabase client

### Out of scope
- Actual embedding generation (handled in M13.04)
- Vector storage persistence (handled in M13.04)
- Retrieval logic (handled in M13.05)
- Web scraping or external API ingestion beyond approved sources
- Real-time synchronization triggers (batch processing approach is acceptable)

## Dependencies
- Document format defined (M13.01)
- Supabase client set up (M13.02)
- Knowledge source data available in src/data/ (resume data, projects, achievements, etc.)

## Files / Areas Expected To Change
- `src/lib/knowledge/ingestion.ts` (to be created) - Main ingestion pipeline
- `src/lib/knowledge/chunking.ts` (to be created) - Chunking utilities
- `src/lib/knowledge/metadata.ts` (to be created) - Metadata extraction per source type
- `src/lib/knowledge/pii.ts` (to be created) - PII detection and redaction
- May update existing data files to add version fields if needed

## Implementation Guidance
1. Analyze existing knowledge source files in src/data/ to understand their structure.
2. Define a chunking strategy: For resume sections, consider chunking by subsection (summary, experience item, etc.). For projects, chunk by project description. For achievements, each achievement could be a chunk. Use a combination of semantic splitting and fixed-size chunking with overlap (e.g., 100-200 tokens with 20% overlap).
3. Implement metadata extraction:
   - source_type: derived from the data file (e.g., "projects.ts" → source_type: "project")
   - classification: default to "PROFESSIONAL" for most content, "PUBLIC" for things like social links or public bio
   - version: start at 1, increment when source data changes
4. Create PII detection function that redacts phone numbers (replace with [REDACTED]) as per PRD §37.
5. Process each knowledge source:
   - Read data from src/data/*.ts files
   - Convert to appropriate document format
   - Apply PII redaction
   - Split into chunks
   - Assign metadata
   - Persist documents and chunks using Supabase client
6. Add logging to track number of documents processed, chunks created, etc.
7. Consider making the ingestion script runnable as a Node.js script for manual triggering.
8. Ensure the pipeline is idempotent or handles updates gracefully (using version field).

## Acceptance Criteria
- Ingestion pipeline can process at least three different knowledge source types (e.g., projects, achievements, resume).
- Output chunks contain clean text with PII redacted.
- Each chunk is associated with a document that has correct source_type and classification.
- Version tracking is implemented.
- Chunks are stored in Supabase with proper document relationships.
- Pipeline runs without errors and logs appropriate information.

## Testing Requirements
- Test chunking logic with sample text to ensure proper splits.
- Verify PII redaction works for various phone number formats.
- Test metadata extraction from sample data files.
- Perform end-to-end ingestion of a small subset of data and verify database records.
- Ensure no PII leaks into stored chunks.

## Security / Privacy Considerations
- PII detection must specifically redact phone numbers as required by PRD §37.
- Classification must be set correctly to avoid storing CONFIDENTIAL or PRIVATE data in the public knowledge base.
- Ingestion should run in a secure environment (not exposed to clients).
- Error logs should not contain raw PII data.

## Performance / Accessibility Considerations
- Chunking should be efficient; avoid overly complex algorithms for modest data sizes.
- Consider streaming large documents if needed (though knowledge base is expected to be small).
- Metadata extraction should be lightweight.

## Definition of Done
- Ingestion pipeline can process resume, projects, and achievements data sources.
- Chunks are generated with appropriate metadata (source_type, classification, version).
- PII (phone numbers) is redacted from chunk content.
- Documents and chunks are correctly stored in Supabase with referential integrity.
- Pipeline can be run incrementally with version updates.
- Logging provides visibility into ingestion process.

## Related Requirements
- PRD §32: AI Knowledge Architecture
- PRD §33: Initial Knowledge Sources
- PRD §34: Knowledge Classification
- PRD §37: Resume Phone Number Protection
- PRD §57: Single Source of Truth
- PRD §55: No Public Admin CMS (ingestion uses version-controlled data)