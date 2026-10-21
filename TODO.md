# Immediate Next Actions

- Finish M13.03 – Implement Document Ingestion Pipeline:
  - Add unit tests for chunking, PII redaction and metadata extraction (a test runner still needs to be wired into `npm test`, which currently reports "No tests yet")
  - Run an end-to-end ingestion against Supabase and verify the stored documents and chunks, including that no phone numbers leak into chunk content
  - Make the ingestion pipeline runnable as a manual Node.js script
