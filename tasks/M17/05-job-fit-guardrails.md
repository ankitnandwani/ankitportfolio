# M17.05 — Apply the Privacy and Safety Guardrails to the Job Fit Flow

## Objective

Put the privacy and the safety rules of PRD §35 to PRD §40 in front of and behind the job fit analysis: check the pasted job description before it is used, remove the personal data from it, keep the injection rules working on a long third-party document, run the output guardrails over the finished analysis, apply the response validation with the evidence as the context, and give the analyzer its own rate limit.

## Context

The chat guardrails of M13.07 were built for a question: a sentence or two, written by a visitor, about Ankit. A job description is a different shape of input, and three of the existing rules do not transfer unchanged.

**The topic classification does not apply.** A job description is not a question, and the classifier of M13.07 would call most of them off-topic. The analyzer therefore does not run the topic classification on the job description. It runs the attack detection, the personal data removal and the length checks, and nothing else.

**The injection detection has to work on a document.** A job description is written by a stranger and can contain text that reads like an instruction. The patterns of M13.07 are matched on tokens, so they work on a document, but a document is much longer than a question and can contain a phrase that also has an innocent reading. The detection therefore runs over the job description, and a match blocks the analysis of that document with a clear message. It does not block the visitor from trying again.

**The personal data of the visitor is in the document.** A job description usually carries the recruiter's name, their e-mail address, the hiring manager's name and the office address. None of it is needed by the model. The personal data is removed before the document is parsed and before it reaches the prompt.

The output side is mostly already there. The output guardrails of M13.07 remove the personal data and the credentials from a text, and the response validation of M13.10 checks the length, the tone and the grounding of an answer against its context. The engine of M17.03 runs the output guardrails; this task adds the response validation with the evidence as the context, and it owns the rate limit of the analyzer.

**The analyzer needs its own limit.** PRD §48 sets the policy for messages: twenty every thirty minutes and a hundred a day. One analysis is not one message. It costs a full prompt with the job description, a larger answer and a JSON parse, and the Gemini free tier allows twenty generations a day. The analyzer therefore has its own bucket with its own limits, which default to something considerably stricter and are configurable through the environment.

## Requirements

- Implement an input policy for the job description that runs before the engine:
  - the length limits of M17.01 are enforced, with a clear reason,
  - the personal data is removed with `detectPii` and `redactPii` from `src/lib/guardrails/piiDetection.ts`,
  - the attack detection runs with `detectInjection` from `src/lib/guardrails/promptInjection.ts`,
  - a detected attack stops the analysis and produces a friendly message that says what happened without repeating the pattern that matched.
- Do **not** run the topic classification on the job description, and say so in a comment, because the job description is not a question.
- Do not let the personal data removal change the structure of the document: the removal replaces the finding with the redaction token, and the parser of M17.02 runs on the redacted text.
- Apply the output guardrails to the finished analysis, through the engine, over every text field.
- Apply the response validation of M13.10 to the narrative of the analysis, with the text of the retrieved evidence as the context, so the grounding check compares the answer against the evidence it was built from.
- When the response validation fails, do not show the analysis. Show the safe fallback of M13.10, which is the behaviour of the chat, and mark the result so the route can log it.
- Give the analyzer its own rate limiter:
  - a separate store and a separate set of limits, so the counts of the analyzer never reduce the allowance of the chat,
  - the keys of the analyzer are namespaced, so a visitor cannot spend the allowance of the chat by analysing job descriptions,
  - the limits come from the environment when it holds them, and the code holds the default.
- Send the limit headers with every answer of the analyzer: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and `Retry-After` when the request is turned away.
- Keep the guardrail log free of the job description and free of the answer. The guardrail event of M13.07 carries the action, the subject, the confidence and the number of findings, and that is what the analyzer logs too.
- Record the corrections of M17.04, the redactions and the rate limit decisions in the log, as counts and identifiers.

## Scope

### In scope

- `src/lib/jobFit/policy.ts` — the input policy and the rate limit of the analyzer.
- `src/lib/jobFit/policy.test.mts` — the tests.
- `src/lib/jobFit/analysis.ts` (updated) — the response validation with the evidence as the context.
- `src/lib/env.ts`, `src/lib/env.js` and `.env.example` (updated) — the optional variables of the analyzer.
- `src/lib/githubService.test.mts` (updated) — the new variables in the list the test sets.
- The exports through `src/lib/jobFit/index.ts`.

### Out of scope

