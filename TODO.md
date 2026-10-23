# Immediate Next Actions

- Deployment prerequisites for M13.03 (the code is complete and verified against an in-memory Supabase double):
  - Provision the Supabase project and replace the placeholder values in `.env.local` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
  - Apply the migrations in `supabase/migrations/` to the live project so the `knowledge_documents` and `knowledge_chunks` tables and the pgvector extension exist
  - Run `npm run ingest` once against the live project and confirm the documents and chunks are stored
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. The skills and testimonial sources are still empty, so they currently produce no knowledge documents
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- Begin implementation of M13.04 (embedding generation)
