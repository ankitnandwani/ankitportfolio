# Immediate Next Actions

- Begin implementation of M13.07 (AI guardrails: topic classification, PII detection and prompt injection protection)
- The personal content can wait. `src/data/skills.ts` and `src/data/testimonials.ts` are still empty placeholders, and neither is needed for the remaining M13 tasks. The point at which they become visible to users is M13.09, when the chatbot starts answering questions about skills. The point at which they become a launch blocker is the resume page, which currently shows "Skills data pending verification against resume." Add them before launch
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- `GITHUB_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are still placeholders, but they are not needed until M13.11. Set them when you reach that task
- Re-measure the retrieval similarity threshold once the M13.07 guardrails exist, since the guardrails decide what to do with an off-topic question
- Decide on the model for the chatbot. The configured `gemini-flash-latest` needs 13 to 57 seconds for a short question on the free tier, because it spends up to 75 tokens thinking before it answers. `gemini-flash-lite-latest` answered the same question in 6.8 seconds without any thinking tokens, and PRD §50 asks for the most cost efficient model that still answers well. This is a decision for the chat work of M13.08 and M13.09
- Use the streaming path for the chat. A streamed answer starts arriving in a few seconds, while a complete answer waits for the whole response. The provider already supports it, and the timeout of a stream restarts every time a piece arrives
- Run the live language model tests with `LIVE_LLM_TESTS=1`. They are off by default because the free tier of the Gemini API allows twenty generation requests a day and a request over that limit is rejected for the rest of the day
