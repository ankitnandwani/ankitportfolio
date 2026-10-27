# Milestone M17 – Job Description Analyzer

Task specifications for ROADMAP Milestone 17 – Job Description Analyzer.

**Status:** Specification created. Awaiting implementation. Nothing in this folder is implemented yet.

**Roadmap goal:** Map a job description to Ankit's profile.

**Roadmap Definition of Done:** The tool produces positive, truthful, evidence-based fit narratives.

---

## Scope of this milestone

A recruiter pastes a job description, the assistant maps it against Ankit's professional knowledge base, and the result is a structured fit analysis with six sections (PRD §30), a qualitative alignment summary (PRD §89), a requirement-by-requirement classification (PRD §88) and a call to action (PRD §90).

This milestone reuses everything M13 built. It adds no new service, no new dependency, no new database table and no new architectural layer.

---

## Execution Order

The tasks are mostly sequential because each one consumes the contract of the one before it. The recommended order is:

```
M17.01  Define the Job Fit Analysis Contract
   ↓
M17.02  Parse a Job Description into Requirements
   ↓
M17.03  Implement the Job Fit Analysis Engine
   ↓
M17.04  Enforce the Job-Matching Rule (claim grounding validation)
   ↓
M17.05  Apply the Privacy and Safety Guardrails to the Job Fit Flow
   ↓
M17.06  Create the Job Fit API Route
   ↓
M17.07  Build the Job Fit Analyzer Interface
   ↓
M17.08  Add Job Fit Analytics and the Entry Points
   ↓
M17.09  Test and Verify the Job Fit Analyzer End to End
```

### Work that can safely be done in parallel

- **M17.07 (Interface) can start after M17.01 and M17.06.** The contract of M17.01 fixes the request and response shapes, so the presentational part of the interface (the paste field, the loading state, the six result sections, the alignment bars, the call to action) can be built and reviewed while M17.03 to M17.05 are still in progress, against a stubbed response.
- **M17.08 (Analytics) can start after M17.01.** The event type and the privacy rules of the event are part of the contract and do not depend on the engine.
- **M17.04 and M17.05 can be developed in parallel** once M17.03 has fixed the shape of the analysis result. They touch different modules (`src/lib/jobFit/claimValidation.ts` versus `src/lib/jobFit/policy.ts`) and neither imports the other.
- **The test work of M17.09 can start earlier** for the parts that only cover M17.01 and M17.02, which are pure functions with no external dependency.

### Tasks that must not be started early

- M17.03 must not start before M17.01 and M17.02, because the engine's output is the contract of M17.01 and it consumes the requirements of M17.02.
- M17.06 must not start before M17.03 and M17.05, because the route is the boundary that applies the guardrails and the rate limit.
- M17.07 must not start before M17.06, except for the presentational work described above.
- M17.09 must be last, because it verifies the whole flow.

---

## Traceability Table

