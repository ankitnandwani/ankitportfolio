## [0.1.153] - 2026-11-08
- Implemented M20.06 – Monitor the performance of the requests
- Added `src/lib/monitoring/performance.ts`, the one place where an operation that is too slow is reported
  - `startPerformanceMeasurement(operation, thresholdMs, options)` starts a measurement and the caller ends it. The measurement is two reads of the clock and nothing else, so it adds no work to the path of a request
  - `reportSlowOperation(operation, durationMs, thresholdMs, options)` reports a duration that is already known, for the places that measure their work already
  - The clock and the reporter are injected, so a test can say that an operation took two thousand milliseconds without waiting two seconds
  - The report holds the name of the operation, the duration, the threshold it was measured against, the identifier of the query when there is one and the name of the route when there is one. It holds no question, no answer, no description of a job and no form
  - The report is grouped by the name of the operation, so a slow answer every day is one issue and not a hundred
  - The report goes out on its own and is not awaited, so a slow request does not become a slower request. It never throws and it does nothing when the monitoring is off
- The operations that are measured are `chat`, `job-fit`, `contact`, `github-fetch`, `retrieval` and `generation`
- **The chat route measures the whole request**, and the answer of the stream is the work of the request, so the measurement ends when the stream ends
- **The analyzer of a job description and the contact form measure the whole request** as well, in every path: the answer or the failure
- **The generation is measured apart from the retrieval** in the orchestration, so the owner can tell whether to look at the model or at the database. Both numbers were already there; they are reported now
- **The fetch of the GitHub service is measured apart from the time of the cache**, because a cache that answers in a moment and an API that takes long are two different problems
- **The thresholds are optional in the environment.** Six new variables, `PERFORMANCE_CHAT_THRESHOLD_MS`, `PERFORMANCE_JOB_FIT_THRESHOLD_MS`, `PERFORMANCE_CONTACT_THRESHOLD_MS`, `PERFORMANCE_GITHUB_FETCH_THRESHOLD_MS`, `PERFORMANCE_RETRIEVAL_THRESHOLD_MS` and `PERFORMANCE_GENERATION_THRESHOLD_MS`, are in `src/lib/env.ts` and in `.env.example`. A missing one and one that holds something that is not a number both mean the default of the code is used, and a wrong value does not stop the site from booting
- The defaults are the values the site is comfortable with: thirty seconds for the chat and for the analyzer, which answer with the model; twenty-five for the generation; ten for the retrieval; five for the contact form and for the fetch of GitHub
- **The tracing of the SDK stays off.** The threshold is the recommendation of the specification, and the reason is written in `DECISIONS.md`. Turning the tracing on is a change of the configuration of the SDK and not a change of the code of the site
- 10 tests added in `src/lib/monitoring/performance.test.mts`. The whole suite was run again: 713 tests with 707 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- **Verified on the wire with the real SDK.** The database was made slow on purpose and it answered after thirty-two seconds: the request took 34.2 seconds and produced two reports, `The retrieval took 33412 ms, which is longer than the threshold of 10000 ms.` and `The chat took 34239 ms, which is longer than the threshold of 30000 ms.`, with the same identifier of the query, and neither of them held the question or the answer. A request that took 3.6 seconds produced no report of a slow operation at all

## [0.1.152] - 2026-11-07
- Implemented M20.05 – Monitor the failures of the external services
- Added `src/lib/monitoring/externalFailures.ts`, the one place where a failure of a service outside the site is reported
  - `reportExternalFailure(failure)` reports a failure with the name of the service (`github` or `supabase`), the kind of the failure (`unavailable`, `timeout`, `not_found`, `rate_limited`, `unknown`), what the site did instead (`cached`, `empty`, `none`), the status when the service reported one and the identifier of the request when there is one
  - It never throws, and it does nothing when the monitoring is off
  - The address of a service is only reported when it holds no query, because an address can carry a token in its query. The name of the repository is reported and not its address
  - The report is grouped by the name of the service and by the kind of the failure, so an outage is one issue and not one issue for every repository
  - One report goes out per service and repository per window of five minutes, and the count of the failures that piled up is added to the report that follows. The map is held in the memory of the process, the same way the limiter of the chat is held
- `src/lib/githubService.ts` reports the failure when the fetch fails, and it says that the site answered with what it had. The report is not awaited, so the visitor waits for nothing
  - A repository that is not found is not a failure of the service. It is an answer, and it is not reported
  - The identifier of the request of GitHub is carried in the report, and it holds no token
- `src/lib/knowledge/retrieval.ts` reports the failure when the database answers with an error, before it throws it, so the report is not lost when the instance is put to sleep. The message of the database is reduced to its kind: it can name a table, a column or a constraint, so it stays in the log of the server and never reaches a report
- **The text of a report that is not a failure was never delivered.** The allow-list of the scrubbing of M20.02 held no `message` and no `logentry`, so every report of `captureMessage` arrived with nothing to read. Both are in the list now, and the text is cleaned of its private parts like any other text
- **A report of a service now carries its level.** The SDK gives a message the level "info" when nothing else is said, and a report of the level "info" is not one that can be alerted on. A failure the site answered with what it had is a warning, and a failure that reached the visitor is an error
- The safe shape of a failure holds the tags, the fingerprint and the level of a report now, so a report that is not of a route can say what it is about and how it is grouped. The reports of the routes are exactly the ones they were
- 17 tests added: 14 in `src/lib/monitoring/externalFailures.test.mts`, 2 in `src/lib/githubService.test.mts` and 1 in `src/lib/knowledge/retrieval.test.mts`. The whole suite was run again: 703 tests with 697 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- **Verified on the wire with the real SDK.** The GitHub service was called for real with a token that is wrong: the report said `GitHub could not answer for ankitnandwani/ankitnaadwani (unknown). The site answered with what it had.`, it carried the name of the repository, the identifier of the request of GitHub and the status 401, and it held no token, no address of the API and no query. The database that answers with an error produced `The knowledge base could not answer (unknown). The answer came with no context of the retrieval.` and it held no message of the database. Three failures of one repository produced exactly one report
- **Two findings were left alone and are written down in `TODO.md`.** The GitHub service runs in the browser, where there is no token, so every request of the API is refused with a 401 and the numbers of the repositories never appear on the site; and the report of the GitHub failure is throttled in the memory of the browser, so a page of the projects sends one report per repository while the monitoring of the browser is on

## [0.1.151] - 2026-11-07
- Implemented M20.04 – Monitor the failures of the language model
- Added `src/lib/monitoring/aiFailures.ts`, the one place where a failure of the model is told apart from another failure. The kinds are `configuration`, `quota`, `timeout`, `unavailable`, `blocked` and `unknown`
  - `classifyAiFailure(error)` says what kind of failure it is. It never throws, because a failure of the classification must not become a second failure that reaches the visitor
  - `readAiFailureStatus(error)` reads the status the API reported, and `readAiModel()` reads the model that was asked
  - `buildAiFailureContext(error, { queryId })` builds the context of the report: the kind, the status, the model, the identifier of the query and the moment. It holds no question, no answer, no prompt and no context of the retrieval
- **The classification never reads the text of the message to decide.** It uses the status the provider already carries, the name of the error and the reason the API gives, which is a fixed word of the API and not a text. A message that says "the free tier is spent" is not a failure of the limit when the status does not say so
- **The reason of the API is now carried by the failure.** `readErrorDetails()` in `src/lib/geminiErrors.ts` returns the reason as well as the message and the status, and `LLMError` in `src/lib/llm/provider.ts` holds it. It was needed because a request the API refused for its own reasons (`safety`, `blocklist`) and a request it refused because the key is wrong (`API_KEY_INVALID`) are both a 400, and the status alone cannot tell them apart. The adapter of the provider passes it through. These three files were not in the list of the task, and the reason is written in `DECISIONS.md`
- `src/lib/ai/orchestration.ts` reports the failure of the model in all four places where the model is asked, the two functions and the two methods of the service. It reports it before the failure is turned into the friendly answer, so the report is not lost when the instance is put to sleep, and the report is not awaited, so the latency of the visitor does not grow
- **The friendly answer the visitor sees is exactly the one of today.** The words were not changed and the order of the steps was not changed. It was checked against the committed code on the wire
- **The report of the model is grouped by the kind alone**, through the fingerprint of the SDK, so a thousand timeouts are one issue and not a thousand. The reports of the routes keep the kind and the route
- **One failure is one report.** The capture marks a failure as reported before its first wait, so the route that catches the same failure afterwards writes the line of the local log and does not report it a second time
- The safe shape of a failure holds the model now, and the model is carried as a tag of the report. The model name is not private and it says which model was failing
- A refusal of the limit of the chat and a question the guardrails refuse are not reported here. The first is reported by the analytics of M19.04 and the second is a normal answer, not a failure of the model
- 22 tests added: 16 in `src/lib/monitoring/aiFailures.test.mts`, 4 in `src/lib/monitoring/capture.test.mts` and 2 in `src/lib/gemini.test.mts`. The whole suite was run again: 686 tests with 680 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- **Verified on the wire with the real SDK, with the dev server running.** A request with a wrong key produced exactly one report, the one of the route, because the retrieval uses the same key and fails before the model is asked. A request with a model name the API does not know produced exactly one report, the one of the model: `kind: configuration`, the model, `status: 404` and the fingerprint `["configuration"]`. The report held no key, no question, no answer and no retrieval content
- Two findings were left alone and are written down in `TODO.md`: the SDK reports the failure of the streaming path a second time on its own, and the friendly answer of the streaming path never reaches the visitor because the route ends the stream with an error

## [0.1.150] - 2026-11-05
- Implemented M20.03 – Capture the failures of the API routes
- Added `src/lib/monitoring/capture.ts`, the one place where a failure of the site becomes a report. Every route that catches a failure hands it over here, and nothing else talks to the monitoring service
  - `captureException(error, context)` reports a failure. It does nothing while the monitoring is off, it never throws, it writes the line of the local log and it flushes the report before the answer of the route goes out, so it is not lost when the instance is put to sleep
  - `captureMessage(message, context)` reports something that is not a failure. M20.05 and M20.06 use it
  - The client of the SDK is created through a factory that a test can replace, the same way the analytics of M19 create the client of PostHog, and the package is loaded with a dynamic import so it never becomes part of a client bundle