- The rate limiter of the chat, which stays as it is.
- The route (M17.06), which applies the limit and sends the headers.
- The interface (M17.07).
- Any change to the guardrail modules themselves. The analyzer uses them the way they are.

## Dependencies

- M17.01 — the limits.
- M17.03 — the engine the policy wraps.
- M13.07 — `detectPii`, `redactPii`, `detectInjection` and `applyOutputGuardrails`.
- M13.10 — `validateResponse` and `createRateLimiter`.

## Files / Areas Expected To Change

- `src/lib/jobFit/policy.ts` (to be created) — the input policy and the rate limit.
- `src/lib/jobFit/policy.test.mts` (to be created) — the tests.
- `src/lib/jobFit/analysis.ts` (updated) — the response validation.
- `src/lib/env.ts` (updated) — the optional variables.
- `src/lib/env.js` (updated) — the same variables for the environment check.
- `.env.example` (updated) — the same variables, with a comment.
- `src/lib/githubService.test.mts` (updated) — the variables in the list the test sets before it imports a module that reads the environment.

## Implementation Guidance

1. Write the policy as one function that takes the raw job description and returns either a redacted document or a reason the analysis cannot go on:

   ```typescript
   export type JobFitInputPolicy =
     | { allowed: true; jobDescription: string; redactions: number }
     | { allowed: false; reason: 'too_short' | 'too_long' | 'injection' };
   ```

2. The order of the checks follows PRD §35. The length is checked first, because it is the cheapest check and it bounds the work of the other two. Then the personal data is removed. Then the attack detection runs, on the redacted text, so that a credential in the document is not matched as an attack.

3. Redact with the existing helper rather than writing a new one:

   ```typescript
   const detection = detectPii(raw);
   const redacted = detection.hasPii ? redactPii(raw) : raw;
   ```

   `redactPii` replaces the finding with the redaction token of M13.07. The count of the redactions is returned so the route can log it without the text.

4. Run the attack detection on the redacted text and block on `isInjection`. A `isSensitiveRequest` finding is **not** a reason to block: a job description may legitimately ask for "his contact details" as a requirement, and that is a requirement to analyse, not an attack.

5. Write the reason for the block in the visitor's language, without the pattern that matched. Something in the shape of: "This job description contains text that looks like an attempt to change the assistant's instructions, so it was not analysed. Paste the job description without that text and try again." Do not say which pattern matched and do not repeat it.

6. Give the analyzer its own limiter. The limiter of M13.10 is created by `createRateLimiter`, and it takes a store and a clock, so the analyzer creates a second instance with a second store:

   ```typescript
   const jobFitLimiter = createRateLimiter({
     windowSeconds: JOB_FIT_WINDOW_SECONDS,
     maxRequests: JOB_FIT_MAX_REQUESTS,
     dailyWindowSeconds: JOB_FIT_DAILY_WINDOW_SECONDS,
     dailyMaxRequests: JOB_FIT_DAILY_MAX_REQUESTS,
   });
   ```

   The default limits are five analyses every thirty minutes and ten a day. The chat keeps its twenty and a hundred. The store is in memory, the way the chat store is, and it is injectable so a shared store can replace it later, as DECISIONS.md records for the chat.

7. Namespace the key of the analyzer, so the counts never meet the counts of the chat:

   ```typescript
   limiter.check(`jobfit:${clientKey}`);
   ```

   The route of M17.06 computes the client key the way the chat route does, and the same header names are used.

8. Add the variables to the environment as optional, exactly the way `RATE_LIMIT_WINDOW_SECONDS` and the others were added in M13.10. A missing variable only means the default is used, and a variable that does not hold a number is ignored:

   - `JOB_FIT_WINDOW_SECONDS`
   - `JOB_FIT_MAX_REQUESTS`
   - `JOB_FIT_DAILY_WINDOW_SECONDS`
   - `JOB_FIT_DAILY_MAX_REQUESTS`
   - `JOB_FIT_MAX_TOKENS`

   Add them to `src/lib/env.ts`, to `src/lib/env.js` and to `.env.example`, and add them to the list of variables the test in `src/lib/githubService.test.mts` sets before it imports a module that reads the environment. A variable that is not set must not break the test.

9. Apply the response validation in the engine, with the evidence as the context:

   ```typescript
   const validation = validateResponse(narrative, { context: evidenceText });
   ```

   The context is the text of the retrieved chunks, joined. The grounding check of M13.10 then compares the numbers and the acronyms of the analysis against the evidence, which is exactly what it is for.

