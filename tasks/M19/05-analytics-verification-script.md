# M19.05 – Create Analytics Verification Script and Test Plan

## Objective

Create a verification script (`scripts/verifyAnalytics.mts`) and extend `test-plan.md` with an analytics section to validate that all analytics events fire correctly and meet privacy requirements.

## Context

Following the pattern of M17.09 (`verifyJobFit.mts`) and M18.08 (`verifyContact.mts`), create a comprehensive verification script for analytics that:
1. Tests each analytics event type against the live API
2. Verifies event payloads match PRD requirements
3. Verifies no PII in any event
4. Verifies PostHog integration works (when credentials configured)
5. Exits non-zero on failure

## Requirements

### 1. Test Fixtures

Create fixtures in `src/lib/analytics/fixtures/analyticsFixtures.ts` covering:

- **Chat events**: session_start, message_sent, response_received (success, redirect, error)
- **Job Fit events**: job_fit_analysis (success, failure, rate limited)
- **Contact Form events**: contact_form_submission (success, validation error, rate limited)
- **Feedback events**: feedback_given (up, down, with comment)
- **CTA events**: cta_clicked (resume, linkedin, email, github, project)
- **Rate Limit events**: rate_limit_exceeded (chat, job-fit, contact)
- **Edge cases**: Invalid payloads, missing fields, network errors

### 2. Verification Rules

For each fixture, verify:

- **Event fires**: API route calls tracking function
- **Correct event type**: `eventType` matches expectation
- **Required fields present**: sessionId, queryId, timestamp, eventType
- **Privacy compliance**: No PII in payload (no raw IP, no email, no phone, no message content)
- **Correct payload structure**: Matches `AnalyticsEvent` union
- **PostHog integration**: When credentials configured, event reaches PostHog (optional, can mock)

### 3. Verification Script (`scripts/verifyAnalytics.mts`)

Pattern following `verifyJobFit.mts` and `verifyContact.mts`:

```typescript
// Run all fixtures against live API
// Check each rule
// Exit non-zero on failure
// Detailed console output
// Added as `verify:analytics` script in package.json
```

### 4. Test Plan Extension (`test-plan.md`)

Add analytics section with test cases:

| Category | Prefix | Description |
|----------|--------|-------------|
| Functional Correctness | AFC | Verify each event type fires with correct payload |
| Privacy | APC | Verify no PII in any event |
| Integration | AIC | Verify PostHog integration, rate limits, error handling |
| Edge Cases | AEC | Invalid payloads, missing fields, network errors |

## Scope

### In scope

- `scripts/verifyAnalytics.mts` (new)
- `src/lib/analytics/fixtures/analyticsFixtures.ts` (new)
- `test-plan.md` (analytics section)
- `package.json` (verify:analytics script)

### Out of scope

- Implementation changes (M19.01-04)
- End-to-end test execution (M19.06)

## Dependencies

- M19.01 through M19.04 (analytics implementation complete)

## Files / Areas Expected To Change

- `scripts/verifyAnalytics.mts` (new)
- `src/lib/analytics/fixtures/analyticsFixtures.ts` (new)
- `test-plan.md` (analytics section)
- `package.json` (verify:analytics script)

## Implementation Guidance

### 1. Fixtures Structure

```typescript
export interface AnalyticsFixture {
  id: string;
  label: string;
  category: 'chat' | 'job-fit' | 'contact' | 'feedback' | 'cta' | 'rate-limit';
  trigger: () => Promise<{ statusCode: number; response: unknown }>;
  expectedEventType: string;
  expectedFields: string[];
  forbiddenPatterns: RegExp[]; // PII patterns
  rules: VerificationRule[];
}
```

### 2. Verification Rules

Each rule checks a specific property:

```typescript
interface VerificationRule {
  name: string;
  check: (event: unknown) => { passed: boolean; message?: string };
}
```