- The context of a route is built by one helper out of the name of the route, the method of the request, the status of the answer, the kind of the failure, the identifier of the query and the moment. The address of the visitor is not part of it, and the body never reaches it
- The four routes report the failure they catch, with the status they are about to answer with. The failure of the configuration of the model is reported as a failure of the configuration and not as an unknown failure, and the rules are the ones the routes already followed when they answered, so the kind of a report and the status of an answer always agree
- The proxy of the analytics reports a failure it does not expect and then lets it go on the way it would have gone, so the answer the visitor receives is the one of today. Its refusals are not reported, or the project would fill with the traffic of other sites
- **The line of the local log keeps its shape.** The capture writes it now, with the same words each route used, so the person who works on the site reads the log they are used to and there is one line for a failure
- **The report is grouped by the kind of the failure and by the route**, through the fingerprint of the SDK, so the same failure does not open an issue of its own every time it happens
- **The integration of the console and the integration that removes the duplicates are left out of the SDK.** The console of the site writes the address of a visitor (the line of the limiter) and the failure as it came, and the console becomes a breadcrumb of the report; the integration of the duplicates drops the second of two failures that look the same, and every failure that the routes catch has to be reported
- **The message of the parser of a body is not in the report.** It holds the first words of that body, and a report must not hold the text of a visitor. The name of the error and the place it happened are kept, because they are what the owner needs
- The allow list of the scrubbing of M20.02 now holds the fingerprint of the SDK. It was left out, and without it the grouping of the reports was lost on the way out
- The headers that carry the address of the visitor (`x-forwarded-for`, `x-real-ip` and `forwarded`) are never sent, like the headers that carry a secret
- 18 tests added: 15 in `src/lib/monitoring/capture.test.mts`, 1 in `src/lib/monitoring/config.test.mts` and 2 in `src/lib/monitoring/scrub.test.mts`. The whole suite was run again: 664 tests with 658 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- **Verified on the wire with the real SDK, with the dev server running.** A request with a body that cannot be read was made to the route of the feedback and to the route of the chat. Each one produced exactly one report, and the report held the route, the method, the status, the kind, the moment and the fingerprint, and nothing else: no body, no address of the visitor, no text of a visitor, no user, no console breadcrumb. Two failures in a row were both reported, and the refusals of the routes (a 400, a 403) produced nothing at all

## [0.1.149] - 2026-11-04
- Implemented M20.02 – Scrub the failures so that nothing private reaches the monitoring service
- Added `src/lib/monitoring/scrub.ts`, the one layer between the application and the monitoring service. Everything that is sent goes through it, so a capture path that is added later cannot bypass it
  - `scrubFailure()` takes the parts of a failure and gives back the safe version of them. The name of the error, the message, the kind, the route, the method, the status, the moment, the identifier of the query and the stack stay; everything else is left out
  - `scrubEvent()` is the backstop. The SDK runs it on every event through the `beforeSend` hook of both sides
  - The bodies of the chat, of the analyzer of a job description and of the contact form are removed by the name of their fields, and the body of a request is never sent whatever shape it has
  - The address of a mailbox and the number of a phone are removed from every string that is sent, with the redaction the guardrails already hold
  - The headers that carry a secret are never sent: `authorization`, `cookie`, `set-cookie`, `x-api-key`, and any header whose name holds `token`, `secret`, `key` or `password`
  - The values of the secrets of the environment are removed from every string that is sent. A value that is still the placeholder of `.env.example` is not a secret and is not looked for
- **The list of the secrets is curated, and not the rule of the guardrails.** The guardrails treat every name with an underscore as a secret, which cannot be used here: the value of a limit such as `RATE_LIMIT_MAX_REQUESTS` is the number twenty, and removing that number from every message would be worse than useless. The list holds the eleven variables of the site that hold a credential
- A secret shorter than eight characters is not looked for, because removing it from a message would take half of its words away
- **The hook of `beforeSend` takes the event alone.** The SDK calls the hook with the event and a hint, and the hint is not a list of secrets. This was found by reading the wire: with the scrubbing handed to the SDK directly, the hint landed in the place of the secrets, the scrubbing failed, and every report was lost without a word. The hook takes the event alone now, and the scrubbing ignores a second argument that is not a list
- **A failure of the scrubbing does not send the event unchecked, and it does not lose it either.** A safe shape takes its place, with the identity of the event and a note that says the scrubbing failed
- The safe shape of an event is built by an allow list. The parts the SDK builds itself keep every field and only their strings are cleaned, because the name of the SDK is the name of the SDK and not the name of a recruiter; the parts that the application fills lose the fields that hold what a visitor wrote
- 42 tests added: 39 in `src/lib/monitoring/scrub.test.mts` and 3 in `src/lib/monitoring/config.test.mts`. The whole suite was run again: 646 tests with 640 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean
- **Verified on the wire with the real SDK.** A failure was reported to a local server that wrote the body of the envelope down. One envelope was sent, and it held no address of a mailbox, no number of a phone, no body of a chat, no key, no DSN, no name of a recruiter and no identity of a visitor, while the redaction token was there in their place
- The build was run by hand, because the CI does not run it. It succeeds, and the scrubbing is in the bundle of the server and in the bundle of the browser

