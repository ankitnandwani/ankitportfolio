# Immediate Next Actions

- Begin implementation of M20.04 – Capture the failures of the language model. The specification is `tasks/M20/04-ai-failure-monitoring.md`. The capture of M20.03 is in place, so a failure of the model can be reported with the kind of the failure and the status of the answer
- The nine specifications of M20 are written and the milestone is in progress. The plan, the order of the tasks, the table of the requirements and the decisions that need a person are in `tasks/M20/README.md`
- **The browser will need its own client of the SDK.** The capture loads the package with a dynamic import, which is what the server needs. The browser already holds the SDK of M20.01, and M20.07 has to hand that one to the capture through the factory instead of loading the package a second time in the page
- **The browser may want the integration of the duplicates back.** It was left out of the SDK because it drops the second of two failures that look the same, and every failure has to be reported. A loop of failures in the page is the case the integration is for, and M20.07 decides whether the browser needs it
- **The delivery of the email of the contact form is not reported yet.** The route answers a 500 when the message could not be sent, but that failure is not caught, so it is not a report. It belongs to M20.05, which is the task of the failures of the external services
- **The SDK of the browser is loaded on its own, and a failure of the very first moment is not seen.** The import of `instrumentation-client.ts` is a dynamic one, so the hundred and fifty kilobytes of the SDK are not part of the first load of a page and the page never waits for them. The price is that the SDK is ready a moment after the page is there. The boundaries of M20.07 and the capture of M20.03 have to work with that
- **Four moderate advisories came with the SDK**, all of them in `@sentry/bundler-plugins`, which only runs at the build. The count of the audit went from 24 to 28 and no new serious one came. The serious ones that were already there are in Next.js 16.3.2 itself and are written down in `TODO.md`
- The findings that M19 left behind are written as specifications in `tasks/M19-followups/`: M19F.01 (one identity for the visitor across the events, so a click can be joined with the conversation and the project counts the visitors and not the sessions), M19F.02 (the page level events of PRD §78: `page_view`, `project_view`, `chat_open` and the click on the contact link) and M19F.03 (the two corrections of M19.06). M19F.03 is done. The other two are worked on after M20, and they are not part of M20
- Four decisions of M20 need a person before the milestone is finished: which package of Sentry is used (the answer is `@sentry/nextjs` 11.10.0, it declares the support of Next.js 16 and it is the one that uses the `instrumentation.ts` hook of Next.js 16 on its own), whether the performance is watched with a threshold or with tracing (the recommendation is the threshold), whether the local machine reports to the same project as the live site (the recommendation is a project of its own), and how the alerts reach the owner (the recommendation is the email of Sentry)
- M19 – Analytics is complete. All six tasks are done and verified
- The verification of the analytics was made for real on 2026-11-03. Every event of the catalogue was fired against the real PostHog project, the payload on the wire was read, and the project was opened in the browser: the activity log of project 325584 shows all eight kinds of event. The run of the script of M19.05 was 24 cases, 405 rules checked, 405 passed, 0 failed
- **The CI does not run the build.** `.github/workflows/ci.yml` runs the lint, the typecheck and the tests, and nothing else, so a configuration that breaks the build is not caught by the pipeline. The build has to be run by hand after a change that touches `next.config.ts`, the `instrumentation` files or the environment. Adding the build to the CI is not part of M20 and is written down here
- **PostHog counts a session as a person.** The identifier of the session is the identity of the event, so every session becomes a person of its own in the project and the number of people is the number of sessions, not the number of visitors. It was seen in the activity log on 2026-11-03 and comes from the decision of M19.01. It is a change of the design of the identity, so it should be a change of its own
- **A visit from the local machine reaches the real PostHog project.** There is no project of its own for the work on the machine, so the clicks of a developer land in the numbers of the site. A project of its own for the work on the machine would keep the two apart
- The verification script of M19.05 runs the cases of the catalogue against the running site with `npm run verify:analytics`. It needs the server to be running, and it reads the file of the server when `SERVER_LOG` is given, so the events the server really counted can be seen in the report
- **Two more variables of the environment are declared and never read.** `CONTACT_FORM_DAILY_WINDOW_SECONDS` is declared in `src/lib/env.ts` and written in `.env.example`, but `src/lib/contact/rateLimiter.ts` reads only the window, the maximum of the window and the maximum of the day, so the length of the day of the contact form cannot be changed. `JOB_FIT_MAX_TOKENS` is declared as well, but `src/lib/jobFit/analysis.ts` uses the constant `MAX_JOB_FIT_RESPONSE_TOKENS` of `src/lib/jobFit/limits.ts` instead, so the variable has no effect. They are the same kind of finding as the one M19F.03 closed for the analyzer, and they were left alone because that task closed two specific findings. They should be a change of their own
- The event of a refused request is now sent per PRD §48, and the start of the chat is fired. The audit of every event of PRD §46, §47, §48 and §90 is recorded in `tasks/M19/README.md`. The event of a refusal carries only the scope, the endpoint and the wait, which the visitor already sees in the headers of the answer
- The events of the browser and the events of the server carry two different sessions, so a click on a call to action cannot be joined with the conversation of the same visit in PostHog. This comes from M19.01 and M19.03 and was left alone in M19.04, because joining them means a change of the design of the proxy
- PRD §78 also asks for the events of the pages themselves, `page_view` and `project_view`, and for the clicks on the links of the header, of the footer and of the projects. They are not implemented, because the browser can only send the events the proxy of M19.02 allows, and the proxy only allows the click on a call to action. They should be a change of their own, either in the proxy or in another milestone
- The click of a call to action is counted from the browser through the proxy of M19.02, and was verified in a real browser on 2026-10-29. The browser reports the events to the server of the site, because it cannot see the credentials and therefore cannot know whether the server forwards them. The server decides, and a server without the credentials forwards nothing
- Two faults of the milestone M17 were found and fixed while the manual test of M19.03 was carried out. The route of the job fit answered with `meta` while the contract and the interface read `metadata`, so every successful analysis showed an error instead of the results, and the calls to action that point at the site threw on a placeholder address of the site. The route files cannot be loaded by the test runner, so neither fault could be caught by a unit test. The end-to-end run of M19.06 reaches the routes over http and would catch this class of fault
- The proxy of M19.02 flushes the event before the answer goes out, so it is not lost when the instance is put to sleep. The other routes still leave their events in the queue of the PostHog client, which is safe on a process that stays alive but not on a serverless function that is frozen. This matters from M24, the production deployment
- The PostHog project is set up and the credentials are in `.env.local`, so the events reach a real PostHog. The value that is still the placeholder of `.env.example` is treated as no credentials, so a deployment without the credentials stays in the console only mode instead of sending to a host that does not exist
- The PostHog browser snippet and the session recording are deliberately not used. The events are sent from the server, and the client side events go through the proxy endpoint of M19.02, so nothing a visitor types is ever captured automatically
- The events that carry a group of properties put them in a `properties` object of their own, so they reach PostHog one level deeper than the other events
- `SENTRY_DSN` and the two `UPSTASH_REDIS` variables are optional in the environment now, so the site boots without the three placeholders. They are still not used by anything: the DSN is used as soon as the Sentry project exists, which is M20.08, and the store of the rate limiter is a later change
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch.
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch.
- The rate limit of the chat is kept in memory, so it is lost when the instance restarts and it is per instance. That is what PRD §48 accepts for a site with low traffic, but a shared store (the Upstash Redis of PRD §53) would make it hold across instances. The store of the limiter is injected, so this is a change in one place.
- The visitor is counted by the address the hosting platform writes into the request. A visitor who can change that header can get around the limit, so the limit is a guard against accidents rather than a wall.
- The model of the chat is now `gemini-flash-lite-latest`, which answers in a few seconds without spending tokens on thinking. `gemini-flash-latest` needed 13 to 57 seconds for the same question, because it spends up to 75 tokens thinking before it answers.
- Run the live language model tests with `LIVE_LLM_TESTS=1`. They are off by default because the free tier of the Gemini API allows twenty generation requests a day and a request over that limit is rejected for the rest of the day.
- The guardrail patterns are a rule set, not a model. They need a look again once the chat is live, because the questions the visitors really ask are the ones that show whether a pattern is too broad or too narrow.
- The personal content can wait. `src/data/skills.ts` and `src/data/testimonials.ts` are still empty placeholders, and neither is needed for the remaining M17 tasks. The point at which they become visible to users is the chatbot, which already says that the summary and the snapshot are pending verification. The point at which they become a launch blocker is the resume page, which currently shows "Skills data pending verification against resume." Add them before launch.
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks.

