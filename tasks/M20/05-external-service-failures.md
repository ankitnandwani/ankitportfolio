# M20.05 – Monitor the Failures of the External Services

## Objective

Report the failures of the two services the site depends on outside its own process, in a way that says which service failed and that the site answered with what it had.

## Context

Two external services can fail while the site keeps working:

**GitHub.** `src/lib/githubService.ts` fetches the data of the repositories. It keeps a cache, and when the fetch fails it answers with the cached data and writes `console.error(\`Error fetching GitHub repo ${cacheKey}:\`, error)`. PRD §77 says the homepage must never fail because of the GitHub API, and the cache is how that is kept. The failure is worth knowing about, because a cache that is never refreshed is a page that shows something that is no longer true.

**Supabase.** The knowledge base lives in Supabase PostgreSQL with pgvector. `src/lib/knowledge/retrieval.ts` reads the chunks and throws `new Error(error.message)` when the database answers with an error. The message of the database is a message of PostgreSQL, and it can name a table, a column or a constraint. It holds no personal data, but it holds the shape of the database, and it should not be published anywhere.

PRD §79 asks for the GitHub API failures and for the database failures to be tracked. ROADMAP M20 says the same for the GitHub API.

Both failures are the same kind of event: **a service outside the site could not be reached, and the site degraded instead of failing.** They are one task because they share the shape, the reporting path and the test.

## Requirements

### 1. The failures of the external services are reported

Create `src/lib/monitoring/externalFailures.ts`:

- A function that reports a failure of a service, with:
  - the name of the service (`github` or `supabase`),
  - the kind of the failure (`unavailable`, `timeout`, `not_found`, `rate_limited`, `unknown`),
  - what the site did instead (`cached`, `empty`, `none`),
  - the status, when the service reported one,
  - the identifier of the request when there is one.
- It never throws, and it does nothing when the monitoring is off.
- The report holds no body of a request, no answer of a service and no credential. The URL of a service can carry a token in a query, so a URL is only reported when it holds no query, and the key of the repository is reported instead of its address.

### 2. The GitHub failure is reported with the fact that the cache answered

- `src/lib/githubService.ts` reports the failure when the fetch fails and the cache answers.
- The report says that the cache answered, so the owner can see that the page was served from an old copy.
- The report is not sent every time the same repository fails over and over. A GitHub outage would otherwise fill the project with one issue per repository. The report is sent once per repository per window, and the count of the failures is added to the report that follows.
- The behaviour of the cache does not change. The homepage still never fails because of the GitHub API.

### 3. The failure of the database is reported where it is raised

- `src/lib/knowledge/retrieval.ts` reports the failure when the database answers with an error, before it throws it, so the report is not lost when the instance is put to sleep.
- The report says that the answer came with no context of the retrieval, so the owner knows that the assistant answered without the knowledge base.
- The message of the database is reduced to its kind. The raw text of the message of PostgreSQL can hold the shape of the database, and it is kept in the log of the server, not in the report.

### 4. The failures that are not failures are not reported

- A repository that is not found is not a failure of the service. It is an answer.
- A request that the limit of the site refuses is not a failure of the service.
- A question that the guardrails refuse never reaches the database.

## Scope

### In scope

- `src/lib/monitoring/externalFailures.ts` (new)
- `src/lib/monitoring/externalFailures.test.mts` (new)
- `src/lib/monitoring/index.ts` (the exports)
- `src/lib/githubService.ts`
- `src/lib/knowledge/retrieval.ts`

### Out of scope

- Changing the behaviour of the cache of the GitHub service
- Changing the retrieval, the threshold of the similarity or the shape of the knowledge base
- The routes, which are M20.03
- The failures of the language model, which are M20.04
- The email delivery of the contact form, which is a service of its own and is reported by the route of the contact

## Dependencies

- M20.02 – the report goes through the scrubbing.

## Files / Areas Expected To Change

- `src/lib/monitoring/externalFailures.ts` (new)
- `src/lib/monitoring/externalFailures.test.mts` (new)
- `src/lib/monitoring/index.ts` (new or extended)
- `src/lib/githubService.ts`
- `src/lib/knowledge/retrieval.ts`

## Implementation Guidance

1. **The cache is the answer, not the failure.** The GitHub service already answers with the cached data. The report says what happened, and the answer to the visitor does not change.
2. **One report per outage, not one per request.** The count of the failures is held in a map that is emptied when the report goes out, and the map is held in the memory of the process, the same way the limiter of the chat is held. The window is short enough that an outage produces a handful of reports.
3. **The name of the repository, not its address.** A repository name holds no token and is useful. An address can hold one in a query.
4. **The message of the database is not the report.** The kind of the failure and the status are the report. The whole message stays in the log of the server, where it belongs.
5. **The retrieval is the only place that talks to the database in the path of a question.** The ingestion pipeline is a script and not a request, and it is not part of this task.

## Acceptance Criteria

- A failure of the GitHub API is reported with the name of the service, the kind and the fact that the cache answered.
- A failure of the database is reported with the name of the service, the kind and the fact that the answer came with no context.
- A failure that repeats inside the same window produces one report and the count of the failures, not one report per failure.
- A repository that is not found is not reported.
- The report holds no address of a service that carries a query, no answer of a service and no credential.
- The behaviour of the cache and of the retrieval does not change.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: a failure of the GitHub API is reported with the cache as what answered.
- Unit test: a failure of the database is reported with nothing as what answered.
- Unit test: a repository that is not found is not reported.
- Unit test: the report holds the name of the repository and not the address of the API.
- Unit test: two failures inside the same window produce one report with a count of two.
- Unit test: the report holds no credential and no answer of the service.
- Unit test: the monitoring being off means that nothing is sent and nothing throws.
- Manual: the GitHub service is made to fail and the report is seen in the Sentry project with the cache as what answered.

## Security / Privacy Considerations

- The token of GitHub is in the environment and must never reach the report. The scrubbing of M20.02 removes it, and the report does not hold the address of the service in the first place.
- The message of the database can name a table and a constraint. It stays in the log of the server.
- The knowledge base holds the professional information of Ankit, and the chunks themselves never reach a report.

## Performance / Accessibility Considerations

- The report is not awaited on the path of a question that is answered from the cache, so the visitor waits for nothing.
- The map of the counts is small and is emptied as it is read.

## Definition of Done

- The failures of the GitHub API and of the database are reported, grouped, and hold nothing private.
- The behaviour of the site is exactly the same as before.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §79 – GitHub API failures, database failures
- PRD §77 – GitHub Failure Handling: use cached repository data, never make the homepage fail
- ROADMAP Milestone 20 – Track AI failures, GitHub API failures
- M13 – the knowledge base and its storage, whose failures are reported here
