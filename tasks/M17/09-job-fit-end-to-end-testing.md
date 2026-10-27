# M17.09 — Test and Verify the Job Fit Analyzer End to End

## Objective

Prove that the job fit analyzer works as a whole: that it analyses a pasted job description into a truthful, evidence-based fit narrative, that it never rejects a role because of a gap and never invents experience, that it refuses a document that carries an injected instruction, that it stays within its limits, and that the whole thing holds together on a real device.

## Context

Every task of M17 ends with its own tests, but the milestone needs the tests that only exist when the whole flow runs: the route, the engine, the guardrails and the interface together, with a real model and a real knowledge base.

The milestone has one characteristic that the chat does not have, and it changes how it has to be verified. The output of the analyzer is a **narrative**. A unit test can prove that a section is present and that a claim was downgraded, but it cannot prove that the narrative reads as positive, recruiter-friendly and evidence-based, which is the Definition of Done of the milestone:

> The tool produces positive, truthful, evidence-based fit narratives.

So the verification has three layers: the automated tests, a fixed set of job descriptions that are analysed against the live knowledge base and read by a human against the rules of PRD §31 and PRD §88, and the checks of the interface on a phone and on a desktop.

The Gemini free tier allows twenty generation requests a day. The live part of the verification is therefore opt-in, the same way `LIVE_LLM_TESTS=1` is in `src/lib/llm/geminiProviderLive.test.mts`. A live test of the analyzer has to be written so that it spends one generation per case and no more.

The test plan of M13 lives in `test-plan.md` at the root. This task extends it with a job fit section rather than starting a second file, so that the whole site's verification stays in one place.

## Requirements

- Extend `test-plan.md` with a job fit section, with the same shape as the existing sections: the categories, the numbered cases, the expected result, the actual result and the status.
- Write the live test of the analyzer as an opt-in test file, following the pattern of `src/lib/llm/geminiProviderLive.test.mts` and `src/lib/knowledge/retrievalLive.test.mts`:
  - it only runs when `LIVE_LLM_TESTS=1` is set,
  - it skips with a clear message when the variable is not set,
  - it spends one generation per case.
- Define the fixed set of job descriptions the milestone is verified against. They are stored in the repository as fixtures, never as a document a visitor sent:
  1. **A strong match.** A senior automation and quality engineering role whose requirements are covered by the knowledge base.
  2. **A partial match.** A role that asks for a technology that is not in the profile, next to requirements that are covered.
  3. **A low overlap.** A role in a domain the profile does not cover at all.
  4. **A role with a "nice to have" list.** To see that the optional requirements are told apart from the required ones.
  5. **A job description with an injected instruction.** To see that the analysis is refused.
  6. **A job description with the personal data of a recruiter.** To see that the data is removed before the document is used.
  7. **A document that is not a job description.** To see that it is refused.
- Verify against the live knowledge base that:
  - every analysis returns the six sections,
  - every requirement is classified as one of the five classifications of PRD §88,
  - a requirement that the evidence does not support is written as a learning area and never as a rejection,
  - no requirement produces the phrase "not a fit" or any equivalent,
  - a duration of experience that the evidence does not contain never appears in the narrative,
  - every claim of the narrative appears in the retrieved evidence, or is a general statement that does not claim a specific experience.
- Verify the limits against the running site:
  - the limit headers are sent,
  - the request that is over the limit is answered with the status 429 and a friendly message,
  - the chat allowance is not affected by the analyzer.
- Verify the interface:
  - the page loads, the field works, the button works, the result renders,
  - the six sections, the three bars and the call to action are shown,
  - no percentage appears anywhere,
  - the layout works on a phone and on a desktop,
  - the keyboard alone is enough to use it,
  - the light and the dark theme work,
  - the reduced motion works.
- Verify the privacy:
  - the job description does not reach the logs,
  - the job description does not reach the analytics,
  - the phone number of the recruiter does not reach the model,
  - the browser keeps no copy of the job description after the page is closed.
- Update the documentation: `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md` and, when a decision was made during the implementation that is not yet recorded, `DECISIONS.md`.

## Scope

### In scope

- `test-plan.md` (updated) — the job fit section.
- `src/lib/jobFit/analysisLive.test.mts` (to be created) — the opt-in live test.
- `src/lib/jobFit/fixtures/jobDescriptions.mts` (to be created) — the fixed job descriptions.
- `scripts/verifyJobFit.mts` (to be created) — a script that runs the fixed job descriptions against the live knowledge base and writes a report, so the verification can be repeated without spending the daily budget by accident.
- The documentation updates.

