# M20 – Monitoring

This milestone observes the runtime health of the site: the errors that happen in the browser, in the API routes, in the language model layer and in the external services, and the requests that are too slow. Nothing in it changes what a visitor sees, and nothing in it may carry what a visitor typed.

## Execution Order

| Order | Task | Depends On | Parallel |
|-------|------|------------|----------|
| 1 | M20.01 – Install and configure Sentry; make the monitoring environment variables optional | M19.06 | – |
| 2 | M20.02 – Scrub the failures so that nothing private reaches the monitoring service | M20.01 | – |
| 3 | M20.03 – Capture the failures of the API routes | M20.02 | Done (2026-11-05) |
| 4 | M20.04 – Monitor the failures of the language model | M20.02 | Done (2026-11-07) |
| 5 | M20.05 – Monitor the failures of the external services | M20.02 | Done (2026-11-07) |
| 6 | M20.06 – Monitor the performance of the requests | M20.02 | M20.03, M20.04, M20.05 |
| 7 | M20.07 – Add the error boundaries and the browser error capture | M20.02 | M20.03, M20.04, M20.05, M20.06 |
| 8 | M20.08 – Set up the Sentry project, the alerts and the verification script | M20.01, M20.03, M20.04, M20.05, M20.06, M20.07 | – |
| 9 | M20.09 – Test and verify the monitoring end to end | M20.08 | – |

M20.03 to M20.07 all write to the same modules, so they are listed in order. M20.04, M20.05, M20.06 and M20.07 touch different files from each other and may be worked on in parallel by different people once M20.02 is done.

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Sentry is integrated | ROADMAP M20, PRD §129 | M20.01 | Complete |
| Only the variables the implementation needs are required | PRD _Environment variables_ | M20.01 | Complete |
| The site runs without a monitoring project | ROADMAP M20 (free tier, optional) | M20.01 | Complete |
| Nothing private reaches the monitoring service | PRD §79, §36, §78 | M20.02 | Complete |
| API errors are monitored | PRD §79, §129 | M20.03 | Complete |
| AI failures are monitored | PRD §79, §129, ROADMAP M20 | M20.04 | Complete |
| GitHub API failures are monitored | PRD §79, ROADMAP M20 | M20.05 | Complete |
| Database failures are monitored | PRD §79 | M20.05 | Complete |
| Performance is monitored | PRD §129, ROADMAP M20 | M20.06 | Covered |
| Frontend errors are monitored | PRD §79, §129 | M20.07 | Covered |
| Error boundaries exist | PRD §129 | M20.07 | Covered |
| Errors are captured and alertable | ROADMAP M20 DoD | M20.08 | Covered |
| The monitoring is verified end to end | ROADMAP M20 DoD | M20.09 | Covered |
| Personal data is redacted before it is written | DECISIONS M13 (guardrails), `src/lib/guardrails/piiDetection.ts` | M20.02 | Complete, reused |
| A secret is removed from every message | DECISIONS M13 (provider) | M20.02 | Complete, reused |
| The events of the visits are counted | ROADMAP M19 | M19.01–M19.06 | Satisfied |
| The chat, the analyzer and the contact form are limited | PRD §48 | M17, M19.04 | Satisfied |

M20.01, M20.02, M20.03, M20.04 and M20.05 are done (2026-11-05 and 2026-11-07). The rest of the milestone is waiting to be implemented.

## What the repository holds after M20.05