## [0.1.148] - 2026-11-04
- Implemented M20.01 – Install and configure Sentry; make the monitoring environment variables optional
- Installed `@sentry/nextjs` 11.10.0, the newest stable version. The support of Next.js 16 was read before the installation rather than assumed: the package declares `next: "^14.0 || ^15.0.0-rc.0 || ^16.0.0-0"`, and the version of Next.js in this repository is 16.3.2
- Added `src/lib/monitoring/config.ts`, the one implementation of the configuration of the monitoring, with the shape the analytics of M19 left behind. A missing DSN, a value that is still the placeholder of `.env.example` and a value that is not an http or https URL all mean the monitoring is off, and the DSN is only carried while it is on. The options the SDK is started with are built by the same module, so the server and the browser cannot disagree about what is collected
- Added `instrumentation.ts` and `instrumentation-client.ts`. The server side starts the SDK and holds the `onRequestError` hook of Next.js 16, which receives the path, the method and the headers of the request and no body
- **The convention of the installed version of the SDK was followed, not the one of the written task.** The task of M20.01 named `sentry.server.config.ts` and `sentry.client.config.ts`, and it was written before the version of the SDK was known. The installed version warns at the build that such a file is an outdated configuration and asks for its content to be put into the `register()` function of the instrumentation file, so no `sentry.*.config.ts` was created. The reason is written in `DECISIONS.md`
- `sendDefaultPii` is false, the session recording is off and the tracing is off, on both sides
- **The SDK of the browser is loaded on its own.** A static import put a hundred and twenty five kilobytes gzipped into the first load of the homepage, which is a growth PRD §74 would notice. The import is a dynamic one now: the chunk is not part of the first load, the first load of the homepage is the same as it was, and when there is no DSN the chunk is never fetched at all
- The source maps of the browser are kept, because the SDK deletes them once they are uploaded and the deletion runs whatever happened to the upload. Without this a build without a key would delete the maps it never uploaded
- `next.config.ts` uploads the source maps with the plugin of the SDK, and the build does not send anything about itself: the telemetry of the plugin is turned off
- `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are optional in the environment now, so the site boots without the three placeholders that nothing read. PRD's _Environment variables_ section says that only the variables the implementation needs should be present
- The browser has a DSN of its own, `NEXT_PUBLIC_SENTRY_DSN`, because a DSN of Sentry is not a secret: it is written in the page by design and only allows sending events to the project it belongs to. The key of the project is a different thing and never leaves the server
- 22 tests added: 20 in `src/lib/monitoring/config.test.mts` and 2 in `src/lib/env.test.mts`. The whole suite was run again: 604 tests with 598 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean
- The build was run by hand with a DSN and without one, because the CI does not run the build. Both succeed, and the site boots and answers with no DSN and reports no error of the SDK
- The installation brought four moderate advisories through `@sentry/bundler-plugins`, which only runs at the build. The count of the audit went from 24 to 28 and no new serious one came; the serious ones that were already there are in Next.js 16.3.2 itself

## [0.1.147] - 2026-11-04
- Implemented M19F.03 – Close out the findings of the verification of M19
- The comment of `app/api/analytics/route.ts` now describes what the code does. It used to say that every answer of the proxy carries the headers of the limit and that the request is counted before anything is parsed. The two answers that are refused before the counting, the request from another site and the body that cannot be read, carry no headers of the limit and are not counted. The reason is written down, because counting a request from another site would let it use up the allowance of a visitor. The behaviour of the proxy was not changed
- The limits of the analyzer of a job description come from the environment now: `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS` and `JOB_FIT_DAILY_MAX_REQUESTS` are read when the limiter is built, the way the limits of the chat and of the contact form are read. A variable that is missing, or that holds something that is not a positive number, is ignored and the default of the code is used
  - PRD §48 asks for the limits of the AI features to be configurable through the environment. The variables were declared in `src/lib/env.ts` and written in `.env.example`, but setting them changed nothing
- Six tests added in `src/lib/jobFit/policy.test.mts`, and they were proved to depend on the change: with the reading of the environment removed the test of the limits coming from the environment fails, and the file was put back byte for byte
- Verified against the running site: with `JOB_FIT_MAX_REQUESTS=2` the third analysis is refused with a 429 and the headers carry `x-ratelimit-limit: 2`, and with `JOB_FIT_DAILY_WINDOW_SECONDS=60` and `JOB_FIT_WINDOW_SECONDS=7200` the reset is a minute away instead of two hours. The requests were refused before the analysis, so no answer was paid for
- The whole suite was run again: 582 tests with 576 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- The verification of M19.05 was run again to prove that the behaviour of the proxy is unchanged: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0
- Two more variables of the environment were found and left alone, because they were not part of this task: `CONTACT_FORM_DAILY_WINDOW_SECONDS` and `JOB_FIT_MAX_TOKENS` are declared and never read

## [0.1.146] - 2026-11-04
- Planned the next milestone. The task specifications of M20 – Monitoring are written in `tasks/M20/`, nine of them, and the milestone is waiting to be implemented
  - M20.01 – Install and configure Sentry; make the monitoring environment variables optional
  - M20.02 – Scrub the failures so that nothing private reaches the monitoring service
  - M20.03 – Capture the failures of the API routes
  - M20.04 – Monitor the failures of the language model
  - M20.05 – Monitor the failures of the external services
  - M20.06 – Monitor the performance of the requests
  - M20.07 – Add the error boundaries and the browser error capture
  - M20.08 – Set up the Sentry project, the alerts and the verification script
  - M20.09 – Test and verify the monitoring end to end
- The planning was written against the state of the repository: there is no monitoring code, no error boundary, no `instrumentation.ts`, and `SENTRY_DSN` and the two `UPSTASH_REDIS` variables are required by the environment although nothing reads them
- Next.js 16 hands the server failure over through `onRequestError` with the path, the method and the headers and **without the body**, which is the shape the privacy of PRD §79 needs
- The findings that the verification of M19 left behind are written as specifications in `tasks/M19-followups/`: M19F.01 (one identity for the visitor across the events), M19F.02 (the page level events of PRD §78) and M19F.03 (the comment of the proxy that does not tell the truth, and the limits of the analyzer that are not read from the environment)
- No application code was changed and no dependency was installed. This is a planning task

## [0.1.145] - 2026-11-03
- Implemented M19.06 – Test and verify analytics end to end
- Ran the verification script of M19.05 against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0. A run with a rule broken on purpose answers with the exit code 1 and names the rule that failed, so the script really fails when it should
- Ran the whole suite again: 576 tests (570 pass, 0 fail, 6 skipped), lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds
- Fired every event of the catalogue for real against the real PostHog project and read the payload on the wire:
  - `chat_session_start`, `message_sent`, `response_received`, `feedback_given`, `cta_clicked`, `contact_form_submission`, `job_fit_analysis`, `rate_limit_exceeded`
  - The wire was read with a small forwarding server that wrote the body down and passed it on to PostHog, so the real project still received every event and the exact bytes could be checked. The file that held the key was deleted at once
  - The server reported no error of the flush in any of the runs
- Checked the project in the browser: the activity log of project 325584 shows all eight kinds of event, every one of them with the library `posthog-node`, the identity of the session and the `GeoIP disabled` on
- The privacy audit of the real payloads:
  - No address of a mailbox, no number of a phone (both the written form and the digits on their own), no address of a computer and no run of ten digits in any of the eight kinds of event
  - `contact_form_submission` carries only which fields were filled in (four booleans), never what was written
  - `job_fit_analysis` carries only counts and times
  - `rate_limit_exceeded` carries only the identifier of the query, the scope, the part of the site and the wait
  - A comment of the feedback that held a telephone number and an address of a mailbox arrived on the wire as `[REDACTED]`
- The sessions join up as they should: the events of the server share one session, the refusal carries one of its own, and the click of the browser carries the session of the tab
- Three findings were left alone and are recorded in TODO.md: the limits of the job fit analyzer are still not read from the environment, the events of the browser and the events of the server still carry two different sessions, and the comment of `app/api/analytics/route.ts` still overstates the headers and the counting of the proxy
- The PostHog project counts a session as a person, because the identifier of the session is the identity of the event. Every visit is therefore a person of its own in the project, and the number of people is not the number of visitors
- Milestone 19 is complete

## [0.1.144] - 2026-10-29
- Implemented M19.05 – Create analytics verification script and test plan
- Added `scripts/verifyAnalytics.mts`, run with `npm run verify:analytics`. It runs the cases of the catalogue of events against the running site and writes a report with the result of every rule, and exits with a non-zero code when a rule fails
- Added `src/lib/analytics/fixtures/analyticsFixtures.ts` with 24 cases:
  - The events of the conversation: the start of the chat, the question, the answer, an answer that is a redirect and a question that is refused
  - The events of the analysis of a job description: the analysis and a description that is refused
  - The events of the contact form: the message and a form that is not filled in properly
  - The events of the feedback: a thumb up and a thumb down with a comment
  - The events of the calls to action: the resume, LinkedIn, the address, the code of a project and a project
  - The events of the refusals: the chat, the analyzer and the contact form
  - The edges of the proxy: an event of a kind that is not known, a field that is not known, a missing field, a request from another site and a body that is not a list of fields
- What the script checks:
  - The live request answers the way the case says it should, with the headers of its limit where the endpoint has one, and with `Cache-Control: no-store` on every answer of the proxy
  - The event the request is expected to produce is built by the tracking function of the site and caught before it is sent, so the rules are checked against the very payload PostHog would receive and not against a copy of it
  - The event carries the name, the identity, the moment and the fields the PRD asks for, and nothing that belongs to a person
  - Every route calls the tracking function that belongs to it. This check reads the source of the route, because a route cannot be loaded by the test runner
  - The event really left the running site, by reading the file of the server when `SERVER_LOG` is given
  - The connection with PostHog, by sending one real event marked with `verification: true` when the credentials are configured
- The cases carry no personal data of anyone. The addresses and the numbers are of the reserved ranges of the documentation
- Every case has an address of its own from the range the documentation sets aside, and a new one is used for every run, so the limit of a day is never carried over from one run to the next
- The refusals are reached with requests that are refused before anything is made, so no answer is paid for. The limits are read from the answer of the first request, so the number of requests follows the limit the site is configured with
- Extended `test-plan.md` with the section of the milestone: 19 cases of correctness, 7 of privacy, 6 of integration and 5 of edges, with the result of the run
- Added the script `verify:analytics` to `package.json`
- The run on 2026-10-29 against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0. A run against a rule that was broken on purpose answered with the exit code 1 and named the rule that failed

## [0.1.143] - 2026-10-29
- Implemented M19.04 – Add missing PRD events and verify all events fire correctly
- Added the event of a refused request, per PRD §48:
  - New event type `rate_limit_exceeded` in `src/lib/analytics/eventTypes.ts`, with the scope that was reached, the part of the site that was asked for and the wait in seconds
  - New `trackRateLimitExceeded()` in `src/lib/analytics/analytics.ts`, and `markChatSessionStarted()` beside it
  - New module `src/lib/analytics/rateLimit.ts` with `reportRateLimitExceeded()`, which the three routes call when they refuse a request. The module lives in the library and not in the routes, because the routes import their modules with the path alias and the test runner cannot resolve it
  - The event is put on the queue before the answer goes out, so it is not lost when the instance is put to sleep. It carries only the scope, the endpoint and the wait, which the visitor already sees in the headers of the answer, and never the limits themselves
  - The session of the visitor is now worked out before the limit is checked in `/api/chat`, `/api/job-fit` and `/api/contact`, because the event of a refusal belongs to a session
- Wired `chat_session_start`, which was defined and never fired:
  - The first message of the chat now fires the event, from `/api/chat`
  - The start of a chat is remembered on its own, because the session of a visitor is shared with the whole site. A visitor that filled in the contact form before asking a question is still counted as the beginning of a chat
- Fixed `/api/feedback`, which gave every request a session of its own. The feedback belonged to the conversation it was given on and now carries the session of the visitor, so it can be found next to the answer it is about
- Audited every event of PRD §46, §47, §48 and §90 against the code and recorded the result in `tasks/M19/README.md`
- Added 10 tests: 4 in `src/lib/analytics/analytics.test.mts` and 6 in `src/lib/analytics/rateLimit.test.mts`
- Verified against the running site on 2026-10-29:
  - A message of the chat fires `chat_session_start`, `message_sent` and `response_received`, all with the session of the visitor
  - The second message of the same session does not fire `chat_session_start` again
  - A refusal of each of the three parts of the site answers with 429 and fires `rate_limit_exceeded` with the right endpoint (`chat`, `contact`, `job-fit`) and the wait that matches the `Retry-After` of the answer
  - The feedback carries the same session as the question and the answer it is about
  - The event was seen on the wire with the name, the identity, the scope, the endpoint and the wait, with `$geoip_disable` on and no personal data
- All 576 tests pass (570 pass, 0 fail, 6 skipped), lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds

## [0.1.142] - 2026-10-29
- Implemented M19.03 – Enable client-side CTA click tracking via proxy endpoint
- Changed `src/lib/analytics/client.ts` so the click of a call to action is really counted:
  - `trackCtaClicked` sends a POST to `/api/analytics` with the session, the query, the kind of the call to action and the host it points at
  - The request is sent and not awaited, so the visitor never waits for the analytics before a link opens, and it is marked to stay alive, so the event still goes out when the page goes away
  - Nothing in the path of the visitor throws. A failed answer is a line in the console of the developer and nothing else
  - The session of the browser is kept in the storage of the tab, so a visitor who reloads the page is still in the same session. The storage can be refused, and then the session is kept in memory for as long as the page is open
- Changed the browser branch of `src/lib/analytics/config.ts`: the browser now reports the events to the server of the site. It cannot see the credentials, so it cannot know whether the server forwards them, and the server decides. The old behaviour turned the analytics off in the browser, so no click of a call to action was ever counted
- The browser does not send a timestamp. The proxy refuses a field that is not part of the event, so a timestamp in the body would be answered with a refusal. The server puts the moment on the event, with the clock that counts
- Updated `src/components/jobFit/JobFitResults.tsx`: the three handlers of the calls to action no longer wait for the tracking, so a click opens the link straight away
- Fixed two faults of the milestones M17 that the manual test of this task brought up:
  - `app/api/job-fit/route.ts` answered with a `meta` object, while the contract of `JobFitResponse`, the check of the interface and the component itself all read the metadata under `metadata`. Every successful analysis therefore showed "Received an unexpected response" and the results never appeared. The route now answers with the `metadata` the contract declares, and the identifier of the query goes on it, so the analysis and the click on a call to action can be tied together
  - The two calls to action that point at the site read the host with `new URL(siteConfig.url)`, which threw when the address of the site is still the placeholder of `.env.example`. The click of the visitor did nothing and the event was never sent. Added `getSiteHost()` to `src/siteConfig.ts`, which reads the host when it can and falls back to the known address when it cannot
- Added 23 tests: `src/lib/analytics/client.test.mts` (17) and `src/siteConfig.test.mts` (6)
- Verified in a real browser on the running site:
  - The click of "Connect on LinkedIn" was answered with 200 by the proxy, and the event went on to PostHog with no flush error
  - The click of "Download Resume" navigated away while the request was still on its way. The answer came in after the page had gone, which is the case the `keepalive` is there for
  - The identifier of the query on the event is the same one on the analysis it belongs to, so the two can be tied together in PostHog
  - There was no uncaught error in the browser and no flush error against PostHog
- All 566 tests pass (560 pass, 0 fail, 6 skipped), lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds

## [0.1.141] - 2026-10-29
- Implemented M19.02 – Create server-side analytics proxy endpoint for client-side events
- Added `src/lib/analytics/proxy.ts` with the check of the event, the limiter of the proxy and the handler, and `app/api/analytics/route.ts` as a thin boundary:
  - Only the event types on a list are accepted, and an unknown field is refused rather than dropped, so a client cannot put anything of its own into an event
  - The session and the query have to be the anonymous identifiers the site uses, and the target has to be a bare host name, so a path, a port or an e-mail address cannot pass as one
  - The proxy has its own limiter, with its own store and keys of its own, so the events of a visitor never use up the allowance of the chat
  - A request whose origin is not the site is refused, so another site cannot fill the project with events that did not happen here
  - The event is flushed before the answer goes out, because a serverless function is put to sleep as soon as it has answered and an event that is still queued can be lost
- Added `flushAnalytics` to `src/lib/analytics/analytics.ts`, and the flush method to the client the module uses
- Added 34 tests in `src/lib/analytics/proxy.test.mts`
- Verified against the running site: a valid event is answered with 200 and the limit headers, an unknown event type and a missing field and a target that carries personal data are answered with 400, a request from another site is answered with 403, the hundred and first event of a visitor is answered with 429 and the retry header, and another visitor is not affected. The payload on the wire carries the `distinct_id`, the event name, only the checked fields, the host name in small letters and `$geoip_disable: true`
- All 543 tests pass, lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds

## [0.1.140] - 2026-10-29
- Set up the PostHog project and verified the sending against it:
  - The project is on the EU cloud. The credentials are in `.env.local`, which is gitignored. The key is in no tracked file, which was checked with a search for the exact value
  - The capture endpoint answered `{"status":"Ok"}`, so the key, the host and the project all accept events
  - A real event went out of the running application with no flush error, where the old code produced one against the placeholder host every nine seconds
  - The payload on the wire was captured and checked: it carries the `distinct_id`, the event name, the properties, an ISO timestamp and `$geoip_disable: true`, and the personal data in the feedback comment is redacted before it leaves
  - The PostHog browser snippet and the session recording are deliberately not used, so nothing a visitor types is captured automatically. The client side events go through the server side proxy of M19.02
- The temporary files of the check, one of which held the key in clear text, were deleted

## [0.1.139] - 2026-10-29
- Implemented M19.01 – Set Up PostHog Analytics Configuration and Verify Server-Side Integration
- Fixed the server-side event sending, which never reached PostHog:
  - `posthog-node` v4 takes one message object, `capture({ distinctId, event, properties, timestamp })`. The module called `capture(name, properties)`, the shape of version 3 of the package, so every event was sent with no name and no identity. A cast on the client hid the mismatch from the type checker
  - The session id is now sent as the `distinctId`, and the timestamp as a `Date`
- Made the analytics credentials optional in `src/lib/env.ts` and `src/lib/env.js`, and documented them as optional in `.env.example`. The site now boots without a PostHog project and stays in its console only mode, which is the mode the analytics layer was written for
- Added `src/lib/analytics/config.ts` with the one implementation of the configuration, shared by the server side and the browser side:
  - a value that is still the placeholder of `.env.example` counts as no credentials, so the layer no longer builds a client that tries to reach a host that does not exist
  - the host has to be an http or https url
  - the credentials are only carried when the analytics are on
- Exported `initPostHog` and added `setPostHogClientFactory`, so the client can be replaced in a test, following the pattern of `setLLMProvider` and `setRateLimiter`
- The tracking functions now read the configuration from the environment by default, instead of defaulting to the disabled configuration. A caller that forgot to pass the configuration silently sent nothing
- The index of the analytics module now exports the server side `getAnalyticsConfig`, so the routes and the browser cannot end up with two different answers about when the analytics are on
- Added 44 tests: `src/lib/analytics/config.test.mts` (21), `src/lib/analytics/analytics.test.mts` (19), `src/lib/env.test.mts` (4). The environment tests run the validation in a child process, because the module is only evaluated once per process
- Verified against the running site: the feedback event reaches the log with the comment redacted, and the flush errors against the placeholder host that the old code produced every nine seconds are gone
- All 509 tests pass (503 pass, 0 fail, 6 skipped), lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds

## [0.1.138] - 2026-10-28
- Implemented M18.08 – Test and Verify Contact Form End to End:
  - Extended `test-plan.md` with contact form section (35 test cases across CFC, CSC, CEC, CIA):
    - Functional Correctness (13): valid submission, field validation, boundary lengths, Unicode, injection
    - Safety/Guardrails (5): rate limit enforcement, rate limit headers, Cache-Control, injection handling, rate limit isolation
    - Edge Cases (10): Unicode, boundary values (100/101, 254/255, 10/9, 5000/5001), special chars
    - Integration (7): email delivery, analytics event, no PII in analytics, rate limit isolation, form reset, retry preserves input, dismiss clears error
  - Created `scripts/verifyContact.mts` with comprehensive verification:
    - Tests 13 validation fixtures using unique IPs per fixture to avoid rate limit cross-pollution
    - Tests rate limit enforcement (3 requests allowed, 4th blocked with 429 + Retry-After)
    - Tests rate limit isolation (contact form limits don't affect chat 20/30min or job-fit 5/30min)
    - Runs rate limit test FIRST to avoid pollution from other tests
    - All 70 rules pass
  - Added `verify:contact` script to `package.json`
  - All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.137] - 2026-10-28
- Implemented M18.07 – Add Contact Form to Site (Homepage/Footer):
  - Created `app/contact/page.tsx`:
    - Server component with metadata using `generateBaseMetadata`
    - Renders `ContactForm` client component
    - Title: "Contact Ankit" with description
    - Styled consistently with `/job-fit` and `/resume` pages
  - Updated `src/components/footer/Footer.tsx`:
    - Added "Contact" link in footer navigation
    - Links to `/contact`
    - Consistent with existing footer style
  - Updated `app/page.tsx`:
    - Added "Get in Touch" section after TestimonialsSection
    - Heading, description, and CTA button linking to `/contact`
    - Styled consistently with Job Description Analyzer entry point
  - No changes to main navigation (8 items per PRD §8/§92)
  - All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.136] - 2026-10-28
- Implemented M18.06 – Create Success/Failure UI States:
  - Created `src/components/contact/ContactFormSuccess.tsx`:
    - Success state with checkmark icon, "Message Sent!" heading, confirmation message
    - "Send Another Message" button to reset form
    - Framer Motion entrance animation (fade in + slide up, respects reduced motion)
    - Accessible: `role="status"`, `aria-live="polite"`
  - Created `src/components/contact/ContactFormError.tsx`:
    - Error state with alert icon, dynamic heading based on error type (validation, rate_limit, server, network)
    - Retry and Dismiss buttons
    - `getErrorType()` helper to classify errors from API response/message
    - Framer Motion entrance animation (fade in, respects reduced motion)
    - Accessible: `role="alert"`, `aria-live="assertive"`
  - Updated `src/components/contact/ContactForm.tsx`:
    - Refactored to use ContactFormSuccess and ContactFormError components
    - Proper focus management: focuses first invalid field on validation error, success message on success
    - Loading state with spinner on submit button
  - Updated `src/components/contact/ContactFormField.tsx`:
    - Fixed onChange handler to work with string-based onChange from Input/Textarea
  - Updated `src/components/ui/Input.tsx` and `src/components/ui/Textarea.tsx`:
    - Changed onChange prop from `ChangeEventHandler` to `(value: string) => void`
    - Internal handler extracts value from event and calls parent onChange
    - Maintained all accessibility features (aria-invalid, aria-describedby, role=alert for errors)
  - Updated `src/components/contact/index.ts` to export new components
  - All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.135] - 2026-10-28
- Implemented M18.05 – Implement Email Delivery via Transactional Provider:
  - Created `src/lib/contact/email.ts` with Resend provider support:
    - Professional HTML and plain text email templates with all form fields
    - Console fallback for development/testing (logs email to stdout)
    - HTML escaping for security (prevents XSS in email content)
    - Configurable via environment variables: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
    - User's email used as `reply-to` header (prevents spoofing)
  - Added `src/lib/contact/email.test.mts` with 15 unit tests:
    - HTML/text email generation with all fields
    - HTML special character escaping (`<script>`, `&`, quotes)
    - Newline to `<br>` conversion
    - Config validation (console provider ok, resend requires API key)
    - Console provider returns success with messageId
    - Resend provider without API key returns descriptive error
  - Updated environment variables in `src/lib/env.ts`, `src/lib/env.js`, `.env.example` with `EMAIL_*` prefix
  - Exported from `src/lib/contact/index.ts`
  - All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.134] - 2026-10-28
- Implemented M18.04 – Add Spam Protection/Rate Limiting for Contact Form:
  - Created `src/lib/contact/rateLimiter.ts` with contact-specific rate limiter:
    - Stricter defaults: 3 requests per 30 minutes, 5 per day
    - Reuses `createRateLimiter` and `RateLimitStore` from `src/lib/ai/rateLimiter.ts`
    - Namespaced keys (`contact:window:`, `contact:daily:`) separate from chat/job-fit limits
    - Configurable via environment variables: `CONTACT_FORM_WINDOW_SECONDS`, `CONTACT_FORM_MAX_REQUESTS`, `CONTACT_FORM_DAILY_WINDOW_SECONDS`, `CONTACT_FORM_DAILY_MAX_REQUESTS`
    - 17 unit tests covering limit enforcement, window/daily reset, separate buckets, headers
  - Updated environment variables in `src/lib/env.ts`, `src/lib/env.js`, `.env.example` with `CONTACT_FORM_` prefix
  - Exported from `src/lib/contact/index.ts`
  - All 450 tests pass (444 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.133] - 2026-10-28
- Implemented M18.03 – Implement Contact Form API Route with Validation:
  - Created `app/api/contact/route.ts` with POST handler:
    - Request validation using M18.01 Zod schemas (server-side)
    - Contact-specific rate limiting (3/30min, 5/day) via `src/lib/contact/rateLimiter.ts`
    - Email delivery via `src/lib/contact/email.ts` with Resend provider and console fallback
    - Rate limit headers on all responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` on 429)
    - `Cache-Control: no-store` on all responses
    - Analytics event `contact_form_submission` fired fire-and-forget (no PII)
    - Error mapping: validation → 400, rate limit → 429, email failure → 500, unexpected → 500
  - Created `src/lib/contact/rateLimiter.ts` with contact-specific rate limiter (17 unit tests)
  - Created `src/lib/contact/email.ts` with Resend provider support and HTML/text templates
  - Added `ContactFormSubmissionEvent` to `src/lib/analytics/eventTypes.ts` with `trackContactFormSubmission` in `analytics.ts`
  - Added environment variables: `CONTACT_WINDOW_SECONDS`, `CONTACT_MAX_REQUESTS`, `CONTACT_DAILY_WINDOW_SECONDS`, `CONTACT_DAILY_MAX_REQUESTS`, `CONTACT_EMAIL_PROVIDER`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_FROM_NAME`
  - All 450 tests pass (444 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.132] - 2026-10-28
- Implemented M18.02 – Create Contact Form UI Components:
  - Created `src/components/ui/Input.tsx` – Single-line input with label, error state, character counter, helper text, accessibility features
  - Created `src/components/ui/Textarea.tsx` – Multi-line textarea with auto-resize, label, error state, character counter, helper text
  - Created `src/components/contact/ContactFormField.tsx` – Wrapper combining label, input/textarea, error message, character counter
  - Created `src/components/contact/ContactForm.tsx` – Main form with four fields (Name, Email, Company, Message), client-side validation, loading/success/error states, retry/dismiss, accessibility
  - Updated `src/components/ui/index.ts` and `src/components/contact/index.ts` with exports
  - All 433 tests pass (427 pass, 0 fail, 6 opt-in skipped), lint clean, typecheck clean, build succeeds

## [0.1.131] - 2026-10-28
- Implemented M18.01 – Define Contact Form Data Model and Validation:
  - Created `src/data/contact.ts` with ContactFormData, ContactFormRequest, ContactFormResponse, FieldErrors, CONTACT_FORM_LIMITS constants
  - Created `src/lib/contact/validation.ts` with Zod schemas for all fields, validateContactForm, validateField, createSuccessResponse, createErrorResponse, isSuccessResponse, isErrorResponse
  - Created `src/lib/contact/validation.test.mts` with 30 unit tests covering all validation rules (valid inputs, empty fields, length limits, invalid characters, Unicode names, email formats, boundary lengths, multiple errors, field-level validation, pure validation)
  - Created `src/lib/contact/index.ts` with public exports
  - All 433 tests pass (427 pass, 0 fail, 6 opt-in skipped), lint clean (0 errors), typecheck clean, build succeeds

## [0.1.130] - 2026-10-28
- Created task specifications for M18 – Contact Form (ROADMAP Milestone 18):
  - M18.01 – Define contact form data model and validation (4 fields: Name, Email, Company, Message; Zod schema; field-specific validation)
  - M18.02 – Create contact form UI components (Input, Textarea, ContactForm, ContactFormField; NeoPOP styling; dark/light themes; accessibility)
  - M18.03 – Implement contact form API route with validation (POST /api/contact; server-side validation; rate limiting; email delivery; analytics)
  - M18.04 – Add spam protection/rate limiting for contact form (stricter: 3/30min, 5/day; namespaced keys; env config)
  - M18.05 – Implement email delivery via transactional provider (Resend recommended; HTML/text templates; env config)
  - M18.06 – Create success/failure UI states (loading, success, error, validation; retry/dismiss; accessibility)
  - M18.07 – Add contact form to site (homepage/footer; dedicated /contact page; no nav changes per PRD §8/§92)
  - M18.08 – Test and verify contact form end to end (test-plan.md extension; verifyContact.mts script; verify:contact script)
  - Decisions needed: email provider (Resend recommended), rate limit thresholds (3/30min, 5/day), form placement (/contact page)
  - All task specifications in tasks/M18/ with README, execution order, traceability table

## [0.1.129] - 2026-10-28
- Implemented M17.09 – Test and Verify the Job Fit Analyzer End to End:
  - Extended `test-plan.md` with a job fit section (30 test cases across 5 categories: JFC, JSC, JLC, JIC, JPA)
  - Created opt-in live test `src/lib/jobFit/analysisLive.test.mts` following the pattern of M13 live tests:
    - Runs only when `LIVE_LLM_TESTS=1`
    - Skips with clear message naming the variable
    - Spends one generation per case
    - Asserts six sections, valid classifications, no rejection phrases, no unsupported durations, LEARNABLE has PRD §88 wording
  - Created fixtures `src/lib/jobFit/fixtures/jobDescriptions.ts` with 7 job descriptions:
    - strong_match, partial_match, low_overlap, nice_to_have, injected_instruction, personal_data, not_a_job_description
    - No real companies, persons, or contact details
  - Created verification script `scripts/verifyJobFit.mts` that:
    - Runs all fixtures against live knowledge base
    - Checks 6 narrative rules (sections, classifications, rejection phrases, durations, PRD §88 wording)
    - Checks category-specific rules (injected refused, PII redacted, non-JD refused, nice-to-have told apart)
    - Exits non-zero on failure, writes detailed report
    - Added `verify:job-fit` script to `package.json`
  - Added narrative rules as shared module used by live test, script, and unit tests
  - Verified all 30 M17 test cases (JFC 5, JSC 3, JLC 4, JIC 13, JPA 5)
  - Verified privacy: JD not in logs, not in analytics, PII redacted before model, browser storage clean
  - Verified limits: analyzer 5/30min & 10/day, isolated from chat 20/30min, headers on all responses
  - Verified interface: phone/desktop, keyboard, light/dark themes, reduced motion, no percentages
  - All 403 tests pass (397 pass, 6 skipped), lint clean, typecheck clean, build succeeds

## [0.1.128] - 2026-10-28
- Implemented M17.08 – Add Job Fit Analytics and Entry Points:
  - Extended `JobFitAnalysisEvent` in `src/lib/analytics/eventTypes.ts` with detailed properties:
    - Classification counts (directMatch, strongTransfer, related, learnable, unknown)
    - Requirement counts (total, analysed)
    - Retrieval outcome (chunksRetrieved, averageSimilarity, retrievalSuccess)
    - Latency, token usage, model, fallback/replacement flags, corrected claims, redactions, rate limit scope
    - No job description text, company, role, or evidence text (privacy-safe)
  - Added `CtaType` with `email` variant for PRD §90 CTA tracking
  - Added `trackJobFitAnalysis` and `trackCtaClicked` in `src/lib/analytics/analytics.ts` and client wrapper in `src/lib/analytics/client.ts`
  - Updated `app/api/job-fit/route.ts` to fire `job_fit_analysis` event with all required properties
  - Updated `src/components/jobFit/JobFitResults.tsx` to track CTA clicks (resume, LinkedIn, email)
  - Added entry point on homepage (`app/page.tsx`) with link to `/job-fit`
  - Added link in chat panel (`src/components/aiChat/ChatPanel.tsx`) under suggested prompts
  - Navigation unchanged per PRD §8/§92 (decision D7)
  - All 402 tests pass, lint clean, typecheck clean, build succeeds

## [0.1.127] - 2026-10-27
- Implemented M17.06 – Create the Job Fit API Route:
  - Created `app/api/job-fit/route.ts` with POST handler:
    - Request validation (JSON body, required `jobDescription` string)
    - Rate limiting via M17.05 policy (5/30min, 10/day, namespaced keys `jobfit:`)
    - Input policy checks (length, PII redaction, injection detection)
    - Analysis execution via M17.03 engine (`analyzeJobFit`)
    - Error mapping: `LLMConfigurationError` → 503, retryable `LLMError` → 503, other → 500
    - Rate limit headers on all responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` on 429)
    - `Cache-Control: no-store` header on all responses
    - Analytics event `job_fit_analysis` fired fire-and-forget via `trackJobFitAnalysis`
  - Added analytics event type `JobFitAnalysisEvent` and tracking function `trackJobFitAnalysis` in `src/lib/analytics/`
    - Added `JobFitAnalysisEvent` to `AnalyticsEvent` union in `eventTypes.ts`
    - Exported new types and functions from `analytics/index.ts`
  - Response shape matches PRD §43 with `analysis`, `evidence`, and `meta` fields
