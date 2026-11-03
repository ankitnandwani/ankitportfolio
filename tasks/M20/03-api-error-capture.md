# M20.03 – Capture the Failures of the API Routes

## Objective

Make every failure that the API routes handle themselves visible to the owner of the site, in a shape that holds the route, the kind of the failure and the moment, and nothing that a visitor wrote.

## Context

The site has five API routes:

| Route | File | What it does |
|---|---|---|
| `POST /api/chat` | `app/api/chat/route.ts` | The conversation with the assistant |
| `POST /api/job-fit` | `app/api/job-fit/route.ts` | The analysis of a job description |
| `POST /api/contact` | `app/api/contact/route.ts` | The contact form |
| `POST /api/feedback` | `app/api/feedback/route.ts` | The thumb up and the thumb down |
| `POST /api/analytics` | `app/api/analytics/route.ts` | The proxy of the analytics of M19 |

Each of the four that talk to a service ends with a `catch` block that writes the failure to the console and answers the visitor with a safe message:

- `app/api/chat/route.ts` writes `console.error('Chat API error:', error)` and answers with a 500, or with a 503 when the failure is a configuration of the model or a failure that another attempt could survive.
- `app/api/contact/route.ts` writes `console.error('Contact form API error:', error)` and answers with a 500.
- `app/api/job-fit/route.ts` writes `console.error('Job fit API error:', error)` and answers with a 500.
- `app/api/feedback/route.ts` writes `console.error('[feedback] Error processing feedback:', error)` and answers with a 500.

A failure that a route catches is invisible to the framework: Next.js never sees it, so the `onRequestError` hook of M20.01 does not fire for it. The other way round, a failure that escapes a route is a crash of the server, and the framework hook catches it. **Both paths are needed, and they are not the same path.**

The routes cannot be loaded by the test runner, because they import their modules with the `@/` alias. Every part that can be checked on its own therefore has to live in `src/lib/`, and the route only hands over what it knows. This is the shape of `src/lib/analytics/proxy.ts` and of `src/lib/contact/validation.ts`.

The analytics already made the same journey in M19 and left a pattern to follow: `src/lib/analytics/analytics.ts` holds the tracking functions, the configuration is read from the environment by default, and the client is created through a factory that a test can replace with `setPostHogClientFactory`.

## Requirements

### 1. A capture module that has one implementation

Create `src/lib/monitoring/capture.ts`:

- `captureException(error, context)` — reports a failure.
  - It does nothing when the monitoring is off, and it says so by returning without touching the network.
  - It never throws. A failure of the monitoring must not become a second failure that reaches the visitor.
  - It writes the failure to the console as well, so the log of the local machine keeps the shape it has today.
  - The context it is given holds only the safe parts: the name of the route, the method, the status of the answer, the kind of the failure, the identifier of the query and the moment. It never holds the body.
- `captureMessage(message, context)` — reports something that is not a failure but is worth knowing, such as a service that could not be reached and the site answered with what it had. It is used by M20.05 and M20.06.
- The client of the SDK is created through a factory that a test can replace, following `setPostHogClientFactory` in `src/lib/analytics/analytics.ts`. This is the only way the tests get to see what is reported.
- The package is loaded with a dynamic import, so it never becomes part of a client bundle and the module can be imported without a complete environment.

### 2. The context of a route is built by a helper

Create a helper that builds the context of a route from the request and the answer:

- The name of the route is a constant that the caller gives, such as `chat` or `job-fit`. It is never read from the address, so a query that was asked for never reaches the service.
- The method is taken from the request.
- The identifier of the query is taken when there is one. It already exists in the chat and in the analyzer, and it ties a failure to the analytics of the same visit.
- The address of the visitor is not included. The rate limiter uses it, but a report that carries it would be a report that carries a personal detail.

### 3. The catch blocks of the routes report the failure

- Each of the four routes reports the failure it catches, with the name of the route and the status it is about to answer with.
- The order of the route matters: the report is sent before the answer goes out, so it is not lost when the instance is put to sleep. This is the rule the proxy of M19.02 and the event of a refusal of M19.04 already follow.
- The failure that is a configuration of the model (`LLMConfigurationError`) is reported as a failure of the configuration and not as an unknown failure. It is a deployment problem and it has to be told apart from a fault of the model.
- The route keeps its own safe answer for the visitor. Nothing about the monitoring changes the answer, and the reason of the failure still never reaches the visitor.

