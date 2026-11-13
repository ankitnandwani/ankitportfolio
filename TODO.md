# Immediate Next Actions

- Begin implementation of M21.02 – Lazy-load the chat, the palette and the sections below the fold. The specification of the task is in `tasks/M21/02-lazy-loading.md`, and the plan of the milestone is in `tasks/M21/README.md`. The chat and the palette are in the first load of every page today, and the measurement of M21.01 says that the home page sends 1,336,092 bytes of JavaScript in fifteen files before it is usable
- **The answers of the chat and of the feedback carry no cache header at all.** The measurement of M21.01 asked the five routes of the API for an answer, with an empty body so that nothing would be sent, and read the header of the answer: `POST /api/contact`, `POST /api/job-fit` and `POST /api/analytics` answer with `no-store`, and `POST /api/chat` and `POST /api/feedback` answer with no header at all on the path that refuses the request. An answer without a header may be kept by a browser on its own, and the body of the chat and the body of the feedback are what PRD §36 and §78 tell us not to keep. The rule of the cache of M21.07 is the task that fixes it, and the budget of M21.01 already holds the ceiling of zero for the answer of every route
- **Five decisions of M21 need the owner before the tasks that carry them are done**, and they are written down in `tasks/M21/README.md`: which library of icons stays (M21.04), whether the library of the animation is removed (M21.03), how Lighthouse is run (M21.08 and M21.09), what happens to the empty `public/resume.pdf` (M21.06), and how the picture of the social networks is made (M21.06)
- **The account of Sentry is the only thing that is left of M20.08, and it is the owner's.** The address of the service in `.env.local` is still the placeholder of `.env.example`, so nothing has been sent to a project yet, and the one real report of the script was skipped. What has to be done, in this order:
  1. Make a token of Sentry with the rights `org:read`, `project:read`, `project:write` and `project:releases`, in the page of the account, under the API tokens, and put it in `.env.local` next to `SENTRY_ORG` and `SENTRY_PROJECT`. The token is never in the chat and never in the repository
  2. Run `npm run setup:sentry`. It creates the project when it is not there yet, with the platform of Next.js and with the rule of the new issue turned on, and it writes the address of the service into `.env.local` for the server and for the browser
  3. In the page of the project, check that the rule of the new issue sends the mail to the address of the owner, and add a second rule: an issue happens more than ten times in ten minutes
  4. Put the four variables in the deployment, for the running of the site: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_RELEASE` and `NEXT_PUBLIC_SENTRY_RELEASE`
  5. Put the three variables in the **build** of the deployment, so the maps of the source are uploaded: `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN`. The build uploads the maps of the browser by itself, and a failure in the production is read with the code it came from
  6. Run `npm run verify:monitoring` and look for the report that carries the tag `verification: true` in the project
- **The repository of the site is not connected to the service, and that is the decision.** The monitoring does not need it: the maps of the source are uploaded by the build itself, because `next.config.ts` holds the organization, the project and the key. What the connection of the repository adds is the commit and the author next to a frame of the stack, and that is a comfort and not a need
- **The chat leaves a promise that is rejected and that nobody awaits, and the SDK reports it.** `src/components/aiChat/hooks/useChatAPI.ts` builds `metadataPromise` and, inside the promise itself, reads `metadataPromise` to keep the function that resolves it. The promise is not built yet at that moment, so the reading throws `Cannot access 'metadataPromise' before initialization`, the promise is born rejected, and nothing awaits it when the request fails before the metadata is needed. The browser SDK of M20.07 reports it as a failure that nothing caught, and it will do so on every request of the chat. It was found by the verification of M20.07 on 2026-11-08 and it was not fixed there, because the chat is out of the scope of that task. The fix is to keep the function that resolves the promise in a variable of its own, outside the promise
- **The thresholds of the performance are guesses and they have to be checked against the real numbers of the site.** The defaults of M20.06 are thirty seconds for the chat and for the analyzer, twenty-five for the generation, ten for the retrieval and five for the form and for the fetch of GitHub. They were chosen because the answer of the model takes seconds on the free tier, and they have not been compared with the numbers the site really does. The first week of the reports is the moment to see whether a threshold is too low (every answer is reported and the free tier is spent) or too high (a slow answer is never seen). The measurement is already there, so the numbers can be read from the analytics of the latency
- **The GitHub service runs in the browser, where there is no token, so every request of the API is refused with a 401.** The browser has no `GITHUB_TOKEN`, and the service sends the header `Authorization: token undefined`, and GitHub answers "Bad credentials". It was seen on the wire: ten requests, all of them a 401, and the card of every project shows the placeholders of the numbers, so the stars, the forks and the language of the repositories have never appeared on the site. It is not a fault of M20.05: the behaviour of the service is not in the scope of the task, and the site must behave exactly as it did before. The two ways to fix it are to fetch the data on the server, where the token is, or to leave the header out in the browser and let the API answer without a token, which the API allows for a public repository but limits to a few requests an hour
- **The report of the GitHub failure is throttled in the memory of the browser, so a page of the projects sends one report per repository.** The throttle of M20.05 is held in the memory of the process, and the process of a browser is a tab of a visitor. It was measured with the monitoring of the browser turned on: one page of the projects sent five reports, one for each repository, and the second request of each repository was held back by the window. The verification of M20.09 measured it again on 2026-11-11 and it was eight reports on the page of the home, because the page of the home shows eight of the projects. The monitoring of the browser is off today, because `NEXT_PUBLIC_SENTRY_DSN` is not set, so nothing goes out. M20.07 turns the monitoring of the browser on, and it has to decide what happens with the report of the GitHub failure before that day: either the fetch moves to the server, where the throttle is shared, or the report of the GitHub failure is not sent from the browser
- **The failure of the model is reported once, and the SDK reports the streaming path a second time.** The failure of the model is reported by the orchestration, which knows the kind of it, and the route that catches it afterwards writes the line of the local log and does not report it again. The SDK reports the failure of the streaming path a second time on its own, through the hook of `onRequestError` of Next.js, because the failure leaves the route and the stream is ended with an error. The two reports are two different issues: the one of M20.04 is grouped by the kind of the failure, the one of the SDK is the failure of the framework. It was left alone because the configuration of the SDK belongs to M20.01, and M20.09 is the task that looks at the project and decides what the issues of it should be. M20.09 looked at the reports on the wire on 2026-11-11 and could not read the list of the issues of the real project, because the account of Sentry is not set up yet, so the decision is still open
- **The friendly answer never reaches the visitor when the model fails in the streaming path.** The orchestration gives the friendly answer and then rethrows the failure, and the route ends the stream with `controller.error()`, which throws away what was written to it. The visitor gets a stream that is broken instead of the answer that was written for that case. It was checked against the committed code and it is not a fault of M20.04: the behaviour is the one of today. The streaming path is the default of the chat, so the friendly answer is worth fixing, and it is a change of the route of the chat
- **The same failure of a page is reported twice: once by the server and once by the boundary of the browser.** The server saw the failure while it made the page and reported it through the hook of `onRequestError` of Next.js, and the boundary of the browser reported it again with the fixed sentence. The two reports have two different fingerprints, so they are two issues in the project for one failure, and the report of the server holds fifty frames of the stack. It was seen on the wire on 2026-11-11. It is the same family as the finding of the streaming path above, and it was left alone because this task checks
- **The report of the server holds the message of the failure as it came.** The scrubbing of M20.02 removes the personal data and the secrets of the environment, and a text that is neither of the two reaches the project. The site puts nothing that a visitor wrote in a message of a failure today, and the boundary of the browser does not either, but the server does. It was seen on the wire on 2026-11-11, where the message of the failure of the page was in the report of the server
- **The rule of the number of a phone catches the timestamp of the SDK.** The time of the service is ten digits and a run of ten digits looks like a number of a phone, so the audit of the private data has to look at the content of a report and not at the bookkeeping of the SDK. It was found by the audit of M20.09 on 2026-11-11, and the audit was changed, not the site
- **The failure of the model of the analyzer of a job description is not classified.** The analyzer asks the model from `src/lib/jobFit/analysis.ts` and not through the orchestration, so its failures are reported by the route of the analyzer with the kinds of M20.03 and not with the kinds of M20.04. The scope of M20.04 was the orchestration, and the analyzer was left alone
- The nine specifications of M20 are written and the milestone is complete. The plan, the order of the tasks, the table of the requirements and the decisions that need a person are in `tasks/M20/README.md`
- The nine specifications of M21 are written and **M21.01 is done**. The plan, the order of the tasks, the table of the requirements, the decisions that this milestone takes and the five decisions that need a person are in `tasks/M21/README.md`, and the numbers of the site are in `docs/performance-baseline.md`. What the measurement of M21.01 found on 2026-11-13 is written down there: the home page sends 1,336,092 bytes of JavaScript in fifteen files in its first load, of which 136 kB is the runtime of the animation library and 40 kB is the one icon of `lucide-react`; two fonts are preloaded on every page and one of them is used on one page; `/og-image.png` answers 404 while every page announces it; `public/resume.pdf` is empty while the hero links to it; and the CI does not build the site
- **The browser may want the integration of the duplicates back.** It was left out of the SDK because it drops the second of two failures that look the same, and every failure has to be reported. A loop of failures in the page is the case the integration is for, and M20.07 decided that the browser does not need it: the reports of the boundaries are grouped by the fingerprint, so a loop of the same failure is one issue, and the integration would have hidden the second failure of the site
- **The GitHub service of the browser sends one report per repository, and the page of the projects has six of them.** The service runs in the browser, where there is no token, so every request is refused with a 401 and every refusal is a report. The throttle of M20.05 is held in the memory of the browser, so it holds for one tab and not for the next. The task of M20.07 was to decide what happens with it, and the decision is that the report stays as it is: the service really is failing, and the owner has to see that it fails. The fix of the cause is the token of the server, which is a task of its own
- **The delivery of the email of the contact form is not reported yet.** The route answers a 500 when the message could not be sent, but that failure is not caught, so it is not a report. The specification of M20.05 says that the email delivery is a service of its own and that the route of the contact reports it, so it was left alone there. It is still open
- **The SDK of the browser is loaded on its own, and a failure of the very first moment is not seen.** The import of `instrumentation-client.ts` is a dynamic one, so the hundred and fifty kilobytes of the SDK are not part of the first load of a page and the page never waits for them. The price is that the SDK is ready a moment after the page is there. The boundaries of M20.07 work with that: the capture of the boundary waits for the SDK to be ready, so the report is not lost, it is only a moment late
- **Four moderate advisories came with the SDK**, all of them in `@sentry/bundler-plugins`, which only runs at the build. The count of the audit went from 24 to 28 and no new serious one came. The serious ones that were already there are in Next.js 16.3.2 itself and are written down in `TODO.md`
- The findings that M19 left behind are written as specifications in `tasks/M19-followups/`: M19F.01 (one identity for the visitor across the events, so a click can be joined with the conversation and the project counts the visitors and not the sessions), M19F.02 (the page level events of PRD §78: `page_view`, `project_view`, `chat_open` and the click on the contact link) and M19F.03 (the two corrections of M19.06). M19F.03 is done. The other two are worked on after M20, and they are not part of M20
- The four decisions of M20 are answered: the package of Sentry is `@sentry/nextjs` 11.10.0, the performance is watched with a threshold and not with tracing, the local machine reports to a project of its own, and the alerts reach the owner by mail for a new issue and for a failure that repeats. They are written down in `DECISIONS.md`
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

## Completed (M21.01)

- The site is measured and the budget of its size is written down. It was done on 2026-11-13 and it is the first task of the milestone
- Added `scripts/measurePerformance.mts` and the command `npm run perf:budget`. It reads the output of a build, starts the production server on the port 3111, asks it for the HTML of every page and for the headers of the files of `public/`, and prints what it found
- **The measurement reads the build and not the source.** The JavaScript of the first load of a page is taken from the scripts that the HTML of the page names, so that the chunks that are loaded later are not counted as if they were part of the first load
- Added `src/lib/performance/budgets.ts`, which holds a rule for every measure with a note that says where its number came from and when it was read. A rule of the kind `atMost` fails when the value is over its ceiling and a rule of the kind `atLeast` fails when the value is under its floor, so that the cache of a file has a floor and the answer of the API has a ceiling of zero
- **A measure that is new is reported and is not a failure.** The budget grows on purpose, and a measure that nobody thought of never breaks the pipeline by accident
- The script exits with a non-zero code and names the rule when a ceiling is broken: `✗ first-load-js:home: 1.27 MB (1336092 bytes) — the ceiling is 1000 bytes`. It was checked with a ceiling broken on purpose and the file was put back afterwards and the sum of its bytes was checked
- The script exits with a non-zero code and says where it looked when the build is missing. It is checked by a test
- `/projects/[slug]` is written down as not measured, with the reason, and it is not guessed
- The answers of the API are asked for with an empty body, so that the route refuses them before it does any work: no question reaches the model and no form is sent
- Added `docs/performance-baseline.md`, with the numbers of the build, the numbers of the six pages, the table of the cache and the reading of them. It names the three heaviest things: the runtime of the animation library (136 kB in the first load of every page, the task of M21.03), the chat and the palette (the task of M21.02) and the one icon of `lucide-react` (40 kB, the task of M21.04)
- Nothing of the measurement is imported by the site, and it is not in the bundle of the browser
- 13 tests added in `src/lib/performance/budgets.test.mts`. The whole suite: 754 tests with 748 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- One finding was left alone, because this task measures and the fix of a finding is a change of its own: the answers of the chat and of the feedback carry no cache header. It is written down at the top of this file and the task that fixes it is M21.07

## Completed (M20.09)

- The monitoring is verified end to end on 2026-11-11. It is the last task of the milestone and it changes no code
- The script was run against the running site and every rule was met: 16 cases, 260 rules, 260 passed, the exit code 0
- The script was run with a rule broken on purpose: the exit code was 1 and the name of the rule was in the output. The case was put back and the file was byte for byte the file of the repository, which was checked with the sum of its bytes
- The script was run with the server stopped: the exit code was 1 and the reason was printed
- Every kind of report was fired for real and the bytes were read on the wire, with a small forwarding server that wrote the body of every envelope down, the way M19.06 did it with the analytics. Eighteen reports of ten kinds
- Every kind of report was grouped the way it has to be, and the environment of every report was the name the site gives it
- The audit of the private data was made on what the service really received: 280 checks and nothing private. The reports of the failure of the model hold the kind, the status and the name of the model, and the reports of the external services hold the name of the service and the kind
- The boundaries of M20.07 were checked in a browser: the page of the boundary with the focus on the way to try again, and the report of the boundary on the wire with the scope `routes` and with the fixed sentence
- The state of the repository: 741 tests with 735 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds with the server stopped
- No secret is in a tracked file: the six values of the environment that are not placeholders were looked for in the 468 tracked files, and the only one of them that is in a file is the name of the model, which is not a secret
- Three findings were left alone and are written down at the top of this file
- The list of the issues of the real project could not be read, because the account of Sentry is not set up yet. The steps of the account are written down at the top of this file

## Completed (M20.08)

- The monitoring can be checked against the running site on 2026-11-09. Sixteen cases and 248 rules, and the exit code 0
- `src/lib/monitoring/fixtures/monitoringFixtures.ts` holds the cases and the rules, and it is the model of `src/lib/analytics/fixtures/analyticsFixtures.ts`
- The report that a failure produces is built by the capture of the site and caught before it is sent, so the rules are checked against the very payload that the service would receive. The address of the service is a fake one while the cases run
- The rules of the privacy of PRD §79 are checked on every payload: no address of a mailbox, no number of a phone in the written form and as a run of digits, no question, no answer, no description of a job, no form, no key, no token, no address of the service and no address of a visitor
- The phrases that are used to try to smuggle something into a report are made up, and each of them is put where the site really handles it. The identifiers are left out of the text the rules look at, because a digest is a number and a number of ten digits looks like a number of a phone
- The script never writes the value it found, and the line of the local log of the site is quiet while the cases run
- `scripts/verifyMonitoring.mts` and `npm run verify:monitoring` check the status and the answer of every endpoint, check that the answer holds the safe message of the site and never the reason of the failure, and read the failures the server caught out of the file of the server when `SERVER_LOG` is given
- The script exits with a non-zero code when a rule fails and when the server is not running. It was checked with a rule broken on purpose: the exit code was 1 and the name of the rule was in the output
- One real report is sent to the project when the credentials are configured, marked with the tag `verification: true`
- The live part of the failures of the model is only run when `LIVE_LLM_TESTS=1` is given, the same way the live tests of the model are opt-in
- `scripts/setupSentry.mts` and `npm run setup:sentry` create the project and write the address of the service into `.env.local` and nowhere else. The token is never in the chat and never in the repository
- 9 tests added. The whole suite: 741 tests with 735 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- The account is left to the owner, and the steps are written down at the top of this file

## Completed (M20.07)

- The failures of a page are caught and reported on 2026-11-08. A visitor sees a page that works and the owner of the site is told what failed
- `app/error.tsx` is the boundary of the routes and `app/global-error.tsx` is the boundary of the root. The second one renders its own `html` and `body`, because it replaces the whole document
- `src/components/layout/ErrorBoundaryView.tsx` is the page both of them show. It is a page of the site and not a message of the framework: the colours, the radius, the spacing and the typography are the ones of the design system
- The message is in a region of `role="alert"` with `aria-live="assertive"`, the way to try again is a real `button` that the focus is moved to, and the button has a visible ring of focus. PRD §71 is met by both
- `src/lib/monitoring/boundary.ts` holds the one place where the failure of a boundary is reported. The report holds the part of the page and the digest of Next.js, and it holds no message of the failure: only the name of the error and the frames of the stack are kept, because a name is a name of a class of code and a frame is a place in the code
- The report is grouped by the kind and by the part of the page, so a failure of the same boundary is one issue and not one issue every time it happens
- The report goes out on its own and is not awaited, so a visitor never waits for a report. The line of the local log holds the failure as it came, whether the monitoring is on or not
- The digest is its own part of the shape of a failure and it is cleaned like an identifier. The digest of Next.js is a hash and it cannot hold personal data, but it is a number, and the redaction of the personal data was taking it apart and leaving `[REDACTED]` in its place
- The SDK of the browser is handed to the capture through the factory, so the package is never loaded a second time in the page. The decision that was taken in M20.03 is carried out
- The failures that nothing catches are reported by the SDK, through the integration of the global handlers that is one of its defaults. A failed request of the chat, of the analyzer or of the contact form is caught by the site and shown to the visitor, so it is not reported as a failure of the browser
- 19 tests added. The whole suite: 732 tests with 726 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Verified in a real browser with the real SDK: a page that fails on purpose showed the boundary of the routes with the focus on the way to try again, and the report on the wire held the part of the page, the fingerprint and the fixed sentence and held neither the text of the page nor the message of the failure. The layout of the site was made to fail on purpose as well, and the boundary of the root showed and reported with the digest of Next.js. A button that fails on purpose showed that the SDK reports the failures nothing catches
- The browser monitoring found the fault of the chat that is written down above, and it was not fixed here

## Completed (M20.06)

- The slow requests are watched on 2026-11-08. A request that is too slow is reported with the part of it that was slow
- `src/lib/monitoring/performance.ts` holds the one place where an operation that is too slow is reported. `startPerformanceMeasurement()` starts a measurement and the caller ends it, `reportSlowOperation()` reports a duration that is already known, and `readPerformanceThreshold()` reads the threshold of an operation
- The measurement is two reads of the clock and nothing else, so it adds no work to the path of a request. The report goes out on its own and is not awaited, so a slow request does not become a slower request
- The report holds the name of the operation, the duration, the threshold it was measured against, the identifier of the query and the name of the route. It holds no question, no answer, no description of a job and no form
- The report is grouped by the name of the operation, so a slow answer every day is one issue and not a hundred, and it is of the level "warning", because a report of the level "info" cannot be alerted on
- The clock and the reporter are injected, so a test can say that an operation took two thousand milliseconds without waiting two seconds
- The chat route, the analyzer of a job description and the contact form measure the whole request. The answer of the stream of the chat ends the measurement of the chat, because the answer is the work of the request
- The generation and the retrieval are reported apart in the orchestration, so the owner can tell whether to look at the model or at the database. Both numbers were already there
- The fetch of the GitHub service is measured apart from the time of the cache
- The six thresholds are optional in the environment (`PERFORMANCE_*_THRESHOLD_MS`) and are in `.env.example`. A missing one and one that holds something that is not a number both mean the default of the code is used, and a wrong value does not stop the site from booting
- **The tracing of the SDK stays off.** The threshold is the recommendation of the specification and the reason is in `DECISIONS.md`. Turning the tracing on is a change of the configuration of the SDK
- 10 tests added. The whole suite: 713 tests with 707 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Verified on the wire with the real SDK against a database that was made slow on purpose: the request took 34.2 seconds and produced two reports, the retrieval at 33412 ms against a threshold of 10000 ms and the chat at 34239 ms against a threshold of 30000 ms, with the same identifier of the query and no question and no answer in them. A request that took 3.6 seconds produced no report of a slow operation at all

## Completed (M20.05)

- The failures of the services outside the site are watched on 2026-11-07. The failures of the GitHub API and of the database of the knowledge base are reported, told apart and grouped
- `src/lib/monitoring/externalFailures.ts` holds the one place where a failure of a service is reported. The name of the service is `github` or `supabase`, the kind of the failure is `unavailable`, `timeout`, `not_found`, `rate_limited` or `unknown`, and what the site did instead is `cached`, `empty` or `none`
- The report holds the status when the service reported one and the identifier of the request when there is one. The address of a service is only reported when it holds no query, and the name of the repository is reported and not its address
- The report is grouped by the service and by the kind of the failure, so an outage is one issue and not one issue for every repository
- One report goes out per service and repository per window of five minutes, and the count of the failures that piled up is added to the report that follows
- `src/lib/githubService.ts` reports the failure when the fetch fails and says that the site answered with what it had. The report is not awaited, so the visitor waits for nothing. A repository that is not found is not reported, because it is an answer and not a failure of the service
- `src/lib/knowledge/retrieval.ts` reports the failure when the database answers with an error, before it throws it, so the report is not lost when the instance is put to sleep. The message of the database is reduced to its kind and stays in the log of the server
- **The text of a report that is not a failure was never delivered.** The allow-list of the scrubbing held no `message` and no `logentry`, so every report of `captureMessage` arrived with nothing to read. It was found when the first report of M20.05 arrived empty, and both keys are in the list now
- **A report of a service carries its level now.** The SDK gives a message the level "info", which cannot be alerted on. A failure the site answered with what it had is a warning, and a failure that reached the visitor is an error
- The safe shape of a failure holds the tags, the fingerprint and the level of a report, so a report that is not of a route can say what it is about and how it is grouped. The reports of the routes are exactly the ones they were
- 17 tests added. The whole suite: 703 tests with 697 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Verified on the wire with the real SDK: the GitHub service called for real with a wrong token produced one report with the name of the repository, the identifier of the request of GitHub and the status 401, and no token, no address and no query; the database that answers with an error produced one report with no message of the database; three failures of one repository produced exactly one report

## Completed (M20.04)

- The failures of the language model are watched on 2026-11-07. They are reported, they are told apart from one another and they are grouped
- `src/lib/monitoring/aiFailures.ts` holds the one place where a failure of the model is classified. The kinds are `configuration`, `quota`, `timeout`, `unavailable`, `blocked` and `unknown`
- **The classification never reads the text of the message.** It uses the status the provider already carries, the name of the error and the reason the API gives. A message that says "the free tier is spent" is not a failure of the limit when the status does not say so
- The classification never throws. A failure of the classification must not become a second failure that reaches the visitor
- **The reason of the API is carried by the failure now.** `readErrorDetails()` gives it back and `LLMError` holds it, because a request the API refused for its own reasons and a request it refused because the key is wrong are both a 400. The three files were not in the list of the task and the reason is in `DECISIONS.md`
- `src/lib/ai/orchestration.ts` reports the failure of the model in all four places where the model is asked. The report goes out before the friendly answer and is not awaited, so the latency of the visitor does not grow
- **The friendly answer the visitor sees is exactly the one of today.** The words and the order of the steps were not changed, and it was checked against the committed code on the wire
- **The report is grouped by the kind alone**, so a thousand timeouts are one issue and not a thousand. The reports of the routes keep the kind and the route
- **One failure is one report.** The capture marks a failure as reported before its first wait, so the route that catches it afterwards writes the line of the local log and does not report it a second time
- The report holds the kind, the status, the model, the identifier of the query and the moment. It holds no question, no answer, no prompt and no context of the retrieval
- A refusal of the limit of the chat and a question the guardrails refuse are not reported here. The first is reported by the analytics of M19.04 and the second is a normal answer
- 22 tests added. The whole suite: 686 tests with 680 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Verified on the wire with the real SDK and the dev server running: a request with a wrong key produced exactly one report, the one of the route, because the retrieval uses the same key and fails before the model is asked. A request with a model name the API does not know produced exactly one report, the one of the model, with `kind: configuration`, the model, `status: 404` and the fingerprint `["configuration"]`. The report held no key, no question, no answer and no retrieval content

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