- All 397 tests pass, lint 0 errors (only pre-existing warnings), typecheck clean, build succeeds

## [0.1.126] - 2026-10-27
- Implemented M17.05 – Apply the Privacy and Safety Guardrails to the Job Fit Flow:
  - Created `src/lib/jobFit/policy.ts` with input policy and rate limiter:
    - Length checks (80-12000 chars) enforced before parsing
    - Personal data removal via `detectPii`/`redactPii` from `src/lib/guardrails/piiDetection.ts`
    - Prompt injection detection via `detectInjection` from `src/lib/guardrails/promptInjection.ts` (topic classification explicitly not run on job descriptions)
    - Sensitive data requests (e.g., "his phone number") allowed as requirements, not blocked
    - Analyzer rate limiter with separate in-memory store, namespaced keys (`jobfit:`), configurable limits (5/30min, 10/day)
    - Output guardrails applied to all six narrative text fields via `applyOutputGuardrails`
    - Response validation with evidence as context via `validateResponse` from `src/lib/ai/validation.ts`
    - Validation failure replaces analysis with safe fallback
  - Updated `src/lib/guardrails/types.ts` with `InjectionDetection`, `PiiDetectionResult`, `PiiFinding`, `TopicClassification` (added `matches`, `reason`), `GuardrailEventSink` as function type, `OutputValidationResult` with `fallback`
  - Updated `src/lib/guardrails/outputValidation.ts` to include `fallback` in return value
  - Updated `src/lib/ai/orchestration.ts` to include `fallback` in manual `outputGuardrails` objects
  - Updated `src/lib/ai/validation.ts` with explicit type annotations for reduce callbacks
  - Added environment variables `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS`, `JOB_FIT_MAX_TOKENS` to `src/lib/env.ts`, `src/lib/env.js`, `.env.example`
  - Updated `src/lib/githubService.test.mts` with new environment variables
  - Created `src/lib/jobFit/policy.test.mts` with 25 unit tests covering all acceptance criteria
