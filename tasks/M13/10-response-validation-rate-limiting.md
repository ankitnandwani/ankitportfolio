# M13.10 — Implement Response Validation, Safety Checks, and Rate Limiting

## Objective

Implement final response validation to ensure AI outputs are safe, professional, and compliant with privacy rules, along with rate limiting to prevent abuse and ensure fair usage of the AI assistant within free tier constraints.

## Context

Following PRD §42 (AI Answer Quality), PRD §46 (Chat Analytics), PRD §47 (AI Feedback Loop), PRD §48 (AI Rate Limiting), and PRD §80 (AI Guardrails), we need to add a final layer of validation before sending responses to the user, and implement rate limiting to protect the service from excessive usage. This task builds upon the output guardrails from M13.07 but adds more structured validation and explicit rate limiting mechanisms.

## Requirements
- Implement response validation that checks for:
  - Remaining PII that should have been redacted (phone numbers, etc.)
  - Professional tone (no excessive familiarity, slang, or inappropriate language)
  - Factual consistency with provided context (basic checks)
  - Length limits to prevent overly verbose responses
  - Safe completion: if validation fails, return a polite fallback message
- Implement rate limiting for the AI chat endpoint:
  - Per-IP or per-session limits to prevent abuse
  - Configurable limits (e.g., 20 messages per 30 minutes, 100 messages per day as suggested in PRD §48)
  - Return friendly error messages when limits are exceeded
  - Consider using headers to communicate limits (like X-RateLimit-Remaining)
  - Log rate limiting events for monitoring
- Integrate both validation and rate limiting into the AI chat API route.
- Ensure that rate limiting does not block legitimate users under normal usage.
- Provide clear feedback to users when they are rate limited (suggest trying again later).

## Scope
### In scope
- Response validation functions for PII, tone, length, and safety
- Rate limiting implementation (in-memory store, Redis optional, or simple timestamp tracking)
- Integration into the chat API route (before sending response to user)
- Configurable limits via environment variables
- Feedback messages for rate limit exceeded
- Logging of validation failures and rate limiting events
- Graceful degradation: if rate limiting store fails, consider allowing requests or failing safely

