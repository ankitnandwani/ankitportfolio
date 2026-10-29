# M19 – Analytics

This milestone captures product-relevant metrics by completing the PostHog integration and ensuring all events fire correctly with privacy-conscious configuration.

## Execution Order

| Order | Task | Depends On | Parallel |
|-------|------|------------|----------|
| 1 | M19.01 – Set up PostHog analytics configuration and verify server-side integration | M18.08 | – |
| 2 | M19.02 – Create server-side analytics proxy endpoint for client-side events | M19.01 | – |
| 3 | M19.03 – Enable client-side CTA click tracking via proxy endpoint | M19.02 | – |
| 4 | M19.04 – Add missing PRD events and verify all events fire correctly | M19.03 | – |
| 5 | M19.05 – Create analytics verification script and test plan | M19.04 | – |
| 6 | M19.06 – Test and verify analytics end to end | M19.05 | – |

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Integrate PostHog (free tier) | ROADMAP M19, PRD §78 | M19.01 | Complete |
| Events listed in PRD fire correctly | PRD §46, §47, §48 | M19.04 | Planned |
| Privacy-conscious configuration (no PII) | PRD §35, §36, ROADMAP M19 | M19.01, M19.04 | M19.01 Complete, M19.04 Planned |
| CTA click tracking (client-side) | PRD §90, §46 | M19.03 | Planned |
| Feedback tracking (thumbs up/down) | PRD §46, §47 | M19.04 | Planned |
| Session tracking | PRD §46 | M19.01 | Complete |
| Rate limit metrics | PRD §48 | M19.04 | Planned |
| Events fire correctly and respect privacy | ROADMAP M19 DoD | M19.06 | Planned |
| Server-side proxy for the client events | PRD §78, PRD §80 | M19.02 | Complete |

**Note on M19.01:** the server-side integration was broken and is now fixed. `posthog-node` v4 takes one message object, `capture({ distinctId, event, properties, timestamp })`, and the module was calling the version 3 shape `capture(name, properties)`, so every event was sent with no name and no identity and none of them ever arrived. The credentials are now optional, and a value that is still the placeholder of `.env.example` counts as no credentials, so the layer no longer builds a client that tries to reach a host that does not exist. The project is set up on the EU cloud, the credentials are in `.env.local`, and the sending was verified on 2026-10-29: the capture endpoint answered `{"status":"Ok"}`, a real event went out of the running app with no flush error, and the payload on the wire carries the `distinct_id`, the event name, the properties, an ISO timestamp and `$geoip_disable: true`. The PostHog browser snippet and the session recording are not used, so nothing a visitor types is captured automatically.

## Parallel Work

- M19.02 (proxy endpoint) and M19.04 (event verification) can be developed in parallel once M19.01 is complete.

## Decisions Requiring Human Approval

1. **PostHog project setup** – Done. The project is created on the EU cloud and the credentials are in `.env.local`. The browser snippet and the session recording are deliberately not used, and the events are sent from the server.
2. **Analytics sampling** – For high-traffic scenarios (not expected on free tier), decide if sampling is needed.
3. **Data retention** – PostHog free tier has retention limits; confirm acceptable.

## Files Expected to Change

- `src/lib/analytics/analytics.ts` (server-side tracking functions)
- `src/lib/analytics/client.ts` (client-side wrapper updates)
- `src/lib/analytics/eventTypes.ts` (if new events needed)
- `src/lib/analytics/index.ts` (exports)
- `app/api/analytics/route.ts` (new proxy endpoint)
- `src/lib/env.ts`, `src/lib/env.js`, `.env.example` (environment variables if needed)
- `src/components/aiChat/FeedbackButton.tsx` (if client-side feedback tracking)
- `src/components/aiChat/ChatPanel.tsx` (CTA tracking integration)
- `src/components/jobFit/JobFitResults.tsx` (CTA tracking integration)
- `src/components/contact/ContactForm.tsx` (submission tracking integration)
- `test-plan.md` (analytics section)
- `scripts/verifyAnalytics.mts` (new verification script)
- `package.json` (verify:analytics script)

## Acceptance Criteria (Milestone Definition of Done)

- PostHog integration configured and functional (server-side and client-side via proxy)
- All events listed in PRD §46, §47, §48 fire correctly
- CTA click tracking works from client-side via proxy endpoint
- Feedback tracking (thumbs up/down with optional comment) works
- No PII in any analytics event
- Session tracking works correctly
- Rate limit metrics captured
- Analytics verification script passes all test cases
- No PII in analytics events (verified)
- All tests pass, lint clean, typecheck clean, build succeeds