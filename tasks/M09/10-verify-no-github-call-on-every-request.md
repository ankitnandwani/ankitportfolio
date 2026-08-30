# M09.10 — Verify no GitHub call on every request

## Objective

Verify that the GitHub integration does not make API requests on every page render, ensuring that caching is effective and that we stay within GitHub's rate limits.

## Context

The GitHub service implements caching to prevent redundant requests. This task focuses on confirming that the caching works as intended in the actual application (e.g., when browsing the projects index page or detail page). We will check that for a given repository, only one request is made within the cache TTL, even if the component is rendered multiple times (e.g., due to re-renders or multiple instances on the page).

## Requirements

- Manually verify or implement a simple check to ensure that when the `ProjectCard` component (or the service) is invoked multiple times for the same repository within a short period, only one actual API request is sent to GitHub.
- We can do this by:
  - Adding a temporary `console.log` in the service when a real fetch is made (i.e., on cache miss) and observing the console output during page navigation.
  - Using the browser's developer tools Network tab to filter requests to `api.github.com/repos/` and ensuring that duplicates do not appear for the same repo within a short time.
  - Ensuring that the cache TTL is respected (e.g., after the TTL expires, a new request is made).
- Ensure that we are not calling the service unnecessarily (e.g., we should not call it on every render if we can avoid it; but with caching, even if we call the service multiple times, the request is only made once).
- If we find that requests are being made on every render (e.g., because we are not using the cache correctly), we need to fix the caching logic or the way we call the service.
- Verify that the fallback and loading states do not cause extra requests (e.g., we should not retry on every render if the previous request failed; we should respect the cache or have a retry delay).
- After verification, we can remove any temporary logging we added.

## Scope

### In scope
- Adding temporary logging to the GitHub service to track actual API requests.
- Verifying caching behavior in the project index page and project detail page.
- Ensuring that the cache TTL is respected (optional: we can wait and see if a new request is made after TTL).
- Confirming that the service does not make requests when the data is already cached.
- Removing temporary logging after verification.

### Out of scope
- Changing the caching algorithm (unless we discover a bug).
- Modifying the service's API request logic (unless we find an issue).
- Altering the `GitHubRepoData` interface.

## Dependencies
- M09.02: Create GitHub service with caching (we are verifying the service created in this task).
- M09.05: Ensure caching reduces API calls (we are building upon that verification).

## Files / Areas Expected To Change
- `src/lib/githubService.ts` – add temporary logging for cache misses (to be removed after verification).
- Optional: create a simple test script or use browser devtools.

## Implementation Guidance
1. In `src/lib/githubService.ts`, inside the fetch logic, before making the actual `fetch` call, add a line like:
   ```typescript
   console.log(`[GitHubService] Fetching data for ${owner}/${repo}`);
   ```
   (We can also log cache hits if we want.)
2. Run the application in development mode (`npm run dev`).
3. Open the browser's developer tools to the Console tab.
4. Navigate to the projects index page (`/projects`) and observe the console logs. Note how many fetch logs appear for each repository.
5. Refresh the page or navigate away and back; check if the number of fetch logs matches the expected cache behavior (should be one per unique repo per cache TTL).
6. Visit the project detail page for a specific project and verify that the fetch log appears only once (or not at all if cached).
7. Optionally, disable the cache temporarily (by setting TTL to 0) to see that requests are made on every call, then re-enable.
8. After verification, remove the temporary logging lines from the service.
9. Run lint and typecheck to ensure no errors after removing the logging.

## Acceptance Criteria
- [ ] After adding temporary logging, we observe that API requests are made only once per unique repository within a short period (page refresh or navigation) when the data is not cached.
- [ ] When the data is cached, no API request logs appear for subsequent requests for the same repo.
- [ ] After the cache TTL expires (we can wait or adjust TTL for testing), a new request is made.
- [ ] The temporary logging is removed, and the service code is clean.
- [ ] TypeScript compiles without errors.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] We will perform manual verification as described above.
- [ ] We can also write a simple automated test in the future, but it is not required for this task.

## Security / Privacy Considerations
- The temporary logging does not expose the GitHub token (we only log the owner/repo).
- We ensure that the logging is removed before production.

## Performance / Accessibility Considerations
- Verifying caching helps ensure we do not waste bandwidth or hit rate limits.
- Effective caching improves performance by reducing latency and external requests.

## Definition of Done
- Verification confirms that the GitHub service does not make API requests on every request and that caching is working as intended.
- The temporary logging is removed, and the service is ready for production.
- The task is ready for the next steps (e.g., finalizing the milestone).

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).