| Requirement | Source | Task | Status |
|---|---|---|---|
| Paste a job description | PRD §30, ROADMAP M17 | M17.02, M17.07 | Covered |
| Analyze fit on demand | PRD §30, PRD §126 | M17.06, M17.07 | Covered |
| Overall positioning section | PRD §30, ROADMAP M17 | M17.01, M17.03 | Covered |
| Strong matches section | PRD §30, ROADMAP M17 | M17.01, M17.03 | Covered |
| Transferable experience section | PRD §30, ROADMAP M17 | M17.01, M17.03 | Covered |
| Learning agility section | PRD §30, ROADMAP M17 | M17.01, M17.03 | Covered |
| Interview talking points section | PRD §30, ROADMAP M17 | M17.01, M17.03 | Covered |
| Recommended positioning section | PRD §30, ROADMAP M17 | M17.01, M17.03 | Covered |
| Never reject automatically because of a gap | PRD §31 | M17.03, M17.04 | Covered |
| Never fabricate experience | PRD §31, AGENTS.md | M17.03, M17.04 | Covered |
| Find the strongest truthful connection | PRD §31 | M17.03 | Covered |
| Classify each requirement: DIRECT_MATCH, STRONG_TRANSFER, RELATED, LEARNABLE, UNKNOWN | PRD §88 | M17.01, M17.03 | Covered |
| Emphasise the first four classifications | PRD §88 | M17.03 | Covered |
| Never output "NOT A FIT" because of missing keywords | PRD §88 | M17.03, M17.04 | Covered |
| Use the approved wording for an unsupported requirement | PRD §88 | M17.03, M17.04 | Covered |
| Job fit interface: strong alignment, transferable, growth areas | PRD §89 | M17.01, M17.07 | Covered |
| No misleading precision such as a percentage match | PRD §89 | M17.01, M17.07 | Covered |
| Call to action after the analysis: resume, LinkedIn, email | PRD §90 | M17.07 | Covered |
| Recruiter flow ends in the resume download | PRD §91 | M17.07, M17.08 | Covered |
| Job fit analysis event | PRD §78 | M17.08 | Covered |
| Privacy-conscious analytics without personal data | PRD §46, PRD §78 | M17.08 | Covered |
| Intent classification with a job fit category | PRD §87 | M13.07 | Already satisfied |
| RAG over the knowledge base | PRD §32 | M17.03 | Covered |
| Only PUBLIC and PROFESSIONAL content is retrievable | PRD §34 | M17.03 | Covered |
| Defence in depth around the model | PRD §35 | M17.05 | Covered |
| Sensitive data protection | PRD §36 | M17.05 | Covered |
| Phone number protection | PRD §37 | M17.05 | Covered |
| Prompt injection defence | PRD §38 | M17.05 | Covered |
| Professional, concise, confident, positive, transparent tone | PRD §41 | M17.03, M17.05 | Covered |
| Direct answer, relevant evidence, transferable skills | PRD §42 | M17.03 | Covered |
| Source grounding with source, classification and confidence | PRD §43 | M17.01, M17.03 | Covered |
| Say when the information is not available | PRD §44 | M17.03 | Covered |
| Temporary session memory may hold the job description | PRD §45 | M17.07 | Covered |
| Rate limiting of the analysis | PRD §48 | M17.05, M17.06 | Covered |
| Provider abstraction, no Gemini specific APIs in application code | PRD §49 | M17.03 | Covered |
| Cost protection through configurable limits | PRD §84 | M17.01, M17.03 | Covered |
| Context optimisation, never send the whole knowledge base | PRD §85 | M17.03 | Covered |
| Single source of truth for the knowledge | PRD §57 | M17.03 | Covered |
| No public admin interface, content stays in version controlled files | PRD §55 | M17.01 | Covered |
| Accessibility target WCAG 2.2 AA | PRD §71 | M17.07 | Covered |
| Performance targets | PRD §74 | M17.07 | Covered |
| Graceful failure without raw API errors | PRD §76 | M17.05, M17.06 | Covered |
| No secrets in code or in error messages | PRD §80 | M17.05, M17.06 | Covered |
| Free tier constraint | PRD §83 | M17.03, M17.06 | Covered |
| Privacy notice for the AI | PRD §99 | M17.07 | Covered |
| AI disclaimer | PRD §100 | M17.07 | Covered |
| Sensitive content is not retained | PRD §101 | M17.05, M17.06 | Covered |
| Automated tests in CI | PRD §104 | M17.09 | Covered |

---

## Requirements already satisfied by earlier milestones

These are not rebuilt in M17. They are used as they are, and the tasks below only wire them in.

| Requirement | Source | Satisfied by | Note |
|---|---|---|---|
| Provider abstraction with a Gemini implementation | PRD §49 | M13.06 | `src/lib/llm/provider.ts`, `src/lib/llm/factory.ts` |
| Topic classification, personal data detection, prompt injection defence, output validation | PRD §35–§40 | M13.07 | `src/lib/guardrails/` |
| Vector search with metadata filtering | PRD §32, §51 | M13.05 | `src/lib/knowledge/retrieval.ts` |
| Response validation with a safe fallback | PRD §42 | M13.10 | `src/lib/ai/validation.ts` |
| Rate limiting with a friendly message and limit headers | PRD §48 | M13.10 | `src/lib/ai/rateLimiter.ts` |
| Analytics with privacy-conscious session identifiers | PRD §46, §78 | M13.11 | `src/lib/analytics/` |
| Design system primitives, themes and motion | PRD §58–§66 | M02, M13.08 | `src/components/ui/`, `design/` |
| Chat surface that already answers role fit questions | PRD §28, §29 | M13.08, M13.09 | `src/components/aiChat/` |

