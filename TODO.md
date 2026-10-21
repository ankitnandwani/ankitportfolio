# Immediate Next Actions

- Finish M13.03 – Implement Document Ingestion Pipeline:
  - Run an end-to-end ingestion against Supabase and verify the stored documents and chunks, including that no phone numbers leak into chunk content
  - Make the ingestion pipeline runnable as a manual Node.js script
  - Fix the two findings recorded as TODO tests:
    - `src/lib/knowledge/pii.ts` – the phone-number regex also matches ISO dates such as `2021-01-01`, so career timeline, education and certification dates are redacted out of the knowledge base. PRD §37 scopes redaction to phone numbers only
    - `src/lib/knowledge/metadata.ts` – `getSourceTypeFromFilePath` returns `unknown` for `src/data/socialLinks.ts`, so social link documents are stored with classification `PROFESSIONAL` instead of `PUBLIC`
- Consider adding Playwright for the end-to-end tests named in PRD §104 (M13.12)
