# Immediate Next Actions

- Deploy the knowledge base (do this now, before M13.04, because M13.04 cannot be verified without it):
  1. Create a Supabase project and enable the `vector` extension for it
  2. Apply `supabase/migrations/20261018000001_create_knowledge_tables.sql` to the live project
  3. Add the real values to `.env.local`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`
  4. Run `npm run ingest` once and confirm the documents and chunks are stored
  5. Run `npm run env:check` to confirm the environment is complete
- `GITHUB_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are still placeholders, but they are not needed until M13.11. Set them when you reach that task
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. The skills and testimonial sources are still empty, so they currently produce no knowledge documents
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- Begin implementation of M13.04 (embedding generation) once the deployment steps above are done
