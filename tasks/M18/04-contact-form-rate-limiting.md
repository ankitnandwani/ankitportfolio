# M18.04 – Add Spam Protection / Rate Limiting for Contact Form

## Objective

Create a contact-form-specific rate limiter with stricter limits than the chat or job-fit analyzer, since each submission sends an email.

## Context

The contact form submits data that triggers an email. To prevent abuse (spam, email flooding), the contact form needs its own rate limit bucket with stricter limits than the chat (20/30min) or job-fit analyzer (5/30min).

PRD §27 specifies: "Implement spam protection/rate limiting."
PRD §48 accepts a limit per instance (in-memory is acceptable for MVP).
PRD §127 lists "spam protection" as a requirement.

## Requirements

- Create `src/lib/contact/rateLimiter.ts` with:
  - Contact-specific rate limit constants (stricter than job-fit):
    - Default: 3 requests per 30 minutes (short window)
    - Default: 5 requests per day (long window)
    - Configurable via environment variables
  - `createContactRateLimiter(options)` function returning a `RateLimiter`
  - `getContactRateLimiter()` singleton getter
  - `setContactRateLimiter()` for tests
  - Reuse the `createRateLimiter` and `RateLimitStore` from `src/lib/ai/rateLimiter.ts`
- Environment variables:
  - `CONTACT_FORM_WINDOW_SECONDS` (default: 1800)
  - `CONTACT_FORM_MAX_REQUESTS` (default: 3)
  - `CONTACT_FORM_DAILY_WINDOW_SECONDS` (default: 86400)
  - `CONTACT_FORM_DAILY_MAX_REQUESTS` (default: 5)
  - `CONTACT_FORM_MAX_TOKENS` (not used, but kept for consistency)
- Add variables to `src/lib/env.ts`, `src/lib/env.js`, `.env.example`
- Export from `src/lib/contact/index.ts`

## Scope

### In scope

- `src/lib/contact/rateLimiter.ts` (new)
- `src/lib/contact/index.ts` (updated)
- `src/lib/env.ts`, `src/lib/env.js`, `.env.example` (updated)

### Out of scope

- API route integration (M18.03)
- UI rate limit display (handled by API response headers)

## Dependencies

- `src/lib/ai/rateLimiter.ts` (existing rate limiter infrastructure)

## Files / Areas Expected To Change

- `src/lib/contact/rateLimiter.ts` (new)
- `src/lib/contact/index.ts` (updated)
- `src/lib/env.ts` (updated)
- `src/lib/env.js` (updated)
- `.env.example` (updated)

## Implementation Guidance

1. Copy the pattern from `src/lib/jobFit/policy.ts` which creates its own rate limiter.
2. Use the same `createRateLimiter` and `RateLimitStore` from `src/lib/ai/rateLimiter.ts`.
3. Use stricter defaults: 3/30min, 5/day (vs job-fit 5/30min, 10/day; chat 20/30min, 100/day).
4. The rate limiter should use namespaced keys internally (e.g., `contact:window:key`, `contact:daily:key`).
5. Add environment variables to:
   - `src/lib/env.ts` (with validation)
   - `src/lib/env.js` (CommonJS for scripts)
   - `.env.example` (documentation)
6. Export the limiter factory and getter from `src/lib/contact/index.ts`.
6. The rate limiter should be usable by the API route (M18.03) via `getContactRateLimiter()`.

## Acceptance Criteria

- Contact rate limiter created with stricter defaults (3/30min, 5/day).
- Environment variables added to all three config files.
- Rate limiter uses namespaced keys (`contact:window:`, `contact:daily:`).
- Unit tests: limit enforced, headers correct, separate from chat/job-fit limits.
- Integration test: contact form requests don't affect chat/job-fit limits.
- Lint, typecheck, build pass.

## Testing Requirements

- Unit test: limit enforced at 3 requests in window.
- Unit test: daily limit enforced at 5 requests.
- Unit test: window resets after time passes.
- Unit test: daily limit resets after day passes.
- Unit test: separate bucket from chat and job-fit (same key, different counts).
- Unit test: rate limit headers on response.
- Unit test: `Retry-After` header on 429.

## Security / Privacy Considerations

- Rate limiting prevents email flooding/spam.
- In-memory store acceptable per PRD §48 (low traffic, free tier).
- Store is injected, so can be replaced with shared store later.
- Requests over limit are not counted (prevents window extension).

## Performance / Accessibility Considerations

- Rate limiter check is fast (in-memory Map).
- Runs before validation and email sending.
- No impact on page load (server-side only).

## Definition of Done

- Rate limiter implemented with correct defaults.
- Environment variables in all config files.
- Exports available from `src/lib/contact/index.ts`.
- Unit tests pass.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §27: Spam protection/rate limiting
- PRD §48: AI Rate Limiting
- PRD §127: Milestone 18 requirements
- ROADMAP Milestone 18: Contact Form