- **The failures of the services outside the site are reported in one place.** `src/lib/monitoring/externalFailures.ts` holds `reportExternalFailure()`. The name of the service is `github` or `supabase`, the kind of the failure is `unavailable`, `timeout`, `not_found`, `rate_limited` or `unknown`, and what the site did instead is `cached`, `empty` or `none`
- **The report holds the status when the service reported one and the identifier of the request when there is one.** The address of a service is only reported when it holds no query, because an address can carry a token in its query. The name of the repository is reported and not its address
- **The report is grouped by the service and by the kind of the failure.** An outage is one issue and not one issue for every repository of the site
- **One report goes out per service and repository per window.** The count of the failures that piled up is added to the report that follows, and the map of the counts is held in the memory of the process
- **The GitHub service reports the failure and says that the site answered with what it had.** The report is not awaited, so the visitor waits for nothing. A repository that is not found is not reported, because it is an answer and not a failure of the service
- **The database reports the failure before it throws it.** The message of the database is reduced to its kind, because it can name a table, a column or a constraint. It stays in the log of the server
- **A report of a service carries a level.** A failure the site answered with what it had is a warning, and a failure that reached the visitor is an error, because the SDK gives a message the level "info" and a report of that level cannot be alerted on
- **The text of a report of a message arrives.** The allow-list of the scrubbing of M20.02 held no `message` and no `logentry`, so every report of `captureMessage` arrived with nothing to read. It was found when M20.05 sent its first report, and both keys are in the list now
- Two findings were left alone and are written down in `TODO.md`: the GitHub service runs in the browser, where there is no token, so every request of the API is refused with a 401 and the numbers of the repositories never appear on the site; and the throttle of the GitHub failure is held in the memory of the browser, so a page of the projects sends one report per repository while the monitoring of the browser is on

## What the repository holds after M20.04

- **The failures of the model are told apart in one place.** `src/lib/monitoring/aiFailures.ts` holds `classifyAiFailure()`, and the kinds are `configuration`, `quota`, `timeout`, `unavailable`, `blocked` and `unknown`. A failure of the configuration is a problem of the deployment, a failure of the limit is a problem of the plan, a failure of time is a problem of the limit of the request and a failure of the service is a problem of the day
- **The classification never reads the text of the message.** It uses the status the provider already carries, the name of the error and the reason the API gives. The text of the message of the API can be anything, and a rule that read it would classify a failure by the wording of the API and not by what happened
- **The reason of the API is carried by the failure.** `readErrorDetails()` in `src/lib/geminiErrors.ts` gives it back as well as the message and the status, and `LLMError` in `src/lib/llm/provider.ts` holds it. It was needed because a request the API refused for its own reasons and a request it refused because the key is wrong are both a 400
- **The place where the failure happens reports it.** `src/lib/ai/orchestration.ts` reports the failure of the model in all four places where the model is asked, before the failure is turned into the friendly answer and without awaiting the report, so the latency of the visitor does not grow
- **The friendly answer is exactly the one of today.** The words and the order of the steps were not changed, and the behaviour was checked against the committed code
- **One failure is one report.** The capture marks a failure as reported before its first wait, so the route that catches it afterwards writes the line of the local log and does not report it a second time
- **The report of the model is grouped by the kind alone.** A thousand timeouts are one issue and not a thousand. The reports of the routes keep the kind and the route
- **The report holds nothing that a visitor wrote.** The kind, the status, the model, the identifier of the query and the moment. No question, no answer, no prompt, no context of the retrieval
- **The refusals are not failures of the model.** A refusal of the limit of the chat is reported by the analytics of M19.04 and a question the guardrails refuse is a normal answer
- Two things were found on the wire and left alone, and they are written down in `TODO.md`: the SDK reports the failure of the streaming path a second time on its own, and the friendly answer of the streaming path never reaches the visitor because the route ends the stream with an error

## What the repository holds after M20.03

- **The capture is one module and every route hands over to it.** `src/lib/monitoring/capture.ts` holds `captureException()` and `captureMessage()`, and the client of the SDK is created through a factory that a test can replace, the same way the analytics of M19 create the client of PostHog
- **The context of a route is built by one helper.** The name of the route, the method, the status of the answer, the kind of the failure, the identifier of the query and the moment. The address of the visitor is not part of it and the body never reaches it
- **The report is grouped by the kind of the failure and by the route**, through the fingerprint of the SDK, so the same failure does not open an issue of its own every time it happens
- **The console line keeps its shape.** The capture writes it with the words each route used, so the log of the machine reads the way it always read
- **The integration of the console and the integration of the duplicates are left out of the SDK.** The console of the site holds the address of a visitor and the failure as it came, and it becomes a breadcrumb of the report; the integration of the duplicates drops the second of two failures that look the same, and every failure has to be reported
- **The message of the parser of a body is not in the report.** It holds the first words of that body. The name of the error and the place it happened are kept
- **The refusals are not reported.** A 400, a 403 and a 429 are the site doing its job

## What the repository holds after M20.02