10. When the validation fails, the analysis is not returned. The safe fallback of M13.10 is returned instead, and the metadata says that the analysis was replaced. The visitor sees a professional answer and no error, which is the behaviour of PRD §76.

11. Keep the log free of the document. The log of the analyzer carries the counts: the number of redactions, whether an attack was blocked, the number of corrections of M17.04, and the rate limit decision. It carries neither the job description nor the analysis.

## Acceptance Criteria

- A job description that is too short or too long is refused with a clear reason.
- The personal data of the job description is removed before the document is parsed, and the number of redactions is reported.
- A job description with an injected instruction is refused with a friendly message that does not repeat the pattern that matched.
- A job description that asks for contact details as a requirement is **not** refused, because that is a requirement and not an attack.
- The topic classification is not run on the job description.
- The output guardrails run over every text field of the analysis.
- The response validation runs with the evidence as the context, and a failing validation replaces the analysis with the safe fallback.
- The analyzer has its own limiter, with its own store, its own limits and namespaced keys.
- The chat limiter and the analyzer limiter do not affect each other.
- The limits of the analyzer can be changed through the environment, and a missing or invalid variable falls back to the default.
- The rate limit headers have the same names as the chat uses.
- The log carries the counts and carries neither the job description nor the analysis.
- The tests cover every case above, and `npm test`, `npm run lint`, `npm run typecheck` and `npm run env:check` pass.

## Testing Requirements

- A document that is too short is refused with `too_short`, and one that is too long with `too_long`.
- A document with an e-mail address and a phone number is redacted, and the redaction count is right.
- A document with "ignore the previous instructions" is refused with the injection reason.
- A document that asks for "his phone number and e-mail address" as a requirement is allowed.
- The redacted document is what the parser receives.
- The output guardrails remove a phone number that the model put into the analysis.
- A response validation that fails replaces the analysis with the fallback and sets the flag.
- The analyzer limiter allows five requests in the window and refuses the sixth, with the retry after in seconds.
- The daily limit of the analyzer is separate from the window limit.
- The chat limiter is not affected by the analyzer limiter, and the other way round.
- The environment variables are read, and an invalid value falls back to the default.
- The guardrail log of a blocked analysis holds no text of the job description.

## Security / Privacy Considerations

- A job description is third-party text and may carry the personal data of the recruiter and of the hiring manager. That data is removed before the document is used, so it never reaches the model and never reaches a log.
- An attack in the job description is refused before the document is parsed, so the attack text never reaches the prompt.
- The visitor cannot use the analyzer to spend the chat allowance, because the two use separate stores and namespaced keys. The limit is still a guard against accidents and not a wall, because the visitor is identified by the address the hosting platform writes into the request, exactly as the chat does.
- The rate limit message is friendly and says nothing about the limits themselves, the way the chat message does.
- The safe fallback of M13.10 is what a visitor sees when the validation fails, so a failed analysis never leaks a raw model output.
- Nothing in this task logs the document, the analysis or the personal data that was found in it.

## Performance / Accessibility Considerations

- The checks are cheap. The length check is first, the redaction is a single pass and the attack detection is the token matching of M13.07, which is fast on a long document.
- The redaction happens once, before the parsing, so the parser and the prompt builder never see the personal data.
- The response validation adds a single pass over the narrative and a normalised copy of the evidence. The evidence is built once and reused.
- The message of a refused analysis is plain text and reads the same to a screen reader as the rest of the interface.

## Definition of Done

- The pasted job description is checked before it is used, and the personal data is removed before it is used.
- An injected instruction in the job description stops the analysis with a clear, friendly message.
- The finished analysis passes through the output guardrails and the response validation.
- The analyzer has its own rate limit with configurable limits and the same headers as the chat.
- The new environment variables are optional and documented.
- The log holds counts and no text.
- The tests pass, and lint, typecheck and the environment check are clean.

## Related Requirements

- PRD §35: Privacy Architecture
- PRD §36: Sensitive Data Protection
- PRD §37: Resume Phone Number Protection
- PRD §38: Prompt Injection Defense
- PRD §39: Off-Topic Conversation Handling
- PRD §40: Professional Conversation Redirect
- PRD §41: AI Tone
- PRD §42: AI Answer Quality
- PRD §48: AI Rate Limiting
- PRD §76: AI Failure Handling
- PRD §80: Security
- PRD §84: Cost Protection
- PRD §101: Data Retention