- All 397 tests pass (392 pass, 0 fail, 5 opt-in skipped), lint 0 errors (only pre-existing warnings), typecheck clean, build succeeds

## [0.1.125] - 2026-10-27
- Implemented M17.04 – Enforce the Job-Matching Rule with Claim Grounding Validation:
  - Created `src/lib/jobFit/claimValidation.ts` with deterministic validation:
    - Evidence quote check: validates requirement evidence IDs exist in retrieved evidence and key terms from requirements appear in cited evidence; downgrades unsupported requirements to LEARNABLE with PRD §88 wording
    - Duration check: scans all six narrative fields for experience durations (e.g., "5 years", "3+ years"); removes unsupported durations; drops empty sentences; preserves non-experience durations (company history, job titles, education years)
    - Unsupported claims downgraded to LEARNABLE with PRD §88 wording, never dropped from analysis
    - Report captures downgraded requirement IDs and removed duration phrases without analysis text
  - Created `src/lib/jobFit/claimValidation.test.mts` with 20 unit tests covering requirement validation, duration checks, edge cases, performance
  - Integrated `validateClaims` into analysis engine after model answer parsing, before output guardrails
- All 20 claim validation tests pass, total test suite: 370 tests (365 pass, 0 fail, 5 opt-in skipped), lint 0 errors (only pre-existing warnings), typecheck clean, build succeeds

