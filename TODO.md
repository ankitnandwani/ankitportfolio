# Immediate Next Actions

- Finish M13.04 (embedding generation):
  1. Get a Gemini API key from Google AI Studio and put it in `.env.local` as `GEMINI_API_KEY`. Set `GEMINI_MODEL` to the chat model you want to use and `GEMINI_EMBEDDING_MODEL` to `gemini-embedding-001`
  2. Run `npm run embed` to fill the 39 chunks that are still missing an embedding
  3. Confirm the result with `select count(*) from knowledge_chunks where embedding is not null;` — it should match the chunk count
  4. Run `npm test` once more. The live test that checks the embedding dimension and the semantic similarity of related texts skips itself until a real key is configured
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. The skills and testimonial sources are still empty, so they currently produce no knowledge documents
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- `GITHUB_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are still placeholders, but they are not needed until M13.11. Set them when you reach that task
- Begin implementation of M13.05 (vector search) after M13.04 is verified
