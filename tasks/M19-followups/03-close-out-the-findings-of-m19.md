# M19F.03 – Close Out the Findings of the Verification of M19

## Objective

Fix the two small things that M19.06 found and left: the comment of the proxy that does not tell the truth, and the limits of the analyzer that are not read from the environment.

## Context

Both were found while the analytics were verified end to end on 2026-11-03, and both are already diagnosed. Neither is a design question.

**The comment of the proxy.** `app/api/analytics/route.ts` carries a comment that says that every answer of the proxy carries the headers of the limit and that the request is counted before anything is parsed. The code does not do that for the two answers that are refused before the counting:

- a request whose origin is not the site is refused with a 403,
- a body that cannot be read is refused with a 400.

Neither of them carries the headers of the limit, and neither of them is counted. **The code is right.** Counting a request from another site would let that site use up the allowance of a visitor, and counting a body that could not be read would let a broken client spend the allowance of a visitor for nothing. The comment has to say what the code does.

**The limits of the analyzer.** PRD §48 asks for the limits of the AI features to be configurable through the environment. The chat and the contact form already are:

- `RATE_LIMIT_WINDOW_SECONDS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_DAILY_MAX` for the chat,
- `CONTACT_FORM_WINDOW_SECONDS`, `CONTACT_FORM_MAX_REQUESTS`, `CONTACT_FORM_DAILY_WINDOW_SECONDS`, `CONTACT_FORM_DAILY_MAX_REQUESTS` for the contact form.

The analyzer has the same four variables declared in `src/lib/env.ts` and written in `.env.example`:

```
JOB_FIT_WINDOW_SECONDS=1800
JOB_FIT_MAX_REQUESTS=5
JOB_FIT_DAILY_WINDOW_SECONDS=86400
JOB_FIT_DAILY_MAX_REQUESTS=10
```

but `src/lib/jobFit/policy.ts` uses the constants of the code and never looks at them. A variable that is set changes nothing, which is the kind of thing that is trusted until the day it matters.

## Requirements

### 1. The comment of the proxy tells the truth

- The comment is rewritten so that it describes what the code does: the request from another site and the body that cannot be read are refused before the counting, and they carry no headers of the limit.
- The reason for the order is written down, because it looks like an oversight otherwise: counting a request from another site would let it use up the allowance of a visitor.
- No code changes. The behaviour of the proxy stays exactly as it is.

### 2. The limits of the analyzer are read from the environment

- `src/lib/jobFit/policy.ts` reads the four variables, the way the chat and the contact form do.
- A variable that is missing means the default of the code is used. A variable that holds something that is not a number is ignored, the same way the limits of the chat ignore one.
- The defaults of the code stay the ones they are: five analyses every thirty minutes and ten a day.
- The limit that is used is the one that is in the answer, and the headers of the answer of the analyzer carry the values that were actually applied, so a visitor can see them.

### 3. Nothing else changes

- The events of the analytics do not change. The event of a refusal carries the scope, the endpoint and the wait, and it must not start carrying the limits themselves.

## Scope

### In scope

- `app/api/analytics/route.ts` (the comment only)
- `src/lib/jobFit/policy.ts`
- The tests of the limits of the analyzer
- `src/lib/env.ts` and `.env.example` only if a variable is missing or named differently

### Out of scope

- The limits of the chat and of the contact form, which already work
- The shared store of the limiter, which is a bigger change and is written down in `TODO.md`
- The events of the analytics
- The two design level findings, which are M19F.01 and M19F.02

## Dependencies

- M19.06 (complete).

## Files / Areas Expected To Change

- `app/api/analytics/route.ts`
- `src/lib/jobFit/policy.ts`
- `src/lib/jobFit/policy.test.mts` (new, or the test file that holds the limits)
- `src/lib/env.ts`, `.env.example` only if needed

## Implementation Guidance

1. **Copy the way the chat does it.** `src/lib/ai/rateLimiter.ts` reads the limits of the environment and falls back to the defaults. The analyzer must look the same, so that a reader does not have to learn two ways of doing one thing.
2. **The limiter is injected.** The store of the limiter is injected so the tests can use a double. The limits themselves are read where the limiter is built, so the test can pass them directly.
3. **The comment is the whole change of the first part.** Do not "improve" the code while the comment is being corrected. The behaviour of the proxy is verified by M19.06 and it must stay the same.
4. **The tests are the shape of the limits of the chat.** There is a test file for the limiter of the chat; the analyzer needs the same.

## Acceptance Criteria

- The comment of `app/api/analytics/route.ts` describes what the code does, and it explains why the two refusals are not counted.
- The behaviour of the proxy is unchanged.
- `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS` and `JOB_FIT_DAILY_WINDOW_SECONDS` change the limits of the analyzer.
- A missing or an invalid value means the default of the code is used.
- The headers of the answer of the analyzer carry the values that were applied.
- The event of a refusal carries no limit.
- All the tests pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the limits of the analyzer come from the environment when they are set.
- Unit test: the defaults are used when the variables are missing.
- Unit test: a variable that is not a number is ignored and the default is used.
- Unit test: the window and the daily limit are independent of each other, the way they are for the chat.
- Manual: the analyzer answers with 429 after the configured number of analyses, and the headers carry the configured values.

## Security / Privacy Considerations

- The limits are not private. They are already in the headers of the answer, which the visitor sees.
- The event of a refusal must not carry the limits. PRD §48 keeps the limits out of the event, and this task does not change that.

## Performance / Accessibility Considerations

- Nothing in the path of a request changes. The limits are read when the limiter is built, not on every request.

## Definition of Done

- The comment tells the truth and the code is unchanged.
- The limits of the analyzer are read from the environment, with the defaults as a fallback.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §48 – the limits are configurable through the environment
- M19.06 – the findings this task closes
- M17 – the analyzer of a job description