## Completed (M20.03)

- The capture of the failures of the routes was put in place on 2026-11-05. The failures of the model and of the external services arrive with M20.04 and M20.05
- `src/lib/monitoring/capture.ts` holds the one place where a failure of the site becomes a report. A route that catches a failure hands it over and holds nothing else, so a route that is added later cannot reach the monitoring service by another way
- The context of a route is built by one helper: the name of the route, the method, the status of the answer, the kind of the failure, the identifier of the query and the moment. The address of the visitor is not part of it and the body never reaches it
- The report is awaited and it is flushed before the answer of the route goes out, so it is not lost when the instance is put to sleep
- The line of the local log keeps its shape: the capture writes it with the words each route used, so the person who works on the site reads the log they are used to
- The report is grouped by the kind of the failure and by the route, so the same failure does not open an issue of its own every time it happens
- The refusals are not reported. A 400, a 403 and a 429 are the site doing its job, and reporting them would fill the project with the traffic of other sites
- The answer the visitor receives is exactly the answer of today. The proxy of the analytics lets a failure it does not expect go on the way it would have gone
- **Three findings came out of the verification on the wire and were fixed.** The allow list of the scrubbing dropped the fingerprint of the SDK, so the grouping of the reports was lost on the way out; the integration of the console wrote the console of the site (the line of the limiter holds the address of a visitor) into the report as a breadcrumb; and the integration of the duplicates dropped the second of two failures that look the same
- The message of the parser of a body holds the first words of that body, so it is not in the report. The name of the error and the place it happened are kept
- The headers that carry the address of the visitor (`x-forwarded-for`, `x-real-ip` and `forwarded`) are never sent
- 18 tests added. The whole suite: 664 tests with 658 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Verified with the dev server running and the real SDK: a request with a body that could not be read was made to the route of the feedback and to the route of the chat. Each one produced exactly one report, the report held the route, the method, the status, the kind, the moment and the fingerprint and nothing else, two failures in a row were both reported, and the refusals produced nothing at all

