# M17.02 — Parse a Job Description into Requirements

## Objective

Turn a pasted job description into a list of discrete requirements, each with an identifier, its text, the kind of requirement it is and whether it is required. The parsing is deterministic: no model is called, so it costs nothing, it is fast, and it is fully unit-testable.

## Context

The analysis engine of M17.03 has to classify requirements against the knowledge base, and it has to know which requirements are which. A pasted job description is not a list of requirements: it is a document with headings, bullet points, numbered lists, salary lines, contact blocks and paragraphs of boilerplate.

Splitting that document up is the job of this task. Doing it deterministically rather than with the model has three reasons:

- The Gemini free tier allows twenty generation requests a day. A parsing step that calls the model would spend a quarter of the daily budget before the analysis even starts.
- The result has to be explainable. A recruiter can be told "this requirement came from the 'Requirements' section" without a model being involved.
- The result has to be stable. The same job description has to produce the same requirements every time, otherwise the analysis cannot be tested.

PRD §88 asks for every requirement to be classified, and PRD §31 forbids rejecting a role because of a gap. Both only work if the gaps are actually found, so the parser has to be thorough about the bullet points that are the requirements and careful about the text that is not.

## Requirements

- Parse a raw job description into a title, an optional company, and a list of requirements.
- Identify the requirements from:
  - bullet points (`-`, `*`, `•`, `–`, `—`),
  - numbered list items (`1.`, `2)`, `3 -`),
  - checkboxes (`[ ]`, `[x]`),
  - and plain lines under a heading that names responsibilities or requirements.
- Recognise the usual section headings and map them to the kinds of the contract: `responsibility`, `requirement`, `qualification`, `nice_to_have`.
  - "Responsibilities", "What you'll do", "The role", "Your impact" → `responsibility`
  - "Requirements", "Required", "Must have", "You have", "We are looking for" → `requirement`
  - "Qualifications", "Who you are", "About you" → `qualification`
  - "Nice to have", "Preferred", "Bonus", "Plus", "Good to have" → `nice_to_have`
- A requirement under a "nice to have" heading is **not** required, whatever the wording of the line says.
- A line before any heading is treated as `other` and is still a candidate requirement, because a job description often starts with the requirements.
- Ignore the parts of the document that are not requirements: the salary line, the benefits block, the equal opportunity statement, the application instructions, the contact block, the URL, and the "about the company" prose.
- Keep the original wording of every requirement. The text is never rephrased, because the analysis refers to it and a recruiter has to recognise it.
- Give every requirement an identifier that is stable within one parse, of the form `r1`, `r2`, and so on, in the order the requirements appear in the document.
- Extract the role title when it can be found with confidence: the first short line that is not a heading and not a bullet, or a line that starts with a label such as "Role:", "Position:", "Job title:" or "Title:".
- Extract the company when it can be found with confidence: a line that starts with "Company:", "Organisation:", "Organization:" or "Employer:", or a title line that contains " at " followed by a short company name.
- Return the number of requirements that were left out because the list was longer than the limit, so the caller can say the analysis is based on the first N requirements.
- Reject a document that is too short to be a job description, and reject one that is too long, with a clear reason in both cases.
- Report a document that yields no requirements at all, so the visitor is told to paste a real job description rather than being shown an empty analysis.

## Scope

### In scope

- `src/lib/jobFit/jdParser.ts` — the parser.
- `src/lib/jobFit/jdParser.test.mts` — the tests.
- The exports of the parser through `src/lib/jobFit/index.ts`.

### Out of scope

- The model, the prompt and the analysis (M17.03).
- The guardrails that run before the parsing (M17.05).
- The interface (M17.07).
- Reading anything from disk. A job description arrives as a string in the request and goes nowhere else.

## Dependencies

- M17.01 — the requirement type, the kinds and the limits.

## Files / Areas Expected To Change

- `src/lib/jobFit/jdParser.ts` (to be created) — the parser.
- `src/lib/jobFit/jdParser.test.mts` (to be created) — the tests.
- `src/lib/jobFit/index.ts` (updated) — the exports.

## Implementation Guidance

1. Write the parser as a set of small pure functions that each do one thing, so each one can be tested on its own:

   - `splitLines(raw)` — normalises the line endings and trims the trailing spaces.
   - `stripBullet(line)` — removes a leading bullet, a leading number or a leading checkbox, and returns the text that is left together with a flag that says what kind of marker was found.
   - `classifyHeading(line)` — returns the kind of heading, or `null` when the line is not a heading.
   - `isNoise(line)` — returns true for the lines that are never a requirement.
   - `extractTitle(lines)` and `extractCompany(lines)`.
   - `parseJobDescription(raw)` — the function that puts the others together.

2. A heading is recognised by a small set of known phrases, matched the way the guardrails match: on tokens, in a case-insensitive way, so "REQUIREMENTS", "Requirements" and "requirements" are the same heading. Do not use a regular expression with an unbounded repetition on the line, because the bound is what keeps a long line fast (see DECISIONS.md on the bounded repetitions).

3. A line is a candidate requirement when it carried a bullet or a number, or when it follows a heading that names requirements and is long enough to be one. A line that is shorter than ten characters after the marker is treated as a label rather than a requirement, because "Benefits" is not a requirement.