Example rules:
- `has_event_type`: Event has correct `eventType`
- `has_session_id`: Event has valid UUID `sessionId`
- `has_timestamp`: Event has ISO timestamp
- `no_pii`: Payload doesn't match PII patterns
- `correct_payload_structure`: Matches expected TypeScript interface

### 3. Script Structure

```typescript
async function main() {
  // Load env
  // Check server running
  // For each fixture:
  //   Trigger event via API
  //   Capture analytics event (via test endpoint or PostHog API)
  //   Run rules
  // Report results
  // Exit non-zero if any rule fails
}
```

Note: Since we can't easily intercept PostHog events in verification, the script should:
- Trigger the API endpoints that should fire events
- Verify the API responses are correct (indirect verification)
- Optionally, add a test-only endpoint to retrieve last N analytics events for verification

### 4. Test Plan Extension

Add to `test-plan.md`:

```markdown
## M19 — Analytics End-to-End Verification

### Test Categories
| Category | Prefix | Description |
|----------|--------|-------------|
| Functional Correctness | AFC | Verify each event type fires with correct payload |
| Privacy | APC | Verify no PII in any event |
| Integration | AIC | Verify PostHog integration, rate limits, error handling |
| Edge Cases | AEC | Invalid payloads, missing fields, network errors |
```

### Test Cases

| ID | Test | Expected Outcome |
|----|------|------------------|
| AFC001 | chat_session_start fires | Event has correct structure, sessionId UUID |
| AFC002 | message_sent fires | Event has queryId, category, guardrailAction, length |
| AFC003 | response_received fires | Event has latency, tokens, model, isRedirect |
| AFC004 | feedback_given fires | Event has rating, isRedirect |
| AFC005 | cta_clicked fires | Event has ctaType, targetDomain |
| AFC006 | job_fit_analysis fires | Event has classification counts, latency |
| AFC007 | contact_form_submission fires | Event has success, fieldsPresent |
| AFC008 | rate_limit_exceeded fires | Event has scope, endpoint, retryAfter |
| APC001 | No PII in events | No email, phone, IP, message content in payloads |
| APC002 | Session IDs are UUIDs | sessionId matches UUID v4 pattern |
| APC003 | No raw IPs | No x-forwarded-for in payloads |
| AIC001 | PostHog receives events | Events appear in PostHog (with credentials) |
| AIC002 | Rate limit headers on analytics | X-RateLimit-* on /api/analytics |
| AEC001 | Invalid payload rejected | 400 for malformed analytics events |

## Acceptance Criteria

- `scripts/verifyAnalytics.mts` runs and passes all fixture rules
- `test-plan.md` has analytics section with test cases
- `package.json` has `verify:analytics` script
- Fixtures cover all event types and edge cases
- Privacy rules verify no PII in any event
- Script exits non-zero on failure
- Detailed output for debugging

## Testing Requirements

- Run `npm run verify:analytics` against dev server
- All fixture rules pass
- Privacy rules pass (no PII)
- Script exits 0 on success, 1 on failure
- Output is clear and actionable

## Security / Privacy Considerations

- Verification script must not log PII
- Test fixtures must not contain real PII
- Forbidden patterns should include common PII formats

## Performance / Accessibility Considerations

- Script runs in reasonable time (<30 seconds)
- Clear output for CI/CD integration

## Definition of Done

- `scripts/verifyAnalytics.mts` created and functional
- `src/lib/analytics/fixtures/analyticsFixtures.ts` with comprehensive fixtures
- `test-plan.md` extended with analytics section
- `package.json` has `verify:analytics` script
- All verification rules pass against implemented analytics
- Lint, typecheck, build pass

## Related Requirements

- PRD §46: AI Conversation tracking
- PRD §47: AI Feedback Loop
- PRD §48: AI Rate Limiting
- PRD §78: Analytics (PostHog)
- PRD §90: Job Fit CTA
- ROADMAP M19: Analytics
- M17.09, M18.08 patterns