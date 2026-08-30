# M09.01 — Define GitHub repository data model

## Objective

Create a TypeScript interface that defines the shape of data fetched from the GitHub API for a repository (e.g., stars, language, description). This interface will be used by the GitHub service and components to represent live repository metadata.

## Context

The project data model (`src/data/projects.ts`) already includes a `githubUrl` field for each project. To enrich project showcases with live data, we need to fetch additional information from the GitHub API. Defining a clear data model ensures type safety and consistency when integrating this data into UI components.

## Requirements

- Define an interface `GitHubRepoData` that includes at least the following fields:
  - `stars`: number (stargazers count)
  - `forks`: number (forks count)
  - `language`: string | null (primary language)
  - `description`: string | null
  - `updatedAt`: string (ISO date) or Date
  - Optionally: `open_issues`: number, `subscribers_count`: number
- The interface should be placed in a suitable location (e.g., `src/data/github.ts` or `src/lib/types.ts`).
- Ensure the interface is exported so it can be imported by the GitHub service and components.
- Do not modify the existing project data model in this task; we will extend it later if needed for curation fields.

## Scope

### In scope
- Creating the `GitHubRepoData` interface.
- Exporting the interface from a shared types file.

### Out of scope
- Implementing the GitHub service (M09.02).
- Fetching data from the API.
- Modifying the project data model.
- Updating UI components.

## Dependencies

- None (foundational task).

## Files / Areas Expected To Change
- `src/lib/types.ts` (or create `src/data/github.ts`) – add the `GitHubRepoData` interface and export it.

## Implementation Guidance
1. If `src/lib/types.ts` does not exist, create it.
2. Define the interface:
   ```typescript
   export interface GitHubRepoData {
     stars: number;
     forks: number;
     language: string | null;
     description: string | null;
     updatedAt: string; // ISO string
     // optional fields
     open_issues?: number;
     subscribers_count?: number;
   }
   ```
3. Export the interface.
4. Ensure no lint or typecheck errors.

## Acceptance Criteria
- [ ] The interface `GitHubRepoData` is defined and exported.
- [ ] TypeScript compiles without errors when the interface is imported in a test file.
- [ ] The interface includes at least the required fields (stars, forks, language, description, updatedAt).

## Testing Requirements
- [ ] No runtime tests needed for this task; typecheck will verify correctness.

## Security / Privacy Considerations
- No direct security or privacy implications; the interface only defines data shape.

## Performance / Accessibility Considerations
- None.

## Definition of Done
- The interface is created, exported, and passes typecheck.
- The task is ready for the next task (M09.02) to depend on it.

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).