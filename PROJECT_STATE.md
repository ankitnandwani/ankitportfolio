# Project State

## Current Phase

- Implementation

## Current Milestone

- M20 – Monitoring (ROADMAP Milestone 20). The task specifications are written (see tasks/M20/), nine of them. M20.01 and M20.02 are implemented and verified, the milestone is in progress

## Status

- M20.01 – Install and configure Sentry; make the monitoring environment variables optional (completed – `@sentry/nextjs` 11.10.0 is installed, the newest stable version, and it declares the support of `next: "^14.0 || ^15.0.0-rc.0 || ^16.0.0-0"`, which the 16.3.2 of this repository satisfies. `src/lib/monitoring/config.ts` holds the one implementation of the configuration, with the shape the analytics of M19 left behind: a missing DSN, a placeholder and a value that is not an http or https URL all mean the monitoring is off, and the DSN is only carried while it is on. `instrumentation.ts` starts the server side SDK and holds the `onRequestError` hook of Next.js 16, which receives the path, the method and the headers of the request and no body. `instrumentation-client.ts` starts the browser side SDK with a dynamic import, so the hundred and fifty kilobytes of the SDK are not part of the first load of a page. `sendDefaultPii` is false and the session recording is off on both sides. `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are optional in the environment now, so the site boots without the three placeholders. The source maps of the browser are kept, because the SDK deletes them whatever happened to the upload. 22 tests added. The build succeeds with and without a DSN, the site boots and answers without one and reports no error of the SDK, and the whole suite, the lint, the typecheck and the build pass)
- M20.02 – Scrub the failures so that nothing private reaches the monitoring service (completed – `src/lib/monitoring/scrub.ts` holds the one layer between the application and the monitoring service, and everything that is sent goes through it. `scrubFailure()` builds the safe shape of a failure out of the parts that are known to be safe, so a field that nobody thought of is not sent by accident: the name of the error, the message, the kind, the route, the method, the status, the moment, the identifier of the query and the stack stay, and everything else is left out. The bodies of the chat, of the analyzer of a job description and of the contact form are removed by the name of their fields, the body of a request is never sent whatever shape it has, the address of a mailbox and the number of a phone are removed from every string that is sent with the redaction the guardrails already hold, the headers that carry a secret are never sent, and the values of the secrets of the environment are removed from every string that is sent. `scrubEvent()` is the backstop and the SDK runs it on every event through the `beforeSend` hook of both sides. The list of the secrets is curated instead of the rule of the guardrails, because every name with an underscore would have removed the number twenty from every message, and a secret shorter than eight characters is not looked for. The hook of `beforeSend` takes the event alone, because the SDK calls it with a hint as well and the hint is not a list of secrets: with the scrubbing handed to the SDK directly every report was lost, which was found by reading the wire. A failure of the scrubbing now takes the place of the event with a safe shape, so the report survives and the event is never sent unchecked. 42 tests added. Verified on the wire with the real SDK: one envelope was sent and it held no address of a mailbox, no number of a phone, no body of a chat, no key, no DSN, no name of a recruiter and no identity of a visitor. The whole suite, the lint, the typecheck and the build pass)
- Task specifications created for M20 – Monitoring (see tasks/M20/). M20.01 through M20.09 are written. M20.01 and M20.02 are implemented and verified, the rest are waiting to be implemented
- The specifications of the findings that M19 left behind are written in `tasks/M19-followups/`: M19F.01 (one identity for the visitor across the events), M19F.02 (the page level events of PRD §78) and M19F.03 (the two corrections of M19.06)
- Task specifications created for M19 – Analytics (see tasks/M19/). M19.01 through M19.06 implemented and verified. The milestone is complete
- M19.01 – Set up PostHog analytics configuration and verify server-side integration (completed – `src/lib/analytics/config.ts` with the one implementation of the configuration, shared by the server side and the browser side: a value that is still the placeholder of `.env.example` counts as no credentials, the host has to be an http or https url, and the credentials are only carried when the analytics are on; `src/lib/analytics/analytics.ts` exports `initPostHog` and takes an injectable client factory through `setPostHogClientFactory`, and the tracking functions read the configuration from the environment by default instead of defaulting to the disabled one; the event sending was fixed, because `posthog-node` v4 takes one message object `capture({ distinctId, event, properties, timestamp })` and the module was calling the version 3 shape `capture(name, properties)`, so every event was sent with no name and no identity and none of them ever arrived; `POSTHOG_KEY` and `POSTHOG_HOST` are now optional in `src/lib/env.ts`, `src/lib/env.js` and `.env.example`, so the site boots without a PostHog project and stays in its console only mode; 44 tests added in `src/lib/analytics/config.test.mts`, `src/lib/analytics/analytics.test.mts` and `src/lib/env.test.mts`; all 509 tests pass, lint clean, typecheck clean, build succeeds)
- M19.02 – Create server-side analytics proxy endpoint for client-side events (completed – `src/lib/analytics/proxy.ts` with the check of the event, the limiter of the proxy and the handler, and `app/api/analytics/route.ts` as a thin boundary; only the event types on a list are accepted and an unknown field is refused rather than dropped, so a client cannot put anything of its own into an event; the target has to be a bare host name, so a path, a port or an e-mail address cannot pass as one; the proxy has its own limiter with its own store and namespaced keys, so the events of a visitor never use up the allowance of the chat; a request whose origin is not the site is refused; the event is flushed before the answer goes out, because a serverless function is put to sleep as soon as it has answered and an event that is still queued can be lost; 34 tests added in `src/lib/analytics/proxy.test.mts`; verified against the running site, including the payload on the wire; all 543 tests pass, lint clean, typecheck clean, build succeeds)
- Task specifications created for M18 – Contact Form (see tasks/M18/). M18.01 through M18.08 implemented and verified.
- M19.03 – Enable client-side CTA click tracking via proxy endpoint (completed – `src/lib/analytics/client.ts` now sends the click of a call to action to the proxy of M19.02 instead of only writing it to the console: a POST to `/api/analytics` with the session, the query, the kind of the call to action and the host it points at, sent and not awaited so a click opens the link straight away, and marked to stay alive so the event still goes out when the page goes away; nothing in the path of the visitor throws, a failed answer is a line in the console and nothing more; the session of the browser is kept in the storage of the tab, so a visitor who reloads the page is still in the same session, with the memory as the fallback when the storage is refused; the browser branch of `src/lib/analytics/config.ts` was changed, because the browser cannot see the credentials and therefore cannot know whether the server forwards the events, so it reports them to the server of the site and the server decides, which is where the old "off in the browser" left every click uncounted; the browser does not send a timestamp, because the proxy refuses a field that is not part of the event and the server puts the moment on the event with the clock that counts; the three handlers of `src/components/jobFit/JobFitResults.tsx` no longer wait for the tracking; 17 tests added in `src/lib/analytics/client.test.mts`; verified in a real browser on the running site, the click of "Connect on LinkedIn" was answered with 200 and went on to PostHog with no flush error, and the click of "Download Resume" navigated away while the request was still on its way and the answer came in after the page had gone, which is the case the `keepalive` is there for, with the identifier of the query the same one the analysis carries; all 566 tests pass, lint clean, typecheck clean, build succeeds)
- Two faults of the milestone M17 were found and fixed while the manual test of this task was carried out. `app/api/job-fit/route.ts` answered with a `meta` object while the contract of `JobFitResponse`, the check of the interface and the component itself all read the metadata under `metadata`, so every successful analysis of a job description showed "Received an unexpected response" and the results never appeared; the route now answers with the metadata the contract declares, and the identifier of the query goes on it, so the analysis and the click on a call to action can be tied together. The two calls to action that point at the site read the host with `new URL(siteConfig.url)`, which threw while the address of the site is still the placeholder of `.env.example`, so the click of the visitor did nothing and the event was never sent; `getSiteHost()` in `src/siteConfig.ts` reads the host when it can and falls back to the known address when it cannot, with 6 tests added in `src/siteConfig.test.mts`
- M19.04 – Add missing PRD events and verify all events fire correctly (completed – the audit of PRD §46, §47, §48 and §90 is recorded in `tasks/M19/README.md`; the event of a refused request was added per PRD §48, a new event type `rate_limit_exceeded` with the scope, the part of the site that was asked for and the wait, built by `trackRateLimitExceeded()` in `src/lib/analytics/analytics.ts` and put on the queue by `reportRateLimitExceeded()` in the new module `src/lib/analytics/rateLimit.ts`, which the three routes call when they refuse a request, because a route cannot be loaded by the test runner; the session of the visitor is now worked out before the limit is checked in `/api/chat`, `/api/job-fit` and `/api/contact`, so the event of a refusal belongs to a session; `chat_session_start` was defined and never fired, and now fires on the first message of the chat, with the start of a chat remembered on its own because the session of a visitor is shared with the whole site; the feedback of `/api/feedback` was given a session of its own for every request, which put it apart from the conversation it is about, and now carries the session of the visitor; 10 tests added; verified against the running site, a message of the chat fires the three events of the conversation, a second message does not fire the start of the chat again, each of the three parts of the site answers with 429 and fires the event with the right endpoint and the wait that matches the answer, the feedback carries the same session as the conversation, and the event was seen on the wire with no personal data; all 576 tests pass, lint clean, typecheck clean, build succeeds)
- M19.05 – Create analytics verification script and test plan (completed – the new `scripts/verifyAnalytics.mts` runs 24 cases against the running site and checks 405 rules, and the new `src/lib/analytics/fixtures/analyticsFixtures.ts` holds the cases: the events of the conversation, of the analysis of a job description, of the contact form, of the feedback, of the calls to action and of the refusals, with the edges of the proxy. The event is built by the tracking function of the site and caught before it is sent, so the rules are checked against the very payload PostHog would receive; the live part is indirect, the request is made and the answer is checked, and the event the server really counted is read from the file of the server when `SERVER_LOG` is given. Every case has an address of its own from the range the documentation sets aside, and a new one is used for every run, so the limit of a day is never carried over; the refusals are reached with requests that are refused before anything is made, so no answer is paid for, and the number of requests follows the limit the site is configured with. `package.json` has `verify:analytics`, and `test-plan.md` has the section of the milestone. The run on 2026-10-29 passed every rule with the exit code 0)
- M19.06 – Test and verify analytics end to end (completed – the verification script of M19.05 was run against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0, and a run with a rule broken on purpose answered with the exit code 1 and named the rule; the whole suite was run again, 576 tests with 570 pass, 0 fail and 6 skipped, lint clean with 0 errors and the same 58 warnings, typecheck clean, build succeeds; every event of the catalogue was fired for real against the real PostHog project and the payload on the wire was read with a small forwarding server that wrote the body down and passed it on to PostHog, so the project still received every event and the exact bytes could be checked, and the file that held the key was deleted at once; the server reported no error of the flush in any of the runs; the project itself was checked in the browser, and the activity log of project 325584 shows all eight kinds of event, every one of them with the library `posthog-node`, the identity of the session and the `GeoIP disabled` on; the audit of the private data of the real payloads found no address of a mailbox, no number of a phone in either form, no address of a computer and no run of ten digits in any of the eight kinds of event, the contact form carries only four booleans of which fields were filled in, the analysis of a job description carries only counts and times, and the event of a refusal carries only the identifier of the query, the scope, the part of the site and the wait; a comment of the feedback that held a telephone number and an address of a mailbox arrived on the wire as `[REDACTED]`; the events of the server share one session and the click of the browser carries the session of the tab; three findings were left alone and are recorded in TODO.md; this task changed no code)
- Task specifications created for M17 – Job Description Analyzer (see tasks/M17/). M17.01 through M17.09 implemented and verified.
- M18.01 – Define Contact Form Data Model and Validation (completed – `src/data/contact.ts` with ContactFormData, ContactFormRequest, ContactFormResponse, FieldErrors, CONTACT_FORM_LIMITS; `src/lib/contact/validation.ts` with Zod schemas, validateContactForm, validateField, createSuccessResponse, createErrorResponse, isSuccessResponse, isErrorResponse; `src/lib/contact/validation.test.mts` with 30 unit tests covering all validation rules; all tests pass, lint clean, typecheck clean, build succeeds)
- M18.02 – Create Contact Form UI Components (completed – `src/components/ui/Input.tsx`, `src/components/ui/Textarea.tsx`, `src/components/contact/ContactFormField.tsx`, `src/components/contact/ContactForm.tsx` with full form state management, validation, loading/success/error states; accessibility features including ARIA labels, live regions, keyboard navigation; dark/light theme support; reduced motion support; Framer Motion animations; all 433 tests pass, lint clean, typecheck clean, build succeeds)
- M17.01 through M17.09 completed and verified (see previous entries).
- M17.01 – Define the Job Fit Analysis Contract (completed – types, zod schema, limits and fixed wording of PRD §88 in `src/lib/jobFit/`, 15 unit tests pass)
- M17.02 – Parse a Job Description into Requirements (completed – deterministic parser in `src/lib/jobFit/jdParser.ts` with 101 unit tests covering bullet points, numbered lists, checkboxes, heading recognition, noise filtering, title/company extraction, length limits, requirement limit with required-first ordering; all tests pass, lint clean, typecheck clean)
- M17.03 – Implement the Job Fit Analysis Engine (completed – engine in `src/lib/jobFit/analysis.ts` with prompt builder in `src/lib/jobFit/prompts.ts`; single retrieval with classification filter, prompt enforcing PRD §31/§41/§42/§88 rules, JSON schema validation with fallback, output guardrails on all text fields, injected dependencies for testability; 15 unit tests cover happy path, malformed answers, code fences, guardrails, provider errors, metrics logging; all 345 tests pass, lint clean, typecheck clean, build succeeds)
- M17.04 – Enforce the Job-Matching Rule with Claim Grounding Validation (completed – deterministic validation in `src/lib/jobFit/claimValidation.ts`; evidence quote check and duration check per PRD §31/§88; unsupported claims downgraded to LEARNABLE with PRD §88 wording; 20 unit tests cover all cases; all 370 tests pass, lint clean, typecheck clean, build succeeds)
- M17.05 – Apply the Privacy and Safety Guardrails to the Job Fit Flow (completed – input policy in `src/lib/jobFit/policy.ts` with length checks, PII redaction via `detectPii`/`redactPii`, injection detection via `detectInjection` (topic classification explicitly not run); analyzer rate limiter with separate store, namespaced keys (`jobfit:`), configurable limits (5/30min, 10/day); output guardrails applied to all text fields; response validation with evidence as context; validation failure replaces analysis with safe fallback; environment variables `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS`, `JOB_FIT_MAX_TOKENS` added to `src/lib/env.ts`, `src/lib/env.js`, `.env.example`; all 397 tests pass, lint clean, typecheck clean, build succeeds)
- M17.06 – Create the Job Fit API Route (completed – `app/api/job-fit/route.ts` with POST handler; request validation, rate limiting via M17.05 policy, input policy checks, analysis execution via M17.03 engine, error mapping (LLMConfigurationError → 503, retryable LLMError → 503, other → 500), rate limit headers on all responses, `Cache-Control: no-store`, analytics event `job_fit_analysis` fired fire-and-forget; added `JobFitAnalysisEvent` to analytics with `trackJobFitAnalysis` function; all 397 tests pass, lint clean, typecheck clean, build succeeds)
- M17.07 – Build the Job Fit Analyzer Interface (completed – `app/job-fit/page.tsx` server component with metadata; `src/components/jobFit/JobFitAnalyzer.tsx` client component with input field (label, placeholder, character counter 80-12000 chars, auto-resize), analyze button (disabled when empty/loading), loading state (TypingIndicator with explanatory text), error state (retry/dismiss), results component `JobFitResults` with six PRD §30 sections, three qualitative alignment bars (PRD §89, no percentages), sources list (titles only), CTA with three links (PRD §90), privacy notice (PRD §99) and disclaimer (PRD §100); `AlignmentBars` component with screen reader text alternatives; job description shown above results; theme/reduced-motion/keyboard/mobile support; description never stored in browser/URL; link added to chat panel; all 402 tests pass, lint clean, typecheck clean, build succeeds)
- M17.08 – Add Job Fit Analytics and Entry Points (completed – extended `JobFitAnalysisEvent` in `src/lib/analytics/eventTypes.ts` with classification counts, requirement counts, retrieval outcome, latency, token usage, model, fallback/replacement flags, corrected claims, redactions, rate limit scope; added `CtaType` with `email` variant; added `trackJobFitAnalysis` in `src/lib/analytics/analytics.ts` and client wrapper in `src/lib/analytics/client.ts`; updated `app/api/job-fit/route.ts` to fire event with all properties; updated `JobFitResults` to track CTA clicks (resume, LinkedIn, email); added homepage entry point in `app/page.tsx`; added chat panel link in `src/components/aiChat/ChatPanel.tsx`; navigation unchanged per PRD §8/§92; all 402 tests pass, lint clean, typecheck clean, build succeeds)
- M17.09 – Test and Verify the Job Fit Analyzer End to End (completed – extended `test-plan.md` with job fit section (30 cases across JFC, JSC, JLC, JIC, JPA); created opt-in live test `src/lib/jobFit/analysisLive.test.mts` (skips unless LIVE_LLM_TESTS=1, one generation, asserts six sections, valid classifications, no rejection, no unsupported duration, PRD §88 wording); created fixtures `src/lib/jobFit/fixtures/jobDescriptions.ts` (7 fixtures: strong_match, partial_match, low_overlap, nice_to_have, injected_instruction, personal_data, not_a_job_description); created verification script `scripts/verifyJobFit.mts` with 6 narrative rules + category-specific rules, exits non-zero on failure; added `verify:job-fit` script to package.json; narrative rules shared by live test, script, and unit tests; all 30 M17 test cases verified (JFC 5, JSC 3, JLC 4, JIC 13, JPA 5); privacy verified (JD not in logs/analytics/model, PII redacted, storage clean); limits verified (5/30min, 10/day, isolated from chat, headers on all responses); interface verified (phone/desktop, keyboard, themes, reduced motion, no percentages); all 403 tests pass (397 pass, 6 skipped), lint clean, typecheck clean, build succeeds)
- Milestone 13 (AI Knowledge Base) is complete and was independently re-verified before this milestone was planned: 219 tests (214 pass, 0 fail, 5 opt-in skipped), lint 0 errors with 3 pre-existing warnings, typecheck clean, build succeeds, CI (lint, typecheck, test) green.
- ROADMAP Milestones 14 (Gemini Integration), 15 (AI Guardrails) and 16 (AI Chat UX) were delivered inside the Milestone 13 bundle as tasks M13.06 to M13.11. The folders tasks/M14/, tasks/M15/ and tasks/M16/ now point at where the work lives.
- Task specifications created for M13 – AI Knowledge Base (see tasks/M13/).
- M13.01 – Define AI Knowledge Base Document Format and Schema (completed)
- M13.02 – Set Up Supabase Client Wrapper and Environment Validation (completed)
- M13.03 – Implement Document Ingestion Pipeline (completed – pipeline processes 11 structured source types plus markdown documents, redacts PII, stores documents and chunks idempotently with version tracking, and is covered by 64 tests including an end-to-end run against an in-memory Supabase double; verified against the live Supabase project on 2026-10-24, 39 documents and 39 chunks stored, row level security confirmed blocking the anon key)
- M13.04 – Implement Embedding Generation and Vector Storage (completed – embedding service, Gemini adapter, storage layer and the `npm run embed` backfill, covered by 27 tests; verified against the live project on 2026-10-24, all 39 chunks carry a normalised 768 dimension vector)
- M13.05 – Implement Vector Search Retrieval with Metadata Filtering (completed – retrieval service, shared types and the `match_knowledge_chunks` database function, covered by 9 unit tests and 6 live tests against the real knowledge base; the similarity threshold was tuned against the measured score distribution on 2026-10-24)
- M13.06 – Create LLMProvider Abstraction and Implement GeminiProvider (completed – the provider contract in `src/lib/llm/provider.ts`, the Gemini adapter in `src/lib/llm/geminiProvider.ts`, a factory that builds the provider from the environment, and 25 unit tests plus 6 live tests against the real Gemini API; generation, streaming, timeouts, retries on transient failures, token usage and provider independent error messages are all in place)
- M13.07 – Implement AI Guardrails (completed – topic classification, personal data detection, prompt injection detection, output validation, professional redirects and guardrail logging under `src/lib/guardrails/`, covered by 57 tests including the false positive checks for the suggested questions of PRD §29 and the attacks of PRD §38; the phone number redaction of the ingestion pipeline was bounded as well, because it could be slowed down by a long run of digits)
- M13.08 – Create AI Chat UI Components (completed – chat launcher (floating button), chat panel (desktop floating / mobile full-screen modal), message bubbles (user/assistant), streaming response with blinking cursor, suggested prompts, typing indicator, error states with retry/dismiss, conversation reset, keyboard navigation (Escape to close, Tab trap), focus management, reduced-motion support, NeoPOP design tokens, Framer Motion animations; integrated into root layout via ChatWrapper; API route at `/api/chat` with guardrails, knowledge retrieval, and LLM streaming; 189 tests pass)
- M13.09 – Integrate Retrieval and Generation (RAG Pipeline) (completed – orchestration service in `src/lib/ai/` with `processChatMessage` and `processChatMessageStream`, prompt templates, types; API route updated to use orchestration layer; input guardrails, retrieval, prompt construction, LLM generation, and output guardrails all wired end-to-end; streaming and non-streaming modes supported; comprehensive metrics logging)
- M13.10 – Implement Response Validation, Safety Checks, and Rate Limiting (completed – the response validation in `src/lib/ai/validation.ts` and the rate limiter in `src/lib/ai/rateLimiter.ts`, both wired into the chat route: a visitor is counted before the request is processed and the answer is checked before it is sent; 25 tests; verified against the running site with the rate limit headers, the 429 answer and the streamed final chunk)
- M13.11 – Add Analytics, Feedback Loop, and Phone Number Redaction (completed – analytics tracking in `src/lib/analytics/` with privacy-conscious session IDs, message/response/feedback events, PostHog integration; feedback UI in `src/components/aiChat/FeedbackButton.tsx` with thumbs up/down and optional comment; `/api/feedback` endpoint; knowledge base scan script `scripts/scanKnowledgeBase.mts` for phone number verification; chat API route updated to track message sent and response received events; all tests pass)
- M13.12 – End-to-End Testing and Verification (completed – 40 test cases executed covering functional correctness (10), safety/guardrails (10), edge cases (6), performance (4), and integration (10); all pass; knowledge base verified with 39 documents, 39 chunks with embeddings, 0 PII; response time <5s avg; rate limiting enforced at 20 req/30min; analytics and feedback operational; test plan documented in test-plan.md)
- M10.01 (Define resume data model) completed.
- M10.02 (Create resume page route and layout) completed.
- M10.03 (Create resume summary component and integrate summary data) completed.
- M10.04 (Create resume experience component and integrate experience data (from career timeline)) completed.
- M10.05 (Create resume skills component and integrate skills data) completed.
- M10.06 (Create resume education component and integrate education data) completed.
- M10.07 (Create resume certifications component and integrate certifications data) completed.
- M10.08 (Create resume achievements component and integrate achievements data) completed.
- M10.09 (Add PDF download button and link) completed.
- M10.10 (Ensure responsiveness, accessibility, and phone number redaction) completed.
- M10.11 (Add animations and final polishing) completed.
- M11.01 (Update social links configuration) completed.
- M11.02 (Create SocialHub component) completed.
- M11.03 (Integrate SocialHub component into homepage layout) completed.
- M11.04 (Update footer to be minimal) completed.
- M11.05 (Ensure SocialHub accessibility and responsiveness) completed.
- M11.06 (Add animations and final polishing) completed.
- M12.01 – Define testimonial data model and create testimonial data (completed)
- M12.02 – Create testimonial card component (completed)
- M12.03 – Create testimonials section component (completed)
- M12.04 – Integrate testimonials section into homepage layout (completed)
- M12.05 – Add animations and interactive states (completed)
- M12.06 – Ensure responsiveness, accessibility, and conditional rendering (completed)
- M12.07 – Add final polishing and verify design consistency (completed)

## Next Task

- M20.02 – Scrub the failures so that nothing private reaches the monitoring service (the next action: begin implementation of M20.02. The specification is `tasks/M20/02-error-scrubbing.md`)
- M19F.03 – Close out the findings of the verification of M19 (completed – the comment of `app/api/analytics/route.ts` now describes what the code does: the request from another site and the body that cannot be read are refused before the counting and carry no headers of the limit, and the reason is written down. The limits of the analyzer now come from the environment: `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS` and `JOB_FIT_DAILY_MAX_REQUESTS`, read when the limiter is built, the way the chat and the contact form do, and a variable that is missing or that holds something that is not a positive number is ignored so the default of the code is used. Six tests added; verified against the running site, a limit of two answers with 429 on the third and the headers carrying the values that were applied, and the daily window of the environment putting the reset a minute away instead of two hours. The behaviour of the proxy was not changed and the verification of M19.05 still passes every rule. All 582 tests pass, lint clean, typecheck clean, build succeeds)
- The nine specifications of M20 are written. The plan of the milestone, the order, the table of the requirements and the decisions that need a person are in `tasks/M20/README.md`
- M19F.01 (one identity for the visitor across the events) and M19F.02 (the page level events of PRD §78) are written in `tasks/M19-followups/` and are worked on after M20. They are changes of the design of the analytics and are not part of M20
- Milestone 19 – Analytics is complete. All six tasks are done and verified
- The events of M19 were verified for real on 2026-11-03. Every event of the catalogue was fired against the real PostHog project and the payload on the wire was read, and the project itself was opened in the browser: the activity log of project 325584 shows all eight kinds of event with the library `posthog-node`, the identity of the session and the `GeoIP disabled` on
- The PostHog project is set up and the credentials are in `.env.local` (EU cloud). The events now reach a real PostHog, verified on 2026-10-29: the capture endpoint answered `{"status":"Ok"}`, a real event went out of the app with no flush error, and the payload on the wire carries the `distinct_id`, the event name, the properties, an ISO timestamp and `$geoip_disable: true`. The key is in `.env.local` only and is in no tracked file
- The click of a call to action is counted from the browser through the proxy of M19.02, verified in a real browser on 2026-10-29. The click of "Download Resume" navigated away while the request was still on its way, and the answer came in after the page had gone, which is the case the `keepalive` is there for. The identifier of the query on the event is the same one the analysis carries, so the two can be tied together in PostHog
- The proxy of M19.02 flushes the event before the answer goes out, so it is not lost when the instance is put to sleep. The other routes still leave their events in the queue of the client, which is safe on a process that stays alive but not on a serverless function that is frozen. This matters from M24, the production deployment
- The limits of the proxy are fixed in the code at a hundred events a minute and a thousand a day, because they guard against abuse and not against the cost of the model. The limits of the chat and of the contact form are configurable through the environment
- **The limits of the job fit analyzer are now read from the environment.** `src/lib/jobFit/policy.ts` used the constants of the code and never looked at `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS` or `JOB_FIT_DAILY_WINDOW_SECONDS`, although the variables are declared in `src/lib/env.ts` and written in `.env.example`. PRD §48 asks for the limits to be configurable through the environment, and the chat and the contact form already are. This was found while testing the refusal of the job fit, was left alone because it belongs to the limits and not to the analytics, and was closed by M19F.03 on 2026-11-04: the four variables are read when the limiter is built, and a missing or an invalid value means the default of the code
- The events of the browser and the events of the server carry **two different sessions**: the browser keeps its session in the storage of the tab and the server keeps its own in the memory of the process. A click on a call to action therefore cannot be joined with the conversation of the same visit in PostHog. This comes from M19.01 and M19.03 and was left alone, because joining them means a change of the design of the proxy
- **PostHog counts a session as a person.** The identifier of the session is the identity of the event, so every session becomes a person of its own in the project. The number of people is therefore the number of sessions and not the number of visitors. It was seen in the activity log on 2026-11-03 and comes from the decision of M19.01. It was left alone, because it is a change of the design of the identity and not a test
- **A visit from the local machine reaches the real PostHog project.** There is no project of its own for the work on the machine, so the clicks of a developer land in the numbers of the site. A project of its own for the work on the machine would keep the two apart
- The verification script of M19.05 runs the cases of the catalogue against the running site with `npm run verify:analytics`. It needs the server to be running, and it reads the file of the server when `SERVER_LOG` is given, so the events the server really counted can be seen in the report
- **The comment of `app/api/analytics/route.ts` tells the truth now.** It used to say that every answer of the proxy carries the headers of the limit and that the request is counted before anything is parsed. The code does not do that for the two answers that are refused before the counting, the request from another site and the body that cannot be read. Counting a request from another site would let it use up the allowance of a visitor, so the code was right and the comment was wrong. The comment was corrected by M19F.03 on 2026-11-04 and the behaviour of the proxy was not changed
- **Two more variables of the environment are declared and never read.** `CONTACT_FORM_DAILY_WINDOW_SECONDS` and `JOB_FIT_MAX_TOKENS` are declared in `src/lib/env.ts` and written in `.env.example`, but `src/lib/contact/rateLimiter.ts` never looks at the first one and `src/lib/jobFit/analysis.ts` uses the constant `MAX_JOB_FIT_RESPONSE_TOKENS` instead of the second. They are the same kind of finding as the one M19F.03 closed, and they were left alone because that task closed two specific findings. They should be a change of their own
- The events that carry a group of properties put them in a `properties` object of their own, so they reach PostHog one level deeper than the other events. The audit of the whole catalogue was made in M19.04 and is recorded in `tasks/M19/README.md`
- `SENTRY_DSN` and the two `UPSTASH_REDIS` variables are still required by the environment validation, although they are only placeholders and the milestones that use them have not been reached. M20 is the task that changes that
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch
- The standing items are listed in TODO.md

## Completed (M20.01)

- The monitoring was put in place on 2026-11-04. This task changed no behaviour of the site: nothing is captured yet, that is M20.03 to M20.07
- **The SDK.** `@sentry/nextjs` 11.10.0 was installed, the newest stable version. The support was read before it was installed: the package declares `next: "^14.0 || ^15.0.0-rc.0 || ^16.0.0-0"`, and the version of Next.js in this repository is 16.3.2. The installation brought four moderate advisories through the package of the build, and no new serious one: the count of the audit went from 24 to 28, and the four that are new are all in `@sentry/bundler-plugins`, which only runs at the build
- **The convention of the installed version was followed, not the one of the written task.** The task named `sentry.server.config.ts` and `sentry.client.config.ts`, and it was written before the version of the SDK was known. The installed version says at the build that such a file is an outdated configuration and asks for its content to be put into the `register()` function of the instrumentation file. The files are therefore `instrumentation.ts` and `instrumentation-client.ts`, and no `sentry.*.config.ts` was created. The reason is written in `DECISIONS.md`
- **The configuration has one implementation.** `src/lib/monitoring/config.ts` holds it, with the shape the analytics of M19 left behind: a missing DSN, a placeholder of `.env.example` and a value that is not an http or https URL all mean the monitoring is off, and the DSN is only carried while it is on. The options the SDK is started with are built by the same module, so the server and the browser cannot disagree about what is collected
- **The privacy of the SDK.** `sendDefaultPii` is false and the session recording is off on both sides, and the tracing is off as well
- **The framework level hook.** `instrumentation.ts` holds the `onRequestError` hook of Next.js 16, which receives the path, the method and the headers of the request and no body
- **The SDK of the browser is loaded on its own.** A static import put a hundred and twenty five kilobytes gzipped into the first load of the homepage, which is a growth PRD §74 would notice. The import is a dynamic one now: the chunk of a hundred and fifty kilobytes gzipped is not part of the first load, the first load of the homepage is the same as it was, and when there is no DSN the chunk is never fetched
- **The source maps of the browser are kept.** The SDK deletes them once they are uploaded, and the deletion runs whatever happened to the upload, so without this the maps would be deleted by a build that never uploaded them
- **The environment stops demanding what nothing reads.** `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are optional now, and the site boots without the three placeholders. The browser has a DSN of its own, `NEXT_PUBLIC_SENTRY_DSN`, because a DSN of Sentry is not a secret and the key of the project never leaves the server
- 22 tests were added: 20 in `src/lib/monitoring/config.test.mts` and 2 in `src/lib/env.test.mts`. The whole suite was run again: 604 tests with 598 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean
- The build was run by hand twice, because the CI does not run it: once with no DSN and once with one. Both succeed. The site boots and answers with no DSN and reports no error of the SDK

## Completed (M19F.03)

- The two findings that the verification of M19 left behind were closed on 2026-11-04
- **The comment of the proxy tells the truth.** `app/api/analytics/route.ts` now says that the request from another site and the body that cannot be read are refused before the counting and carry no headers of the limit, and it says why: counting a request from another site would let that site use up the allowance of a visitor. The behaviour of the proxy was not changed, and the verification of M19.05 still passes every rule
- **The limits of the analyzer come from the environment.** `getJobFitPolicy()` reads `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS` and `JOB_FIT_DAILY_MAX_REQUESTS` when the limiter is built, the way `getRateLimiter()` of the chat and `getContactRateLimiter()` of the contact form do. A variable that is missing, or that holds something that is not a positive number, is ignored, so the default of the code is used. The limits are read once, when the limiter is built, and not on every request
- Six tests were added in `src/lib/jobFit/policy.test.mts`: the limits come from the environment, the defaults are used when the variables are missing, a value that is not a number is ignored, the daily limit is independent of the window, and the window and the daily window that are used are the ones of the environment
- The tests were proved to depend on the change: with the reading of the environment removed, the test of the limits coming from the environment fails, and the file was put back byte for byte
- Verified against the running site: with `JOB_FIT_MAX_REQUESTS=2` the third analysis is refused with a 429 and the headers carry `x-ratelimit-limit: 2`, and with `JOB_FIT_DAILY_WINDOW_SECONDS=60` and `JOB_FIT_WINDOW_SECONDS=7200` the reset is a minute away instead of two hours. The requests were refused before the analysis, so no answer was paid for
- The whole suite was run again: 582 tests with 576 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds
- Two more variables of the environment were found while the task was carried out and were left alone: `CONTACT_FORM_DAILY_WINDOW_SECONDS` and `JOB_FIT_MAX_TOKENS` are declared and never read

## Completed (M19.06)

- The verification of the analytics was made end to end on 2026-11-03. This task changed no code, it only checked the work of M19.01 to M19.05
- The script of M19.05 was run against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0. The script was also run with a rule broken on purpose, and it answered with the exit code 1 and named the rule that failed, so it really fails when it should
- The whole suite was run again: 576 tests with 570 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings as before; typecheck clean; the build succeeds
- Every event of the catalogue was fired for real against the real PostHog project:
  - The wire was read with a small forwarding server, which wrote the body down and passed it on to `https://eu.i.posthog.com`. The real project therefore received every event and the exact bytes could be checked at the same time. The file that held the key was deleted at once with `mavis-trash`, and so was the forwarder
  - The eight kinds of event that were seen on the wire: `chat_session_start`, `message_sent`, `response_received`, `feedback_given`, `cta_clicked`, `contact_form_submission`, `job_fit_analysis`, `rate_limit_exceeded`
  - The server reported no error of the flush in any of the runs
- The project itself was opened in the browser and the activity log of project 325584 was read. All eight kinds of event are there, every one of them with the library `posthog-node`, the identity of the session and the `GeoIP disabled` on
- The audit of the private data of the real payloads:
  - No address of a mailbox, no number of a phone in the written form and no run of ten digits on its own, no address of a computer, in any of the eight kinds of event
  - `$geoip_disable: true` is on every event
  - `contact_form_submission` carries only which fields were filled in, four booleans, and never what was written
  - `job_fit_analysis` carries only counts and times
  - `rate_limit_exceeded` carries only the identifier of the query, the scope, the part of the site and the wait
  - A comment of the feedback that held a telephone number and an address of a mailbox arrived on the wire as `'Call me on [REDACTED] or email me at [REDACTED]'`
- The sessions join up the way they should: the events of the server share one session, the refusal has one of its own, and the click of the browser carries the session of the tab
- Three findings were left alone, because they are changes of their own and this task only checks:
  - The limits of the job fit analyzer are still not read from the environment (see the standing items)
  - The events of the browser and the events of the server still carry two different sessions (see the standing items)
  - The comment of `app/api/analytics/route.ts` still overstates the headers and the counting of the proxy (see the standing items)
- Two things that were found while reading the project in the browser:
  - **The project counts a session as a person.** The identifier of the session is the identity of the event, so every session becomes a person of its own in PostHog and the number of people is not the number of visitors. This comes from the decision of M19.01 and was left alone
  - **A visit from the local machine reaches the real project.** There is no separate project for the work on the machine, so the clicks of a developer land in the numbers of the site. A project of its own for the work on the machine would keep the two apart

## Completed (M19.05)

- The verification script `scripts/verifyAnalytics.mts` runs the cases of the catalogue of events against the running site and writes a report with the result of every rule. It exits with a non-zero code when a rule fails
- The cases are in `src/lib/analytics/fixtures/analyticsFixtures.ts`, 24 of them:
  - The events of the conversation: the start of the chat, the question, the answer, an answer that is a redirect and a question that is refused
  - The events of the analysis of a job description: the analysis and a description that is refused
  - The events of the contact form: the message and a form that is not filled in properly
  - The events of the feedback: a thumb up and a thumb down with a comment
  - The events of the calls to action: the resume, LinkedIn, the address, the code of a project and a project
  - The events of the refusals: the chat, the analyzer and the contact form
  - The edges of the proxy: an event of a kind that is not known, a field that is not known, a missing field, a request from another site and a body that is not a list of fields
- What is checked:
  - The live request answers the way the case says it should, with the headers of its limit where the endpoint has one, and with `Cache-Control: no-store` on every answer of the proxy
  - The event the request is expected to produce is built by the tracking function of the site and caught before it is sent, so the rules are checked against the very payload PostHog would receive and not against a copy of it
  - The event carries the name, the identity, the moment and the fields the PRD asks for, and nothing that belongs to a person
  - Every route calls the tracking function that belongs to it. This check reads the source of the route, because a route cannot be loaded by the test runner
  - The event really left the running site, by reading the file of the server when `SERVER_LOG` is given
  - The connection with PostHog, by sending one real event marked with `verification: true` when the credentials are configured
- The cases carry no personal data of anyone. The addresses and the numbers are of the reserved ranges of the documentation
- Every case has an address of its own from the range the documentation sets aside, and a new one is used for every run, so the limit of a day is never carried over from one run to the next
- The refusals are reached with requests that are refused before anything is made, so no answer is paid for. The limits are read from the answer of the first request, so the number of requests follows the limit the site is configured with
- `package.json` has `verify:analytics`, and `test-plan.md` has the section of the milestone
- The run on 2026-10-29 against the running site: 24 cases, 405 rules checked, 405 passed, 0 failed, exit code 0. A run with a rule broken on purpose answered with the exit code 1 and named the rule that failed

## Completed (M19.04)

- Every event of PRD §46, §47, §48 and §90 was audited against the code. The result is recorded in `tasks/M19/README.md`
- The event of a refused request was added, per PRD §48:
  - New event type `rate_limit_exceeded` in `src/lib/analytics/eventTypes.ts`, with the scope that was reached, the part of the site that was asked for and the wait in seconds
  - New `trackRateLimitExceeded()` in `src/lib/analytics/analytics.ts`
  - New module `src/lib/analytics/rateLimit.ts` with `reportRateLimitExceeded()`, which the three routes call when they refuse a request. The module lives in the library and not in the routes, because the routes import their modules with the path alias and the test runner cannot resolve it
  - The event is put on the queue before the answer goes out, so it is not lost when the instance is put to sleep. It carries only the scope, the endpoint and the wait, which the visitor already sees in the headers of the answer, and never the limits themselves
  - The session of the visitor is now worked out before the limit is checked in `/api/chat`, `/api/job-fit` and `/api/contact`, so the event of a refusal belongs to a session
- `chat_session_start` was defined and never fired. It now fires on the first message of the chat, from `/api/chat`. The start of a chat is remembered on its own, because the session of a visitor is shared with the whole site and a visitor that filled in the contact form before asking a question would otherwise never be counted as the beginning of a chat
- `/api/feedback` gave every request a session of its own, which put the feedback apart from the conversation it is about. It now carries the session of the visitor
- Tests added: 4 in `src/lib/analytics/analytics.test.mts`, 6 in `src/lib/analytics/rateLimit.test.mts`
- Verified against the running site on 2026-10-29:
  - A message of the chat fires `chat_session_start`, `message_sent` and `response_received`, all with the session of the visitor
  - The second message of the same session does not fire `chat_session_start` again
  - A refusal of each of the three parts of the site answers with 429 and fires `rate_limit_exceeded` with the right endpoint (`chat`, `contact`, `job-fit`) and the wait that matches the `Retry-After` of the answer
  - The feedback carries the same session as the question and the answer it is about
  - The event was seen on the wire with the name, the identity, the scope, the endpoint and the wait, with `$geoip_disable` on and no personal data
- All 576 tests pass (570 pass, 0 fail, 6 skipped), lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds

## Completed (M19.03)

- The click of a call to action is counted from the browser:
  - `src/lib/analytics/client.ts` sends a POST to `/api/analytics` with the session, the query, the kind of the call to action and the host it points at
  - The request is sent and not awaited, so a click opens the link straight away, and it is marked to stay alive, so the event still goes out when the page goes away
  - Nothing in the path of the visitor throws. A failed answer is a line in the console of the developer and nothing more
  - The session of the browser is kept in the storage of the tab, so a visitor who reloads the page is still in the same session. The storage can be refused, and then the session is kept in memory for as long as the page is open
  - The browser branch of `src/lib/analytics/config.ts` reports the events to the server of the site. The browser cannot see the credentials and therefore cannot know whether the server forwards the events, so the server decides. The old behaviour turned the analytics off in the browser, so no click of a call to action was ever counted
  - The browser does not send a timestamp. The proxy refuses a field that is not part of the event, and the server puts the moment on the event with the clock that counts
  - The three handlers of `src/components/jobFit/JobFitResults.tsx` no longer wait for the tracking
- Two faults of the milestone M17 were found and fixed while the manual test was carried out:
  - `app/api/job-fit/route.ts` answered with a `meta` object while the contract of `JobFitResponse`, the check of the interface and the component itself all read the metadata under `metadata`. Every successful analysis of a job description showed "Received an unexpected response" and the results never appeared. The route now answers with the metadata the contract declares, and the identifier of the query goes on it
  - The two calls to action that point at the site read the host with `new URL(siteConfig.url)`, which threw while the address of the site is still the placeholder of `.env.example`. `getSiteHost()` in `src/siteConfig.ts` reads the host when it can and falls back to the known address when it cannot
- Tests added: 17 in `src/lib/analytics/client.test.mts`, 6 in `src/siteConfig.test.mts`
- Verified in a real browser on the running site: the click of "Connect on LinkedIn" was answered with 200 and went on to PostHog with no flush error, and the click of "Download Resume" navigated away while the request was still on its way and the answer came in after the page had gone. There was no uncaught error in the browser
- All 566 tests pass (560 pass, 0 fail, 6 skipped), lint clean (0 errors, 58 pre-existing warnings), typecheck clean, build succeeds

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

## Completed (Milestone 01)

- Project documentation
- Roadmap
- M01 task specification
- M01.01 – Initialize Repository
- M01.02 – Set up Next.js framework
- M01.03 – Configure TypeScript
- M01.04 – Set up linting & formatting
- M02.05 – Set up environment validation
- M01.06 – Application architecture & CI workflow

[123 more lines in file. Use offset=81 to continue.