---

## Decisions taken by this plan

These are recorded here so the implementation follows them. The implementing agent records them in `DECISIONS.md` when the first one lands.

| # | Decision | Why | Needs human approval |
|---|---|---|---|
| D1 | The job fit analysis is a **separate flow** from the chat. It has its own route, its own service and its own interface, and it does not go through the chat prompt templates. | The chat answers a question; the analyzer answers with a structured result for six fixed sections. Sharing the chat prompt would compromise both. | No |
| D2 | The structured result is produced at the **application layer**: the model is asked for JSON, the JSON is validated with `zod`, and a deterministic fallback is used when the JSON cannot be read. The `LLMProvider` contract is **not** extended. | DECISIONS.md records that the provider interface has `generate()` and `stream()` only, and that methods no provider would implement should not be declared. Adding one would change an accepted decision. | No |
| D3 | The requirement classification is produced by the model against evidence that was retrieved **once** for the whole job description, not once per requirement. | One analysis costs one embedding call and one generation call. The Gemini free tier allows twenty generation requests a day, so a per-requirement loop would exhaust the budget on a single job description. | No |
| D4 | The alignment summary is **not** a percentage. Each band shows one segment per requirement in that band, out of four segments. | PRD §89 asks for a qualitative model and forbids misleading precision. | No |
| D5 | A grounding check runs on the result and **downgrades** a claim that the evidence does not support, instead of failing the whole analysis. | PRD §31 asks for the strongest truthful connection and PRD §88 asks for a specific wording when a requirement is unsupported. A hard failure would push the model towards refusing, which PRD §31 forbids. | No |
| D6 | The analyzer has its **own rate limit bucket**, stricter than the chat, because one analysis costs far more than one chat message. | PRD §48 sets the policy for messages. A job description is not a message. | No |
| D7 | The analyzer is reached at `/job-fit`. It is **not** added to the main navigation, because PRD §8 and PRD §92 list the navigation and it has no entry for it. It is linked from the chat and from the homepage. | Adding a ninth navigation item would go beyond the approved information architecture. | **Yes** – approve the route and the entry points, or ask for a navigation item. |
| D8 | The analysis is **not streamed**. It is a single JSON answer. | The result has a fixed structure that the interface renders as a whole. Streaming it would add complexity without a benefit the recruiter sees. | No |
| D9 | The job description is treated as **untrusted third-party text** everywhere: it is delimited and labelled in the prompt, the system instruction says it is data and never instructions, and it is never allowed to change the output contract. | A job description is written by somebody else and can contain text that reads like an instruction. PRD §38 asks for the defence. | No |
| D10 | The job description is **never stored**. It lives in the request, in the prompt and in the browser tab that pasted it. | PRD §101 asks for sensitive content not to be retained, and PRD §45 asks for temporary session memory only. | No |

---

## Notes for the implementing agent

- The test runner is Node's own, and the modules under `src/lib/` must use **relative** imports so a test can load them. `@/` does not resolve in the test runner.
- A module that reads the environment when it is loaded has to be imported dynamically in a test, and every new required environment variable has to be added to the list in `src/lib/githubService.test.mts`.
- Files loaded by the test runner must use **erasable** TypeScript syntax only: no parameter properties, no enums, no namespaces. A union of string literals is used instead of an enum.
- `zod` is already a dependency. It is used for the environment and it is used for the structured output of the model. No dependency is added by this milestone.
- The Gemini free tier allows twenty generation requests a day. A live test of the analyzer has to be opt-in, in the same way as `LIVE_LLM_TESTS=1` in `src/lib/llm/geminiProviderLive.test.mts`.