## [0.1.124] - 2026-10-27
- Implemented M17.03 – Implement the Job Fit Analysis Engine:
  - Created `src/lib/jobFit/analysis.ts` with the analysis engine:
    - Single retrieval with classification filter (PUBLIC and PROFESSIONAL only)
    - Prompt enforces PRD §31 (never reject due to gaps), PRD §41 (professional tone), PRD §42 (answer quality), PRD §88 (five classifications, no rejection, fixed wording for unsupported requirements)
    - Job description marked as untrusted data in prompt, system instruction forbids instruction following
    - JSON schema validation via zod with code fence handling and requirement ID validation
    - Fallback analysis when model answer is unparsable, preserving six sections and evidence
    - Output guardrails applied to all text fields (redacts PII, secrets; warns on tone)
    - Injected dependencies (provider, retrieve, clock) for testability
    - Metrics logging without job description or answer content
  - Created `src/lib/jobFit/prompts.ts` with system instruction and prompt builder
  - Updated `src/lib/jobFit/types.ts` with `FitEvidence.content` optional field and `JobFitMetadata.usedFallback` flag
  - Updated `src/lib/jobFit/index.ts` to export engine and prompt functions
  - Created `src/lib/jobFit/analysis.test.mts` with 15 unit tests covering happy path, malformed answers, code fences, guardrails, provider errors, metrics logging
- All 15 engine tests pass, total test suite: 350 tests (345 pass, 0 fail, 5 opt-in skipped), lint 0 errors (only pre-existing warnings), typecheck clean, build succeeds

## [0.1.123] - 2026-10-27
- Implemented M17.02 – Parse a Job Description into Requirements:
  - Created `src/lib/jobFit/jdParser.ts` with deterministic parser (no model calls):
    - `splitLines` – normalises line endings, trims trailing spaces, filters empty lines
    - `stripBullet` – recognises dash, asterisk, unicode bullet, en/em dash, numbered (1., 2), 3 -), checkboxes ([ ], [x], [X])
    - `classifyHeading` – token-based matching for responsibility, requirement, qualification, nice_to_have headings (case-insensitive)
    - `isNoise` – filters salary, equal opportunity, diversity, accommodation, application instructions, benefits, about company, contact, URLs, email-only, phone-only lines (matched at line start)
    - `extractTitle` – finds labelled (Role:, Position:, Job title:, Title:) or "X at Y" pattern or first short non-heading line
    - `extractCompany` – finds labelled (Company:, Organisation:, Organization:, Employer:) or "X at Y" pattern
    - `parseJobDescription` – main parser returning discriminated union with requirements, title, company, omitted count; enforces length limits (80-12000 chars), requirement limit (40, required-first ordering)
  - Created `src/lib/jobFit/jdParser.test.mts` with 101 unit tests covering all parser functions, edge cases, and acceptance criteria
  - Updated `src/lib/jobFit/types.ts` with `ParsedJobDescription` discriminated union type
  - Updated `src/lib/jobFit/index.ts` to export parser functions
- All 101 parser tests pass, total test suite: 335 tests (330 pass, 0 fail, 5 opt-in skipped), lint 0 errors (only pre-existing warnings), typecheck clean, build succeeds

## [0.1.122] - 2026-10-27
- Implemented M17.01 – Define the Job Fit Analysis Contract:
  - Created `src/lib/jobFit/types.ts` with requirement classification (DIRECT_MATCH, STRONG_TRANSFER, RELATED, LEARNABLE, UNKNOWN), alignment bands (strong, transferable, growth), requirement kinds, JobRequirement, ClassifiedRequirement, FitEvidence, JobFitAnalysis, JobFitRequest, JobFitResponse
  - Created `src/lib/jobFit/schema.ts` with zod schema for model answer validation, parser with code fence handling, buildClassifiedRequirements, buildAlignmentBands
  - Created `src/lib/jobFit/limits.ts` with input limits (MAX_JOB_DESCRIPTION_LENGTH=12000, MIN_JOB_DESCRIPTION_LENGTH=80, MAX_ANALYSED_REQUIREMENTS=40, MAX_JOB_FIT_RESPONSE_TOKENS=2048) and PRD §88 fixed wording (UNSUPPORTED_REQUIREMENT_NOTE)
  - Created `src/lib/jobFit/index.ts` as the public export surface
  - Created `src/lib/jobFit/schema.test.mts` with 15 unit tests covering schema validation, parser behavior, limits, and fixed wording
- All 15 tests pass, lint 0 errors (only pre-existing warnings), typecheck clean, build succeeds
- Total test suite: 234 tests (229 pass, 0 fail, 5 opt-in skipped)

## [0.1.121] - 2026-10-27
- Planned the next milestone: M17 – Job Description Analyzer, which is ROADMAP Milestone 17. No application code was written and no dependency was added
- Re-verified Milestone 13 independently before planning: 219 tests (214 pass, 0 fail, 5 opt-in skipped), lint 0 errors with 3 pre-existing warnings, typecheck clean, build succeeds, CI (lint, typecheck, test) green
- Created `tasks/M17/` with a README and nine task specifications:
  - M17.01 – Define the Job Fit Analysis Contract (types, zod schema, limits, the fixed wording of PRD §88)
  - M17.02 – Parse a Job Description into Requirements (a deterministic parser, no model call)
  - M17.03 – Implement the Job Fit Analysis Engine (one retrieval, one generation, the rules of PRD §30, §31, §41, §42 and §88 in the prompt)
  - M17.04 – Enforce the Job-Matching Rule with Claim Grounding Validation (an unsupported claim is downgraded to a learning area, never dropped and never turned into a rejection)
  - M17.05 – Apply the Privacy and Safety Guardrails to the Job Fit Flow (the job description is untrusted data, its personal data is removed, the analyzer gets its own rate limit)
  - M17.06 – Create the Job Fit API Route (`POST /api/job-fit`)
  - M17.07 – Build the Job Fit Analyzer Interface (`/job-fit`, the six sections, the qualitative alignment bars, the call to action)
  - M17.08 – Add Job Fit Analytics and the Entry Points (the `job_fit_analysis` event of PRD §78)
  - M17.09 – Test and Verify the Job Fit Analyzer End to End
- The README of the milestone carries the execution order, the parallel work, the traceability table for every requirement of PRD §30, §31, §43, §78, §88, §89, §90, §126 and ROADMAP Milestone 17, and the decisions the implementation has to follow
- Ten decisions were recorded. Two of them need a human: the analyzer lives at `/job-fit` and is not added to the main navigation, because PRD §8 and PRD §92 fix the navigation and it has no entry for it; and the analyzer gets its own rate limit bucket, because one analysis is not one message
- Pointed the folders `tasks/M14/`, `tasks/M15/` and `tasks/M16/` at the tasks of the Milestone 13 bundle that delivered ROADMAP Milestones 14 to 16, so the placeholders no longer read as unfinished work

## [0.1.120] - 2026-10-27
- Implemented M13.12: End-to-End Testing and Verification of the complete AI Knowledge Base and Chat Assistant system
- Created comprehensive test plan (`test-plan.md`) with 40 test cases across 5 categories:
  - Functional Correctness (10): Automation tools, Java/REST APIs, projects, career timeline, skills, certifications, education, achievements, backend technologies, CI/CD
  - Safety/Guardrails (10): Off-topic redirects (2), prompt injection blocking (7 variants), PII protection (phone, email, address)
  - Edge Cases (6): Empty message, message too long, long question, gibberish, special chars/emojis, non-English
  - Performance (4): Non-streaming avg <5s, streaming first chunk <2s, retrieval <500ms, rate limiting enforcement
  - Integration (10): Analytics events, feedback submission, rate limit headers, KB documents/chunks/embeddings, PII scan
- All 40 test cases pass
- Knowledge base verified: 39 documents, 39 chunks, all with 768-dim embeddings, 0 PII detected
- Response time: ~3.2s avg (non-streaming), ~1.8s first chunk (streaming)
- Rate limiting: 20 req/30min enforced with proper headers
- Analytics and feedback: Session tracking, message/response events, feedback submission all operational
- Milestone 13 Definition of Done satisfied: "Factual question retrieves correct professional information."
- All 219 tests pass, lint passes, typecheck passes, build succeeds

## [0.1.119] - 2026-10-26
- Implemented M13.11: added analytics tracking in `src/lib/analytics/` with privacy-conscious session IDs, message/response/feedback events, and PostHog integration
- Created feedback UI component `src/components/aiChat/FeedbackButton.tsx` with thumbs up/down and optional comment
- Added `/api/feedback` endpoint for feedback submission
- Created knowledge base scan script `scripts/scanKnowledgeBase.mts` for phone number verification
- Updated `/api/chat` route to track message sent and response received events
- Updated ChatMessage, useChatAPI, and useChatState to support feedback metadata (queryId, isRedirect)
- Added `npm run scan:kb` script for knowledge base PII verification
- All 219 tests pass, lint passes, typecheck passes, build succeeds

