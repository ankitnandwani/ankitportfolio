# M20 – Monitoring

This milestone observes the runtime health of the site: the errors that happen in the browser, in the API routes, in the language model layer and in the external services, and the requests that are too slow. Nothing in it changes what a visitor sees, and nothing in it may carry what a visitor typed.

## Execution Order

| Order | Task | Depends On | Parallel |
|-------|------|------------|----------|
| 1 | M20.01 – Install and configure Sentry; make the monitoring environment variables optional | M19.06 | – |
| 2 | M20.02 – Scrub the failures so that nothing private reaches the monitoring service | M20.01 | – |
| 3 | M20.03 – Capture the failures of the API routes | M20.02 | – |
| 4 | M20.04 – Monitor the failures of the language model | M20.02 | M20.03 |
| 5 | M20.05 – Monitor the failures of the external services | M20.02 | M20.03, M20.04 |
| 6 | M20.06 – Monitor the performance of the requests | M20.02 | M20.03, M20.04, M20.05 |
| 7 | M20.07 – Add the error boundaries and the browser error capture | M20.02 | M20.03, M20.04, M20.05, M20.06 |
| 8 | M20.08 – Set up the Sentry project, the alerts and the verification script | M20.01, M20.03, M20.04, M20.05, M20.06, M20.07 | – |
| 9 | M20.09 – Test and verify the monitoring end to end | M20.08 | – |

M20.03 to M20.07 all write to the same modules, so they are listed in order. M20.04, M20.05, M20.06 and M20.07 touch different files from each other and may be worked on in parallel by different people once M20.02 is done.

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Sentry is integrated | ROADMAP M20, PRD §129 | M20.01 | Covered |
| Only the variables the implementation needs are required | PRD _Environment variables_ | M20.01 | Covered |
| The site runs without a monitoring project | ROADMAP M20 (free tier, optional) | M20.01 | Covered |
| Nothing private reaches the monitoring service | PRD §79, §36, §78 | M20.02 | Covered |
| API errors are monitored | PRD §79, §129 | M20.03 | Covered |
| AI failures are monitored | PRD §79, §129, ROADMAP M20 | M20.04 | Covered |
| GitHub API failures are monitored | PRD §79, ROADMAP M20 | M20.05 | Covered |
| Database failures are monitored | PRD §79 | M20.05 | Covered |
| Performance is monitored | PRD §129, ROADMAP M20 | M20.06 | Covered |
| Frontend errors are monitored | PRD §79, §129 | M20.07 | Covered |
| Error boundaries exist | PRD §129 | M20.07 | Covered |
| Errors are captured and alertable | ROADMAP M20 DoD | M20.08 | Covered |
| The monitoring is verified end to end | ROADMAP M20 DoD | M20.09 | Covered |
| Personal data is redacted before it is written | DECISIONS M13 (guardrails), `src/lib/guardrails/piiDetection.ts` | M20.02 | Satisfied, reused |
| A secret is removed from every message | DECISIONS M13 (provider) | M20.02 | Satisfied, reused |
| The events of the visits are counted | ROADMAP M19 | M19.01–M19.06 | Satisfied |
| The chat, the analyzer and the contact form are limited | PRD §48 | M17, M19.04 | Satisfied |

## What the repository holds today

The planning was written against the state of the repository on 2026-11-03, and every item below was read in the code rather than assumed.

