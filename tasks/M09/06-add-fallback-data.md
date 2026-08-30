# M09.06 — Add fallback data for failed requests

## Objective

Implement fallback UI or data for when GitHub API requests fail, ensuring the user experience remains graceful and the layout does not break.

## Context

The GitHub service may return `null` due to network errors, invalid repository, rate limiting, or GitHub API downtime. In such cases, we should not break the UI or show incorrect data. Instead, we can show a placeholder (e.g., "Stars: --") or simply omit the GitHub metadata, preserving the rest of the card's content.

## Requirements

- Update the `ProjectCard` component (or the service, depending on design) to handle a `null` return from `fetchGitHubRepoData`.
- When the service returns `null` (failure), the component should not crash and should display a fallback for the GitHub metadata section.
- The fallback can be:
  - Option A: Show placeholder text (e.g., "Stars: --", "Language: --") in muted styling.
  - Option B: Omit the GitHub metadata section entirely (show nothing).
  - Option C: Show a generic icon or text indicating data is unavailable.
- We will choose Option B (omit the section) to keep the UI clean when data is unavailable, but we can also show subtle placeholders if desired.
- Ensure that the fallback does not cause layout shift when data later becomes available (if we omit the section, the layout may shift when data appears; we can reserve space for the metadata to avoid shift).
- Optionally, we can implement a stale-while-revalidate approach: if we have cached data from a previous successful request, we can show that data while retrying in the background. However, for simplicity, we will not implement this in this task; we can consider it in a future improvement.
- Ensure that the fallback is accessible (e.g., if we show placeholder text, ensure sufficient contrast).

## Scope

### In scope
- Updating `ProjectCard.tsx` to handle `null` from the service and show fallback UI.
- Deciding on the fallback UI implementation (we will implement a simple placeholder that reserves space).
- Ensuring the fallback is consistent with the design system.

### Out of scope
- Modifying the GitHub service (M09.02).
- Changing the caching mechanism (M09.05).
- Implementing stale-while-revalidate (future improvement).
- Updating other components (e.g., project detail page) – we will do that in M09.08.

## Dependencies
- M09.03: Extend ProjectCard to show GitHub metadata (we are building upon that).
- M09.04: Implement loading states (we are adding fallback alongside loading).

## Files / Areas Expected To Change
- `src/components/projects/ProjectCard.tsx` – add fallback handling for failed GitHub data fetch.

## Implementation Guidance
1. In `ProjectCard.tsx`, after calling `fetchGitHubRepoData`, check if the returned data is `null`.
2. If data is `null`, we can render a placeholder that reserves the same space as the real metadata would occupy.
   - For example, we can render two lines: one for stars and one for language, but with muted text and maybe a placeholder icon.
   - We can use the same icons but with reduced opacity.
   - Example:
     ```jsx
     {githubData === null && (
       <div className="flex items-center space-x-3 mt-2 text-muted-foreground">
         <div className="flex items-center space-x-1 text-sm">
           <FiStar className="h-4 w-4 text-muted-foreground/50" /> --
         </div>
         <div className="flex items-center space-x-1 text-sm">
           <DotIcon className="h-4 w-4" style={{ backgroundColor: 'gray' }} /> --
         </div>
       </div>
     )}
     ```
   - If we choose to omit the section entirely, we simply render nothing when `githubData === null`.
   - To avoid layout shift, we can render the placeholder with visibility hidden or use a skeleton that matches the expected height.
3. We can also consider showing the fallback only when we have previously cached data (stale-while-revalidate) but we will keep it simple for now.
4. Ensure that the fallback styling matches the design system (use muted colors from the palette).
5. Run lint and typecheck to ensure no errors.

## Acceptance Criteria
- [ ] The `ProjectCard` component handles a `null` return from `fetchGitHubRepoData` without throwing an error.
- [ ] When the service returns `null`, the component shows a fallback UI (either placeholder or omitted section) and does not break.
- [ ] When the service returns valid data, the component shows the real GitHub metadata.
- [ ] The fallback UI is consistent with the design system (uses appropriate colors, spacing).
- [ ] TypeScript compiles without errors.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] We can manually test by temporarily breaking the service (e.g., using an invalid token) and verifying that the fallback UI appears.
- [ ] We can also verify that when the service works, the real data appears.

## Security / Privacy Considerations
- None.

## Performance / Accessibility Considerations
- Fallback UI ensures that the component does not block rendering while waiting for data (if we show placeholder immediately) or does not cause errors.
- If we show placeholder text, ensure it has sufficient contrast for readability.

## Definition of Done
- Fallback data/UI is implemented for failed GitHub requests in the `ProjectCard` component.
- The task is ready for the next tasks to integrate the component with other parts of the application (e.g., project detail page).

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).