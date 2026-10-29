# M19.06 – Test and Verify Analytics End to End

## Objective

Execute the analytics verification script, run all tests, and confirm the analytics implementation meets all acceptance criteria for Milestone 19.

## Context

This is the final verification task for M19, following the pattern of M17.09 and M18.08. It runs the verification script created in M19.05, executes the full test suite, and confirms all analytics events fire correctly with proper privacy controls.

## Requirements

1. **Run verification script**: Execute `npm run verify:analytics` against running dev server
2. **Run full test suite**: `npm test` - all tests pass
3. **Run lint**: `npm run lint` - 0 errors
4. **Run typecheck**: `npm run typecheck` - clean
5. **Run build**: `npm run build` - succeeds
6. **Manual verification**: With PostHog credentials configured, trigger each event type and verify in PostHog dashboard
7. **Privacy audit**: Confirm no PII in any analytics event payload
6. **Update documentation**: Mark M19 complete in PROJECT_STATE.md, TODO.md, CHANGELOG.md

## Scope

### In scope

- Running verification script
- Full test suite execution
- Lint, typecheck, build
- Manual PostHog verification (if credentials available)
- Documentation updates

### Out of scope

- Implementation changes (M19.01-05)
- New feature development

## Dependencies

- M19.01 through M19.05 complete

## Files / Areas Expected To Change

- `PROJECT_STATE.md` (mark M19 complete)
- `TODO.md` (next action: M20.01)
- `CHANGELOG.md` (M19 completion entry)

## Implementation Guidance

### 1. Run Verification Script

```bash
# Start dev server
npm run dev &
# Wait for server
sleep 5
# Run verification
npm run verify:analytics
```

### 2. Run Full Test Suite

```bash
npm test
```

### 3. Run Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

### 4. Manual PostHog Verification (if credentials available)

Configure real PostHog credentials in `.env.local`:
```bash
POSTHOG_KEY=phc_xxx
POSTHOG_HOST=https://app.posthog.com
```

Trigger each event type:
1. Open chat, send message → verify `chat_session_start`, `message_sent`, `response_received`
2. Click thumbs up/down → verify `feedback_given`
3. Click CTA in chat/job-fit → verify `cta_clicked`
4. Submit contact form → verify `contact_form_submission`
5. Run job fit analysis → verify `job_fit_analysis`
6. Hit rate limit → verify `rate_limit_exceeded`

Verify in PostHog dashboard:
- Events appear with correct names
- Properties match expected structure
- No PII in any property
- Session IDs are consistent

### 5. Privacy Audit

Confirm no PII in any event:
- No email addresses
- No phone numbers
- No raw IP addresses
- No message content
- No personal names
- Session IDs are UUIDs (not identifiable)

### 6. Documentation Updates

Update `PROJECT_STATE.md`:
- Mark M19 complete
- List all completed tasks
- Update "Next Task" to M20.01

Update `TODO.md`:
- Mark M19 tasks complete
- Next action: M20.01

Update `CHANGELOG.md`:
- Add M19 completion entry with summary

## Acceptance Criteria

- `npm run verify:analytics` exits 0 (all rules pass)
- `npm test` - all 465+ tests pass
- `npm run lint` - 0 errors
- `npm run typecheck` - clean
- `npm run build` - succeeds
- Manual PostHog verification confirms all events fire correctly
- Privacy audit passes (no PII in events)
- Documentation updated

## Testing Requirements

- All automated checks pass
- Manual verification documented
- No regressions in existing functionality

## Security / Privacy Considerations

- Manual verification uses test credentials only
- No production PostHog data accessed during verification
- Privacy audit confirms no PII leakage

## Performance / Accessibility Considerations

- Verification script completes in <30 seconds
- Build completes in reasonable time

## Definition of Done

- All verification checks pass
- All tests pass
- Lint, typecheck, build clean
- Manual PostHog verification complete (or documented as requiring credentials)
- Privacy audit passes
- PROJECT_STATE.md, TODO.md, CHANGELOG.md updated
- Milestone 19 marked complete

## Related Requirements

- PRD §46: AI Conversation tracking
- PRD §47: AI Feedback Loop
- PRD §48: AI Rate Limiting
- PRD §78: Analytics (PostHog)
- PRD §90: Job Fit CTA
- ROADMAP M19: Analytics
- M17.09, M18.08 patterns