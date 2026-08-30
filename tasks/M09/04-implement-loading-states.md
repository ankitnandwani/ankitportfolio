# M09.04 — Implement loading states

## Objective

Add loading states to the GitHub metadata fetching process so that users see a placeholder while data is being retrieved, preventing layout shifts and improving perceived performance.

## Context

When the `ProjectCard` component fetches GitHub data asynchronously, there is a delay between the request and the response. During this time, we should show a loading indicator or skeleton to maintain a smooth user experience. We can achieve this by using React's `Suspense` component, which allows us to show a fallback UI while a child component's promise is resolving.

## Requirements

- Modify `src/components/projects/ProjectList.tsx` to wrap each `ProjectCard` in a `Suspense` component that displays a loading fallback while the card's data is being fetched.
- Create a simple loading fallback UI (e.g., a skeleton placeholder that mimics the shape of a project card).
- Ensure the loading fallback is displayed only when the `ProjectCard` is waiting for GitHub data (i.e., while its async promise is pending).
- The loading fallback should be consistent with the design system (use muted colors, appropriate spacing).
- Also apply the same wrapping to any other usage of `ProjectCard` (e.g., in the project detail page) – we will do that in M09.08, but we can note it here.
- Do not modify the `ProjectCard` component itself for loading states (we will keep it as an async server component; the loading state is handled externally by `Suspense`).
- If we prefer, we can also modify `ProjectCard` to throw a promise when loading, but using `Suspense` with an async component is the standard approach in React Server Components.

## Scope

### In scope
- Updating `ProjectList.tsx` to wrap each `ProjectCard` in `Suspense`.
- Creating a loading fallback component (e.g., `ProjectCardSkeleton` or inline JSX).
- Ensuring the skeleton resembles a project card (same dimensions, placeholder text/icons).
- Applying the same pattern to the project detail page usage of `ProjectCard` (will be done in M09.08, but we can mention it here).

### Out of scope
- Defining the GitHub service or data model (M09.01, M09.02).
- Implementing the async data fetching in `ProjectCard` (M09.03).
- Implementing error states or fallback data (M09.06).
- Styling the skeleton beyond basic placeholder.

## Dependencies
- M09.03: Extend ProjectCard to show GitHub metadata (we need the card to be async for Suspense to work).
- M09.02: Create GitHub service with caching (the service is used by the card).

## Files / Areas Expected To Change
- `src/components/projects/ProjectList.tsx` – wrap each ProjectCard in Suspense.
- `src/components/projects/project-detail-content.tsx` (if exists) – wrap ProjectCard in Suspense (we will do this in M09.08, but we can note it here).
- Optionally, create a reusable skeleton component (e.g., `src/components/projects/ProjectCardSkeleton.ts`) or use inline JSX.

## Implementation Guidance
1. In `ProjectList.tsx`, import `Suspense` from `react`.
2. Define a loading fallback JSX snippet, for example:
   ```tsx
   const ProjectCardLoading = () => (
     <div className="h-96 w-full bg-muted rounded-lg p-6 flex flex-col space-x-4">
       <div className="h-6 w-20 bg-muted-foreground/20 rounded"></div>
       <div className="h-4 w-36 bg-muted-foreground/20 rounded mt-2"></div>
       <div className="h-4 w-24 bg-muted-foreground/20 rounded mt-1"></div>
       <div className="h-4 w-12 bg-muted-foreground/20 rounded mt-1"></div>
       {/* Add more placeholder lines to mimic the card's content */}
     </div>
   );
   ```
   Alternatively, we can reuse the existing card structure with placeholder text.
3. In the `projects.map` loop, wrap each `<ProjectCard key={project.id} project={project} />` with:
   ```tsx
   <Suspense fallback={<ProjectCardLoading />}>
     <ProjectCard key={project.id} project={project} />
   </Suspense>
   ```
4. Ensure the fallback has similar dimensions to a real card to avoid layout shift.
5. Repeat the same wrapping for any other occurrence of `ProjectCard` (e.g., in the project detail page) – we will handle that in M09.08.
6. Run lint and typecheck to ensure no errors.

## Acceptance Criteria
- [ ] `ProjectList.tsx` imports `Suspense` from `react`.
- [ ] Each `ProjectCard` is wrapped in a `Suspense` component with a loading fallback.
- [ ] The loading fallback is visible when the card is waiting for GitHub data (we can verify by slowing down the service or disabling cache).
- [ ] The fallback does not cause layout shift when the real card appears.
- [ ] TypeScript compiles without errors.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] No runtime tests required; we will verify manually by inspecting the UI and checking that loading states appear.
- [ ] We can also verify that the skeleton disappears once data is loaded.

## Security / Privacy Considerations
- None.

## Performance / Accessibility Considerations
- Loading states improve perceived performance and prevent layout shift.
- The fallback should be accessible (e.g., if it contains text, ensure sufficient contrast; but since it's a placeholder, it may not need to be meaningful).
- We should avoid using flashing or animated content that could trigger seizures.

## Definition of Done
- Loading states are implemented in the project list (and will be extended to the detail page in M09.08).
- The task is ready for the next tasks to refine error states and finalize integration.

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).