# M17.06 — Create the Job Fit API Route

## Objective

Expose the job fit analysis over HTTP at `POST /api/job-fit`. The route validates the request, counts it against the rate limit of the analyzer, runs the analysis, tracks the analytics event and returns the result. It is the boundary where the job description enters the server and where the analysis leaves it.

## Context

The route is the same kind of boundary as `app/api/chat/route.ts`, and it follows the same rules. It is the place where:

- the request is counted against the limit, before any work is done,
- the personal data of the visitor is removed and an injected instruction is refused,
- the raw error of the model never reaches the visitor,
- the answer is checked before it is sent,
- and the analytics event is fired.

The chat route is the reference implementation. It counts the visitor first, sends the limit headers with every answer, answers with a friendly message and a `Retry-After` when the limit is reached, and turns a failure of the provider into a 503 instead of a 500 with a raw error.

The analyzer does not stream. The result is a structure, the interface renders it as a whole, and a stream would add complexity the recruiter never sees.

## Requirements

- Create `app/api/job-fit/route.ts` with a `POST` handler.
- Read the request body as JSON and take the job description from it.
- Reject a request whose body is not JSON, whose job description is missing, or whose job description is not a string, with a status of 400 and a clear message.
- Count the request against the rate limit of the analyzer before anything else happens.
- Answer with the status 429, a friendly message, the `Retry-After` header and the `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers when the limit is reached.
- Send the limit headers with every answer, including the successful ones, the way the chat route does.
- Work out which visitor the request comes from, the way the chat route does: the first address in `x-forwarded-for`, then `x-real-ip`, then a constant.
- Run the input policy of M17.05 and answer with a status of 400 and the reason when the job description is refused.
- Run the analysis of M17.03.
- Answer with a status of 200 and the analysis, the evidence and the metadata when the analysis succeeds.
- Turn a failure of the provider into a status of 503:
  - `LLMConfigurationError` → "The analysis service is not configured."
  - a retryable `LLMError` → "The analysis service is temporarily unavailable. Please try again."
- Turn any other failure into a status of 500 with a message that says nothing about the internals.
- Never let a stack trace, a key or a raw provider message reach the visitor.
- Track the `job_fit_analysis` event of M17.08, fire and forget, so a slow analytics call never delays the answer.
- Answer with `Cache-Control: no-store`, because the analysis is made from a document that was pasted and must not be cached anywhere.

## Scope

### In scope

- `app/api/job-fit/route.ts` (to be created) — the route.
- The exports the route needs from `src/lib/jobFit/index.ts`.
- The analytics call, which M17.08 defines.

### Out of scope

- The analysis itself (M17.03), the policy (M17.05) and the corrections (M17.04).
- The interface (M17.07).
- A `GET` handler. There is nothing to read.
- Streaming.
- A rate limiter of its own. It uses the one of M17.05.

## Dependencies

- M17.03 — the analysis.
- M17.05 — the input policy and the rate limit.
- M13.10 — the shape of the limit headers, which are copied from the chat route.
- M17.08 — the analytics event. The route can be built before M17.08 and the call can be added to it in M17.08, as long as the two are finished before M17.09.

## Files / Areas Expected To Change

- `app/api/job-fit/route.ts` (to be created) — the route.
- `src/lib/jobFit/index.ts` (updated) — the exports the route needs.

## Implementation Guidance

1. Copy the shape of `app/api/chat/route.ts`. The order of the steps is the same:

   ```typescript
   export async function POST(request: NextRequest) {
     const limiter = getJobFitRateLimiter();
     const clientKey = getClientKey(request);
     const limit = limiter.check(`jobfit:${clientKey}`);
     const rateLimitHeaders = { /* the same three names */ };

     if (!limit.allowed) {
       return NextResponse.json({ error: RATE_LIMIT_MESSAGE, retryAfterSeconds: limit.retryAfterSeconds }, {
         status: 429,
         headers: { ...rateLimitHeaders, 'Retry-After': String(limit.retryAfterSeconds) },
       });
     }

     try {
       // read the body, validate, run the policy, run the analysis
     } catch (error) {
       // the same error mapping as the chat route
     }
   }
   ```

2. Keep the rate limit message friendly and say nothing about the limits themselves, the way `RATE_LIMIT_MESSAGE` in the chat route does. It may mention that the analysis takes a moment and that the visitor should try again shortly.

3. The body is read inside the `try`, so a body that is not JSON becomes a 400 and not a 500. Catch the failure of `request.json()` on its own and answer with 400.

4. Validate the job description before the policy runs, so a missing field gives a precise message and not the message of the policy.

5. The policy of M17.05 gives the reason of a refusal. Map the reasons to the answers:

   - `too_short` → 400 with a message that asks for a fuller job description,
   - `too_long` → 400 with a message that asks for a shorter one,
   - `injection` → 400 with the friendly message of M17.05.

   The status is 400 in all three cases. The document is bad, not the server.

6. The response body has this shape, which is the response shape of M17.01:

   ```json
   {
     "analysis": { "…": "…" },
     "evidence": [ { "sourceId": "…", "sourceTitle": "…", "classification": "PROFESSIONAL", "lastUpdated": null, "confidence": 0.71 } ],
     "meta": {
       "latencyMs": 3120,
       "tokenUsage": { "promptTokens": 1800, "completionTokens": 640, "totalTokens": 2440 },
       "model": "gemini-flash-lite-latest",
       "requirementCount": 12,
       "chunksRetrieved": 8,
       "usedFallback": false
     }
   }
   ```

7. The evidence that is returned carries the fields of PRD §43 and the text of the chunk, so the interface can show where a claim comes from. The raw chunk identifiers are not part of it.

8. The error mapping is the one of the chat route:

   ```typescript
   if (error instanceof Error && error.name === 'LLMConfigurationError') {
     return NextResponse.json({ error: 'The analysis service is not configured.' }, { status: 503, headers: rateLimitHeaders });
   }
   const llmError = error as { retryable?: boolean; name?: string };
   if (llmError.name === 'LLMError' && llmError.retryable) {
     return NextResponse.json({ error: 'The analysis service is temporarily unavailable. Please try again.' }, { status: 503, headers: rateLimitHeaders });
   }
   ```

   Everything else becomes a 500 with "Something went wrong while analysing the job description. Please try again."

9. Log the failure with the message of the error on the server, so the operator can see it, and answer the visitor with the friendly message. The job description is never part of either.

10. Send `Cache-Control: no-store` on every answer. An analysis of a pasted document must not be held by a proxy or by a browser cache.

11. The analytics call is fire and forget, exactly like the calls of the chat route:

    ```typescript
    trackJobFitAnalysis(sessionId, queryId, properties, config).catch((err) =>
      console.warn('[analytics] trackJobFitAnalysis failed:', err)
    );
    ```

    A failure of the analytics never fails the request.

## Acceptance Criteria

- A request with a job description returns the status 200 with the analysis, the evidence and the metadata.
- A request with no body, a body that is not JSON, or a job description that is not a string returns the status 400 with a clear message.
- A job description that is too short, too long or that carries an injected instruction returns the status 400 with the message of M17.05.
- The request is counted before the work begins, and the sixth request inside the window is refused with the status 429, a friendly message and the `Retry-After` header.
- The limit headers are sent with the successful answers and with the refusals.
- A failure of the provider returns the status 503 with a friendly message, and the raw error never reaches the visitor.
- Any other failure returns the status 500 with a message that says nothing about the internals.
- The `Cache-Control: no-store` header is sent.
- The analytics event is fired and a failure of the analytics does not fail the request.
- The server log holds the failure and never holds the job description or the analysis.
- The route is registered by the build and the build passes.
- The tests cover the cases above, and `npm test`, `npm run lint` and `npm run typecheck` pass.

## Testing Requirements

- A successful request returns the status 200 and the three parts of the response.
- A missing job description returns the status 400.
- A body that is not JSON returns the status 400 and not the status 500.
- A document that is too short returns the status 400 with the message of the policy.
- A document with an injected instruction returns the status 400 and does not reach the engine.
- The sixth request inside the window returns the status 429 with the three limit headers and the `Retry-After` header.
- A request that is over the limit does not reach the engine.
- A configuration failure of the provider returns the status 503.
- A retryable failure of the provider returns the status 503.
- An unexpected failure returns the status 500.
- The error body of every failure holds no key, no stack trace and no provider message.
- The response carries `Cache-Control: no-store`.
- A failure of the analytics does not change the status of the answer.

## Security / Privacy Considerations

- The route is the boundary where the job description enters the server. It is counted against the limit before it is parsed, so a flood of requests cannot make the server work for free.
- The document is removed of its personal data before it is used, and the analysis is checked before it leaves. Neither the document nor the analysis is logged.
- The answers carry `Cache-Control: no-store`, so a pasted document is not held by a proxy or by a cache in the browser.
- The visitor is identified by the address the hosting platform writes into the request, the way the chat does. The limit is a guard against accidents and not a wall, and the analyzer uses its own bucket so the two cannot be used against each other.
- The error messages are fixed strings. No provider message, no stack trace and no environment value is ever sent to the visitor.
- The route accepts nothing but the job description. The visitor cannot choose the model, the temperature, the number of chunks or the limits.

## Performance / Accessibility Considerations

- The route does not stream, so the visitor waits for the whole analysis. The interface of M17.07 has to show a loading state for the whole wait.
- The limit headers let the interface tell the visitor how long they have to wait when the limit is reached.
- The answer is a single JSON document, which the interface reads once and renders.

## Definition of Done

- `POST /api/job-fit` answers with the analysis, the evidence and the metadata.
- The request is validated, limited, redacted, checked and answered safely.
- Every failure has a fixed, friendly message and a sensible status.
- The limit headers and the cache header are sent.
- The analytics event is fired without blocking the answer.
- The build passes, and the tests, lint and typecheck pass.

## Related Requirements

- PRD §30: AI Job Description Analysis
- PRD §35: Privacy Architecture
- PRD §43: AI Source Grounding
- PRD §48: AI Rate Limiting
- PRD §76: AI Failure Handling
- PRD §78: Analytics
- PRD §80: Security
- PRD §84: Cost Protection
- PRD §101: Data Retention
- PRD §126: Milestone 17 — Job Description Analyzer
