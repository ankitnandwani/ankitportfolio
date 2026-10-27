# M18.03 – Implement Contact Form API Route with Validation

## Objective

Create the API route at `/api/contact` that receives form submissions, validates them server-side, applies rate limiting, and forwards to the email delivery service.

## Context

The API route is the server-side entry point for contact form submissions. It must validate all input, enforce rate limits, and either send the email or return appropriate errors. The route follows the same patterns as `/api/job-fit` and `/api/chat`.

## Requirements

- Create `app/api/contact/route.ts` with POST handler.
- Request validation:
  - JSON body required
  - All four fields present and valid (use validation from M18.01)
  - Return 400 with field-specific errors on validation failure
- Rate limiting:
  - Use contact-specific rate limiter (from M18.04)
  - Return 429 with `Retry-After` and rate limit headers
- Email delivery:
  - Call email delivery function from M18.05
  - On success: return 200 with success message
  - On delivery failure: return 500 with user-friendly error
- Response headers:
  - `Cache-Control: no-store`
  - Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` (on 429)
- Analytics:
  - Fire `contact_form_submission` analytics event (fire-and-forget)
  - Event includes: sessionId, queryId, success, fields present, rate limit scope
  - No PII in analytics event

## Scope

### In scope

- `app/api/contact/route.ts` (new)
- Integration with M18.01 validation, M18.04 rate limiter, M18.05 email delivery

### Out of scope

- Rate limiter implementation (M18.04)
- Email delivery implementation (M18.05)
- Analytics event definition (M13.11 already has the infrastructure)

## Dependencies

- M18.01 – Data model and validation
- M18.04 – Rate limiting (provides contact-specific limiter)
- M18.05 – Email delivery (provides send function)

## Files / Areas Expected To Change

- `app/api/contact/route.ts` (new)

## Implementation Guidance

1. Follow the exact pattern of `app/api/job-fit/route.ts`:
   - Same rate limit header structure
   - Same analytics firing pattern (fire-and-forget with `.catch()`)
   - Same error response structure
2. Use the validation function from `src/lib/contact/validation` for server-side validation.
3. Use the contact-specific rate limiter from `src/lib/contact/rateLimiter`.
4. Use the email delivery function from `src/lib/contact/email`.
5. Generate a unique `queryId` (UUID) for each request for analytics.
6. Extract client key from headers (same as job-fit: `x-forwarded-for`, `x-real-ip`).
7. Generate session ID via `generateClientKey`/`getSessionId` from analytics.
8. Fire analytics event with `contact_form_submission` type:
   - sessionId, queryId, success, field presence, rate limit scope
   - NO PII (no name, email, company, message content)
9. Map errors:
   - Validation error → 400
   - Rate limit → 429 with headers
   - Email delivery failure → 500 (generic message)
   - Unexpected error → 500

## Acceptance Criteria

- POST `/api/contact` with valid data returns 200 and sends email.
- POST with invalid data returns 400 with field-specific errors.
- POST over rate limit returns 429 with `Retry-After` and rate limit headers.
- Email delivery failure returns 500 with generic message (no internal details).
- Rate limit headers present on all responses.
- `Cache-Control: no-store` on all responses.
- Analytics event fired for every request (success and failure).
- No PII in analytics event.
- Lint, typecheck, build pass.

## Testing Requirements

- Unit test: valid request → 200, email function called.
- Unit test: invalid email → 400 with email field error.
- Unit test: missing fields → 400 with field errors.
- Unit test: rate limit exceeded → 429 with headers.
- Unit test: email delivery failure → 500.
- Test: analytics event fired with correct shape (no PII).

## Security / Privacy Considerations

- Server-side validation is mandatory (client-side can be bypassed).
- No PII in logs or analytics.
- Rate limiting prevents email abuse.
- Error messages don't leak internal details.
- `Cache-Control: no-store` prevents caching of responses.

## Performance / Accessibility Considerations

- Rate limiter check happens before validation (cheapest first).
- Analytics is fire-and-forget, doesn't block response.
- Response is JSON, no streaming needed.

## Definition of Done

- API route implemented and working.
- Integrates with validation, rate limiting, and email delivery.
- All error cases handled with correct status codes.
- Analytics event fired correctly.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §27: Contact form validation
- PRD §127: Milestone 18 requirements
- ROADMAP Milestone 18: Contact Form
- M13.11: Analytics infrastructure