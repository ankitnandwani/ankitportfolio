# M19.04 – Add Missing PRD Events and Verify All Events Fire Correctly

## Objective

Review the PRD for all required analytics events, ensure each is implemented in the event types and tracking functions, and verify they fire correctly at the appropriate integration points.

## Context

The PRD specifies several analytics events across multiple sections:
- **PRD §46 (AI Conversation tracking)**: session_id, timestamp, question category, response latency, retrieval success, answer confidence, CTA clicked
- **PRD §47 (AI Feedback Loop)**: thumbs up/down, optional comment
- **PRD §48 (AI Rate Limiting)**: rate limit events
- **PRD §78 (Analytics)**: PostHog integration for events
- **PRD §90 (Job Fit CTA)**: resume, LinkedIn, email CTA tracking

Current implementation in `src/lib/analytics/eventTypes.ts` and `analytics.ts` covers:
- `chat_session_start`, `message_sent`, `response_received` (chat)
- `feedback_given` (thumbs up/down)
- `cta_clicked` (resume, project, github, linkedin, email, other)
- `job_fit_analysis` (detailed metrics)
- `contact_form_submission` (success, field presence)

Need to verify:
1. All PRD events are represented
2. Each event fires at the correct integration point
3. Events have correct payload structure
4. No missing events

## Requirements

### 1. Audit PRD Events vs Implementation

Map each PRD event requirement to current implementation:

| PRD Section | Event | Current Status |
|-------------|-------|----------------|
| §46 | chat_session_start | ✅ Implemented |
| §46 | message_sent | ✅ Implemented |
| §46 | response_received | ✅ Implemented |
| §46 | retrieval_success | ✅ In response_received |
| §46 | response_latency | ✅ In response_received |
| §46 | answer_confidence | ✅ In response_received |
| §46 | CTA_clicked | ✅ Implemented |
| §47 | feedback_given (up/down) | ✅ Implemented |
| §47 | feedback_comment | ✅ Implemented |
| §48 | rate_limit_metrics | ⚠️ Partially (headers only) |
| §90 | job_fit_cta (resume, linkedin, email) | ✅ In cta_clicked |

### 2. Add Missing Event Properties

If any PRD event properties are missing from current event types, add them to `eventTypes.ts` and update tracking functions.

### 3. Verify Integration Points

Ensure each event fires at the correct location:

- **chat_session_start**: First message in chat (ChatPanel)
- **message_sent**: User submits message (ChatPanel → API)
- **response_received**: AI response complete (ChatPanel → API)
- **feedback_given**: User clicks thumbs up/down (FeedbackButton)
- **cta_clicked**: User clicks CTA links (ChatPanel, JobFitResults, ContactForm)
- **job_fit_analysis**: Analysis completes (JobFit API)
- **contact_form_submission**: Form submits (ContactForm → API)

### 4. Add Rate Limit Analytics Event

Per PRD §48, track rate limit hits:
- New event type: `rate_limit_exceeded`
- Properties: `scope` (window/daily), `endpoint` (chat/job-fit/contact), `retryAfterSeconds`

## Scope

### In scope

- `src/lib/analytics/eventTypes.ts` (add missing event types/properties)
- `src/lib/analytics/analytics.ts` (add tracking functions)
- Integration point updates (ChatPanel, JobFitResults, ContactForm, FeedbackButton, API routes)
- Rate limit analytics event

### Out of scope

- Proxy endpoint (M19.02)
- Client-side tracking (M19.03)
- Verification script (M19.05)

## Dependencies

- M19.01 (PostHog config verified)
- M19.02 (proxy endpoint for client events)
- M19.03 (client-side tracking enabled)

## Files / Areas Expected To Change

- `src/lib/analytics/eventTypes.ts`
- `src/lib/analytics/analytics.ts`
- `src/lib/analytics/index.ts` (exports)
- `src/components/aiChat/ChatPanel.tsx` (verify integration)
- `src/components/aiChat/FeedbackButton.tsx` (verify integration)
- `src/components/jobFit/JobFitResults.tsx` (verify CTA tracking)
- `src/components/contact/ContactForm.tsx` (verify submission tracking)
- `app/api/chat/route.ts` (verify message/response tracking)
- `app/api/job-fit/route.ts` (verify analysis tracking)
- `app/api/contact/route.ts` (verify submission tracking)
- `app/api/feedback/route.ts` (verify feedback tracking)

## Implementation Guidance

1. **Audit eventTypes.ts**: Compare each PRD event requirement against current types. Add missing properties or event types.

2. **Add rate_limit_exceeded event**:
   ```typescript
   export interface RateLimitExceededProperties {
     queryId: string;
     scope: 'window' | 'daily';
     endpoint: 'chat' | 'job-fit' | 'contact';
     retryAfterSeconds: number;
   }
   
   export interface RateLimitExceededEvent extends BaseAnalyticsEvent {
     eventType: 'rate_limit_exceeded';
     queryId: string;
     properties: RateLimitExceededProperties;
   }
   ```

3. **Update tracking functions** in `analytics.ts` for any new events.

4. **Verify integration points**: Check each component/API route calls the correct tracking function with correct parameters.

5. **Rate limit integration**: In each API route (`/api/chat`, `/api/job-fit`, `/api/contact`), when rate limit is hit, fire `rate_limit_exceeded` event before returning 429.

## Acceptance Criteria

- All PRD §46, §47, §48, §90 events represented in `eventTypes.ts`
- Each event fires at correct integration point
- `rate_limit_exceeded` event fires on 429 responses
- Event payloads match PRD requirements (no PII, correct fields)
- Tracking functions exported from `index.ts`
- All existing tests still pass
- Lint, typecheck, build pass

## Testing Requirements

- Unit test: Each tracking function creates correct event structure
- Integration test: API route rate limit → event fires
- Integration test: Chat flow → session_start, message_sent, response_received
- Integration test: Job fit analysis → job_fit_analysis event
- Integration test: Contact form → contact_form_submission event
- Integration test: Feedback button → feedback_given event
- Manual verification: Trigger each event, verify in PostHog

## Security / Privacy Considerations

- No PII in any new event payloads
- Session IDs remain anonymous
- Rate limit events don't expose internal limits beyond what headers show
- Rate limit events only include scope/endpoint/retryAfter (already in headers)

## Performance / Accessibility Considerations

- Fire-and-forget tracking doesn't block responses
- Rate limit event sent before 429 response
- No additional latency for user

## Definition of Done

- All PRD events represented in types and tracking functions
- Events fire at correct integration points
- Rate limit analytics implemented
- All tests pass, lint clean, typecheck clean, build succeeds

## Related Requirements

- PRD §46: AI Conversation tracking
- PRD §47: AI Feedback Loop
- PRD §48: AI Rate Limiting
- PRD §78: Analytics (PostHog)
- PRD §90: Job Fit CTA
- ROADMAP M19: Analytics