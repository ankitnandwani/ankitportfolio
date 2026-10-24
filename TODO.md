# Immediate Next Actions

- Begin implementation of M13.05 (vector search). The knowledge base is ready for it: 39 chunks with normalised 768 dimension vectors, and the HNSW index is in place
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. The skills and testimonial sources are still empty, so they currently produce no knowledge documents. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- `GITHUB_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are still placeholders, but they are not needed until M13.11. Set them when you reach that task