### Out of scope

- A change to the analysis, the policy or the interface. A failing verification is fixed in the task that owns the behaviour, not in this one.
- A change to the knowledge base. The job descriptions are not ingested.
- An end-to-end browser test with Playwright. PRD §104 names Playwright for the end-to-end tests, but the repository has no browser test setup yet. Adding one is a separate decision and is out of scope here.
- A test of the other milestones.

## Dependencies

- M17.01 to M17.08 — everything has to be finished.
- M13.12 — the shape of the existing test plan.

## Files / Areas Expected To Change

- `test-plan.md` (updated) — the job fit section.
- `src/lib/jobFit/analysisLive.test.mts` (to be created) — the live test.
- `src/lib/jobFit/fixtures/jobDescriptions.mts` (to be created) — the fixed job descriptions.
- `scripts/verifyJobFit.mts` (to be created) — the repeatable verification script.
- `package.json` (updated) — a `verify:job-fit` script, the way `scan:kb` and `embed` were added.
- `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md` (updated) — the documentation.
- `DECISIONS.md` (updated) — the decisions that were made during the implementation and are not yet recorded.

## Implementation Guidance

1. Write the live test the way `src/lib/llm/geminiProviderLive.test.mts` does it:

   ```typescript
   const live = process.env.LIVE_LLM_TESTS === '1';

   test('analyses a job description against the live knowledge base', { skip: live ? false : 'set LIVE_LLM_TESTS=1 to run the tests against the real Gemini API' }, async () => {
     // one generation
   });
   ```

   The skip message has to name the variable, so a developer who sees the skip knows what to do.

2. Keep the live test to one generation. The test analyses one job description and asserts on the result. The other cases are covered by the script of point 4, which is run by hand when the daily budget allows it.

3. Store the fixed job descriptions as fixtures. They are written in the voice of a real posting, with the headings, the bullets and the noise a real posting has, so the parser of M17.02 is exercised. They name no real company and no real person. The fixture for the injected instruction contains the phrase in a way a real posting would never have it, so it is obviously a fixture and not a document a visitor sent.

4. Write the script so the verification can be repeated deliberately:

   ```typescript
   // scripts/verifyJobFit.mts
   ```

   It reads the fixtures, analyses each one, and writes a report with the result of every rule: the six sections are there, every requirement is classified, no rejection phrase is present, no unsupported duration is present, and every claim is in the evidence. It exits with a non-zero code when a rule fails, the way `scripts/scanKnowledgeBase.mts` does. Add the script to `package.json` as `verify:job-fit`.

5. Write the checks of the narrative as a small module of rules, so the same rules are used by the live test, by the script and by the human reading of the report:

   - the six sections are present and not empty,
   - every requirement of the analysis is classified as one of the five,
   - no text of the analysis matches a rejection phrase, such as "not a fit", "not a match", "does not meet", "lacks the required",
   - every duration of experience in the narrative appears in the evidence,
   - every requirement that is classified as `LEARNABLE` carries the wording of PRD §88.

   Put these rules in `src/lib/jobFit/analysis.test.mts` as well, so they run on every `npm test` against the fixtures and a fake provider.

6. Check the rejection phrases carefully. The phrase "is not a fit" is forbidden by PRD §88. A rule that only looks for one exact phrase would miss "would not be a strong match". Write the rules over a small set of phrases, and read the list of phrases before it is used, so the list does not catch a legitimate sentence.

7. Verify the privacy by reading what the server writes. Run the analysis against the running site with a job description that carries a phone number and an e-mail address, then read the server log. The log must hold neither the document nor the analysis. The same check is done against the analytics: the event that is fired must not hold the document either.

8. Verify the limits against the running site with the same steps the chat uses: send the requests until the limit is reached, check the status of 429, the `Retry-After` header and the three limit headers, and then send a chat request to confirm the chat allowance was not touched.

9. Verify the interface on a phone and on a desktop. Check the layout, the field, the loading state, the error state, the result, the bars, the call to action, the theme, the reduced motion and the keyboard.

