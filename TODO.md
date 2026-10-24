# Immediate Next Actions

- Finish M13.05 (vector search):
  1. Apply `supabase/migrations/20261024000001_add_vector_search.sql` to the Supabase project. The simplest route is the SQL editor: open the file, copy it, paste it, run. To set the project up for the CLI instead, run `supabase link --project-ref amhxorlxilwkkufebocn` (it asks for the database password) and then `supabase db push`
  2. Run `npm test`. The live retrieval tests verify the search against the real knowledge base: that a professional question returns relevant chunks, that the chunks come back ordered by similarity, that confidential and private content is never returned, and that the search is fast enough for a chat response
- Begin implementation of M13.06 (LLM provider abstraction) after M13.05 is verified
- The personal content can wait. `src/data/skills.ts` and `src/data/testimonials.ts` are still empty placeholders, and neither is needed for the remaining M13 tasks. The point at which they become visible to users is M13.09, when the chatbot starts answering questions about skills. The point at which they become a launch blocker is the resume page, which currently shows "Skills data pending verification against resume." Add them before launch
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- `GITHUB_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are still placeholders, but they are not needed until M13.11. Set them when you reach that task