### Out of scope
- Advanced NLP-based toxicity detection (beyond scope for MVP)
- Machine learning models for response quality scoring
- Distributed rate limiting across multiple instances (single instance is acceptable for Vercel serverless)
- Complex quota systems with rolling windows (fixed window or simple token bucket is acceptable)
- Authentication-based rate limiting (we'll use IP or session-based)

## Dependencies
- Orchestration RAG pipeline (M13.09)
- Guardrails for PII detection (M13.07)
- Environment variables for configuration
- Knowledge base and LLM provider

## Files / Areas Expected To Change
- `src/lib/ai/validation.ts` (to be created) - Response validation functions
- `src/lib/ai/rateLimiter.ts` (to be created) - Rate limiting utility
- `src/lib/ai/api/chat/route.ts` (the chat API route) - to integrate validation and rate limiting
- May update `src/lib/ai/orchestration.ts` to accept validation options
- May update environment variable validation to include rate limit configs
- `src/lib/env.ts` (may need updates)

## Implementation Guidance
1. Response Validation:
   - Create validation function that takes the generated response and returns a ValidationResult (isValid, errors, suggestedFix).
   - PII check: run phone number and email detection (similar to M13.07) and flag if any found.
   - Tone check: simple heuristic checks for excessive informality (e.g., too many exclamation marks, slang words) – can be basic for MVP.
   - Length check: ensure response is under a reasonable limit (e.g., 500 characters for conciseness, or 1000).
   - Hallucination check: optional, could verify that key facts in response appear in the context (but this is complex; rely on retrieval grounding).
   - If validation fails, either attempt to regenerate with stricter prompt or return a safe fallback: "I want to ensure I provide accurate information. Let me try to rephrase or you can ask about his professional experience in a different way."
2. Rate Limiting:
   - Decide on storage: for Vercel serverless, we can use in-memory storage (but it resets per instance) or use Upstash Redis if configured (optional per PRD §53).
   - Simpler approach: use a simple timestamp array in memory (not persistent across invocations but works for basic protection against brute force in a single instance).
   - Better: if Upstash Redis is configured (via UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN), use it for distributed rate limiting.
   - Implement a token bucket or fixed window counter.
   - Key by IP address (from request headers) or by session (if we implement session tracking).
   - Limits: e.g., MAX_REQUESTS_PER_WINDOW = 20, WINDOW_SECONDS = 1800 (30 minutes); DAILY_LIMIT = 100.
   - When limit exceeded, return HTTP 429 (Too Many Requests) with retry-after header and friendly JSON error.
   - Log rate limiting events (IP, timestamp, action taken).
3. Integration:
   - In the chat API route, first check rate limit; if exceeded, return 429.
   - Then process the message through orchestration (which includes guardrails).
   - After getting response from orchestration, run response validation.
   - If validation fails, log and return fallback message.
   - Otherwise, return the validated response.
4. Configuration:
   - Add environment variables: RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_DAILY_MAX.
   - Validate these in env.ts.
   - Default values can be those suggested in PRD §48.
5. Consider adding response headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.

## Acceptance Criteria
- Response validation correctly identifies PII in AI responses.
- Validation flags overly informal tone (if implemented simply).
- Length validation works for excessively long responses.
- Rate limiting blocks requests after exceeding the configured limit.
- Rate limiting resets after the time window (or day).
- Friendly error messages are returned when rate limited.
- Validation and rate limiting do not interfere with legitimate requests under normal usage.
- Logging captures validation failures and rate limiting events.

## Testing Requirements
- Test response validation with inputs containing phone numbers (should be caught).
- Test validation with very long response (should trigger length error).
- Test rate limiting by making requests in quick succession beyond limit.
- Verify that after waiting, requests succeed again.
- Test that legitimate requests under limit are not blocked.
- Check that response headers are present if implemented.
- Ensure error messages do not leak sensitive information.
- Test fallback response when validation fails.

## Security / Privacy Considerations
- Response validation is a critical privacy safeguard to catch any PII that slipped through earlier guards.
- Rate limiting prevents abuse that could lead to excessive costs or service degradation.
- Ensure that rate limiting does not inadvertently block legitimate users (choose reasonable limits).
- Error messages should not reveal internal state that could aid attackers.
- Consider securing the rate limiting store from tampering (if using Redis, ensure proper auth).

## Performance / Accessibility Considerations
- Response validation should be lightweight; avoid heavy computations.
- Rate limiting check should be fast (O(1) or O(log n)).
- If using in-memory storage, be aware of memory usage over time (consider expiring old entries).
- For serverless functions, in-memory state is not shared across instances, so rate limiting is per-instance. This may be acceptable for low traffic.
- If using Upstash Redis, consider network latency.

## Implementation Notes

Recorded when the task was implemented, so the differences between this
specification and the delivered code are not a surprise later.

- **The files live in `src/lib/ai/`.** The specification points at
  `src/lib/ai/validation.ts` and `src/lib/ai/rateLimiter.ts`, and the route
  it names as `src/lib/ai/api/chat/route.ts` is `app/api/chat/route.ts`, the
  place the Next.js routes live in this project.
- **The rate limit is kept in memory.** The store is injected, so a shared
  store can replace it later without changing the callers. The Upstash Redis
  of PRD §53 is not used yet, because its variables are still placeholders
  and the task leaves distributed limiting out of scope.
- **Both windows slide.** A request only counts against the half hour and
  the day it was made in.
- **The limits are optional in the environment.** The code holds the values
  PRD §48 suggests, so a missing variable only means the default is used.
- **The validation runs in the route.** The route is the boundary where the
  answer leaves the server. For a streamed answer the check runs on the
  final text, which the interface shows in place of the text it streamed.
- **The tone is reported and not changed.** An answer that is a little too
  informal is still a correct answer, so it is shown and the finding is
  reported. Personal data that survived the guardrails is the one thing
  that keeps an answer from being shown at all.

## Definition of Done
- Response validation function checks for PII, tone, and length.
- Rate limiting implementation enforces per-IP or per-session limits.
- Chat API route integrates rate limiting before processing and validation after.
- Configuration via environment variables works.
- Rate limiting returns HTTP 429 with appropriate headers and friendly message.
- Response validation failures result in a safe fallback message.
- Logging captures validation and rate limiting events.
- System remains usable for normal conversation volumes.

## Related Requirements
- PRD §42: AI Answer Quality
- PRD §46: Chat Analytics
- PRD §47: AI Feedback Loop
- PRD §48: AI Rate Limiting
- PRD §80: AI Guardrails
- PRD §53: Caching / rate limiting – Upstash Redis optional