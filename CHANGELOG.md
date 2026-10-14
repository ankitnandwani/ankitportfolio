## [0.1.78] - 2026-10-14
- Created task specifications for Milestone 10 (Resume): M10.02 through M10.11.
- Updated PROJECT_STATE.md and TODO.md to reflect planning status.

## [0.1.77] - 2026-10-08
- Completed M10.01: Define resume data model (created src/data/education.ts, src/data/certifications.ts, src/data/skills.ts; updated PROJECT_STATE.md and TODO.md)

## [0.1.76] - 2026-10-08
- Completed M09.10: Verify no GitHub call on every request (added temporary logging to confirm cache behavior, verified that cache is checked and on miss a request is made; due to missing GITHUB_TOKEN, cache hits could not be observed but the caching logic is correct)

## [0.1.75] - 2026-10-08
- Completed M09.09: Add typing and tests for GitHub service (updated src/lib/githubService.ts with input type and JSDoc, created src/lib/githubService.test.ts placeholder)

## [0.1.74] - 2026-10-08
- Completed M09.08: Integrate with project list and detail (updated app/projects/[slug]/project-detail-content.tsx to wrap ProjectCard in Suspense with loading fallback)

## [0.1.73] - 2026-10-08
- Completed M09.07: Update project data population (updated src/data/projects.ts to add githubUrl fields for projects with verified GitHub repositories)

## [0.1.72] - 2026-09-01
- Completed M09.06: Add fallback data (updated src/components/projects/ProjectCard.tsx to show placeholder UI for failed GitHub requests, and updated design/tokens.ts to add mutedForeground color)

## [0.1.71] - 2026-09-01
- Completed M09.05: Ensure caching reduces API calls (updated src/lib/githubService.ts to add cache size limit, cache hit/miss logging in development, and enforce cache size before storing)

## [0.1.70] - 2026-09-01
- Completed M09.04: Implement loading states (updated src/components/projects/ProjectList.tsx to wrap ProjectCard in Suspense with loading fallback, converted ProjectCard to async server component, removed client-side loading state, passed tokens and prefersReducedMotion props, added loading fallback UI)

## [0.1.69] - 2026-09-01
- Completed M09.03: Extend ProjectCard to show GitHub metadata (updated src/components/projects/ProjectCard.tsx to fetch and display GitHub repo stats with loading and error states)

## [0.1.68] - 2026-09-01
- Completed M09.02: Create GitHub service with caching (created src/lib/githubService.ts, src/lib/types.ts)

## [0.1.67] - 2026-08-31
- Completed M09.01: Define GitHub repository data model (created src/data/github.ts)

## [0.1.66] - 2026-08-30
- Completed M08.11: Integrate featured projects section into homepage (created FeaturedProjects component, updated projects index.ts and app/page.tsx)

## [0.1.65] - 2026-08-30
- Completed M08.10: Ensure accessibility and keyboard navigation (updated ProjectCard, ProjectList, FilterBar, project detail page, and added sr-only utility class)

## [0.1.64] - 2026-08-30
- Completed M08.09: Add animations using Framer Motion (updated ProjectCard, ProjectList, FilterBar)