- **The scrubbing is one layer and it is on the way out of the process.** `src/lib/monitoring/scrub.ts` holds `scrubFailure()` for the failures the application builds and `scrubEvent()` for the events of the SDK. The `beforeSend` hook of both sides runs the second one, so a capture path that is added in M20.03 to M20.07 cannot bypass it by accident
- **The safe shape is built by an allow list.** A part that is not on the list of the safe parts does not reach the service, so a field that nobody thought of is not sent by accident
- **The list of the secrets of the environment is curated.** The rule of the guardrails, which treats every name with an underscore as a secret, cannot be used here: the value of a limit is a number, and removing that number from every message would be worse than useless. A secret shorter than eight characters is not looked for either
- **The hook of `beforeSend` takes the event alone.** The SDK calls the hook with the event and a hint, and the hint is not a list of secrets. Handing the scrubbing to the SDK directly put the hint in the place of the secrets, so the scrubbing failed and every report was lost. This was found by reading the wire
- **A failure of the scrubbing does not send the event unchecked and does not lose it either.** A safe shape takes its place, with the identity of the event and a note that says the scrubbing failed
- **The redaction of the personal data is the one of the guardrails.** It is reused as it is, and it is applied to every string that is sent, not only to the fields whose name says what they hold

## What the repository holds after M20.01

- **The SDK is installed.** `@sentry/nextjs` 11.10.0, the newest stable version. Its support of Next.js 16 was read before the installation: the package declares `next: "^14.0 || ^15.0.0-rc.0 || ^16.0.0-0"`, and the version of Next.js in this repository is 16.3.2
- **The files are `instrumentation.ts` and `instrumentation-client.ts`, not `sentry.server.config.ts` and `sentry.client.config.ts`.** The installed version of the SDK warns at the build that a file of the second kind is an outdated configuration and asks for its content to be put into the `register()` function of the instrumentation file, because `Sentry.init` has to be called inside an instrumentation file. The written task of M20.01 named the two configuration files, and it was written before the version of the SDK was known
- **The configuration lives in `src/lib/monitoring/config.ts`** and is the only part of the layer that the browser and the server share
- **The SDK of the browser is loaded with a dynamic import.** A static import put a hundred and twenty five kilobytes gzipped into the first load of the homepage. The chunk is a hundred and fifty kilobytes gzipped and is not part of the first load
- **The environment no longer demands `SENTRY_DSN` or the two `UPSTASH_REDIS` variables.** The site boots without the placeholders that nothing read
- **The browser has a DSN of its own**, `NEXT_PUBLIC_SENTRY_DSN`. A DSN of Sentry is not a secret; the key of the project is, and it never leaves the server

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
- **The SDK of the browser is loaded on its own.** The chunk of the SDK is not part of the first load of a page, and it is never fetched when there is no DSN. The price is that the SDK is ready a moment after the page is there.

## Decisions that need a person

These are not settled by the planning and are marked in the task that carries them.

1. **Which Sentry package.** **Answered by M20.01:** `@sentry/nextjs` 11.10.0. It is the one package that covers the browser, the server and the edge, and it is the only one that uses the `instrumentation.ts` hook of Next.js 16 on its own. The version was chosen by reading the support that the package declares, not by taking the newest number on the page.
2. **Whether the performance is watched with a threshold or with tracing.** A threshold ("this request was slower than three seconds") is cheap on the free tier and enough for a site with low traffic. Full tracing costs a span per request and would need a decision about the sample rate. The threshold is the recommendation. Carried by M20.06.
3. **Whether the local machine reports to the same project as the live site.** The same reasoning as the analytics of M19: a project of its own for the machine keeps the numbers of the site clean. This needs an account action. Carried by M20.08.
4. **How the alerts reach the owner.** The email alerts of Sentry are free and need nothing else. A chat channel would need another service. The email is the recommendation. Carried by M20.08.

## Notes for the tasks

- The repository has no React testing library, so the error boundaries of M20.07 are checked in a browser rather than in a unit test. The same approach was used for the click of a call to action in M19.03.
- The live language model tests are opt in with `LIVE_LLM_TESTS=1`, because the free tier of Gemini allows twenty generation requests a day. M20.04 must not turn them on by default.
- Every failure that is captured has to be safe to show to a person who is not the owner of the site. A stack trace is fine, a message of a recruiter is not.
