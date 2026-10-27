# Project State

## Current Phase

- Planning

## Current Milestone

- M17 – Job Description Analyzer (ROADMAP Milestone 17)

## Status

- Task specifications created for M17 – Job Description Analyzer (see tasks/M17/). M17.01 through M17.08 implemented.
- M17.01 – Define the Job Fit Analysis Contract (completed – types, zod schema, limits and fixed wording of PRD §88 in `src/lib/jobFit/`, 15 unit tests pass)
- M17.02 – Parse a Job Description into Requirements (completed – deterministic parser in `src/lib/jobFit/jdParser.ts` with 101 unit tests covering bullet points, numbered lists, checkboxes, heading recognition, noise filtering, title/company extraction, length limits, requirement limit with required-first ordering; all tests pass, lint clean, typecheck clean)
- M17.03 – Implement the Job Fit Analysis Engine (completed – engine in `src/lib/jobFit/analysis.ts` with prompt builder in `src/lib/jobFit/prompts.ts`; single retrieval with classification filter, prompt enforcing PRD §31/§41/§42/§88 rules, JSON schema validation with fallback, output guardrails on all text fields, injected dependencies for testability; 15 unit tests cover happy path, malformed answers, code fences, guardrails, provider errors, metrics logging; all 345 tests pass, lint clean, typecheck clean, build succeeds)
- M17.04 – Enforce the Job-Matching Rule with Claim Grounding Validation (completed – deterministic validation in `src/lib/jobFit/claimValidation.ts`; evidence quote check and duration check per PRD §31/§88; unsupported claims downgraded to LEARNABLE with PRD §88 wording; 20 unit tests cover all cases; all 370 tests pass, lint clean, typecheck clean, build succeeds)
- M17.05 – Apply the Privacy and Safety Guardrails to the Job Fit Flow (completed – input policy in `src/lib/jobFit/policy.ts` with length checks, PII redaction via `detectPii`/`redactPii`, injection detection via `detectInjection` (topic classification explicitly not run); analyzer rate limiter with separate store, namespaced keys (`jobfit:`), configurable limits (5/30min, 10/day); output guardrails applied to all text fields; response validation with evidence as context; validation failure replaces analysis with safe fallback; environment variables `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS`, `JOB_FIT_MAX_TOKENS` added to `src/lib/env.ts`, `src/lib/env.js`, `.env.example`; all 397 tests pass, lint clean, typecheck clean, build succeeds)
- M17.06 – Create the Job Fit API Route (completed – `app/api/job-fit/route.ts` with POST handler; request validation, rate limiting via M17.05 policy, input policy checks, analysis execution via M17.03 engine, error mapping (LLMConfigurationError → 503, retryable LLMError → 503, other → 500), rate limit headers on all responses, `Cache-Control: no-store`, analytics event `job_fit_analysis` fired fire-and-forget; added `JobFitAnalysisEvent` to analytics with `trackJobFitAnalysis` function; all 397 tests pass, lint clean, typecheck clean, build succeeds)
- M17.07 – Build the Job Fit Analyzer Interface (completed – `app/job-fit/page.tsx` server component with metadata; `src/components/jobFit/JobFitAnalyzer.tsx` client component with input field (label, placeholder, character counter 80-12000 chars, auto-resize), analyze button (disabled when empty/loading), loading state (TypingIndicator with explanatory text), error state (retry/dismiss), results component `JobFitResults` with six PRD §30 sections, three qualitative alignment bars (PRD §89, no percentages), sources list (titles only), CTA with three links (PRD §90), privacy notice (PRD §99) and disclaimer (PRD §100); `AlignmentBars` component with screen reader text alternatives; job description shown above results; theme/reduced-motion/keyboard/mobile support; description never stored in browser/URL; link added to chat panel; all 402 tests pass, lint clean, typecheck clean, build succeeds)
- M17.08 – Add Job Fit Analytics and Entry Points (completed – extended `JobFitAnalysisEvent` in `src/lib/analytics/eventTypes.ts` with classification counts, requirement counts, retrieval outcome, latency, token usage, model, fallback/replacement flags, corrected claims, redactions, rate limit scope; added `CtaType` with `email` variant; added `trackJobFitAnalysis` in `src/lib/analytics/analytics.ts` and client wrapper in `src/lib/analytics/client.ts`; updated `app/api/job-fit/route.ts` to fire event with all properties; updated `JobFitResults` to track CTA clicks (resume, LinkedIn, email); added homepage entry point in `app/page.tsx`; added chat panel link in `src/components/aiChat/ChatPanel.tsx`; navigation unchanged per PRD §8/§92; all 402 tests pass, lint clean, typecheck clean, build succeeds)
- M17.09 – Test and Verify the Job Fit Analyzer End to End (not started)
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

