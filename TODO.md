# Immediate Next Actions

- Begin implementation of M17.01.
- Two decisions of the M17 plan are waiting for a human before M17.08 is started: the job fit analyzer lives at `/job-fit` and is not added to the main navigation, because PRD §8 and PRD §92 fix the navigation and it has no entry for it; and the analyzer gets its own rate limit bucket, because one analysis is not one message and PRD §48 sets the policy for messages
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- The rate limit of the chat is kept in memory, so it is lost when the instance restarts and it is per instance. That is what PRD §48 accepts for a site with low traffic, but a shared store (the Upstash Redis of PRD §53) would make it hold across instances. The store of the limiter is injected, so this is a change in one place
- The visitor is counted by the address the hosting platform writes into the request. A visitor who can change that header can get around the limit, so the limit is a guard against accidents rather than a wall
- The model of the chat is now `gemini-flash-lite-latest`, which answers in a few seconds without spending tokens on thinking. `gemini-flash-latest` needed 13 to 57 seconds for the same question, because it spends up to 75 tokens thinking before it answers
- Run the live language model tests with `LIVE_LLM_TESTS=1`. They are off by default because the free tier of the Gemini API allows twenty generation requests a day and a request over that limit is rejected for the rest of the day
- The guardrail patterns are a rule set, not a model. They need a look again once the chat is live, because the questions the visitors really ask are the ones that show whether a pattern is too broad or too narrow
- The personal content can wait. `src/data/skills.ts` and `src/data/testimonials.ts` are still empty placeholders, and neither is needed for the remaining M17 tasks. The point at which they become visible to users is the chatbot, which already says that the summary and the snapshot are pending verification. The point at which they become a launch blocker is the resume page, which currently shows "Skills data pending verification against resume." Add them before launch
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks

## Completed (M13.11)

- Analytics tracking system in `src/lib/analytics/` with:
  - Privacy-conscious session IDs (hashed IP + user agent)
  - Event tracking for: chat_session_start, message_sent, response_received, feedback_given, cta_clicked
  - PostHog integration (optional, via POSTHOG_KEY/POSTHOG_HOST env vars)
  - Console logging in development
  - PII redaction for feedback comments
- Feedback UI component `src/components/aiChat/FeedbackButton.tsx`:
  - Thumbs up/down buttons after each AI response
  - Optional comment field for negative ratings
  - Optimistic UI updates
  - Accessible with proper ARIA labels
- Feedback API endpoint `/api/feedback`:
  - Accepts messageId, queryId, rating, comment, isRedirect
  - Tracks feedback via analytics
- Knowledge base scan script `scripts/scanKnowledgeBase.mts`:
  - Scans knowledge_chunks and knowledge_documents tables for phone numbers
  - Uses same phone number pattern as ingestion pipeline
  - Excludes date patterns (ISO dates, MM/DD/YYYY)
  - Exits with error code if phone numbers found
- Chat API route updated to track:
  - Message sent events (with question category, guardrail action, message length)
  - Response received events (with retrieval success, chunks, similarity, latency, token usage, confidence)
- ChatMessage component updated to include FeedbackButton for assistant messages
- useChatAPI hook updated to capture metadata (queryId, isRedirect) from streaming response
- useChatState hook updated to store queryId and isRedirect on messages
- All 219 tests pass, lint passes, typecheck passes, build succeeds

## Completed (M13.12)

- End-to-end testing and verification of the complete AI Knowledge Base and Chat Assistant system
- Test plan created with 40 test cases across 5 categories:
  - Functional Correctness (10 tests): AI answers factual questions about automation tools, projects, career timeline, skills, certifications, education, achievements, backend technologies, CI/CD
  - Safety/Guardrails (10 tests): Off-topic redirects, prompt injection blocking (7 variants), PII protection (phone, email, address)
  - Edge Cases (6 tests): Empty message, message too long, long question, gibberish, special chars/emojis, non-English
  - Performance (4 tests): Non-streaming avg <5s, streaming first chunk <2s, retrieval <500ms, rate limiting enforcement
  - Integration (10 tests): Analytics events, feedback submission, rate limit headers, KB documents/chunks/embeddings, PII scan
- All 40 test cases pass
- Knowledge base verified: 39 documents, 39 chunks, all with 768-dim embeddings, 0 PII detected
- Response time: ~3.2s avg (non-streaming), ~1.8s first chunk (streaming)
- Rate limiting: 20 req/30min enforced with proper headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After)
- Analytics and feedback: Session tracking, message/response events, feedback submission all operational
- Test plan documented in `test-plan.md`
- All 219 unit tests pass, lint passes, typecheck passes, build succeeds