## Completed (M20.02)

- The scrubbing of the failures was put in place on 2026-11-04. Nothing is captured yet, that is M20.03 to M20.07
- `src/lib/monitoring/scrub.ts` holds the one layer between the application and the monitoring service, and everything that is sent goes through it. A capture path that is added later cannot bypass it, because the hook is on the way out of the process
- The safe shape is built by an allow list. The parts that are known to be safe stay, and a part that is not on the list does not reach the service, so a field that nobody thought of is not sent by accident
- The bodies of the chat, of the analyzer of a job description and of the contact form are removed by the name of their fields, the body of a request is never sent whatever shape it has, the address of a mailbox and the number of a phone are removed from every string that is sent, the headers that carry a secret are never sent, and the values of the secrets of the environment are removed from every string that is sent
- **The list of the secrets is curated, and not the rule of the guardrails.** The rule of the guardrails would have removed the number twenty from every message, because a limit such as `RATE_LIMIT_MAX_REQUESTS` holds a number. A secret shorter than eight characters is not looked for either
- **The hook of `beforeSend` takes the event alone.** The SDK calls the hook with the event and a hint, and the hint is not a list of secrets. With the scrubbing handed to the SDK directly the hint landed in the place of the secrets, the scrubbing failed and every report was lost without a word. This was found by reading the wire, and it is fixed
- A failure of the scrubbing does not send the event unchecked and does not lose it either: a safe shape takes its place, with the identity of the event and a note that says the scrubbing failed
- 42 tests added. The whole suite: 646 tests with 640 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Verified on the wire with the real SDK: one envelope was sent, and it held no address of a mailbox, no number of a phone, no body of a chat, no key, no DSN, no name of a recruiter and no identity of a visitor

## Completed (M20.01)

- The monitoring was put in place on 2026-11-04. Nothing is captured yet, that is M20.03 to M20.07
- `@sentry/nextjs` 11.10.0 was installed, the newest stable version. The support was read before the installation: the package declares `next: "^14.0 || ^15.0.0-rc.0 || ^16.0.0-0"` and the version of Next.js in this repository is 16.3.2
- **The convention of the installed version won over the one of the written task.** The task named `sentry.server.config.ts` and `sentry.client.config.ts`, and it was written before the version of the SDK was known. The installed version warns at the build that such a file is an outdated configuration and asks for its content to be put into the `register()` function of the instrumentation file. The files are `instrumentation.ts` and `instrumentation-client.ts`, and no `sentry.*.config.ts` was created. The reason is in `DECISIONS.md`
- `src/lib/monitoring/config.ts` holds the one implementation of the configuration, with the shape the analytics of M19 left behind. A missing DSN, a placeholder and a value that is not an http or https URL all mean the monitoring is off, and the DSN is only carried while it is on
- `sendDefaultPii` is false, the session recording is off and the tracing is off, on both sides
- `instrumentation.ts` holds the `onRequestError` hook of Next.js 16, which receives the path, the method and the headers of the request and no body
- **The SDK of the browser is loaded on its own.** A static import put a hundred and twenty five kilobytes gzipped into the first load of the homepage. The import is a dynamic one now, the chunk is not part of the first load, and when there is no DSN it is never fetched
- The source maps of the browser are kept, because the SDK deletes them whatever happened to the upload
- `SENTRY_DSN` and the two `UPSTASH_REDIS` variables are optional now, and the site boots without the three placeholders. The browser has a DSN of its own, `NEXT_PUBLIC_SENTRY_DSN`
- 22 tests added. The whole suite: 604 tests with 598 pass, 0 fail and 6 skipped; lint clean; typecheck clean. The build was run by hand with a DSN and without one, because the CI does not run it, and both succeed. The site boots and answers without a DSN and reports no error of the SDK

## Completed (M19F.03)

