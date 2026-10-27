# M17.04 — Enforce the Job-Matching Rule with Claim Grounding Validation

## Objective

Check every claim the analysis makes against the evidence it was built from, and downgrade the claims the evidence does not support. This is the task that turns PRD §31 from a sentence in a prompt into a rule the code enforces: the analysis may never state an experience that the knowledge base does not support, and it may never reject the candidate because of a gap.

## Context

PRD §31 is the strictest rule of this milestone:

> The system should **never automatically reject Ankit because a job description has gaps**. However, it must also never fabricate experience.

> **Find the strongest truthful connection.** Never: **Invent a connection.**

A prompt that says "do not fabricate" is not enough. Models state experience they are not sure about, and a model that is asked to be positive will happily say "Ankit has extensive Kubernetes experience" when the evidence says nothing about Kubernetes. On a portfolio whose whole value is that the information is true, that is the one failure that must not happen.

So the claims are checked after the model has answered, with a check that does not need a model and cannot be talked out of its answer.

Two checks do this, and they are both deterministic:

**The evidence quote check.** Every classified requirement carries the evidence that supports it. The check confirms that the quote really appears in the evidence that was retrieved. A quote that is not in the evidence means the model attached support it does not have, and the requirement is downgraded.

**The duration check.** The narrative may not claim a length of experience that the evidence does not contain. "Ankit has 5 years of Kubernetes experience" is the exact sentence PRD §31 names as forbidden. Every duration in the narrative has to appear in the evidence.

When a claim does not survive, it is **downgraded**, not dropped and not failed. A requirement that was classified as `DIRECT_MATCH` without support becomes `LEARNABLE`, its rationale is replaced with the wording of PRD §88, and the analysis still reads as a fit narrative. PRD §31 asks for the strongest truthful connection, and PRD §88 asks for a specific wording when a requirement is not supported. Failing the whole analysis would push towards a refusal, which PRD §31 forbids.

## Requirements

- Implement a validation module that takes the analysis, the evidence and the parsed requirements, and returns the analysis with the unsupported claims corrected.
- Define the notion of a claim that can be checked: a technology or a tool that the analysis attributes to Ankit, and a duration of experience.
- Run the evidence quote check on every classified requirement that names evidence:
  - the evidence identifier has to exist in the evidence that was retrieved,
  - the quote has to appear in the text of that evidence, compared in a normalised way: lower case, spaces collapsed, punctuation removed,
  - when either check fails, the requirement is downgraded.
- Run the duration check over every text field of the narrative:
  - find every duration of experience, such as "5 years", "5+ years", "over a decade", "2 years",
  - check that the number and the unit appear in the evidence,
  - a duration that does not appear in the evidence is removed from the sentence that carries it, and the sentence is dropped when nothing is left of it.
- Never remove the requirement from the analysis. A requirement that cannot be supported stays in the analysis as `LEARNABLE` with the wording of PRD §88, so the gap is visible and honest rather than hidden.
- Never let the analysis say that the candidate is not a fit. A classification of `UNKNOWN` and a `LEARNABLE` requirement are both written as a learning area, never as a rejection.
- Report what was corrected, so the route can log it and the metadata can carry it. The report holds the requirement identifiers and the kinds of correction, and no text from the analysis.
- Keep the corrections visible to the interface in a way that does not alarm the visitor. The interface shows the analysis and the call to action; the corrections are for the logs and the metadata.

## Scope

### In scope

- `src/lib/jobFit/claimValidation.ts` — the checks and the corrections.
- `src/lib/jobFit/claimValidation.test.mts` — the tests.
- The exports through `src/lib/jobFit/index.ts`.
- The wiring into the engine of M17.03, if it was not wired there.

### Out of scope

- The guardrails of M13.07 that run before and after the engine (M17.05).
- The interface. The corrections are not shown as warnings to the visitor.
- A general fact checker for the whole narrative. The checks are the two that PRD §31 names: invented experience and invented duration.
- Any model call. The check is deterministic and never asks the model anything.

## Dependencies

- M17.01 — the contract, the classifications and the wording of PRD §88.
- M17.02 — the parsed requirements, for the original text of a requirement.
- M17.03 — the analysis and the evidence the check runs against.

## Files / Areas Expected To Change

- `src/lib/jobFit/claimValidation.ts` (to be created) — the checks.
- `src/lib/jobFit/claimValidation.test.mts` (to be created) — the tests.
- `src/lib/jobFit/analysis.ts` (updated) — the call to the check, if it is not already there.
- `src/lib/jobFit/index.ts` (updated) — the exports.

## Implementation Guidance

1. Write the module as pure functions. It takes the analysis, the evidence and the requirements, and returns a new analysis and a report. It does not import anything that needs an environment, so a test can load it directly.

2. Normalise the text before it is compared. A quote from the model and the text of the evidence rarely match character for character, because the model changes the punctuation and the case. A small normaliser that lower-cases, replaces every run of whitespace with a single space and removes the punctuation is enough:

   ```typescript
   function normalise(text: string): string {
     return text
       .toLowerCase()
       .replace(/[^\p{L}\p{N}\s]/gu, ' ')
       .replace(/\s+/g, ' ')
       .trim();
   }
   ```

   A quote longer than forty characters is checked as a substring. A shorter quote is checked as a set of words, because a quote of one or two words can be a coincidence.

