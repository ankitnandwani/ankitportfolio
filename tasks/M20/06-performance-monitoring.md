# M20.06 – Monitor the Performance of the Requests

## Objective

Make a request that is too slow visible, with the part of the request that was slow, without turning every request into a record and without spending the free tier of the service.

## Context

ROADMAP M20 asks for the performance issues to be tracked, and PRD §129 asks for the performance monitoring. PRD §74 gives the targets of the site:

```
LCP < 2.5 s, CLS < 0.1, INP < 200 ms on typical mobile
```

Those are the targets of the pages, and the analysis of the pages is the task of M21 (ROADMAP Milestone 21 – Performance Optimisation). This milestone only watches the requests of the server, so that a slow answer is known while it happens and not only when somebody complains.

What the site already measures:

- `app/api/chat/route.ts` measures the time of the answer with `Date.now()` and sends it to the analytics as `latencyMs`.
- `src/lib/ai/orchestration.ts` measures the time of the generation as `metrics.generationMs`, and the retrieval has its own timing.
- `app/api/job-fit/route.ts` measures the time of the analysis for the analytics.
- `src/lib/githubService.ts` knows whether the answer came from the cache.

So the numbers exist. What does not exist is a report when a number is too big.

**The decision that needs a person.** The two ways of watching the performance are a threshold ("this request took longer than three seconds, so it is worth knowing") and tracing (a span for every request, from which the service builds a picture of the whole site). Tracing is the richer answer and it costs a span per request, which on a free tier is a quota that is spent by the traffic of a site nobody visits. A threshold costs nothing when nothing is slow.

**The recommendation is the threshold.** A site with low traffic does not need a picture of the performance, it needs to know when something is broken. The threshold is also the shape that fits the rest of the milestone: a report that arrives when something is wrong, rather than a stream of data that has to be looked at. If the owner wants the full tracing later, it is a change of the configuration of the SDK and not a change of the code of the site.

## Requirements

### 1. A measurement that is reported when it is too slow

Create `src/lib/monitoring/performance.ts`:

- A function that times an operation and reports it when it takes longer than a threshold.
- The threshold is given by the caller and the caller reads it from the environment, where it is optional and has a sensible default. The chat is given a longer threshold than the contact form, because the answer of the model takes seconds and the answer of the form takes milliseconds.
- The report holds:
  - the name of the operation (`chat`, `job-fit`, `contact`, `github-fetch`, `retrieval`, `generation`),
  - the duration in milliseconds,
  - the threshold it was measured against,
  - the identifier of the query when there is one,
  - the name of the route when there is one.
- The report holds nothing else. It holds no question, no answer, no description of a job, no form and no credential.
- It never throws, and it does nothing when the monitoring is off.
- The measurement works with an injected clock and an injected reporter, so it can be checked on its own without waiting for a real second to pass.

### 2. The routes and the parts that are slow are measured

- The chat route measures the whole request, and the generation inside it is measured apart, because a slow answer of the model and a slow retrieval are different problems.
- The analyzer of a job description measures the whole request.
- The contact form measures the whole request.
- The fetch of the GitHub service measures the time of the fetch, apart from the time of the cache.

### 3. The thresholds are in the environment and are optional

- New optional variables in `src/lib/env.ts` and `.env.example`, one per operation that has a threshold. Their names say what they are, the way `RATE_LIMIT_*` and `JOB_FIT_*` do.
- A variable that is missing means the default of the code is used. A variable that holds something that is not a number is ignored, the same way the limits of the chat ignore one.

### 4. The measurement does not slow the request

- The timing is two reads of the clock around the work. Nothing else happens on the path of a request.
- The report of a slow request is sent on its own and is not awaited, so a slow request does not become a slower request.

## Scope

### In scope

