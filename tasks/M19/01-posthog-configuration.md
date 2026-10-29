# M19.01 – Set Up PostHog Analytics Configuration and Verify Server-Side Integration

## Objective

Ensure PostHog analytics is properly configured via environment variables and verify that the existing server-side analytics infrastructure correctly integrates with PostHog when credentials are provided.

## Context

The analytics infrastructure (`src/lib/analytics/`) was implemented in M13.11 and extended in M17.08 and M18.03/08. It includes:
- Event types for chat, job fit analysis, contact form, CTA clicks, feedback
- PostHog integration code in `analytics.ts` (lazy initialization)
- Session management with privacy-conscious client keys
- PII redaction for feedback comments

PostHog environment variables (`POSTHOG_KEY`, `POSTHOG_HOST`) are already defined in `src/lib/env.ts`, `src/lib/env.js`, and `.env.example`. The `posthog-node` package is installed.

However, the integration has not been verified with real credentials, and the `enabled` flag in `getAnalyticsConfig()` only activates when both `POSTHOG_KEY` and `POSTHOG_HOST` are present.

## Requirements

- Verify `POSTHOG_KEY` and `POSTHOG_HOST` environment variables are correctly defined in:
  - `src/lib/env.ts` (Zod schema)
  - `src/lib/env.js` (CommonJS schema for scripts)
  - `.env.example` (documentation)
- Verify `getAnalyticsConfig()` in `analytics.ts` correctly reads credentials and enables tracking
- Verify `initPostHog()` correctly initializes PostHog client with privacy settings:
  - `disableGeoip: true`
  - `flushInterval: 5000`
  - `flushAt: 20`
- Test that server-side events (`chat_session_start`, `message_sent`, `response_received`, `job_fit_analysis`, `contact_form_submission`) can be sent to PostHog when credentials are configured
- Ensure analytics remains disabled (console-only) when credentials are not configured
- Verify `shutdownAnalytics()` properly flushes pending events

## Scope

### In scope

- Environment variable validation for PostHog
- Server-side PostHog client initialization
- Server-side event sending verification
- Privacy settings verification (no IP collection, no PII in events)

### Out of scope

- Client-side analytics proxy endpoint (M19.02)
- Client-side CTA tracking (M19.03)
- Event completeness verification (M19.04)
- End-to-end verification script (M19.05/06)

## Dependencies

- M18.08 (Contact Form complete, analytics events defined)

## Files / Areas Expected To Change

- `src/lib/analytics/analytics.ts` (if fixes needed)
- `src/lib/env.ts`, `src/lib/env.js`, `.env.example` (if validation adjustments needed)

## Implementation Guidance

1. **Review existing env validation**: Check `POSTHOG_KEY` and `POSTHOG_HOST` in `src/lib/env.ts` and `src/lib/env.js` are correctly typed as optional (they are, since analytics should work in console-only mode without them).

2. **Verify PostHog initialization**: In `analytics.ts`, `initPostHog()` uses dynamic import of `posthog-node`. Ensure it handles missing package gracefully (though it's in dependencies).

3. **Test configuration**:
   - Without credentials: `enabled: false`, events logged to console only
   - With credentials: `enabled: true`, events sent to PostHog

4. **Privacy settings**: Confirm `disableGeoip: true` prevents IP collection.

5. **Serverless compatibility**: `flushInterval: 5000` and `flushAt: 20` are appropriate for Vercel/serverless.

## Acceptance Criteria

- `POSTHOG_KEY` and `POSTHOG_HOST` validated in all three config files
- `getAnalyticsConfig()` returns `enabled: false` when credentials missing
- `getAnalyticsConfig()` returns `enabled: true` with valid credentials
- `initPostHog()` initializes PostHog client with correct privacy settings
- Server-side events can be sent to PostHog when enabled
- Console logging works in development when disabled
- No PII in any event payload
- Lint, typecheck, build pass

## Testing Requirements

- Unit test: `getAnalyticsConfig()` returns correct config based on env vars
- Unit test: `initPostHog()` initializes client with correct settings
- Integration test: Server-side event fires and reaches PostHog (with test credentials)
- Manual verification: Set `POSTHOG_KEY`/`POSTHOG_HOST`, trigger event, verify in PostHog dashboard

## Security / Privacy Considerations

- PostHog API key never logged or exposed to client
- `disableGeoip: true` prevents IP-based geolocation
- Session IDs are anonymous UUIDs, not tied to personal identifiers
- No PII in event payloads (validated by event type definitions)

## Performance / Accessibility Considerations

- Lazy initialization prevents blocking on startup
- Fire-and-forget event sending doesn't block response
- Flush settings optimized for serverless

## Definition of Done

- PostHog environment variables validated in all config files
- Server-side PostHog integration verified working
- Analytics correctly disabled/enabled based on credentials
- Privacy settings verified
- Lint, typecheck, build pass

## Related Requirements

- PRD §78: Analytics (PostHog free tier)
- PRD §35: Privacy architecture (defense in depth)
- PRD §36: Sensitive data protection
- PRD §46: AI Conversation tracking
- ROADMAP M19: Analytics