- The two findings that the verification of M19 left behind were closed on 2026-11-04
- The comment of `app/api/analytics/route.ts` now describes what the code does: the request from another site and the body that cannot be read are refused before the counting and carry no headers of the limit, and the reason is written down, because counting a request from another site would let it use up the allowance of a visitor. The behaviour of the proxy was not changed
- The limits of the analyzer come from the environment now: `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS` and `JOB_FIT_DAILY_MAX_REQUESTS` are read when the limiter is built, the way the chat and the contact form do, and a variable that is missing or that holds something that is not a positive number is ignored so the default of the code is used
- Six tests added in `src/lib/jobFit/policy.test.mts`, and the tests were proved to depend on the change: with the reading of the environment removed, the test of the limits coming from the environment fails
- Verified against the running site: with `JOB_FIT_MAX_REQUESTS=2` the third analysis is refused with a 429 and the headers carry the values that were applied, and with `JOB_FIT_DAILY_WINDOW_SECONDS=60` the reset is a minute away instead of two hours. The requests were refused before the analysis, so no answer was paid for
- The whole suite was run again: 582 tests with 576 pass, 0 fail and 6 skipped; lint clean; typecheck clean; the build succeeds. The verification of M19.05 still passes every rule, so the behaviour of the proxy is unchanged
- Two more variables of the environment were found while the task was carried out and were left alone: `CONTACT_FORM_DAILY_WINDOW_SECONDS` and `JOB_FIT_MAX_TOKENS` are declared and never read

## Completed (M19.06)

- Verified the analytics end to end on 2026-11-03. No code was changed by this task
- The script of M19.05 was run against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0. A run with a rule broken on purpose answered with the exit code 1 and named the rule that failed
- The whole suite was run again: 576 tests with 570 pass, 0 fail and 6 skipped; lint clean with 0 errors and 58 warnings; typecheck clean; the build succeeds
- Every event of the catalogue was fired for real against the real PostHog project. The wire was read with a small forwarding server that wrote the body down and passed it on to `https://eu.i.posthog.com`, so the project received every event and the exact bytes could be checked. The file that held the key was deleted at once with `mavis-trash`
- The eight kinds of event seen on the wire: `chat_session_start`, `message_sent`, `response_received`, `feedback_given`, `cta_clicked`, `contact_form_submission`, `job_fit_analysis`, `rate_limit_exceeded`. The server reported no error of the flush in any of the runs
- The project was opened in the browser and the activity log of project 325584 was read: all eight kinds of event are there, with the library `posthog-node`, the identity of the session and the `GeoIP disabled` on
- The audit of the private data of the real payloads found no address of a mailbox, no number of a phone in the written form, no run of ten digits on its own and no address of a computer in any of the eight kinds of event
  - `contact_form_submission` carries only four booleans of which fields were filled in
  - `job_fit_analysis` carries only counts and times
  - `rate_limit_exceeded` carries only the identifier of the query, the scope, the part of the site and the wait
  - A comment of the feedback that held a telephone number and an address of a mailbox arrived on the wire as `[REDACTED]`
- The sessions join up as they should: the events of the server share one session, the refusal has one of its own, and the click of the browser carries the session of the tab
- Three findings were left alone, because they are changes of their own and this task only checks: the limits of the job fit analyzer are still not read from the environment, the events of the browser and the events of the server still carry two different sessions, and the comment of `app/api/analytics/route.ts` still overstates the headers and the counting of the proxy. The first and the third were closed by M19F.03 on 2026-11-04

## Completed (M19.05)

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
- The run on 2026-10-29 against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0. A run with a rule broken on purpose answered with the exit code 1 and named the rule that failed

## Completed (M19.04)

- Audited every event of PRD §46, §47, §48 and §90 against the code. The result is recorded in `tasks/M19/README.md`
- Added the event of a refused request, per PRD §48:
  - New event type `rate_limit_exceeded` in `src/lib/analytics/eventTypes.ts`, with the scope that was reached, the part of the site that was asked for and the wait in seconds
  - New `trackRateLimitExceeded()` in `src/lib/analytics/analytics.ts`, and `markChatSessionStarted()` beside it
  - New module `src/lib/analytics/rateLimit.ts` with `reportRateLimitExceeded()`, which the three routes call when they refuse a request. The module lives in the library and not in the routes, because the routes import their modules with the path alias and the test runner cannot resolve it
  - The event is put on the queue before the answer goes out, so it is not lost when the instance is put to sleep. It carries only the scope, the endpoint and the wait, which the visitor already sees in the headers of the answer, and never the limits themselves
  - The session of the visitor is now worked out before the limit is checked in `/api/chat`, `/api/job-fit` and `/api/contact`, because the event of a refusal belongs to a session
- Wired `chat_session_start`, which was defined and never fired. It now fires on the first message of the chat. The start of a chat is remembered on its own, because the session of a visitor is shared with the whole site
- Fixed `/api/feedback`, which gave every request a session of its own. The feedback now carries the session of the visitor, so it can be found next to the answer it is about
- Added 10 tests: 4 in `src/lib/analytics/analytics.test.mts`, 6 in `src/lib/analytics/rateLimit.test.mts`
- Verified against the running site on 2026-10-29: a message of the chat fires the three events of the conversation with one session, a second message does not fire the start of the chat again, each of the three parts of the site answers with 429 and fires the event with the right endpoint and the wait that matches the answer, the feedback carries the same session as the conversation, and the event was seen on the wire with no personal data
- All 576 tests pass (570 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M19.03)

