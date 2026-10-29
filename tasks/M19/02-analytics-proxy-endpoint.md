# M19.02 – Create Server-Side Analytics Proxy Endpoint for Client-Side Events

## Objective

Create a server-side API endpoint (`/api/analytics`) that receives client-side analytics events and forwards them to PostHog, enabling client-side event tracking (CTA clicks, etc.) without exposing PostHog credentials to the browser.

## Context

Currently, client-side analytics in `src/lib/analytics/client.ts` is disabled:
```typescript
// Client-side: analytics disabled (only server tracks)
return { enabled: false, logToConsole: ... };
```

The `trackCtaClicked` function in `client.ts` only logs to console because there's no way to send events to PostHog from the browser without exposing the API key.

The solution is a server-side proxy endpoint that:
1. Receives client-side events via POST
2. Validates the event payload
3. Forwards to PostHog using server-side credentials
4. Returns success/failure to client

This follows the same pattern as `/api/contact`, `/api/chat`, `/api/job-fit`, `/api/feedback`.

## Requirements

- Create `app/api/analytics/route.ts` with POST handler
- Accept client-side analytics events (initially CTA clicks)
- Validate event payload against `AnalyticsEvent` types
- Forward to PostHog using existing `sendEvent()` function
- Return appropriate HTTP status codes:
  - 200: Event accepted and forwarded
  - 400: Invalid payload
  - 429: Rate limited (optional, can reuse existing rate limiter)
  - 500: Server error
- Include rate limit headers on all responses
- Include `Cache-Control: no-store` on all responses
- Fire-and-forget PostHog send (don't block response)
- No PII accepted from client (validate event structure)

## Scope

### In scope

- `app/api/analytics/route.ts` (new)
- Integration with existing `sendEvent()` and PostHog client
- Rate limiting (can reuse `createRateLimiter` from `src/lib/ai/rateLimiter.ts`)
- Request validation

### Out of scope

- Client-side integration (M19.03)
- New event types (M19.04)
- Analytics verification (M19.05/06)

## Dependencies

- M19.01 (PostHog configuration verified)
- Existing `sendEvent()` and `initPostHog()` in `src/lib/analytics/analytics.ts`
- Existing rate limiter infrastructure in `src/lib/ai/rateLimiter.ts`

## Files / Areas Expected To Change

- `app/api/analytics/route.ts` (new)

## Implementation Guidance

1. **Follow existing API route patterns** (`/api/contact`, `/api/job-fit`):
   - Rate limit check first
   - Request validation
   - Forward to PostHog via `sendEvent()`
   - Fire-and-forget analytics
   - Standard headers: `X-RateLimit-*`, `Retry-After`, `Cache-Control: no-store`

2. **Request payload validation**:
   - Accept only known event types (initially `cta_clicked`)
   - Validate required fields: `sessionId`, `queryId`, `ctaType`, `targetDomain`
   - Reject unknown event types

3. **Rate limiting**: Create analytics-specific rate limiter (e.g., 100 events/minute, 1000/day per client) using `createRateLimiter` from `src/lib/ai/rateLimiter.ts` with namespaced keys (`analytics:`).

4. **Response format**:
   ```typescript
   // Success
   { ok: true, message: 'Event tracked' }
   
   // Error
   { ok: false, error: 'Invalid event payload' }
   ```

5. **Headers on all responses**:
   - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
   - `Retry-After` on 429
   - `Cache-Control: no-store`

6. **Fire-and-forget PostHog send**: Use existing `sendEvent()` which already does this.

## Acceptance Criteria

- `POST /api/analytics` accepts valid `cta_clicked` events
- Invalid payloads return 400 with descriptive error
- Rate limiting enforced with proper headers
- Events forwarded to PostHog via `sendEvent()`
- `Cache-Control: no-store` on all responses
- Rate limit headers on all responses
- No PII accepted or logged
- Lint, typecheck, build pass

## Testing Requirements

- Unit test: Valid CTA click event → 200, event forwarded
- Unit test: Invalid event type → 400
- Unit test: Missing required fields → 400
- Unit test: Rate limit exceeded → 429 with headers
- Unit test: Server error → 500
- Integration test: Client → API → PostHog (with test credentials)

## Security / Privacy Considerations

- No PostHog API key exposed to client
- Only whitelisted event types accepted
- No PII in accepted payloads (sessionId is anonymous UUID, queryId is UUID, ctaType is enum, targetDomain is domain only)
- Rate limiting prevents abuse
- `Cache-Control: no-store` prevents caching

## Performance / Accessibility Considerations

- Fire-and-forget PostHog send doesn't block response
- Rate limiter check before validation (cheapest first)
- Minimal payload validation overhead

## Definition of Done

- `app/api/analytics/route.ts` implemented and working
- Server-side analytics proxy accepts and forwards client events
- Rate limiting, validation, error handling complete
- Lint, typecheck, build pass

## Related Requirements

- PRD §46: CTA click tracking
- PRD §78: Analytics (PostHog)
- PRD §90: CTA links in job fit analysis
- ROADMAP M19: Analytics