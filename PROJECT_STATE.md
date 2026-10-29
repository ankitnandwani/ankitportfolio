# Project State

## Current Phase

- Planning

## Current Milestone

- M18 – Contact Form (ROADMAP Milestone 18)

## Status

- Task specifications created for M17 – Job Description Analyzer (see tasks/M17/). M17.01 through M17.09 implemented and verified.
- Task specifications created for M18 – Contact Form (see tasks/M18/). M18.01 and M18.02 implemented.
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

- M18.08 – Test and verify contact form end to end (the next action: continue Milestone 18 – Contact Form)
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch
- The standing items are listed in TODO.md

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