- Changed `src/lib/analytics/client.ts` so the click of a call to action is really counted:
  - `trackCtaClicked` sends a POST to `/api/analytics` with the session, the query, the kind of the call to action and the host it points at
  - The request is sent and not awaited, so the visitor never waits for the analytics before a link opens, and it is marked to stay alive, so the event still goes out when the page goes away
  - Nothing in the path of the visitor throws. A failed answer is a line in the console of the developer and nothing else
  - The session of the browser is kept in the storage of the tab, so a visitor who reloads the page is still in the same session. The storage can be refused, and then the session is kept in memory for as long as the page is open
- Changed the browser branch of `src/lib/analytics/config.ts`: the browser reports the events to the server of the site, because it cannot see the credentials and therefore cannot know whether the server forwards them. The server decides. The old behaviour turned the analytics off in the browser, so no click of a call to action was ever counted
- The browser does not send a timestamp. The proxy refuses a field that is not part of the event, so a timestamp in the body would be answered with a refusal. The server puts the moment on the event, with the clock that counts
- Updated `src/components/jobFit/JobFitResults.tsx`: the three handlers of the calls to action no longer wait for the tracking, so a click opens the link straight away
- Fixed two faults of the milestone M17 that the manual test brought up:
  - `app/api/job-fit/route.ts` answered with a `meta` object while the contract of `JobFitResponse`, the check of the interface and the component itself all read the metadata under `metadata`. Every successful analysis showed "Received an unexpected response" and the results never appeared. The route now answers with the `metadata` the contract declares, and the identifier of the query goes on it, so the analysis and the click on a call to action can be tied together
  - The two calls to action that point at the site read the host with `new URL(siteConfig.url)`, which threw while the address of the site is still the placeholder of `.env.example`. The click did nothing and the event was never sent. Added `getSiteHost()` to `src/siteConfig.ts`, which reads the host when it can and falls back to the known address when it cannot
- Added 23 tests: `src/lib/analytics/client.test.mts` (17) and `src/siteConfig.test.mts` (6)
- Verified in a real browser on the running site: the click of "Connect on LinkedIn" was answered with 200 and went on to PostHog with no flush error, and the click of "Download Resume" navigated away while the request was still on its way and the answer came in after the page had gone. The identifier of the query on the event is the same one the analysis carries
- All 566 tests pass (560 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M18.08)

- Extended `test-plan.md` with contact form section (35 test cases across CFC, CSC, CEC, CIA)
- Created `scripts/verifyContact.mts` verification script:
  - Tests 13 validation fixtures with unique IPs to avoid rate limit pollution
  - Tests rate limit enforcement (3 allowed, 4th blocked with 429)
  - Tests rate limit isolation (contact limits don't affect chat/job-fit)
  - Uses dedicated IPs for each test group to avoid cross-pollution
  - All 70 rules pass
- Added `verify:contact` script to `package.json`
- All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M18.07)

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

## Completed (M18.06)

- Created `src/components/contact/ContactFormSuccess.tsx`:
  - Success state with checkmark icon, heading, message, and "Send Another Message" button
  - Framer Motion entrance animation (respects reduced motion)
  - Accessible: `role="status"`, `aria-live="polite"`
- Created `src/components/contact/ContactFormError.tsx`:
  - Error state with alert icon, dynamic heading based on error type (validation, rate_limit, server, network)
  - Retry and Dismiss buttons
  - `getErrorType()` helper to classify errors from API response
  - Framer Motion entrance animation (respects reduced motion)
  - Accessible: `role="alert"`, `aria-live="assertive"`
- Updated `src/components/contact/ContactForm.tsx`:
  - Refactored to use ContactFormSuccess and ContactFormError components
  - Proper focus management on error/success
  - Loading state with spinner on submit button
- Updated `src/components/contact/ContactFormField.tsx`:
  - Fixed onChange handler to work with string-based onChange from Input/Textarea
- Updated `src/components/ui/Input.tsx` and `src/components/ui/Textarea.tsx`:
  - Changed onChange prop to accept `(value: string) => void` instead of ChangeEvent
  - Internal handler extracts value and calls parent onChange
  - Maintained all accessibility features (aria-invalid, aria-describedby, role=alert, etc.)
- Updated `src/components/contact/index.ts` to export new components
- All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M18.05)

- Implemented email delivery in `src/lib/contact/email.ts`:
  - Resend provider support with professional HTML/text email templates
  - Console fallback for development/testing
  - HTML escaping for security (prevents XSS in email content)
  - Configurable via environment variables: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
  - 15 unit tests covering HTML/text generation, escaping, config validation, console/resend providers
  - Exported from `src/lib/contact/index.ts`
- Updated environment variables in `src/lib/env.ts`, `src/lib/env.js`, `.env.example` (using `EMAIL_*` prefix)
- All 465 tests pass (459 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M18.04)