- M17.09 – Test and Verify the Job Fit Analyzer End to End (the next action: begin implementation of M17.09)
- The job fit analyzer is planned in tasks/M17/. Two decisions there are waiting for a human before M17.08 is started: the analyzer lives at `/job-fit` and is not added to the main navigation, because PRD §8 and PRD §92 fix the navigation and it has no entry for it; and the analyzer gets its own rate limit bucket, because one analysis is not one message and PRD §48 sets the policy for messages
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch
- The standing items are listed in TODO.md

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
- M01.07 – Design token scaffold
- CI pipeline fixed: corrected syntax error in app/layout.tsx and removed conflicting src/pages directory

## Completed (Milestone 02)

- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.02 – Evaluate NeoPOP components and document selection
- M02.03 – Create compatibility layer
- M02.04 – Define elevations (shadow levels) and integrate with Tailwind
- M02.05 – Define motion (animation presets) using Framer Motion
- M02.06 – Define breakpoints and integrate with Tailwind
- M02.07 – Refined and finalized design tokens
- M02.08 – Implemented dark/light themes with token overrides
- M02.09 – Created design system showcase route

## Completed (Milestone 03)

- M03.01 – Navigation bar (completed)
- M03.02 – Footer (completed)
- M03.03 – Responsive container (completed)
- M03.04 – Page transitions and theme switching (completed)
- M03.05 – Command palette (completed)
- M03.06 – SEO foundation (metadata, sitemap, robots) (completed)

## Completed (Milestone 04)
- M04.01 – Hero typography and basic layout (completed)
- M04.02 – Primary CTA buttons (completed)
- M04.03 – Secondary CTA buttons (completed)
- M04.04 – NeoPOP visual composition (completed)
- M04.05 – Animations using Framer Motion (completed)
- M04.06 – Responsive behavior and reduced-motion support (completed)
- M04.07 – Integration into app/page.tsx and final polishing (completed)

## Completed (Milestone 05)
- M05.01 – Define professional snapshot data model (completed)
- M05.02 – Create ProfessionalSnapshot component with metric cards (completed)
- M05.03 – Add summary copy section (completed)
- M05.04 – Add capability areas section (completed)
- M05.05 – Integrate into homepage and ensure responsiveness (completed)

## Completed (Milestone 06)
- M06.01 – Define career timeline data model (completed)
- M06.02 – Create timeline container component (completed)
- M06.03 – Create company card component (completed)
- M06.04 – Populate career timeline data from resume (completed)
- M06.05 – Integrate timeline into homepage (completed)
- M06.06 – Implement mobile layout adaptation (completed)
- M06.07 – Add animations for expand/collapse using Framer Motion (completed)
- M06.08 – Ensure accessibility and keyboard navigation (completed)

## Completed (Milestone 07)
- M07.01 – Define achievements data model (completed)
- M07.02 – Populate achievements data from resume (completed)
- M07.03 – Create achievement card component (completed)
- M07.04 – Create achievements section container (completed)
- M07.05 – Implement mobile layout adaptation (completed)
- M07.06 – Add animations using Framer Motion (completed)
- M07.07 – Ensure accessibility and keyboard navigation (completed)
- M07.08 – Integrate achievements section into homepage (completed)

## Completed (Milestone 08)
- M08.01 – Define project data model (completed)
- M08.02 – Populate project data (completed)
- M08.03 – Create project card component (completed)
- M08.04 – Create project list component (completed)
- M08.05 – Create project index page (completed)
- M08.06 – Create project detail page (completed)
- M08.07 – Implement filtering and categories (completed)
- M08.08 – Implement mobile layout adaptation (completed)
- M08.09 – Add animations using Framer Motion (completed)
- M08.10 – Ensure accessibility and keyboard navigation (completed)

## Completed (Milestone 09)
- M09.01 – Define GitHub repository data model (completed)
- M09.02 – Create GitHub service with caching (completed)
- M09.03 – Extend ProjectCard to show GitHub metadata (completed)
- M09.04 – Implement loading states (completed)
- M09.05 – Ensure caching reduces API calls (completed)
- M09.06 – Add fallback data (completed)
- M09.07 – Update project data population (completed)
- M09.08 – Integrate with project list and detail (completed)
- M09.09 – Add typing and tests for GitHub service (completed)
- M09.10 – Verify no GitHub call on every request (completed)

## Completed (Milestone 10)
- M10.01 – Define resume data model (completed)
- M10.02 – Create resume page route and layout (completed)
- M10.03 – Create resume summary component and integrate summary data (completed)
- M10.04 – Create resume experience component and integrate experience data (from career timeline) (completed)
- M10.05 – Create resume skills component and integrate skills data (completed)
- M10.06 – Create resume education component and integrate education data (completed)
- M10.07 – Create resume certifications component and integrate certifications data (completed)
- M10.08 – Create resume achievements component and integrate achievements data (completed)
- M10.09 – Add PDF download button and link (completed)
- M10.10 – Ensure responsiveness, accessibility, and phone number redaction (completed)
- M10.11 – Add animations and final polishing (completed)

## Completed (Milestone 11)
- M11.01 – Update social links configuration (completed)
- M11.02 – Create SocialHub component (completed)
- M11.03 – Integrate SocialHub component into homepage layout (completed)
- M11.04 – Update footer to be minimal (completed)
- M11.05 – Ensure SocialHub accessibility and responsiveness (completed)
- M11.06 – Add animations and final polishing (completed)

