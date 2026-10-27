# M17.01 — Define the Job Fit Analysis Contract

## Objective

Define the types, the validation schema and the input limits of the job fit analysis: the shape of a parsed job description, the classification of a single requirement, the structured analysis the engine returns, the evidence reference and the request and response shapes of the API. Every later task builds on these types, so they are fixed here before anything is built.

## Context

The job fit analyzer is the second consumer of the AI stack, after the chat. The chat answers with free text; the analyzer has to answer with a structure, because PRD §88 asks for every requirement to be classified and PRD §89 asks for a qualitative alignment summary that the interface renders as bars.

The repository already has the pieces this contract has to fit into:

- `src/lib/llm/provider.ts` — the provider contract. `generate()` returns `{ text, tokenUsage, finishReason, model }`. There is no structured output method, and DECISIONS.md records that the interface deliberately has `generate()` and `stream()` only.
- `src/lib/knowledge/types.ts` — `RetrievedChunk`, `KnowledgeClassification` and `PUBLIC_CLASSIFICATIONS`.
- `src/lib/ai/types.ts` — the shapes of the chat request and response, which the new shapes follow.
- `src/lib/analytics/eventTypes.ts` — the event types, which M17.08 extends.
- `zod` is already a dependency and is already used in `src/lib/env.ts`.

PRD §30 fixes the six sections the analysis has. PRD §88 fixes the five classifications a requirement can get. PRD §89 fixes the three alignment bands. PRD §43 fixes the fields an evidence reference carries. PRD §84 asks for the cost limits to be configurable.

## Requirements

- Define the classification of a single requirement as a union of string literals: `DIRECT_MATCH`, `STRONG_TRANSFER`, `RELATED`, `LEARNABLE`, `UNKNOWN`. **Not** an enum, because the test runner only loads erasable TypeScript.
- Define the three alignment bands of PRD §89: `strong`, `transferable`, `growth`.
- Define the kind of a requirement in the job description: `responsibility`, `requirement`, `qualification`, `nice_to_have`, `other`.
- Define `JobRequirement`: the identifier, the text, the kind, and whether it is required. A "nice to have" is not required.
- Define `ClassifiedRequirement`: a requirement plus its classification, its rationale and the identifiers of the evidence that supports it.
- Define `FitEvidence`: the evidence reference of PRD §43 — `sourceId`, `sourceType`, `sourceTitle`, `classification`, `lastUpdated` and `confidence`.
- Define `AlignmentBand`: the band, its label, and the number of filled segments out of four.
- Define `JobFitAnalysis`: the six sections of PRD §30 plus the classified requirements and the alignment bands.
  - `overallPositioning` — a paragraph.
  - `strongMatches` — a list of paragraphs.
  - `transferableExperience` — a list of paragraphs.
  - `learningAgility` — a paragraph.
  - `interviewTalkingPoints` — a list of paragraphs.
  - `recommendedPositioning` — a paragraph.
- Define the sections as a constant so the interface and the engine cannot disagree about the order.
- Define the request shape of the API: the job description, and nothing else. The visitor cannot choose the model, the temperature or the number of chunks.
- Define the response shape of the API: the analysis, the evidence, and the metadata (latency, token usage, model, number of requirements, whether the analysis was cut short).
- Define the limits of the input: the largest job description, the smallest job description that is worth analysing, the largest number of requirements that are analysed.
- Define the zod schema that validates the JSON the model returns, and a function that parses the model's text into the analysis, with a clear failure instead of a throw.
- Define the wording of PRD §88 for an unsupported requirement as a constant, so M17.04 uses the same words as PRD §88 and not a paraphrase of it.
- Export everything through a single `src/lib/jobFit/index.ts`.

## Scope

### In scope

- `src/lib/jobFit/types.ts` — the types above.
- `src/lib/jobFit/schema.ts` — the zod schema and the parser for the model's answer.
- `src/lib/jobFit/limits.ts` — the input limits and the wording of PRD §88.
- `src/lib/jobFit/index.ts` — the public exports.
- The unit tests for the schema and the limits.

### Out of scope

- The parsing of the job description (M17.02).
- The retrieval, the prompt and the generation (M17.03).
- The grounding check (M17.04).
- The guardrails (M17.05).
- The route (M17.06) and the interface (M17.07).
- Any change to `LLMProvider`, to `src/lib/llm/`, or to any other existing module.

## Dependencies

- M13.06 — the provider contract and the shapes of a generation result.
- M13.05 — `RetrievedChunk` and `KnowledgeClassification`.
- M13.07 — the guardrail types, for the vocabulary used in the schema.
- `zod` — already a dependency.

## Files / Areas Expected To Change

- `src/lib/jobFit/types.ts` (to be created) — the contract.
- `src/lib/jobFit/schema.ts` (to be created) — the zod schema and the parser.
- `src/lib/jobFit/limits.ts` (to be created) — the limits and the fixed wording.
- `src/lib/jobFit/schema.test.mts` (to be created) — the tests.
- `src/lib/jobFit/index.ts` (to be created) — the exports.

Nothing outside `src/lib/jobFit/` is expected to change.

## Implementation Guidance

1. Start with the types. Keep them plain, with no imports beyond the knowledge types, in the same style as `src/lib/knowledge/types.ts` and `src/lib/llm/provider.ts`. Every type carries a short comment that says what it is for, the way the existing modules do.

2. Model the classification as a union of string literals and pair it with an array of the allowed values, so the schema and the interface share one source of truth:

   ```typescript
   export const REQUIREMENT_CLASSIFICATIONS = [
     'DIRECT_MATCH',
     'STRONG_TRANSFER',
     'RELATED',
     'LEARNABLE',
     'UNKNOWN',
   ] as const;

   export type RequirementClassification = (typeof REQUIREMENT_CLASSIFICATIONS)[number];
   ```