- Implemented contact form rate limiter in `src/lib/contact/rateLimiter.ts`:
  - Contact-specific rate limiter with stricter defaults (3 requests/30min, 5/day)
  - Reuses `createRateLimiter` and `RateLimitStore` from `src/lib/ai/rateLimiter.ts`
  - Namespaced keys (`contact:window:`, `contact:daily:`) separate from chat/job-fit
  - Configurable via environment variables: `CONTACT_FORM_WINDOW_SECONDS`, `CONTACT_FORM_MAX_REQUESTS`, `CONTACT_FORM_DAILY_WINDOW_SECONDS`, `CONTACT_FORM_DAILY_MAX_REQUESTS`
  - 17 unit tests covering limit enforcement, window/daily reset, separate buckets, headers
  - Exported from `src/lib/contact/index.ts`
- Updated environment variables in `src/lib/env.ts`, `src/lib/env.js`, `.env.example`
- All 450 tests pass (444 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M18.03)

- Implemented contact form API route at `app/api/contact/route.ts`:
  - POST handler with request validation using M18.01 validation
  - Server-side validation with field-specific errors (400)
  - Contact-specific rate limiting (3/30min, 5/day) via `src/lib/contact/rateLimiter.ts` (17 unit tests)
  - Email delivery via `src/lib/contact/email.ts` with Resend provider support and console fallback
  - Rate limit headers on all responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` (on 429)
  - `Cache-Control: no-store` on all responses
  - Analytics event `contact_form_submission` fired fire-and-forget with no PII
  - Error mapping: validation → 400, rate limit → 429, email failure → 500, unexpected → 500
- Added analytics event type `ContactFormSubmissionEvent` and tracking function `trackContactFormSubmission`
- Added environment variables: `CONTACT_FORM_WINDOW_SECONDS`, `CONTACT_FORM_MAX_REQUESTS`, `CONTACT_FORM_DAILY_WINDOW_SECONDS`, `CONTACT_FORM_DAILY_MAX_REQUESTS`, `CONTACT_EMAIL_PROVIDER`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_FROM_NAME`
- All 450 tests pass (444 pass, 0 fail, 6 skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M17.01)

- Defined the Job Fit Analysis Contract in `src/lib/jobFit/`:
  - `types.ts` – requirement classification (DIRECT_MATCH, STRONG_TRANSFER, RELATED, LEARNABLE, UNKNOWN), alignment bands (strong, transferable, growth), requirement kinds, JobRequirement, ClassifiedRequirement, FitEvidence, JobFitAnalysis, JobFitRequest, JobFitResponse
  - `schema.ts` – zod schema for model answer validation, parser with code fence handling, buildClassifiedRequirements, buildAlignmentBands
  - `limits.ts` – input limits (MAX_JOB_DESCRIPTION_LENGTH=12000, MIN_JOB_DESCRIPTION_LENGTH=80, MAX_ANALYSED_REQUIREMENTS=40, MAX_JOB_FIT_RESPONSE_TOKENS=2048) and PRD §88 fixed wording (UNSUPPORTED_REQUIREMENT_NOTE)
  - `index.ts` – public exports
  - `schema.test.mts` – 15 unit tests covering schema validation, parser behavior, limits, and fixed wording
- All tests pass (15/15), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M17.02)

- Implemented deterministic job description parser in `src/lib/jobFit/jdParser.ts`:
  - `splitLines` – normalises line endings, trims trailing spaces, filters empty lines
  - `stripBullet` – recognises dash, asterisk, unicode bullet, en/em dash, numbered (1., 2), 3 -), checkboxes ([ ], [x], [X])
  - `classifyHeading` – token-based matching for responsibility, requirement, qualification, nice_to_have headings (case-insensitive)
  - `isNoise` – filters salary, equal opportunity, diversity, accommodation, application instructions, benefits, about company, contact, URLs, email-only, phone-only lines (matched at line start)
  - `extractTitle` – finds labelled (Role:, Position:, Job title:, Title:) or "X at Y" pattern or first short non-heading line
  - `extractCompany` – finds labelled (Company:, Organisation:, Organization:, Employer:) or "X at Y" pattern
  - `parseJobDescription` – main parser returning discriminated union with requirements, title, company, omitted count; enforces length limits (80-12000 chars), requirement limit (40, required-first ordering)
- `jdParser.test.mts` – 101 unit tests covering all parser functions, edge cases, and acceptance criteria
- All tests pass (101/101), lint clean (0 errors), typecheck clean, build succeeds
- Total test suite: 335 tests (330 pass, 0 fail, 5 opt-in skipped)

## Completed (M17.03)

- Implemented Job Fit Analysis Engine in `src/lib/jobFit/analysis.ts` with prompt builder in `src/lib/jobFit/prompts.ts`:
  - Single retrieval with classification filter (PUBLIC and PROFESSIONAL only)
  - Prompt enforces PRD §31 (never reject due to gaps), PRD §41 (professional tone), PRD §42 (answer quality), PRD §88 (five classifications, no rejection, fixed wording for unsupported requirements)
  - Job description marked as untrusted data in prompt, system instruction forbids instruction following
  - JSON schema validation via zod with code fence handling and requirement ID validation
  - Fallback analysis when model answer is unparsable, preserving six sections and evidence
  - Output guardrails applied to all text fields (redacts PII, secrets; warns on tone)
  - Injected dependencies (provider, retrieve, clock) for testability
  - Metrics logging without job description or answer content
  - `analysis.test.mts` – 15 unit tests covering happy path, malformed answers, code fences, guardrails, provider errors, metrics logging
  - All 350 tests pass (345 pass, 0 fail, 5 opt-in skipped), lint clean, typecheck clean, build succeeds