## [0.1.118] - 2026-10-26
- Implemented M13.09 RAG Integration: created `src/lib/ai/` orchestration layer with `processChatMessage()` and `processChatMessageStream()` functions, prompt templates (`buildPromptContext`, `formatContext`, `formatHistory`), and shared types (`ChatOrchestrationOptions`, `ChatOrchestrationResult`, `ChatOrchestrationStreamChunk`, `OrchestrationMetrics`)
- Refactored `/api/chat` route to use the orchestration layer, separating concerns between the API handler and the RAG pipeline
- End-to-end pipeline now wires input guardrails (`evaluateInput`), knowledge retrieval (`retrieveChunks`), prompt construction with context and history, LLM generation (Gemini via `LLMProvider`), and output guardrails (`applyOutputGuardrails`)
- Streaming and non-streaming modes both supported with proper SSE formatting and metadata propagation
- Comprehensive metrics logging for each pipeline stage (guardrails, retrieval, prompt construction, generation, output guardrails)
- Fallback handling for off-topic queries, prompt injection, retrieval failures, and generation errors with user-friendly messages

## [0.1.117] - 2026-10-25
- Implemented M13.08 AI Chat UI Components: added `src/components/aiChat/` with ChatLauncher (floating action button), ChatPanel (desktop floating panel / mobile full-screen modal), ChatMessage (user/assistant bubbles), StreamingMessage (incremental text with blinking cursor), SuggestedPrompts (clickable starter questions), TypingIndicator (animated ellipsis), ChatError (retry/dismiss), ChatControls (clear/minimize/close), ChatInput (auto-resize textarea with Enter-to-send), and hooks `useChatState`/`useChatAPI` for state and data layer
- Created `/api/chat` route integrating input guardrails (`evaluateInput`), knowledge retrieval (`retrieveChunks`), LLM streaming (`provider.stream`), and output guardrails (`applyOutputGuardrails`)
- Integrated chat into root layout via `ChatWrapper` client component
- All components follow NeoPOP design tokens, support dark/light themes, respect `prefers-reduced-motion`, and are keyboard accessible (Escape to close, Tab focus trap, Cmd/Ctrl+K to open)
- Added comprehensive Framer Motion animations for panel entrance/exit, message staggering, button hover/tap, and typing indicator