## Completed (Milestone 12)
- M12.01 – Define testimonial data model and create testimonial data (completed)
- M12.02 – Create testimonial card component (completed)
- M12.03 – Create testimonials section component (completed)
- M12.04 – Integrate testimonials section into homepage layout (completed)
- M12.05 – Add animations and interactive states (completed)
- M12.06 – Ensure responsiveness, accessibility, and conditional rendering (completed)
- M12.07 – Add final polishing and verify design consistency (completed)

## Completed (Milestone 17 – Job Description Analyzer)
- M17.01 – Define the Job Fit Analysis Contract (completed – types, zod schema, limits and fixed wording of PRD §88 in `src/lib/jobFit/`, 15 unit tests pass)
- M17.02 – Parse a Job Description into Requirements (completed – deterministic parser in `src/lib/jobFit/jdParser.ts` with 101 unit tests covering bullet points, numbered lists, checkboxes, heading recognition, noise filtering, title/company extraction, length limits, requirement limit with required-first ordering; all tests pass, lint clean, typecheck clean)
- M17.03 – Implement the Job Fit Analysis Engine (completed – engine in `src/lib/jobFit/analysis.ts` with prompt builder in `src/lib/jobFit/prompts.ts`; single retrieval with classification filter, prompt enforcing PRD §31/§41/§42/§88 rules, JSON schema validation with fallback, output guardrails on all text fields, injected dependencies for testability; 15 unit tests cover happy path, malformed answers, code fences, guardrails, provider errors, metrics logging; all 345 tests pass, lint clean, typecheck clean, build succeeds)
- M17.04 – Enforce the Job-Matching Rule with Claim Grounding Validation (completed – deterministic validation in `src/lib/jobFit/claimValidation.ts`; evidence quote check and duration check per PRD §31/§88; unsupported claims downgraded to LEARNABLE with PRD §88 wording; 20 unit tests cover all cases; all 370 tests pass, lint clean, typecheck clean, build succeeds)
- M17.05 – Apply the Privacy and Safety Guardrails to the Job Fit Flow (completed – input policy in `src/lib/jobFit/policy.ts` with length checks, PII redaction via `detectPii`/`redactPii`, injection detection via `detectInjection` (topic classification explicitly not run); analyzer rate limiter with separate store, namespaced keys (`jobfit:`), configurable limits (5/30min, 10/day); output guardrails applied to all six narrative text fields; response validation with evidence as context; validation failure replaces analysis with safe fallback; environment variables `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_DAILY_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS`, `JOB_FIT_MAX_TOKENS` added to `src/lib/env.ts`, `src/lib/env.js`, `.env.example`; all 397 tests pass, lint clean, typecheck clean, build succeeds)
- M17.06 – Create the Job Fit API Route (completed – `app/api/job-fit/route.ts` with POST handler; request validation, rate limiting via M17.05 policy, input policy checks, analysis execution via M17.03 engine, error mapping (LLMConfigurationError → 503, retryable LLMError → 503, other → 500), rate limit headers on all responses, `Cache-Control: no-store`, analytics event `job_fit_analysis` fired fire-and-forget; added `JobFitAnalysisEvent` to analytics with `trackJobFitAnalysis` function; all 397 tests pass, lint clean, typecheck clean, build succeeds)
- M17.07 – Build the Job Fit Analyzer Interface (completed – `app/job-fit/page.tsx` server component with metadata; `src/components/jobFit/JobFitAnalyzer.tsx` client component with input field (label, placeholder, character counter 80-12000 chars, auto-resize), analyze button (disabled when empty/loading), loading state (TypingIndicator with explanatory text), error state (retry/dismiss), results component `JobFitResults` with six PRD §30 sections, three qualitative alignment bars (PRD §89, no percentages), sources list (titles only), CTA with three links (PRD §90), privacy notice (PRD §99) and disclaimer (PRD §100); `AlignmentBars` component with screen reader text alternatives; job description shown above results; theme/reduced-motion/keyboard/mobile support; description never stored in browser/URL; link added to chat panel; all 402 tests pass, lint clean, typecheck clean, build succeeds)
- M17.08 – Add Job Fit Analytics and Entry Points (completed – extended `JobFitAnalysisEvent` in `src/lib/analytics/eventTypes.ts` with classification counts, requirement counts, retrieval outcome, latency, token usage, model, fallback/replacement flags, corrected claims, redactions, rate limit scope; added `CtaType` with `email` variant; added `trackJobFitAnalysis` in `src/lib/analytics/analytics.ts` and client wrapper in `src/lib/analytics/client.ts`; updated `app/api/job-fit/route.ts` to fire event with all properties; updated `JobFitResults` to track CTA clicks (resume, LinkedIn, email); added homepage entry point in `app/page.tsx`; added chat panel link in `src/components/aiChat/ChatPanel.tsx`; navigation unchanged per PRD §8/§92; all 402 tests pass, lint clean, typecheck clean, build succeeds)