- **No monitoring code at all.** There is no `instrumentation.ts`, no `sentry.*.config.ts`, no `src/lib/monitoring/`, and no dependency on Sentry.
- **No error boundaries.** `app/` holds `layout.tsx`, `page.tsx` and the route folders, and no `error.tsx` or `global-error.tsx`. PRD §129 asks for error boundaries, so this is a gap the milestone closes.
- **`SENTRY_DSN` and the two `UPSTASH_REDIS` variables are required by `src/lib/env.ts`** although nothing reads them. The site therefore refuses to boot unless they are filled in with placeholders, which contradicts PRD's _Environment variables_ section: "Only variables actually required by the implementation should be present."
- **The failures are only written to the console.** `app/api/chat/route.ts`, `app/api/contact/route.ts`, `app/api/job-fit/route.ts` and `app/api/feedback/route.ts` each end their `catch` block with a `console.error`, and `src/lib/ai/orchestration.ts` turns a failure of the model into a friendly answer before rethrowing it.
- **The errors of the language model already carry a status.** `src/lib/llm/provider.ts` holds `LLMError` (with `status` and `retryable`), `LLMConfigurationError` and `src/lib/geminiErrors.ts` holds `GeminiApiError` and `readErrorDetails`. The classification M20.04 needs is already written.
- **The privacy machinery already exists.** `src/lib/guardrails/piiDetection.ts` holds `detectPii`, `redactPii`, `containsPii` and `piiTypes`; `src/lib/knowledge/pii.ts` holds `redactPII` and `redactPhoneNumbers`; `src/lib/guardrails/outputValidation.ts` already knows the names of the variables that hold a secret.
- **The structured, privacy safe log already has a shape.** `src/lib/guardrails/logger.ts` writes an event through a sink that a test can replace with `setGuardrailSink`, and the event holds no question and no answer. The monitoring logger follows that shape.
- **Next.js 16 hands over the request error without the body.** `instrumentation.ts` may export `onRequestError(error, errorRequest, errorContext)`, where `errorRequest` is `{ path, method, headers }` and `errorContext` is `{ routerKind, routePath, routeType, renderSource, revalidateReason }`. There is no body in it, and `routePath` is the route template rather than the address that was asked for. The details are in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md` and `node_modules/next/dist/server/instrumentation/types.d.ts`.
- **The routes cannot be loaded by the test runner.** They import their modules with the `@/` alias, so the part that can be checked on its own has to live in `src/lib/`. This is the shape of the analytics of M19 and of the validation of the contact form.
- **The CI runs the lint, the typecheck and the tests, but not the build.** `.github/workflows/ci.yml` has no `npm run build` step, so a configuration that breaks the build would not be caught by the pipeline. Adding the build to the CI is not part of this milestone, and it is recorded in `TODO.md`.

## Decisions that this milestone takes

They are recorded in `DECISIONS.md` as the milestone is carried out.

- **The monitoring is optional in the environment and the site runs without it.** The same shape the analytics of M19 have: a missing DSN means the monitoring is off, and a value that is still the placeholder of `.env.example` counts as no DSN.
- **The monitoring never receives a request body.** The bodies carry the message of the chat, the description of a job and the form of a contact, which PRD §36 and §78 tell us not to record. The capture is built so that there is nowhere for a body to go, rather than so that a body is removed later.
- **The scrubbing is a layer of its own.** Everything that is sent goes through one function, so a new capture path cannot bypass it by accident.
- **The failures of the routes and the failures of the framework are captured separately.** A route that catches its own failure and answers with a 500 is invisible to the framework, so the catch blocks report it themselves.

## Decisions that need a person

These are not settled by the planning and are marked in the task that carries them.

1. **Which Sentry package.** `@sentry/nextjs` is the recommendation: it is the package that supports the `instrumentation.ts` hook of Next.js 16 out of the box, and it covers the browser, the server and the edge in one dependency. It has to be a version that declares support for Next.js 16, and that has to be checked at the moment it is installed. Carried by M20.01.
2. **Whether the performance is watched with a threshold or with tracing.** A threshold ("this request was slower than three seconds") is cheap on the free tier and enough for a site with low traffic. Full tracing costs a span per request and would need a decision about the sample rate. The threshold is the recommendation. Carried by M20.06.
3. **Whether the local machine reports to the same project as the live site.** The same reasoning as the analytics of M19: a project of its own for the work on the machine keeps the numbers of the site clean. This needs an account action. Carried by M20.08.
4. **How the alerts reach the owner.** The email alerts of Sentry are free and need nothing else. A chat channel would need another service. The email is the recommendation. Carried by M20.08.

## Notes for the tasks

- The repository has no React testing library, so the error boundaries of M20.07 are checked in a browser rather than in a unit test. The same approach was used for the click of a call to action in M19.03.
- The live language model tests are opt in with `LIVE_LLM_TESTS=1`, because the free tier of Gemini allows twenty generation requests a day. M20.04 must not turn them on by default.
- Every failure that is captured has to be safe to show to a person who is not the owner of the site. A stack trace is fine, a message of a recruiter is not.
