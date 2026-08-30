# M09.05 — Ensure caching reduces API calls

## Objective

Verify and improve the caching mechanism in the GitHub service to ensure that redundant API requests for the same repository are avoided, thus reducing the chance of rate limiting and improving performance.

## Context

The GitHub service created in M09.02 includes a basic in-memory cache with a TTL. This task focuses on verifying that the cache works correctly and making any necessary adjustments to ensure optimal caching behavior (e.g., appropriate TTL, cache key uniqueness, handling of expired entries).

## Requirements

- Review the caching implementation in `src/lib/githubService.ts`.
- Ensure that the cache key uniquely identifies a repository (e.g., `${owner}/${repo}`).
- Set an appropriate time-to-live (TTL) for cached data (e.g., 1 hour) to balance freshness and request reduction.
- Ensure that expired cache entries are removed or ignored to prevent serving stale data indefinitely.
- Optionally, add logging (in development) to track cache hits and misses for verification.
- Ensure that the cache does not grow unbounded (we can implement a simple limit or rely on periodic garbage collection; given the small number of repositories, this is not a major concern).
- Verify that when the service is called multiple times with the same identifier within the TTL, only one actual API request is made.
- Ensure that the service still returns `null` on failure and does not cache error responses (or we may choose to cache failures for a short period to avoid hammering a failing endpoint).

## Scope

### In scope
- Inspecting and potentially updating the caching logic in `src/lib/githubService.ts`.
- Setting TTL and cache key format.
- Adding optional debug logging for cache hits/misses.
- Ensuring error responses are not cached (or are cached with a short TTL if desired).

### Out of scope
- Changing the overall architecture of the service (e.g., switching to an external caching service like Upstash Redis).
- Modifying the GitHub API endpoint or request logic.
- Altering the `GitHubRepoData` interface.

## Dependencies
- M09.02: Create GitHub service with caching (we are improving the service created in this task).

## Files / Areas Expected To Change
- `src/lib/githubService.ts` – update the caching implementation.

## Implementation Guidance
1. In `src/lib/githubService.ts`, examine the current cache implementation.
2. If not already present, define a cache TTL constant (e.g., `const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour`).
3. Ensure the cache is a `Map<string, { data: GitHubRepoData; timestamp: number }>`.
4. When fetching data:
   - Generate a cache key from the owner and repo.
   - Check if the key exists in the cache and if `(Date.now() - timestamp) < CACHE_TTL_MS`.
   - If yes, return the cached data.
   - If not, proceed to fetch.
5. After a successful fetch, store the data in the cache with the current timestamp.
6. If the fetch fails (returns `null`), do not store anything in the cache (or store a failed timestamp with a short TTL if we want to avoid repeated failures; we can decide not to cache failures).
7. Optionally, add a `console.log` statement when a cache hit occurs (only in development, e.g., if `process.env.NODE_ENV !== 'production'`).
8. Ensure the cache does not leak memory: we can periodically clean expired entries, but given the small scale, we can skip this for now.
9. Run lint and typecheck to ensure no errors.

## Acceptance Criteria
- [ ] The service uses a cache with a TTL (e.g., 1 hour).
- [ ] Cache hits prevent duplicate API requests for the same repo within the TTL.
- [ ] Cache misses trigger a new API request.
- [ ] Failed requests are not cached (or are cached with a short TTL if we choose to do so).
- [ ] The service still returns the correct data shape on success.
- [ ] TypeScript compiles without errors.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] We can manually verify caching by calling the service twice with the same repo and checking that only one fetch occurs (e.g., by checking network tab or adding a temporary log in the fetch).
- [ ] We can also verify that after the TTL expires, a new request is made.

## Security / Privacy Considerations
- None.

## Performance / Accessibility Considerations
- Caching reduces the number of API requests, lowering latency and reducing the chance of hitting GitHub's rate limit.
- The cache is stored in memory on the server; for a small number of repositories, the memory footprint is negligible.

## Definition of Done
- The caching mechanism in the GitHub service is verified and optimized to reduce API calls.
- The task is ready for the next tasks to finalize integration and verify the overall feature.

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).