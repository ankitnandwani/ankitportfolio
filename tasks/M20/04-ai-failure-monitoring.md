# M20.04 – Monitor the Failures of the Language Model

## Objective

Tell apart the different ways the language model can fail, report them under a name that groups them, and keep the question of the visitor and the answer of the model out of the report.

## Context

The language model is the part of the site that fails most often, and it fails in ways that mean different things to the owner:

- The key is wrong or the model name is not right. Nothing will work until it is fixed.
- The free tier of the API is spent, or the request is too many. The site should answer with a short wait and try again.
- The model took too long. The answer was cut off in time.
- The API itself had a problem.
- The model refused to answer because of its own safety rules.

The repository already knows all of this:

- `src/lib/llm/provider.ts` holds `LLMError` with a `status` and a `retryable` getter, and `LLMConfigurationError`.
- `src/lib/geminiErrors.ts` holds `GeminiApiError` and `readErrorDetails`, which pulls a readable message and a status out of a failure whose message is the whole body of the answer of the API.
- `src/lib/ai/orchestration.ts` catches a failure of the model, turns it into a friendly answer for the visitor, and rethrows it. The rethrow is what makes it visible to the route and therefore to M20.03.
- `src/lib/llm/geminiProvider.ts` removes the API key from every message before it is raised, and a test asserts that a rejected key never appears in a message.

The site answers with `gemini-flash-lite-latest`, which is the cheap and fast model. The free tier of the Gemini API allows twenty generation requests a day, and the live tests of the language model are opt in with `LIVE_LLM_TESTS=1` for exactly that reason. **Nothing in this task may turn the live tests on by default.**

PRD §79 asks for the AI failures to be tracked, and PRD §129 asks for the AI failure monitoring. The DoD of the milestone is that the errors are captured and alertable.

## Requirements

### 1. The failures of the model are classified

Create `src/lib/monitoring/aiFailures.ts`:

- A function that takes a failure and says what kind it is. The kinds are:
  - `configuration` – the key or the model name is wrong. `LLMConfigurationError`.
  - `quota` – the free tier is spent, or the request is too many. The status is 429.
  - `timeout` – the model took too long. The status is 408, or the failure says so.
  - `unavailable` – the API had a problem. The status is 5xx.
  - `blocked` – the model refused to answer for its own reasons.
  - `unknown` – anything else.
- The classification uses the status that the provider already carries. It does not read the text of the message to decide, because the text of the message of the API can be anything.
- The function never throws.

### 2. The classification is reported, and the reports are grouped

- The report carries the kind of the failure, the status, the model that was asked, and the identifier of the query when there is one.
- The report is grouped by the kind of the failure, so a thousand timeouts are one issue and not a thousand. The way the SDK groups is a configuration of the SDK, and the name of the group comes from the context of the report.
- The report holds no question, no answer, no prompt and no context of the retrieval. The route of M20.03 and the scrubbing of M20.02 make that sure; this task adds the kind and the status and nothing else.

### 3. The failure is reported where it happens

- `src/lib/ai/orchestration.ts` reports the failure of the model, with the kind that the classification gives. It reports it before it turns the failure into the friendly answer, so the report is not lost when the instance is put to sleep.
- The report is not awaited in a way that would delay the visitor. The visitor gets the friendly answer as soon as the failure is known, and the report goes out on its own.
- The friendly answer the visitor sees stays exactly the one of today.

### 4. The failures that are expected are not failures of the site

- A refusal of the limit of the chat is reported by the analytics of M19.04 and must not be reported here as well. It would double every refusal in the project.
- A question that the guardrails refuse is a normal answer, not a failure of the model. The guardrails hold their own event and it must not be reported here.

## Scope

### In scope

- `src/lib/monitoring/aiFailures.ts` (new)
- `src/lib/monitoring/aiFailures.test.mts` (new)
- `src/lib/monitoring/index.ts` (the exports)
- `src/lib/ai/orchestration.ts`

### Out of scope

- Changing the model, the timeout or the number of attempts. The adapter of the provider owns them and DECISIONS.md records why they are what they are.
- Changing the friendly answer of the visitor
- The other routes, which are M20.03
- The live tests, which stay opt in

## Dependencies

- M20.02 – the report goes through the scrubbing.

## Files / Areas Expected To Change

- `src/lib/monitoring/aiFailures.ts` (new)
- `src/lib/monitoring/aiFailures.test.mts` (new)
- `src/lib/monitoring/index.ts` (new or extended)
- `src/lib/ai/orchestration.ts`

## Implementation Guidance

1. **The status is the source of truth.** `LLMError.status` is 0 when the provider did not report one, and `retryable` is already true for 408, 429 and 5xx. The classification is a mapping of the status and of the name of the error, and nothing more.
2. **`readErrorDetails` is the helper for a failure whose message is the body of an answer.** It is already used where the SDK reports a failure in a way that hides the status.
3. **A configuration failure is not retried and is not a fault of the model.** `LLMConfigurationError` is a deployment problem. It is reported, and it is reported apart, because the fix is different: the owner has to change a variable, not wait for the model to come back.
4. **The report is grouped.** The SDK groups the reports that share a fingerprint. The kind of the failure is part of the fingerprint, so a hundred failures of the same kind are one issue.
5. **Do not touch the live tests.** `LIVE_LLM_TESTS=1` stays the switch. A task that adds a live call to the suite spends the budget of the day for everybody.

## Acceptance Criteria

- A failure of each kind is classified as that kind: a configuration, a quota, a timeout, an unavailable service, a refusal by the model and an unknown failure.
- The classification does not read the text of the message to decide.
- The report holds the kind, the status, the model and the identifier of the query, and nothing that a visitor wrote.
- A refusal of the limit of the chat and a refusal of the guardrails are not reported here.
- The visitor still receives the same friendly answer.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: `LLMConfigurationError` is classified as `configuration`.
- Unit test: a failure with the status 429 is classified as `quota`.
- Unit test: a failure with the status 408 is classified as `timeout`.
- Unit test: a failure with the status 500 is classified as `unavailable`.
- Unit test: a failure with the status 400 is classified as `unknown`.
- Unit test: a failure that is not an error at all does not throw.
- Unit test: the classification of a failure whose message is the body of an answer of the API works, through `readErrorDetails`.
- Unit test: the report of a failure of the model holds no question and no answer.
- Manual: the chat route is made to fail with a wrong key and the report is seen in the Sentry project under the kind `configuration`.

## Security / Privacy Considerations

- The question of a recruiter is often confidential to the employer. The report of a failure of the model must not hold it, and the context that is built here must not reach the retrieval or the prompt.
- The API key is already removed from the message by the provider, and the scrubbing of M20.02 removes it again from anything that reaches the service.
- The model name is not private and is worth reporting, because it says which model was failing.

## Performance / Accessibility Considerations

- The report goes out on its own and is not awaited before the answer, so the latency of the visitor does not grow.
- The classification is a mapping and costs nothing.

## Definition of Done

- The failures of the model are classified, reported and grouped.
- The reports hold nothing that a visitor wrote.
- The visitor sees exactly the same answer as before.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §79 – AI failures
- PRD §129 – AI failure monitoring
- ROADMAP Milestone 20 – Track AI failures
- DECISIONS.md – The API key is removed from every error message; A stream is only retried while nothing has been handed over; The live language model tests are opt in
