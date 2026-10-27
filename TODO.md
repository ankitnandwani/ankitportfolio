# Immediate Next Actions

- Begin implementation of M17.09.
- Two decisions of the M17 plan are waiting for a human before M17.08 is started: the job fit analyzer lives at `/job-fit` and is not added to the main navigation, because PRD §8 and PRD §92 fix the navigation and it has no entry for it; and the analyzer gets its own rate limit bucket, because one analysis is not one message and PRD §48 sets the policy for messages
- Data verification: Replace TO_BE_VERIFIED_AGAINST_RESUME placeholders in src/data/ before launch
- Verify the social media placeholder URLs in `src/data/socialLinks.ts` before launch
- The rate limit of the chat is kept in memory, so it is lost when the instance restarts and it is per instance. That is what PRD §48 accepts for a site with low traffic, but a shared store (the Upstash Redis of PRD §53) would make it hold across instances. The store of the limiter is injected, so this is a change in one place
- The visitor is counted by the address the hosting platform writes into the request. A visitor who can change that header can get around the limit, so the limit is a guard against accidents rather than a wall
- The model of the chat is now `gemini-flash-lite-latest`, which answers in a few seconds without spending tokens on thinking. `gemini-flash-latest` needed 13 to 57 seconds for the same question, because it spends up to 75 tokens thinking before it answers
- Run the live language model tests with `LIVE_LLM_TESTS=1`. They are off by default because the free tier of the Gemini API allows twenty generation requests a day and a request over that limit is rejected for the rest of the day
- The guardrail patterns are a rule set, not a model. They need a look again once the chat is live, because the questions the visitors really ask are the ones that show whether a pattern is too broad or too narrow
- The personal content can wait. `src/data/skills.ts` and `src/data/testimonials.ts` are still empty placeholders, and neither is needed for the remaining M17 tasks. The point at which they become visible to users is the chatbot, which already says that the summary and the snapshot are pending verification. The point at which they become a launch blocker is the resume page, which currently shows "Skills data pending verification against resume." Add them before launch
- Replace the remaining `TO_BE_VERIFIED_AGAINST_RESUME` placeholders in `src/data/` with resume-verified content. After filling them in, run `npm run ingest` and then `npm run embed` to pick up the new chunks

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

[111 more lines in file. Use offset=51 to continue.