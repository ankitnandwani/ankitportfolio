# M18.08 – Test and Verify Contact Form End to End

## Objective

Verify the complete contact form flow works: form renders, validates, submits, rate limits, sends email, and shows appropriate UI states.

## Context

This is the verification task for Milestone 18. It extends the test plan with contact form test cases and creates a verification script similar to M17.09's `verifyJobFit.mts`.

## Requirements

- Extend `test-plan.md` with contact form section:
  - Functional Correctness (FC): valid submission, field validation, all fields
  - Safety/Guardrails (SC): rate limiting, injection attempts, spam patterns
  - Edge Cases (EC): empty fields, boundary lengths, special characters
  - Integration (IA): email delivery, analytics, rate limit isolation
- Create `scripts/verifyContact.mts`:
  - Runs test cases against live API
  - Uses test fixtures (valid, invalid, rate limit, injection)
  - Checks: validation, rate limits, email delivery (mocked), analytics
  - Exits non-zero on failure
  - Added as `verify:contact` script in `package.json`
- Run all tests (unit + verification script) and verify pass
- Update documentation: `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md`

## Scope

### In scope

- `test-plan.md` (updated with contact form section)
- `scripts/verifyContact.mts` (new)
- `package.json` (updated with `verify:contact` script)
- Documentation updates

### Out of scope

- Implementation changes (tasks M18.01-M18.07)

## Dependencies

- M18.01 through M18.07 – All implementation complete

## Files / Areas Expected To Change

- `test-plan.md` (updated)
- `scripts/verifyContact.mts` (new)
- `package.json` (updated)
- `PROJECT_STATE.md` (updated)
- `TODO.md` (updated)
- `CHANGELOG.md` (updated)

## Implementation Guidance

1. **Test plan extension** – Follow the existing M17 section format:
   - Categories: JFC, JSC, JLC, JIC, JPA → CFC, CSC, CLC, CIC, CPA
   - Table with ID, Test, Expected Outcome, Pass Criteria
   - Execution log with results

2. **Verification script** – Follow `scripts/verifyJobFit.mts` pattern:
   - Test fixtures: valid, invalid email, missing fields, rate limit, injection
   - Run against live API (`/api/contact`)
   - Mock email delivery for verification (or use test mode)
   - Check: validation errors, rate limits, success response, analytics
   - Exit code 0 on pass, 1 on fail
   - Detailed console output

3. **Test fixtures** – Define in script:
   - Valid submission
   - Missing name
   - Invalid email
   - Missing message
   - Message too short
   - Injection attempt in message
   - Rate limit test (4 rapid requests)

4. **Analytics verification** – Check that `contact_form_submission` event fires with correct properties (no PII).

5. **Rate limit isolation** – Verify contact form limits don't affect chat or job-fit.

6. **Documentation updates**:
   - `PROJECT_STATE.md`: Mark M18 complete, next task M19
   - `TODO.md`: Next action M19.01
   - `CHANGELOG.md`: Entry for M18 completion

## Acceptance Criteria

- `test-plan.md` has contact form section with numbered cases.
- `scripts/verifyContact.mts` runs and passes all test cases.
- `verify:contact` script added to `package.json`.
- All unit tests pass (including new tests from M18.01-M18.07).
- Verification script exits 0 on success, 1 on failure.
- Rate limit isolation verified.
- Analytics event verified (no PII).
- Documentation updated.
- Lint, typecheck, build pass.

## Testing Requirements

- Run `npm test` – all 400+ tests pass.
- Run `npm run verify:contact` – all contact form test cases pass.
- Run `npm run build` – succeeds.
- Run `npm run lint` – 0 errors.
- Run `npm run typecheck` – succeeds.

## Security / Privacy Considerations

- Verification script uses test fixtures, no real submissions.
- Email delivery mocked in verification (or test mode).
- No PII in test fixtures.

## Performance / Accessibility Considerations

- Verification script runs in reasonable time (<30 seconds).
- Doesn't consume excessive API quota.

## Definition of Done

- Test plan extended with contact form cases.
- Verification script created and passing.
- Script added to package.json.
- All tests pass, build succeeds.
- Documentation updated.
- Milestone 18 marked complete.

## Related Requirements

- PRD §27: Contact form requirements
- PRD §127: Milestone 18 Definition of Done
- ROADMAP Milestone 18: Contact Form
- PRD §104: Automated Tests
- M17.09 pattern for verification