4. The noise rules must be specific. A line is noise when it starts with a known label that never introduces a requirement:

   - a currency amount, or a line that contains a yearly salary,
   - "equal opportunity", "we are an equal", "diversity", "accommodation",
   - "how to apply", "apply now", "submit your", "application",
   - "our benefits", "what we offer", "perks",
   - "about the company", "about us",
   - "contact us", "reach out", "our website", "http", "www.",
   - a line that is only an e-mail address or only a phone number.

   These are matched as phrases at the start of the line, not as a pattern that can appear anywhere, so a requirement that happens to mention "apply" is not lost.

5. The length checks come first, before any work is done, so a huge document is rejected in constant time:

   ```typescript
   if (raw.length > MAX_JOB_DESCRIPTION_LENGTH) {
     return { ok: false, reason: 'too_long' };
   }
   if (raw.trim().length < MIN_JOB_DESCRIPTION_LENGTH) {
     return { ok: false, reason: 'too_short' };
   }
   ```

6. The result of the parse is a discriminated union, so the caller has to handle the failure:

   ```typescript
   export type ParsedJobDescription =
     | { ok: true; title: string | null; company: string | null; requirements: JobRequirement[]; omittedRequirements: number }
     | { ok: false; reason: 'too_short' | 'too_long' | 'no_requirements' };
   ```

7. When there are more requirements than `MAX_ANALYSED_REQUIREMENTS`, keep the required ones first and the optional ones after, and count what was left out. Dropping a "must have" in favour of a "nice to have" would distort the analysis, so the order matters.

8. The parser must not modify the wording. The only change to the text is the removal of the marker in front of it.

9. Keep the parser free of imports beyond the contract of M17.01, so it can be loaded by a test without an environment.

## Acceptance Criteria

- A job description with bullet points under "Requirements" and "Nice to have" headings produces one requirement per bullet, with the right kind and the right required flag.
- A "nice to have" bullet is not required even when its wording reads like a requirement.
- A numbered list is parsed the same way as a bulleted one.
- A checkbox item is parsed the same way as a bulleted one.
- A requirement that appears before any heading is kept, with the kind `other`.
- The salary line, the benefits block, the equal opportunity statement and the application instructions are not turned into requirements.
- The original wording of every requirement is preserved apart from the marker in front of it.
- The identifiers run `r1`, `r2`, and so on in the order the requirements appear.
- The role title and the company are extracted when they are there, and are `null` when they are not.
- A document that is too short is rejected with the reason `too_short`, and one that is too long with `too_long`.
- A document without any requirement is rejected with `no_requirements`.
- When the list is longer than the limit, the required requirements are kept, the number left out is reported, and the limit is the one from M17.01.
- The parser calls no model, reads no file and touches no network.
- The tests cover every case above, and `npm test`, `npm run lint` and `npm run typecheck` pass.

## Testing Requirements

- A realistic job description with two sections produces the expected requirements in the expected order.
- Every bullet marker is recognised.
- Every known heading is recognised, in upper case, lower case and mixed case.
- A "nice to have" requirement is marked as not required.
- The noise lines are dropped and a requirement that contains a noise word is kept.
- The title is found from a leading line, from a "Role:" label and from a "Senior X at Y" line; it is `null` when there is none.
- The company is found from a "Company:" label and from a "at Y" title; it is `null` when there is none.
- The length limits are enforced on the raw text, including a text that is exactly on the limit and one that is one character over it.
- A document with no requirements is rejected.
- A document with more requirements than the limit keeps the required ones and reports the number left out.
- The parser is fast on a large document: a document at the upper limit is parsed in well under a second, asserted with a generous bound so the test does not become flaky.

## Security / Privacy Considerations

- The parser is the first place the job description is read. It must not write anything to disk, must not log the text, and must not send it anywhere. The caller is the only thing that holds the document.
- A job description is written by somebody else and often contains the recruiter's name, their e-mail address, the hiring manager's name and the office address. The parser keeps the text of the requirements, and a name inside a requirement stays inside it. It is the guardrails of M17.05 that remove the personal data before the document reaches the model.
- The parser does not evaluate anything it reads. A job description is data, never code and never an instruction.

## Performance / Accessibility Considerations

- The parser is a single pass over the lines of the document, so it is linear in the size of the document and finishes in milliseconds.
- The heading and noise matching uses token comparison rather than regular expressions with unbounded repetitions, so a long line cannot slow it down.
- The parser returns a plain data structure. The interface of M17.07 renders the result, so nothing here has to be accessible on its own.

## Definition of Done

- The parser turns a job description into a typed, ordered list of requirements.
- The kinds, the required flag, the title, the company and the omitted count are all correct.
- The noise is dropped and the wording is preserved.
- The parser is deterministic, makes no model call and touches no external system.
- The tests cover the cases above, and lint and typecheck are clean.

## Related Requirements

- PRD §30: AI Job Description Analysis
- PRD §31: Critical Job-Matching Rule
- PRD §88: Job Fit Scoring
- PRD §89: Job Fit UI
- PRD §101: Data Retention
