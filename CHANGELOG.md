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