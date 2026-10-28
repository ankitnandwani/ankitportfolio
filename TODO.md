# Immediate Next Actions

- Begin implementation of M18.03.
- A decision is needed on the transactional email provider before M18.05 (Resend recommended – 3,000/month free, modern API).
- Contact form rate limit thresholds need confirmation (suggested: 3/30min, 5/day, stricter than job-fit's 5/30min).
- Contact form placement: dedicated `/contact` page linked from footer and homepage.
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch.
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch.
- The rate limit of the chat is kept in memory, so it is lost when the instance restarts and it is per instance. That is what PRD §48 accepts for a site with low traffic, but a shared store (the Upstash Redis of PRD §53) would make it hold across instances. The store of the limiter is injected, so this is a change in one place.
- The visitor is counted by the address the hosting platform writes into the request. A visitor who can change that header can get around the limit, so the limit is a guard against accidents rather than a wall.
- The model of the chat is now `gemini-flash-lite-latest`, which answers in a few seconds without spending tokens on thinking. `gemini-flash-latest` needed 13 to 57 seconds for the same question, because it spends up to 75 tokens thinking before it answers.
- Run the live language model tests with `LIVE_LLM_TESTS=1`. They are off by default because the free tier of the Gemini API allows twenty generation requests a day and a request over that limit is rejected for the rest of the day.
- The guardrail patterns are a rule set, not a model. They need a look again once the chat is live, because the questions the visitors really ask are the ones that show whether a pattern is too broad or too narrow.
- The personal content can wait. `src/data/skills.ts` and `src/data/testimonials.ts` are still empty placeholders, and neither is needed for the remaining M17 tasks. The point at which they become visible to users is the chatbot, which already says that the summary and the snapshot are pending verification. The point at which they become a launch blocker is the resume page, which currently shows "Skills data pending verification against resume." Add them before launch.
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks.

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
- M18.03 – Implement contact form API route with validation
- M18.04 – Add spam protection/rate limiting for contact form
- M18.05 – Implement email delivery via transactional provider
- M18.06 – Create success/failure UI states
- M18.07 – Add contact form to site (homepage/footer)
- M18.08 – Test and verify contact form end to end

**Decisions needed before implementation:**
1. Transactional email provider (Resend recommended – 3,000/month free, modern API)
2. Contact form rate limit thresholds (suggested: 3/30min, 5/day)
3. Contact form placement: dedicated `/contact` page linked from footer and homepage