3. Check the evidence identifier first. An identifier that is not in the retrieved evidence means the model invented a reference, and the requirement is downgraded whatever the quote says.

4. Downgrade with the wording of PRD §88, not with a wording of your own. The constant `UNSUPPORTED_REQUIREMENT_NOTE` from M17.01 is used as the rationale, and the classification becomes `LEARNABLE`. The evidence list of the requirement is emptied, because the point of the correction is that there is no support.

   ```typescript
   {
     ...requirement,
     classification: 'LEARNABLE',
     rationale: UNSUPPORTED_REQUIREMENT_NOTE,
     evidenceIds: [],
   }
   ```

5. Write the duration check as a pattern that finds a number next to a unit of time, and not as a general number check. The unit has to be a unit of experience, so "years", "year", "yrs" and "months" count, and "days" and "weeks" do not. A duration is only a claim when it is close to a word that says it belongs to Ankit, so the check looks at the sentence it is in: a sentence that does not talk about Ankit, about his experience or about the role is left alone. This keeps a sentence such as "the company has 20 years of history" from being corrected.

6. When a duration is not in the evidence, remove the phrase from the sentence. If the sentence then says nothing, drop it. Do not rewrite the sentence into something else: a rewrite is an invention of its own.

7. Keep the check away from the numbers that are not claims. A requirement count, a year in a job title and a date in the education are not claims about experience and must survive the check.

8. Report the corrections:

   ```typescript
   export interface ClaimValidationReport {
     downgradedRequirements: string[];   // the identifiers
     removedDurations: string[];          // the phrases that were removed
   }
   ```

   The report holds identifiers and the phrases that were removed, and no sentence of the analysis. The log of the engine writes only the count of each, so the log stays free of the document and of the answer.

9. Run the check over every text field of the analysis: the overall positioning, every entry of the strong matches, every entry of the transferable experience, the learning agility, every interview talking point and the recommended positioning. A duration can appear in any of them.

10. Wire the check into the engine of M17.03, after the answer is read and before the output guardrails run. The order matters: the guardrails remove the personal data, and the check works on the text of the model.

11. When the engine falls back because the answer could not be read, the check still runs over the fallback. The fallback is built from the evidence, so it should pass, and the check proves it.

## Acceptance Criteria

- A requirement whose quote is in the evidence keeps its classification and its evidence.
- A requirement whose quote is not in the evidence is downgraded to `LEARNABLE`, its rationale becomes the wording of PRD §88 and its evidence list is emptied.
- A requirement that refers to an evidence identifier that does not exist is downgraded.
- A duration that appears in the evidence survives.
- A duration that does not appear in the evidence is removed from the sentence that carries it.
- A sentence that carries nothing after the removal is dropped.
- A duration that is not about experience, such as a year in a job title or the age of a company, survives.
- The requirement list keeps every requirement, whatever the corrections. Nothing is removed from the analysis because of a gap.
- The analysis never says that the candidate is not a fit, and a corrected requirement is written as a learning area.
- The report names the requirements that were downgraded and the durations that were removed.
- The check makes no model call and needs no environment.
- The tests cover every case above, and `npm test`, `npm run lint` and `npm run typecheck` pass.

## Testing Requirements

- A supported requirement is untouched.
- A requirement with a quote that is not in the evidence is downgraded, with the wording of PRD §88 as the rationale.
- A requirement with an invented evidence identifier is downgraded.
- A requirement with no quote and no evidence identifier keeps its classification, because the model was not asked for one. The check does not invent a failure that is not there.
- A duration that is in the evidence survives in every narrative field.
- A duration that is not in the evidence is removed from each of the six narrative fields.
- A sentence that becomes empty is dropped.
- "the company was founded 20 years ago" is not treated as a claim about Ankit.
- A requirement count, a year in a job title and an education year survive.
- The report lists the corrections and holds no text from the analysis.
- The whole check is fast on an analysis with forty requirements: well under a second.

## Security / Privacy Considerations

- The check reads the evidence and the answer. It must not log either of them. The report holds identifiers and the removed phrases, and the removed phrases are phrases the model produced, never something the visitor supplied.
- The check never sends anything anywhere. It is a local function, so it cannot leak the analysis.
- The check is the last place where an invented experience can be caught, so it has to fail safe: when the check itself cannot decide, it downgrades rather than lets the claim through. A false downgrade costs a recruiter one sentence; a false pass costs the credibility of the whole site.

## Performance / Accessibility Considerations

- The check is a linear pass over the narrative and over the evidence, with a normalised copy of the evidence built once and reused for every quote. It has to stay in the millisecond range, because it runs on the path of the answer.
- The corrections change the text of the analysis, so the interface never receives a claim that was removed. There is nothing extra for the interface to present, which keeps M17.07 simpler.

## Definition of Done

- Every claim the analysis makes is checked against the evidence.
- An unsupported claim is downgraded to a learning area with the wording of PRD §88, never dropped from the analysis and never turned into a rejection.
- The durations the analysis claims are checked, and the ones the evidence does not support are removed.
- The corrections are reported without the text of the analysis.
- The tests pass, and lint and typecheck are clean.

## Related Requirements

- PRD §30: AI Job Description Analysis
- PRD §31: Critical Job-Matching Rule
- PRD §41: AI Tone
- PRD §42: AI Answer Quality
- PRD §43: AI Source Grounding
- PRD §44: Unknown Questions
- PRD §88: Job Fit Scoring
- PRD §89: Job Fit UI