### 4. The failure of the proxy of the analytics is reported too

- `app/api/analytics/route.ts` answers with a 400 or a 403 for a request it refuses. Those are not failures, and they must not be reported as failures, or the project would fill with the traffic of other sites.
- A failure that the route itself does not expect is reported.

## Scope

### In scope

- `src/lib/monitoring/capture.ts` (new)
- `src/lib/monitoring/capture.test.mts` (new)
- `src/lib/monitoring/context.ts` (new) or the same helper in `capture.ts`
- `src/lib/monitoring/index.ts` (the exports)
- `app/api/chat/route.ts`
- `app/api/job-fit/route.ts`
- `app/api/contact/route.ts`
- `app/api/feedback/route.ts`
- `app/api/analytics/route.ts`

### Out of scope

- The failures of the language model (M20.04) and of the external services (M20.05)
- The performance (M20.06)
- The browser (M20.07)
- The scrubbing itself (M20.02, which this task uses)
- Changing what a visitor is told

## Dependencies

- M20.02 – the capture has to build the safe shape through the scrubbing.

## Files / Areas Expected To Change

- `src/lib/monitoring/capture.ts` (new)
- `src/lib/monitoring/capture.test.mts` (new)
- `src/lib/monitoring/index.ts` (new or extended)
- `app/api/chat/route.ts`
- `app/api/job-fit/route.ts`
- `app/api/contact/route.ts`
- `app/api/feedback/route.ts`
- `app/api/analytics/route.ts`

## Implementation Guidance

1. **Follow the pattern of `src/lib/analytics/analytics.ts`.** The tracking functions read the configuration from the environment by default, the client is created through a factory that a test can replace, and the package is loaded with a dynamic import. Copy that shape rather than inventing another one.
2. **The report is sent before the answer goes out.** `await reportRateLimitExceeded(...)` in `app/api/chat/route.ts` is the model. The report is awaited, and a failure of the report is caught so it cannot break the answer.
3. **The route only hands over what it knows.** The name of the route is a literal in the route. The address of the visitor is not handed over at all.
4. **The status of the answer is part of the context.** A 500 and a 503 are different problems, and the owner has to be able to tell them apart.
5. **Do not report the refusals.** A request that is refused because of the limit, because the body is refused or because it comes from another site is the site doing its job. Only an unexpected failure is a report.
6. **Keep the console line.** The log of the local machine is read by the person who works on the site; it does not lose its shape.

## Acceptance Criteria

- A failure that each of the four routes catches is reported with the name of the route, the method, the status and the identifier of the query where there is one.
- The report holds no body, no address of the visitor and no text of a visitor.
- A failure of the configuration of the model is told apart from an unknown failure.
- A refusal (a 400, a 403 or a 429) is not reported as a failure.
- The monitoring being off means that nothing is sent and nothing throws.
- The answer the visitor receives is exactly the answer of today.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: a failure is reported with the safe shape and the context that was given.
- Unit test: nothing is reported while the monitoring is off.
- Unit test: a failure of the report does not throw.
- Unit test: the report holds no body and no address of the visitor.
- Unit test: the report is grouped by the kind of the failure, so the same failure does not create a new issue every time.
- Manual: the chat route is made to fail on purpose and the report is seen in the Sentry project, with the route and the status and nothing else.

## Security / Privacy Considerations

- The body is never handed to the capture, so there is nothing to remove at that point. The scrubbing of M20.02 is the second line.
- The address of the visitor is not part of the context, even though the rate limiter uses it.
- The reason of a failure still never reaches the visitor. The answer of a 500 stays the same safe message it is today.

## Performance / Accessibility Considerations

- The report is awaited before the answer, which adds the time of one report to the answer of a failure. The failures are rare and the report is small, so the cost does not matter. The report must never be awaited on the path of a success.
- Nothing in this task changes what a visitor sees.

## Definition of Done

- Every failure that the routes catch is reported, in a shape that holds the route and the kind of the failure and nothing private.
- The capture has one implementation and its own tests.
- The refusals are not reported.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §79 – API errors
- PRD §129 – API error monitoring
- ROADMAP Milestone 20
- M19.02 – the rule of sending the event before the answer goes out
- M19.04 – the same rule for the event of a refusal