10. Write the job fit section of `test-plan.md` in the shape of the existing sections, with a numbered case, the expected result, the actual result and the status for every case. The cases are:

    - the six sections are rendered for a strong match,
    - a partial match produces a learning area and no rejection,
    - a low overlap still produces a positive, evidence-based narrative,
    - the optional requirements are told apart from the required ones,
    - the injected instruction is refused,
    - the personal data of the recruiter never reaches the model,
    - a document that is not a job description is refused,
    - the limit is enforced and the headers are sent,
    - the chat allowance is not affected,
    - the analytics event holds no personal data,
    - the interface works on a phone, on a desktop, with the keyboard and in both themes,
    - the duration of an analysis stays inside the target.

11. Update the documentation when everything passes:
    - `PROJECT_STATE.md` marks M17.01 to M17.09 as completed and describes what was built,
    - `TODO.md` moves the immediate next action to the next milestone, which is ROADMAP Milestone 18, the contact form,
    - `CHANGELOG.md` gets an entry for the milestone,
    - `DECISIONS.md` gets the decisions that were made during the implementation and are not recorded yet.

12. Commit the milestone when everything is done, following the convention of the repository: one commit per task during the implementation, and a final one for the verification.

## Acceptance Criteria

- `test-plan.md` has a job fit section with the numbered cases, the expected result, the actual result and the status.
- The live test is opt-in, skips with a clear message and spends one generation.
- The fixtures hold the seven job descriptions, with no real company and no real person in them.
- The script runs the fixtures against the live knowledge base, writes a report and exits with a non-zero code when a rule fails.
- The rules of point 5 are written once and are used by the live test, by the script and by the unit tests.
- The unit tests run the rules against the fixtures with a fake provider, on every `npm test`.
- Every case of the test plan has been executed and has a recorded status.
- The verification of the running site covers the limit headers, the status of 429, the isolation of the chat allowance and the privacy of the log and of the analytics.
- The interface is verified on a phone and on a desktop, with the keyboard alone, in both themes and with the reduced motion.
- The documentation is updated: `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md` and `DECISIONS.md`.
- The work is committed.
- `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` all pass.

## Testing Requirements

- The live test skips with a message that names `LIVE_LLM_TESTS=1` when the variable is not set.
- The live test analyses one job description and asserts that the six sections are there and that every requirement is classified.
- The unit tests run the narrative rules against the fixtures with a fake provider, on every run of the test suite.
- The rejection phrase rule catches "not a fit" and "would not be a match".
- The duration rule catches a duration that is not in the evidence.
- The learning area rule checks that a downgraded requirement carries the wording of PRD §88.
- The script exits with a non-zero code when a rule fails and with zero when all the rules pass.
- The whole suite passes, and the build succeeds.

## Security / Privacy Considerations

- The job descriptions that are used for the verification are written for this purpose and are stored in the repository. They carry no real company, no real person, no real contact details and nothing confidential.
- The verification reads the server log to confirm that the document and the analysis are not written to it. This check is the reason the log is read during the verification and not only after it.
- The analytics event is inspected to confirm that it holds no document, no title, no company and no contact details.
- The live test spends the daily generation budget of the free tier. It is opt-in for that reason, and the script has to be run deliberately.

## Performance / Accessibility Considerations

- The duration of an analysis is measured and recorded. The analysis is heavier than a chat answer, and the loading state of M17.07 has to cover the wait. The target is that the analysis answers within a reasonable time of the chat, and the actual number is recorded in the test plan.
- The interface is checked on a phone and on a desktop, because the recruiter pastes a job description on a phone more often than not.
- The keyboard check covers the whole flow, because the field is long and the result is long.
- The reduced motion check covers the loading animation and the entrance of the result.

## Definition of Done

- The whole flow is verified, automatically and by hand, against the live knowledge base.
- Every case of the job fit section of the test plan has a recorded result.
- The rules of PRD §31 and PRD §88 are checked mechanically, not only by reading.
- The privacy of the log, of the analytics and of the model input is confirmed.
- The documentation is updated and the work is committed.
- The tests, the lint, the typecheck and the build pass.

## Related Requirements

- PRD §30: AI Job Description Analysis
- PRD §31: Critical Job-Matching Rule
- PRD §41: AI Tone
- PRD §42: AI Answer Quality
- PRD §43: AI Source Grounding
- PRD §48: AI Rate Limiting
- PRD §71: Accessibility
- PRD §74: Performance
- PRD §76: AI Failure Handling
- PRD §88: Job Fit Scoring
- PRD §89: Job Fit UI
- PRD §104: Automated Tests
- PRD §126: Milestone 17 — Job Description Analyzer
