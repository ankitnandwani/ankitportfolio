# Milestone M09 – GitHub Integration

## Objective

Dynamically integrate GitHub data to enrich project showcases with live repository metadata (stars, languages, activity) while implementing caching to avoid API calls on every request. According to PRD §20 and §118, the site should periodically retrieve public repository information, apply a curation layer, and handle API failures gracefully.

## Definition of Done

- Project cards display live GitHub metadata (stars, primary language) for projects with a valid GitHub URL.
- GitHub API requests are cached (e.g., via Next.js revalidation or in-memory cache) so that no request is made on every page render.
- The UI gracefully handles API failures (e.g., shows fallback data or placeholder).
- The implementation respects the existing project data model and does not require manual updates for each repository.
- TypeScript compiles cleanly, lint passes, and production build succeeds.

## Tasks

| Task | Name | Description |
|------|------|-------------|
| M09.01 | Define GitHub repository data model | Create TypeScript interface for GitHub repository data (stars, language, description, etc.) to be fetched from the API. |
| M09.02 | Create GitHub service with caching | Implement a service function that fetches repository data from the GitHub API (using `GITHUB_TOKEN` env var) and caches results to prevent redundant requests. |
| M09.03 | Extend ProjectCard to show GitHub metadata | Update the ProjectCard component to fetch and display GitHub metadata (stars, language) for projects with a githubUrl. |
| M09.04 | Implement loading and error states | Add UI states for loading and error when fetching GitHub data in ProjectCard. |
| M09.05 | Ensure caching reduces API calls | Verify that caching mechanism prevents duplicate requests for the same repository within a cache TTL. |
| M09.06 | Add fallback data for failed requests | Implement fallback to last known data or static placeholder when GitHub API is unavailable. |
| M09.07 | Update project data population (optional) | Validate that existing project data includes correct githubUrl fields; no new data required. |
| M09.08 | Integrate with project list and detail pages | Ensure GitHub metadata appears in both the projects index page and project detail page. |
| M09.09 | Add typing and tests for GitHub service | Write TypeScript types for the service and ensure no type errors. |
| M09.10 | Verify no GitHub call on every request | Confirm via logging or devtools that requests are cached and not made on every page render. |

## Execution Order

```text
M09.01 (Define data model)
   ↓
M09.02 (Create GitHub service)
   ↓
M09.03 (Extend ProjectCard)
   ↓
M09.04 (Loading/error states)
   ↓
M09.05 (Caching verification)
   ↓
M09.06 (Fallback data)
   ↓
M09.07 (Validate project data)
   ↓
M09.08 (Integrate with list/detail)
   ↓
M09.09 (Typing and service tests)
   ↓
M09.10 (Verify caching)
```

## Dependencies

- M09.01 → M09.02 (service needs data model)
- M09.02 → M09.03 (ProjectCard uses service)
- M09.02 → M09.04 (service should handle errors)
- M09.03 → M09.04 (UI states depend on data fetching)
- M09.02 → M09.05 (caching is part of service)
- M09.02 → M09.06 (fallback uses service error handling)
- M09.08 → M09.03 (integration uses extended ProjectCard)
- M09.09 → M09.02 (service typing)
- M09.10 → M09.02, M09.05 (verification depends on caching)

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Periodically retrieve public repository information (stars, languages, etc.) | PRD §20, §118 | M09.02, M09.03 | Planned |
| Do not display every repository (use existing curated list) | PRD §20 | M09.07 (use existing project data) | Planned |
| Implement a curation layer (featured, priority, category, professional_relevance) | PRD §20 | M09.01 (extend data model with curation fields) | Planned |
| The website can automatically retrieve GitHub data while maintaining manual control | PRD §20 | M09.02 (service fetches data; curation applied via project data) | Planned |
| No GitHub call on every page request | PRD §20, §118 | M09.05, M09.10 | Planned |
| Caching and fallback on API failure | PRD §118 | M09.05, M09.06 | Planned |
| Project cards show GitHub links (already in M08) | PRD §117 | M08.03 | Completed |
| Project index page shows all projects | PRD §117 | M08.05 | Completed |
| Project detail page shows project details | PRD §117 | M08.06 | Completed |
| Filters and categories | PRD §117 | M08.07 | Completed |

## Notes

- Maintain TypeScript strict mode across all files.
- Adhere to design tokens and NeoPOP component compatibility layer (use Card, Badge, etc. from UI library).
- Project data remains in src/data/projects.ts; GitHub metadata is fetched at runtime and not stored persistently.
- The curation fields (featured, priority, category, professional_relevance) can be added to the project data model if needed; featured already exists.
- Use environment variable GITHUB_TOKEN for authenticated API requests to avoid rate limits for unauthenticated requests.
- Implement caching using Next.js fetch revalidation (e.g., fetch with `{ next: { revalidate: 3600 } }`) or an in-memory cache with TTL.
- Handle API errors gracefully: show fallback data (last known) or placeholder UI.
- Ensure the UI does not break if GitHub API is unavailable or returns unexpected data.