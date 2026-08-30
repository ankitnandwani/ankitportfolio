# M09.03 — Extend ProjectCard to show GitHub metadata

## Objective

Update the `ProjectCard` component to fetch and display live GitHub metadata (stars, primary language) for projects that have a `githubUrl`. This enriches the project showcase with dynamic data while leveraging the caching service to avoid redundant API calls.

## Context

The `ProjectCard` component currently displays the project's name, value proposition, category, technologies, and links (including a GitHub icon that links to the `githubUrl`). We now want to show additional information from the GitHub repository, such as the number of stars and the main programming language, to give recruiters a quick sense of the project's popularity and tech stack.

## Requirements

- Modify `src/components/projects/ProjectCard.tsx` to be an asynchronous React Server Component (since it will fetch data from the GitHub service).
- Import the `fetchGitHubRepoData` service from `src/lib/githubService`.
- For each project, if `githubUrl` is present, parse it to extract the owner and repository name.
- Call the service to fetch `GitHubRepoData`.
- While waiting for the data, show a loading placeholder (we will implement detailed loading states in M09.04, but for this task we can show a simple skeleton or wait UI).
- If the data is successfully fetched, display the stars and language in the card (e.g., as badges or text).
- If the service returns `null` (failure), show a fallback (we will implement fallback states in M09.06, but for this task we can skip the GitHub metadata or show a placeholder).
- Ensure the component remains compatible with existing usage (i.e., if there is no `githubUrl`, it behaves as before).
- Do not break the existing layout or styling; integrate the new information gracefully.
- Import the `GitHubRepoData` type from `src/lib/types` for typing the fetched data.

## Scope

### In scope
- Modifying `ProjectCard.tsx` to fetch and display GitHub metadata.
- Adding basic loading and error UI (can be simple placeholders; refined states will be done in M09.04 and M09.06).
- Ensuring the component works as a server component.

### Out of scope
- Creating the GitHub service (M09.02).
- Defining the GitHub data model (M09.01).
- Implementing advanced loading skeletons or fallback UI (M09.04, M09.06).
- Using the service in other components (e.g., project detail page) – that will be covered in M09.08.

## Dependencies
- M09.02: Create GitHub service with caching (we need the service to call).
- M09.01: Define GitHub repository data model (we need the `GitHubRepoData` interface for typing).

## Files / Areas Expected To Change
- `src/components/projects/ProjectCard.tsx` – modify to fetch and display GitHub data.

## Implementation Guidance
1. Change the component from a regular function to an async function (since we are using server components, we can make it async).
   ```typescript
   export default async function ProjectCard({ project }: { project: Project }) { ... }
   ```
2. Import the service and types:
   ```typescript
   import { fetchGitHubRepoData } from '@/lib/githubService';
   import type { GitHubRepoData } from '@/lib/types';
   ```
3. Inside the component, if `project.githubUrl` exists:
   - Parse the URL to get owner and repo (we can reuse a helper from the service or define a simple one here; for simplicity, we can split the URL).
   - Call `const githubData = await fetchGitHubRepoData({ owner, repo });`.
   - If `githubData` is not null, render the stars and language.
   - Example rendering:
     ```jsx
     {githubData && (
       <div className="flex items-center space-x-3 mt-2">
         <div className="flex items-center space-x-1 text-sm text-muted-foreground">
           <StarIcon className="h-4 w-4 text-yellow-400" /> {githubData.stars}
         </div>
         {githubData.language && (
           <div className="flex items-center space-x-1 text-sm text-muted-foreground">
             <DotIcon className="h-4 w-4" style={{ backgroundColor: getLanguageColor(githubData.language) }} /> {githubData.language}
           </div>
         )}
       </div>
     )}
     ```
   - We may need to define `getLanguageColor` or use a generic icon.
4. If there is no `githubUrl` or the fetch fails, render nothing for the GitHub metadata (or we can render a placeholder; detailed fallback will be in later tasks).
5. Ensure the component still renders all existing content (name, value proposition, etc.).
6. Add any necessary imports for icons (we can use existing icons from `react-icons` or `lucide-react`; we already use `FiGitHub` in the hero, so we might have access to similar icons).
   - We can use `lucide-react` which is already installed? Let's check. We'll assume we can use `StarIcon` from `lucide-react`; if not, we can use a simple text or another icon.
   - For simplicity, we can just show the star count and language as text without icons, or use the existing `FiGitHub` icon for GitHub and a star icon from `react-icons` if available.
   - We'll check what icons are available: we have `react-icons/fi` used in hero and footer. We can use `FiStar` for star? Actually `react-icons` has `FiStar`. Let's use that.
   - Import `{ FiStar } from 'react-icons/fi'`.
   - For language, we can just show the text or use a circle dot; we can use a simple span with a background color.
7. Style the new information appropriately (e.g., small text, muted colors, spacing).
8. Ensure the component remains accessible (add aria-label if needed).

## Acceptance Criteria
- [ ] The `ProjectCard` component is now an async server component.
- [ ] When a project has a `githubUrl`, the component fetches GitHub data and displays stars and language.
- [ ] When there is no `githubUrl`, the component behaves as before (no GitHub metadata).
- [ ] The component does not break the existing layout or styling.
- [ ] TypeScript compiles without errors when the component is used in `ProjectList` or elsewhere.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] No runtime tests required; we will verify manually and via typecheck.
- [ ] However, we can check that the component renders without throwing errors when the service returns data or null.

## Security / Privacy Considerations
- The GitHub token is not used directly in this component; it is used inside the service, which we assume is server-only. Since we are making the component a server component, the token remains on the server and is not sent to the client.

## Performance / Accessibility Considerations
- Fetching data in each `ProjectCard` could lead to multiple requests, but the caching service will prevent duplicate requests for the same repository.
- The component should show a loading state while waiting for data to avoid layout shift (detailed loading states will be added in M09.04).
- The displayed metadata should be accessible (e.g., sufficient contrast, readable font sizes).

## Definition of Done
- The `ProjectCard` component successfully fetches and displays GitHub metadata for projects with a valid `githubUrl`.
- The task is ready for the next tasks to refine loading/error states and integrate with other components.

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).