- `src/lib/monitoring/performance.ts` (new)
- `src/lib/monitoring/performance.test.mts` (new)
- `src/lib/monitoring/index.ts` (the exports)
- `src/lib/env.ts` and `.env.example` (the optional thresholds)
- `app/api/chat/route.ts`
- `app/api/job-fit/route.ts`
- `app/api/contact/route.ts`
- `src/lib/ai/orchestration.ts` (the time of the generation)
- `src/lib/githubService.ts` (the time of the fetch)

### Out of scope

- The tracing of the SDK, which is the decision that needs a person
- The analysis of the pages and the targets of PRD §74, which are M21
- The bundle, the images and the fonts, which are M21
- Any change of the time that the work takes

## Dependencies

- M20.02 – the report goes through the scrubbing.

## Files / Areas Expected To Change

- `src/lib/monitoring/performance.ts` (new)
- `src/lib/monitoring/performance.test.mts` (new)
- `src/lib/monitoring/index.ts` (new or extended)
- `src/lib/env.ts`
- `.env.example`
- `app/api/chat/route.ts`
- `app/api/job-fit/route.ts`
- `app/api/contact/route.ts`
- `src/lib/ai/orchestration.ts`
- `src/lib/githubService.ts`

## Implementation Guidance

1. **Read the clock, do not measure the world.** The function takes a clock, so the test can say that the operation took two thousand milliseconds without waiting two seconds. The rule of the limiter of the chat, whose store is injected for the same reason, is the model.
2. **The thresholds are optional and have defaults in the code.** The defaults are the values the site is comfortable with, and they are written next to the code that uses them, the way the limits of the chat are.
3. **The chat has a longer threshold than the form.** The answer of the model takes between a few seconds and a minute on the free tier. A threshold of three seconds would report every answer; a threshold of thirty seconds reports the ones that are wrong. The chat and the analyzer answer with the model, so they get the longer threshold, and the form gets a short one.
4. **The generation is measured apart from the retrieval.** The orchestrator already knows both numbers. Reporting them apart tells the owner whether to look at the model or at the database.
5. **The report is grouped by the name of the operation**, so a slow answer every day is one issue and not a hundred.

## Acceptance Criteria

- An operation that takes longer than its threshold is reported with the name, the duration, the threshold and the identifier of the query.
- An operation that takes less than its threshold is not reported.
- The thresholds are optional in the environment and a missing or an invalid value means the default of the code.
- The report holds no question, no answer, no description of a job and no form.
- The measurement adds no work to the path of a request beyond two reads of the clock.
- The slow requests of the chat, of the analyzer and of the contact form are measured.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: an operation under the threshold is not reported.
- Unit test: an operation over the threshold is reported with the duration and the threshold.
- Unit test: the report holds the identifier of the query when there is one.
- Unit test: the report holds no question and no answer.
- Unit test: the monitoring being off means that nothing is sent and nothing throws.
- Unit test: a threshold that is not a number in the environment is ignored and the default is used.
- Manual: the chat route is made slow on purpose and the report is seen in the Sentry project.

## Security / Privacy Considerations

- The duration of a request says nothing about a visitor, but the identifier of the query ties the report to a visit. It is an identifier that is already used by the analytics and that identifies nothing on its own.
- The report holds no description of a job and no form, so the size of a body never reaches the service.

## Performance / Accessibility Considerations

- The measurement is two reads of the clock. The report of a slow request is not awaited, so a slow request does not get slower.
- A threshold that is too low would report every request and fill the free tier. The defaults have to be chosen so that only the failures are reported. This is worth checking against the real numbers of the site after the first week.

## Definition of Done

- The slow requests are reported, with the part of the request that was slow.
- The thresholds are optional, documented in `.env.example`, and have sensible defaults.
- The tracing of the SDK is either off or the decision about it is written in `DECISIONS.md` with the reason.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- ROADMAP Milestone 20 – Track performance issues
- PRD §129 – performance monitoring
- PRD §74 – the performance targets of the site, which M21 works towards
- ROADMAP Milestone 21 – Performance Optimisation, which is the analysis of the pages