3. Define the six sections of PRD §30 as an ordered constant, so the interface renders them in the same order the engine produces them:

   ```typescript
   export const FIT_SECTIONS = [
     'overallPositioning',
     'strongMatches',
     'transferableExperience',
     'learningAgility',
     'interviewTalkingPoints',
     'recommendedPositioning',
   ] as const;
   ```

4. Define the alignment bands with the labels PRD §89 uses, spelled the way the PRD spells them: "Strong Alignment", "Transferable", "Growth Areas". The label belongs to the contract, so the interface does not hard-code it.

5. Define the zod schema for the model's answer. The model returns JSON with this shape:

   ```json
   {
     "overallPositioning": "…",
     "strongMatches": ["…"],
     "transferableExperience": ["…"],
     "learningAgility": "…",
     "interviewTalkingPoints": ["…"],
     "recommendedPositioning": "…",
     "requirements": [
       {
         "id": "r1",
         "classification": "DIRECT_MATCH",
         "rationale": "…",
         "evidenceIds": ["e1"]
       }
     ]
   }
   ```

   The schema checks that the six sections are present and of the right kind, that every classification is one of the five, and that every requirement identifier exists in the requirement list the engine sent. The schema does **not** check that the text is truthful; that is the job of M17.04.

6. Write the parser as a function that takes the model's text and the requirement list, and returns a result object that says either what went wrong or what was parsed. It never throws, because a malformed answer is an expected condition and not an exception. The model's text may be wrapped in a code fence, so the parser strips a fence before it parses.

7. Define the limits:

   - `MAX_JOB_DESCRIPTION_LENGTH` — 12000 characters. A job description is usually far shorter; the limit exists so a pasted document cannot become an unbounded prompt.
   - `MIN_JOB_DESCRIPTION_LENGTH` — 80 characters. Below that there is nothing to map.
   - `MAX_ANALYSED_REQUIREMENTS` — 40. The limit keeps one analysis inside the context and the cost budget of PRD §84.
   - `MAX_JOB_FIT_RESPONSE_TOKENS` — 2048. The answer is JSON with six sections and one entry per requirement, so it is larger than a chat answer.

8. Define the wording of PRD §88 for an unsupported requirement as a constant, using the wording of the PRD as closely as the placeholders allow:

   ```typescript
   export const UNSUPPORTED_REQUIREMENT_NOTE =
     "This isn't currently listed as a core area of Ankit's experience, " +
     'but it is adjacent to his existing background and can be positioned as a learning area.';
   ```

   M17.04 substitutes this for a claim the evidence does not support, so the phrase has to be in one place.

9. Keep `src/lib/jobFit/index.ts` as the only entry point the other tasks import from, the way `src/lib/guardrails/index.ts` and `src/lib/llm/index.ts` do.

## Acceptance Criteria

- `src/lib/jobFit/types.ts` defines the requirement classification, the alignment band, the requirement, the classified requirement, the evidence reference and the analysis, each with a comment that explains its purpose.
- The classification is a union of string literals, not an enum, so a test file can load the module.
- The six sections of PRD §30 are defined as one ordered constant and the analysis type uses them.
- The three alignment bands of PRD §89 are defined with their labels.
- The zod schema accepts a well-formed answer and rejects an answer that is missing a section, uses an unknown classification, or refers to a requirement that was not sent.
- The parser returns a failure for malformed JSON instead of throwing, and it reads an answer that is wrapped in a code fence.
- The limits are defined in one place and are the values listed in the implementation guidance.
- The wording of PRD §88 for an unsupported requirement is defined once.
- `src/lib/jobFit/index.ts` exports the public surface, and no other module imports a job fit file directly.
- The unit tests cover the accepted shape, every rejection, the code fence, the malformed answer and the limits.
- `npm test`, `npm run lint` and `npm run typecheck` pass.

## Testing Requirements

- The schema accepts a complete answer with all six sections and one classified requirement.
- The schema rejects a missing section, a section of the wrong kind, an unknown classification, an empty requirement list and an unknown requirement identifier.
- The parser returns a failure for text that is not JSON at all.
- The parser reads an answer that is wrapped in a ``` fence.
- The parser never throws, for every malformed input in the list above.
- The limits are the documented values, asserted in a test so a change to one of them is deliberate.
- The wording of PRD §88 is asserted so a paraphrase cannot creep in unnoticed.

## Security / Privacy Considerations

- The contract carries no field for the raw job description in the response. The analysis that comes back holds the analysis and the evidence references, not the document that was pasted. This keeps a company name or a recruiter's wording out of anything that could be logged or stored.
- The evidence reference keeps the metadata of PRD §43 and not the internal identifiers the interface does not need. The raw chunk id is not part of it.
- The response shape carries no field for an API key, a model configuration or an environment value.

## Performance / Accessibility Considerations

- The contract is types only, so it costs nothing at runtime. The zod schema is used on one answer per analysis and is not on the path of a page load.
- The alignment bands are levels between zero and four, not a floating point number, so the interface does not have to format a number and cannot show a misleading precision (PRD §89).

## Definition of Done

- Every type the later tasks need is defined and commented.
- The schema and the parser are written and tested.
- The limits and the fixed wording of PRD §88 live in one module.
- The public exports are complete.
- The tests pass, and lint and typecheck are clean.

## Related Requirements

- PRD §30: AI Job Description Analysis
- PRD §31: Critical Job-Matching Rule
- PRD §43: AI Source Grounding
- PRD §78: Analytics (event names)
- PRD §84: Cost Protection
- PRD §88: Job Fit Scoring
- PRD §89: Job Fit UI
- PRD §104: Automated Tests
