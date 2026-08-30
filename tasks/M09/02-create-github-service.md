# M09.02 — Create GitHub service with caching

## Objective

Create a service function that fetches repository data from the GitHub API (using the authenticated `GITHUB_TOKEN` environment variable) and implements caching to prevent redundant requests. The service will be used by UI components to enrich project data with live GitHub metadata.

## Context

We have defined a `GitHubRepoData` interface (M09.01) to represent the shape of data we want to fetch. Now we need to implement the actual data fetching logic. The service should:
- Accept a GitHub repository identifier (owner/name or githubUrl).
- Use the `GITHUB_TOKEN` from environment variables for authenticated requests (to increase rate limit).
- Implement caching (e.g., in-memory cache with TTL or using Next.js fetch revalidation) so that the same repository is not fetched more than once within a cache period.
- Handle errors gracefully (network issues, invalid repo, rate limiting) and return a sensible fallback (e.g., `null` or default data).
- Be safe to use only in server-side code (to avoid exposing the token).

## Requirements

- Create a file `src/lib/githubService.ts` (or similar) that exports a function `fetchGitHubRepoData`.
- The function should accept either:
  - An object `{ owner: string, repo: string }`
  - Or a GitHub URL string (e.g., "https://github.com/owner/repo") and parse it.
- Return a `Promise<GitHubRepoData | null>` where `null` indicates failure.
- Implement a cache that stores successful responses for a configurable duration (e.g., 1 hour).
- On cache hit, return the cached data without making a request.
- On cache miss or expired, make a request to `https://api.github.com/repos/{owner}/{repo}`.
- Use the `GITHUB_TOKEN` in the `Authorization` header (`token ${token}` or `Bearer ${token}`? GitHub accepts `token`).
- Handle non-200 responses by returning `null` (or throwing an error that is caught and returns `null`).
- Optionally, implement a simple rate‑limit retry (e.g., if status 403 and header `X-RateLimit-Remaining` is 0, wait until reset? For simplicity, we can return null and let the UI show fallback).
- Ensure the service is only importable in server-side code (we can document this; alternatively, we can use the `server-only` package if we want to enforce it at build time, but we will keep it simple and rely on documentation).
- Export the function as a named export.

## Scope

### In scope
- Creating the GitHub service file.
- Implementing the fetch logic with caching and error handling.
- Parsing GitHub URLs.
- Using the environment variable `GITHUB_TOKEN`.

### Out of scope
- Defining the `GitHubRepoData` interface (M09.01).
- Using the service in UI components (M09.03+).
- Creating a server component that calls the service (will be done in later tasks).

## Dependencies
- M09.01: Define GitHub repository data model (we need the `GitHubRepoData` interface).

## Files / Areas Expected To Change
- `src/lib/types.ts` – ensure `GitHubRepoData` is exported (already done in M09.01).
- `src/lib/githubService.ts` – new file to be created.

## Implementation Guidance
1. Create `src/lib/githubService.ts`.
2. Import `env` from `./env` to access `env.GITHUB_TOKEN`.
3. Import `GitHubRepoData` from `./types`.
4. Implement a simple cache using a `Map` that stores `{ data: GitHubRepoData, timestamp: number }`.
5. Define a cache TTL (e.g., `const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour`).
6. Create a helper function `parseGitHubUrl(url: string): { owner: string; repo: string } | null` that extracts owner and repo from a GitHub URL (handles both `https://github.com/owner/repo` and `git@github.com:owner/repo.git` if needed; we can assume the URL is in the standard format).
7. Implement the main function `async function fetchGitHubRepoData(identifier: string | { owner: string; repo: string }): Promise<GitHubRepoData | null>`:
   - Normalize input to `{ owner, repo }`.
   - Generate a cache key (e.g., `${owner}/${repo}`).
   - Check cache: if exists and not expired, return cached data.
   - Otherwise, construct the API URL: `https://api.github.com/repos/${owner}/${repo}`.
   - Use `fetch` with headers: `{ Authorization: `token ${env.GITHUB_TOKEN}` }` (or `Bearer`? GitHub docs say `token` works).
   - If response is not ok (status !== 200), return `null`.
   - Parse JSON response.
   - Map the response to our `GitHubRepoData` interface (we only need a subset of fields).
   - Store in cache with current timestamp.
   - Return the data.
8. Export the function.

## Acceptance Criteria
- [ ] The file `src/lib/githubService.ts` exists and exports `fetchGitHubRepoData`.
- [ ] The function accepts a GitHub URL or owner/repo object and returns a promise.
- [ ] On successful request, it returns an object matching `GitHubRepoData`.
- [ ] On failure (invalid URL, network error, non-200 response), it returns `null`.
- [ ] Caching prevents duplicate requests for the same repo within the TTL.
- [ ] The service uses `env.GITHUB_TOKEN` for authentication.
- [ ] TypeScript compiles without errors when the service is imported.

## Testing Requirements
- [ ] No runtime tests required; we will rely on manual verification and typecheck.
- [ ] However, we can add a simple test file if desired, but not required for this task.

## Security / Privacy Considerations
- The `GITHUB_TOKEN` must never be exposed to the client. Ensure the service is only imported in server-side code (e.g., server components, route handlers). We will document this and rely on the developer to follow the guideline.
- Do not log the token or include it in error messages.

## Performance / Accessibility Considerations
- Caching reduces the number of API requests, improving performance and reducing chance of rate limiting.
- The service should not block rendering for too long; we can rely on streaming or suspense in Next.js, but that is handled by the calling component.

## Definition of Done
- The service is implemented, cached, and ready to be used by the `ProjectCard` component (M09.03).
- The task passes typecheck and lint when integrated.

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).