## Completed (M17.04)

- Implemented Claim Grounding Validation in `src/lib/jobFit/claimValidation.ts`:
  - Evidence quote check: validates that requirement evidence IDs exist in retrieved evidence and key terms from requirements appear in cited evidence; downgrades unsupported requirements to LEARNABLE with PRD §88 wording
  - Duration check: scans all six narrative fields for experience durations (e.g., "5 years", "3+ years"); removes unsupported durations; drops empty sentences; preserves non-experience durations (company history, job titles, education years)
  - Unsupported claims downgraded to LEARNABLE with PRD §88 wording, never dropped from analysis
  - `claimValidation.test.mts` – 20 unit tests covering requirement validation, duration checks, edge cases, performance
  - `validateClaims` function integrated into analysis engine after model answer parsing, before output guardrails
  - All 370 tests pass (365 pass, 0 fail, 5 opt-in skipped), lint clean, typecheck clean, build succeeds

## Completed (M17.05)

- Implemented Privacy and Safety Guardrails for Job Fit Flow in `src/lib/jobFit/policy.ts`:
  - Input policy with length checks (80-12000 chars), PII redaction via `detectPii`/`redactPii`, injection detection via `detectInjection`
  - Topic classification explicitly NOT run on job descriptions (they are not questions)
  - Sensitive data requests (e.g., "his phone number") allowed as requirements, not blocked
  - Analyzer rate limiter with separate in-memory store, namespaced keys (`jobfit:`), configurable limits (5/30min, 10/day)
  - Output guardrails applied to all six narrative text fields
  - Response validation with evidence as context for grounding checks
  - Validation failure replaces analysis with safe fallback
  - Environment variables added: `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS`, `JOB_FIT_MAX_TOKENS`
  - Updates to `src/lib/guardrails/types.ts`, `src/lib/guardrails/outputValidation.ts`, `src/lib/ai/orchestration.ts`, `src/lib/ai/validation.ts`, `src/lib/env.ts`, `src/lib/env.js`, `.env.example`, `src/lib/githubService.test.mts`
  - `policy.test.mts` – 25 unit tests covering all acceptance criteria
  - All 397 tests pass, lint clean (0 errors), typecheck clean, build succeeds

## Completed (M17.06)

- Created Job Fit API Route at `app/api/job-fit/route.ts`:
  - POST handler with request validation (JSON body, required jobDescription string)
  - Rate limiting via M17.05 policy (5/30min, 10/day, namespaced keys `jobfit:`)
  - Input policy checks (length, PII redaction, injection detection)
  - Analysis execution via M17.03 engine (`analyzeJobFit`)
  - Error mapping: LLMConfigurationError → 503, retryable LLMError → 503, other → 500
  - Rate limit headers on all responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After on 429)
  - `Cache-Control: no-store` header on all responses
  - Analytics event `job_fit_analysis` fired fire-and-forget via `trackJobFitAnalysis`
- Added analytics event type `JobFitAnalysisEvent` and tracking function `trackJobFitAnalysis` in `src/lib/analytics/`
- All 397 tests pass, lint clean (0 errors), typecheck clean, build succeeds

## Completed (M17.07)

- Built the Job Fit Analyzer Interface at `app/job-fit/page.tsx`:
  - Server component page with metadata using `generateBaseMetadata`
  - Client component `JobFitAnalyzer` in `src/components/jobFit/JobFitAnalyzer.tsx` with state management
  - Input field with label, placeholder, character counter (80-12000 chars), auto-resize
  - Analyze button disabled when empty or loading, Ctrl/Cmd+Enter to submit
  - Loading state with TypingIndicator and explanatory text
  - Error state with message, retry and dismiss buttons (reuses ChatError pattern)
  - Results component `JobFitResults` with six PRD §30 sections, three qualitative alignment bars (PRD §89, no percentages), sources list (titles only), CTA with three links (PRD §90), privacy notice (PRD §99) and disclaimer (PRD §100)
  - `AlignmentBars` component with screen reader text alternatives
  - Job description shown above results for reference
  - Light/dark theme support, reduced motion support, keyboard accessible, mobile responsive
  - Job description never stored in browser storage or URL, only sent to `/api/job-fit`
  - Added link to analyzer from chat panel (under suggested prompts)
  - Exports in `src/components/jobFit/index.ts`
  - Notices constants in `src/components/jobFit/notices.ts`
- All 402 tests pass, lint clean (0 errors, only pre-existing warnings), typecheck clean, build succeeds

## Completed (M17.08)