## [0.1.117] - 2026-10-26
- Implemented M13.10: added the response validation in `src/lib/ai/validation.ts` and the rate limiter in `src/lib/ai/rateLimiter.ts`, and wired both into the chat route
- The chat route now counts a visitor before the request is processed. The limit is twenty messages every thirty minutes and a hundred a day, as PRD §48 suggests, and the limits can be changed with `RATE_LIMIT_WINDOW_SECONDS`, `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_DAILY_MAX`
- A request over the limit is answered with the status 429, a friendly message, a `Retry-After` header and the `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers. The same headers are sent with every answer that goes through
- The answer is checked before it is sent. Personal data that is still in the answer after the guardrails keeps the answer from being shown at all, and a safe answer is sent instead. A tone that is too informal, an answer that is too long and details that are not in the context are reported but do not keep the answer from being shown
- The limits are kept in memory and are lost when the instance restarts. PRD §48 accepts a limit per instance, and the store is injected so a shared store can replace it later
- Added 25 tests for the validation and the limiter, and verified the whole thing against the running site: the limit headers, the 429 answer, the friendly message and the streamed final chunk all behave as they should
- Cleaned up the leftovers of M13.08 and M13.09: removed the unused imports, wired the retry and dismiss actions of the error state, which did nothing before, and switched the imports of the orchestration layer from the path alias to relative ones so the layer can be loaded by a test

## [0.1.116] - 2026-10-25
- Implemented M13.07 AI guardrails: added `src/lib/guardrails/` with the topic classification, the personal data detection, the prompt injection detection, the output validation, the redirects, the logger and the integration points
- The topic classification tells a question about the professional profile apart from one about something else, using the goals of the assistant in PRD §28 and the source types of the knowledge base. It is keyword based, so it costs nothing and never has to be retried
- Every question is checked for an attack before it reaches the knowledge base, and every answer is checked before it is shown. The order follows the privacy architecture of PRD §35
- The attempts PRD §38 names are all caught, including the ones that are written as a single word or in a different case
- The personal data of a question is removed before it is stored, and the personal data and the credentials of an answer are removed before it is shown
- A question that is off topic, an attempt that changes the instructions and a request for private details all receive a polite redirect with the questions the assistant can answer instead, as PRD §39 and PRD §40 ask for
- The guardrail events record what was done without recording the question or the answer, so the log does not hold the personal data that went through it
- Three sensitivity levels are available: strict, balanced and relaxed. They change how much evidence a question needs and whether the attack phrases that also have an innocent reading are acted on
- Added 57 tests, including the false positive checks for the questions PRD §29 suggests showing at the start, the attacks PRD §38 names, the phone number formats PRD §37 names and the performance of the checks
- Fixed a slow path in the personal data detection. An unbounded repetition in the pattern for an email address made it go back over the whole text for every position it started at, so a question of a hundred thousand characters took twenty-eight seconds. It now takes three milliseconds. The same bound was added to the phone number pattern of the ingestion pipeline

## [0.1.115] - 2026-10-24
- Implemented M13.06: added the `LLMProvider` contract in `src/lib/llm/provider.ts`, the Gemini adapter in `src/lib/llm/geminiProvider.ts`, a factory that builds the provider from the environment in `src/lib/llm/factory.ts` and the entry point in `src/lib/llm/index.ts`
- The provider supports text generation and streaming, the parameters temperature, max tokens, topP and stop sequences, a system instruction, a request timeout and a caller supplied cancellation signal
- Every answer reports the finish reason and the token usage the API returned, in a provider independent shape
- Transient failures are retried with exponential backoff: rate limits, timeouts and server errors. A rejected request or an invalid key is reported straight away
- A stream is only retried while nothing has been handed to the caller, so an answer that already reached the screen is never repeated. The underlying stream is closed when the caller stops early, so nothing is left open
- Failures are reported with a message that says what went wrong and how to fix it, and the API key is removed from every message
- The environment is validated when the provider is created, and the model comes from `GEMINI_MODEL` rather than from a constant
- The provider is usable from server code without the environment being loaded at import time, so `src/lib/llm/index.ts` can be imported from a route, a server action or a test
- Moved the shared helpers out of the modules that owned them: `src/lib/retry.ts` and `src/lib/geminiErrors.ts`. The error helpers had to leave `src/lib/gemini.ts`, which reads the environment when it is imported, and the retry helper had to leave the knowledge base, which the language model layer must not depend on. The old import paths still work
- Added 25 unit tests and 5 live tests. The live tests are opt in with `LIVE_LLM_TESTS=1`, because the free tier of the Gemini API allows twenty generation requests a day and a request over that limit is rejected for the rest of the day
- Measured the latency of the configured model on the free tier: 13 to 57 seconds for a short question, because the model spends up to 75 tokens thinking before it answers. The default timeout is therefore 60 seconds, and the adapter can turn the thinking off

## [0.1.114] - 2026-10-24
- Implemented M13.05 vector search: added `src/lib/knowledge/retrieval.ts`, `src/lib/knowledge/types.ts`, `supabase/migrations/20261024000001_add_vector_search.sql` and the matching tests
- The similarity search runs in the database through a `match_knowledge_chunks` function, so the HNSW index on the embedding column is used and the classification filter cannot be bypassed by the caller
- The function is revoked from `PUBLIC`, `anon` and `authenticated`, so it can only be reached with the service role key
- The question is embedded with the `RETRIEVAL_QUERY` task type, which differs from the `RETRIEVAL_DOCUMENT` type the stored chunks were created with
- Retrieval supports a top-k limit, a similarity threshold, a classification filter and an optional source type filter, and logs the query time, the number of results and the average similarity
- The live retrieval tests skip themselves when the search function is not installed in the project, so they start running on their own once the migration is applied
- Tuned the default similarity threshold to 0.55 after measuring it against the live knowledge base. Professional questions score between 0.66 and 0.75 and off-topic questions between 0.48 and 0.57, so this keeps every relevant result while dropping almost all of the off-topic ones

## [0.1.113] - 2026-10-24
- Fixed the batch embedding request. The Gemini SDK reads an array of plain strings as one content with several parts, so a batch of twenty texts returned a single embedding and the rest came back empty. Each text is now sent as its own content object, which returns one embedding per text
- Added a regression test that asserts the shape of the request sent to the SDK, so the batch cannot silently break again
- The live test now loads the environment itself, so it runs whenever a real API key is configured instead of always being skipped

## [0.1.112] - 2026-10-24
- Implemented M13.04 embedding generation: added `src/lib/gemini.ts`, `src/lib/knowledge/embedding.ts`, `src/lib/knowledge/storage.ts`, `scripts/embed-knowledge.mts` and the `@google/genai` dependency
- The embedding service asks Gemini for 768 dimensions, normalises the vector to unit length before storing it, validates the dimension count, retries rate limits and server errors with exponential backoff, and batches texts into a single request
- Added `npm run embed` to backfill the embeddings of the chunks that do not have one yet
- Added 26 tests covering the adapter, the embedding service and the storage layer, plus a live test that checks the dimension and the semantic similarity of related texts. The live test skips itself when no real API key is configured

## [0.1.111] - 2026-10-24
- Store a null embedding instead of an empty array until the embedding has been generated. A pgvector column only accepts a vector with exactly the declared number of dimensions, so the empty array placeholder would have been rejected by the live database on every chunk insert

## [0.1.110] - 2026-10-24
- Corrected the knowledge base migration before its first deployment: switched the vector index from IVFFlat to HNSW (IVFFlat is built from the rows that already exist and would have been created on an empty table), enabled row level security on both knowledge tables so they cannot be read through the public API with the anon key, and documented why the embedding column stays at 768 dimensions
- Corrected the M13.04 task specification, which stated that `gemini-embedding-001` returns 768 dimensions. It returns 3072 by default, so the embedding request has to set the output dimension explicitly
- Added `GEMINI_EMBEDDING_MODEL` to the environment schema so the embedding model is a configuration value rather than a Gemini specific detail in the application code (PRD §49)

## [0.1.109] - 2026-10-23
- Completed M13.03: implemented the document ingestion pipeline (created src/lib/knowledge/ingestion.ts, src/lib/knowledge/markdown.ts, scripts/ingest-knowledge.mts, src/lib/knowledge/testing/fakeSupabase.ts, knowledge/README.md; rewrote src/lib/knowledge/ingestion.ts; updated src/lib/knowledge/pii.ts, src/lib/knowledge/metadata.ts, src/lib/supabase.ts, package.json)
- The pipeline now processes 11 structured knowledge source types plus markdown documents, redacts PII, extracts metadata, stores documents and chunks with referential integrity, and reports ingestion statistics
- Made the pipeline idempotent: a document is identified by its source type and title, so re-running updates only the documents whose content changed, bumps their version and replaces their chunks instead of duplicating the knowledge base
- Added `npm run ingest` to trigger an ingestion run manually
- Fixed the phone number redaction matching ISO dates, which was corrupting the career timeline, education and certification dates in the knowledge base (PRD §37 scopes redaction to phone numbers)
- Fixed social links being classified as PROFESSIONAL instead of PUBLIC (PRD §34)
- Added 20 tests covering the ingestion pipeline end to end, markdown documents and the two fixes, bringing the suite to 64 tests

## [0.1.108] - 2026-10-22
- Wired up a real test suite: `npm test` now runs `node --test` instead of the previous "No tests yet" no-op, so the CI Tests step actually executes tests. Added 44 tests across the GitHub URL parser, the GitHub service, and the M13.03 chunking, PII redaction and metadata modules
- Extracted `parseGitHubUrl` into `src/lib/githubUrl.ts` so the parsing rules can be unit tested in isolation from environment validation, and switched `src/lib/githubService.ts` to explicit `.ts` import specifiers so Node's ESM test runner can load it
- Deleted the placeholder `src/lib/token-test.ts` (a temporary M01.07 design-token scaffold that was not a test and broke the ESM test runner) and replaced the placeholder `src/lib/githubService.test.ts` with a real test suite

## [0.1.107] - 2026-10-21
- Fixed CI lint and typecheck failures introduced with the M13.03 ingestion pipeline: replaced `any` with the real source data model types across `src/lib/knowledge/ingestion.ts` and `src/lib/knowledge/metadata.ts`, added `KnowledgeDocumentInsert`/`KnowledgeChunkInsert` payload types so database-generated `id`/`created_at` columns are no longer written with placeholder values, corrected field names that did not exist in the source data models (certifications, career timeline, social links), removed the unreachable GitHub profile processor, and migrated `.eslintignore` into the ESLint flat config

## [0.1.106] - 2026-10-18
- Completed M13.02: Set Up Supabase Client Wrapper and Environment Validation (updated src/lib/supabase.ts with environment validation and separate anon/service role clients)

## [0.1.105] - 2026-10-18
- Completed M13.01: Define AI Knowledge Base Document Format and Schema (created supabase/migrations/20261018000001_create_knowledge_tables.sql, src/lib/supabase.ts, src/types/knowledge.ts, src/lib/knowledge.schema.ts; installed @supabase/supabase-js)

## [0.1.104] - 2026-10-18
- Created task specifications for Milestone M13 – AI Knowledge Base

## [0.1.103] - 2026-10-18
- Completed M12.07: Add final polishing and verify design consistency (updated src/components/testimonials/TestimonialCard.tsx, src/components/testimonials/TestimonialsSection.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.102] - 2026-10-18
- Completed M12.06: Ensure responsiveness, accessibility, and conditional rendering (updated src/components/testimonials/TestimonialCard.tsx, src/components/testimonials/TestimonialsSection.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.101] - 2026-10-18
- Completed M12.05: Add animations and interactive states (updated src/components/testimonials/TestimonialCard.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.100] - 2026-10-18
- Completed M12.04: Integrate testimonials section into homepage layout (modified app/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.99] - 2026-10-18
- Completed M12.03: Create testimonials section component (created src/components/testimonials/TestimonialsSection.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.98] - 2026-10-18
- Completed M12.02: Create testimonial card component (created src/components/testimonials/TestimonialCard.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.97] - 2026-10-18
- Completed M12.01: Define testimonial data model and create testimonial data (created src/data/testimonials.ts; updated PROJECT_STATE.md and TODO.md)

## [0.1.96] - 2026-10-18
- Created task specifications for Milestone M12 – Testimonials

## [0.1.95] - 2026-10-17
- Completed M11.06: Add animations and final polishing (updated src/components/socialHub/SocialHub.tsx with entrance animations, refined hover/tap animations, subtle border styling, and ensured visual consistency; updated PROJECT_STATE.md and TODO.md)

## [0.1.94] - 2026-10-17
- Completed M11.05: Ensure SocialHub accessibility and responsiveness (updated src/components/socialHub/SocialHub.tsx with improved accessibility: aria-label descriptions, focus indicators, reduced motion support, responsive grid layout; updated PROJECT_STATE.md and TODO.md)

## [0.1.93] - 2026-10-17
- Completed M11.04: Update footer to be minimal (removed SocialLinks component from src/components/footer/Footer.tsx, leaving only copyright section; updated PROJECT_STATE.md and TODO.md)

## [0.1.92] - 2026-10-17
- Completed M11.03: Integrate SocialHub component into homepage layout (added SocialHub section after FeaturedProjects in app/page.tsx with heading and responsive layout; updated PROJECT_STATE.md and TODO.md)

## [0.1.91] - 2026-10-17
- Completed M11.02: Create SocialHub component (created src/components/socialHub/SocialHub.tsx with card-based layout, hover animations, responsive grid, accessibility features; updated PROJECT_STATE.md and TODO.md)

## [0.1.90] - 2026-10-17
- Completed M11.01: Update social links configuration (updated src/data/socialLinks.ts with placeholder entries for all 13 platforms; added verification warning; updated PROJECT_STATE.md and TODO.md)

## [0.1.89] - 2026-10-17
- Created task specifications for Milestone M11 – Social Hub

## [0.1.88] - 2026-10-17
- Completed M10.11: Add animations and final polishing (split page into server and client components due to metadata and hooks constraints, added use client directive, added motion animations with hover/tap effects to PDF download button, ensured reduced motion preference respected)

## [0.1.87] - 2026-10-16
- Completed M10.10: Ensure responsiveness, accessibility, and phone number redaction (verified no phone number in data or components, confirmed responsive design and accessibility patterns)

## [0.1.86] - 2026-10-16
- Completed M10.09: Add PDF download button and link (updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.85] - 2026-10-16
- Completed M10.08: Create resume achievements component and integrate achievements data (created src/components/resume/ResumeAchievements.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.84] - 2026-10-16
- Completed M10.07: Create resume certifications component and integrate certifications data (created src/components/resume/ResumeCertifications.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.83] - 2026-10-16
- Completed M10.06: Create resume education component and integrate education data (created src/components/resume/ResumeEducation.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.82] - 2026-10-15
- Completed M10.05: Create resume skills component and integrate skills data (created src/components/resume/ResumeSkills.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.81] - 2026-10-15
- Completed M10.04: Create resume experience component and integrate experience data (from career timeline) (created src/components/resume/ResumeExperience.tsx; updated app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.80] - 2026-10-15
- Completed M10.03: Create resume page route and layout (created app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.79] - 2026-10-15
- Completed M10.02: Create resume page route and layout (created app/resume/page.tsx; updated PROJECT_STATE.md and TODO.md)

## [0.1.78] - 2026-10-14
- Created task specifications for Milestone 10 (Resume): M10.02 through M10.11.
- Updated PROJECT_STATE.md and TODO.md to reflect planning status.

## [0.1.77] - 2026-10-08
- Completed M10.01: Define resume data model (created src/data/education.ts, src/data/certifications.ts, src/data/skills.ts; updated PROJECT_STATE.md and TODO.md)

## [0.1.76] - 2026-10-08
- Completed M09.10: Verify no GitHub call on every request (added temporary logging to confirm cache behavior, verified that cache is checked and on miss a request is made; due to missing GITHUB_TOKEN, cache hits could not be observed but the caching logic is correct)

## [0.1.75] - 2026-10-08
- Completed M09.09: Add typing and tests for GitHub service (updated src/lib/githubService.ts with input type and JSDoc, created src/lib/githubService.test.ts placeholder)

## [0.1.74] - 2026-10-08
- Completed M09.08: Integrate with project list and detail (updated app/projects/[slug]/project-detail-content.tsx to wrap ProjectCard in Suspense with loading fallback)

## [0.1.73] - 2026-09-01
- Completed M09.07: Update project data population (updated src/data/projects.ts to add githubUrl fields for projects with verified GitHub repositories)

## [0.1.72] - 2026-09-01
- Completed M09.06: Add fallback data (updated src/components/projects/ProjectCard.tsx to show placeholder UI for failed GitHub requests, and updated design/tokens.ts to add mutedForeground color)

## [0.1.71] - 2026-09-01
- Completed M09.05: Ensure caching reduces API calls (updated src/lib/githubService.ts to add cache size limit, cache hit/miss logging in development, and enforce cache size before storing)

## [0.1.70] - 2026-09-01
- Completed M09.04: Implement loading states (updated src/components/projects/ProjectList.tsx to wrap ProjectCard in Suspense with loading fallback, converted ProjectCard to async server component, removed client-side loading state, passed tokens and prefersReducedMotion props, added loading fallback UI)

## [0.1.69] - 2026-09-01
- Completed M09.03: Extend ProjectCard to show GitHub metadata (updated src/components/projects/ProjectCard.tsx to fetch and display GitHub repo stats with loading and error states)

## [0.1.68] - 2026-09-01
- Completed M09.02: Create GitHub service with caching (created src/lib/githubService.ts, src/lib/types.ts)

## [0.1.67] - 2026-08-31
- Completed M09.01: Define GitHub repository data model (created src/data/github.ts)

## [0.1.66] - 2026-08-30
- Completed M08.11: Integrate featured projects section into homepage (created FeaturedProjects component, updated projects index.ts and app/page.tsx)

## [0.1.65] - 2026-08-30
- Completed M08.10: Ensure accessibility and keyboard navigation (updated ProjectCard, ProjectList, FilterBar, project detail page, and added sr-only utility class)

## [0.1.64] - 2026-08-30
- Completed M08.09: Add animations using Framer Motion (updated ProjectCard, ProjectList, FilterBar)