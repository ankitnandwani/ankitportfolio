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
| Events listed in PRD fire correctly | PRD §46, §47, §48 | M19.04 | Complete |
| Privacy-conscious configuration (no PII) | PRD §35, §36, ROADMAP M19 | M19.01, M19.04 | Complete |
| CTA click tracking (client-side) | PRD §90, §46 | M19.03 | Complete |
| Feedback tracking (thumbs up/down) | PRD §46, §47 | M19.04 | Complete |
| Session tracking | PRD §46 | M19.01 | Complete |
| Rate limit metrics | PRD §48 | M19.04 | Complete |
| Events fire correctly and respect privacy | ROADMAP M19 DoD | M19.06 | Planned |
| Server-side proxy for the client events | PRD §78, PRD §80 | M19.02 | Complete |

## Audit of the events (M19.04)

Each event the PRD asks for, and where it is fired.

| PRD section | What is asked for | Event | Where it fires | State |
|---|---|---|---|---|
| §46 | session id, timestamp, question category, response latency, retrieval success, answer confidence, CTA clicked | `chat_session_start`, `message_sent`, `response_received`, `cta_clicked` | `/api/chat`, `/api/analytics` through the browser | Fires |
| §47 | thumbs up and down, an optional comment | `feedback_given` | `/api/feedback` | Fires |
| §48 | the limits of the visitor | `rate_limit_exceeded` | `/api/chat`, `/api/job-fit`, `/api/contact` | Fires |
| §90 | resume, LinkedIn and email after a job fit analysis | `cta_clicked` | `/api/analytics` through the browser, from the results of the analysis | Fires |

Two things were found by the audit and fixed in M19.04:

- `chat_session_start` was written down and never fired. The first message of the chat fires it now.
- The feedback carried a session of its own, made for that one request, which put it apart from the conversation it was given on. It carries the session of the visitor now.

The events that carry a group of properties put them in a `properties` object of their own, so they reach PostHog one level deeper than the other events. The events of the server and the events of the browser carry two different sessions, the one of the server in the memory of the process and the one of the browser in the storage of the tab. A click on a call to action therefore cannot be joined with the conversation of the same visit. This comes from M19.01 and M19.03 and was left alone, because joining the two means a change of the design of the proxy.

PRD §78 also asks for the events of the pages themselves, `page_view` and `project_view`, and for the clicks on the links of the header, of the footer and of the projects. They are not implemented, because the browser may only send the events the proxy allows, and the proxy allows the click on a call to action alone. They need a change of their own.

**Note on M19.04:** the event of a refused request was added, per PRD §48. It carries the scope that was reached, the part of the site that was asked for and the wait in seconds, which the visitor already sees in the headers of the answer, and never the limits themselves. The event is put on the queue before the answer goes out, so it is not lost when the instance is put to sleep. The session of the visitor is worked out before the limit is checked, because the event of a refusal belongs to a session. The building of the event lives in `src/lib/analytics/rateLimit.ts` and not in the routes, because a route cannot be loaded by the test runner. Verified against the running site on 2026-10-29: a message of the chat fires the three events of the conversation with one session, a second message does not fire the start of the chat again, each of the three parts of the site answers with 429 and fires the event with the right endpoint and the wait that matches the answer, and the event was seen on the wire with no personal data.

**Note on M19.03:** the click of a call to action is counted from the browser for the first time. The browser reports the event to the server of the site, because it cannot see the credentials and therefore cannot know whether the server forwards it; the server decides, and a server without the credentials forwards nothing. The request is sent and not awaited, so a click opens the link straight away, and it is marked to stay alive, so the event still goes out when the page goes away. The browser sends no timestamp, because the proxy refuses a field that is not part of the event and the server puts the moment on the event with the clock that counts. Verified in a real browser on 2026-10-29: the click of "Connect on LinkedIn" was answered with 200 and went on to PostHog with no flush error, and the click of "Download Resume" navigated away while the request was still on its way and the answer came in after the page had gone. The manual test brought up two faults of M17, both now fixed: the route of the job fit answered with `meta` while the contract and the interface read `metadata`, so every successful analysis showed an error instead of the results, and the calls to action that point at the site threw on a placeholder address of the site. The route files cannot be loaded by the test runner, so neither fault could be caught by a unit test.

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