- Added Job Fit Analytics and Entry Points:
  - Extended `JobFitAnalysisEvent` in `src/lib/analytics/eventTypes.ts` with classification counts, requirement counts, retrieval outcome, latency, token usage, model, fallback/replacement flags, corrected claims, redactions, rate limit scope
  - Added `CtaType` with `email` variant for PRD §90 CTA tracking
  - Added `trackJobFitAnalysis` in `src/lib/analytics/analytics.ts` and client wrapper in `src/lib/analytics/client.ts`
  - Updated `app/api/job-fit/route.ts` to fire event with all properties
  - Updated `JobFitResults` to track CTA clicks (resume, LinkedIn, email)
  - Added homepage entry point in `app/page.tsx`
  - Added chat panel link in `src/components/aiChat/ChatPanel.tsx`
  - Navigation unchanged per PRD §8/§92
  - All 402 tests pass, lint clean, typecheck clean, build succeeds

## Completed (M17.09)

- Test and Verify the Job Fit Analyzer End to End:
  - Extended `test-plan.md` with job fit section (30 cases across JFC, JSC, JLC, JIC, JPA)
  - Created opt-in live test `src/lib/jobFit/analysisLive.test.mts` (skips unless LIVE_LLM_TESTS=1, one generation, asserts six sections, valid classifications, no rejection phrases, no unsupported durations, PRD §88 wording)
  - Created fixtures `src/lib/jobFit/fixtures/jobDescriptions.ts` (7 fixtures: strong_match, partial_match, low_overlap, nice_to_have, injected_instruction, personal_data, not_a_job_description)
  - Created verification script `scripts/verifyJobFit.mts` with 6 narrative rules + category-specific rules, exits non-zero on failure
  - Added `verify:job-fit` script to `package.json`
  - Narrative rules shared by live test, script, and unit tests
  - All 30 M17 test cases verified (JFC 5, JSC 3, JLC 4, JIC 13, JPA 5)
  - Privacy verified (JD not in logs/analytics/model, PII redacted, storage clean)
  - Limits verified (5/30min, 10/day, isolated from chat 20/30min, headers on all responses)
  - Interface verified (phone/desktop, keyboard, themes, reduced motion, no percentages)
  - All 403 tests pass (397 pass, 6 opt-in skipped), lint clean, typecheck clean, build succeeds

## Completed (M18.01)

- Defined the Contact Form Data Model and Validation in `src/data/contact.ts` and `src/lib/contact/`:
  - `src/data/contact.ts` – ContactFormData, ContactFormRequest, ContactFormResponse, FieldErrors, CONTACT_FORM_LIMITS constants
  - `src/lib/contact/validation.ts` – Zod schemas for all fields, validateContactForm, validateField, createSuccessResponse, createErrorResponse, isSuccessResponse, isErrorResponse
  - `src/lib/contact/validation.test.mts` – 30 unit tests covering all validation rules (valid inputs, empty fields, length limits, invalid characters, Unicode names, email formats, boundary lengths, multiple errors, field-level validation, pure validation)
  - `src/lib/contact/index.ts` – public exports
  - All 433 tests pass (427 pass, 0 fail, 6 opt-in skipped), lint clean (0 errors), typecheck clean, build succeeds

## Completed (M18.02)

- Created contact form UI components:
  - `src/components/ui/Input.tsx` – Single-line input with label, error state, character counter, helper text, accessibility features
  - `src/components/ui/Textarea.tsx` – Multi-line textarea with auto-resize, label, error state, character counter, helper text
  - `src/components/contact/ContactFormField.tsx` – Wrapper combining label, input/textarea, error message, character counter
  - `src/components/contact/ContactForm.tsx` – Main form component with:
    - Four fields: Name (Input), Email (Input), Company (Input), Message (Textarea)
    - Client-side validation on blur and submit using M18.01 validation
    - Submit handler calls `/api/contact` via fetch
    - Loading state with spinner
    - Success state with confirmation message and "Send Another Message" button
    - Error state with message and retry/dismiss buttons
    - Character counters for all fields
    - Reset form on success
    - Fully keyboard navigable
    - Dark/light theme support
    - Reduced motion support
    - ARIA labels and live regions for accessibility
  - `src/components/contact/index.ts` – exports
  - Updated `src/components/ui/index.ts` with Input and Textarea exports
  - All 433 tests pass (427 pass, 0 fail, 6 opt-in skipped), lint clean (0 errors), typecheck clean, build succeeds

## Planned (M18 – Contact Form)

Task specifications created in `tasks/M18/`:

- M18.01 – Define contact form data model and validation (completed)
- M18.02 – Create contact form UI components (Input, Textarea, ContactForm) (completed)
- M18.03 – Implement contact form API route with validation (completed)
- M18.04 – Add spam protection/rate limiting for contact form (completed)
- M18.05 – Implement email delivery via transactional provider (completed)
- M18.06 – Create success/failure UI states (completed)
- M18.07 – Add contact form to site (homepage/footer) (completed)
- M18.08 – Test and verify contact form end to end (completed)

**Decisions needed before implementation:**
1. Contact form placement: dedicated `/contact` page linked from footer and homepage