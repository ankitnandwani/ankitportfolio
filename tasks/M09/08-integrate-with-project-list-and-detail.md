# M09.08 — Integrate with project list and detail pages

## Objective

Ensure that the enhanced `ProjectCard` component (with GitHub metadata, loading states, and fallback) is correctly used in the project index page and project detail page, providing a consistent experience across the site.

## Context

We have updated the `ProjectCard` component to fetch and display GitHub metadata, and we have implemented loading states via `Suspense` in the project list (M09.04). Now we need to apply the same pattern to the project detail page and verify that the component works seamlessly in both contexts.

## Requirements

- Verify that the `ProjectList` component (used in the projects index page) wraps each `ProjectCard` in a `Suspense` component with a loading fallback (this should have been done in M09.04; we will confirm and fix if needed).
- Update the project detail page component (likely `src/components/projects/project-detail-content.tsx` or similar) to wrap the `ProjectCard` in a `Suspense` component with a loading fallback.
- Ensure that the loading fallback is appropriate for the detail page context (maybe a larger skeleton or placeholder).
- Verify that the `ProjectCard` component functions correctly when used in the detail page (i.e., it still fetches data based on the project's `githubUrl`).
- Ensure that any other usage of `ProjectCard` (e.g., in a featured projects section on the homepage) also follows the same pattern (we will check the homepage's `FeaturedProjects` component, which uses `ProjectList`; if it uses the same `ProjectList`, then it will automatically benefit from the Suspense wrapping).
- Do not break any existing functionality (e.g., the project detail page should still display all other project details correctly).
- Run lint and typecheck to ensure no errors.

## Scope

### In scope
- Confirming and fixing `Suspense` wrapping in `ProjectList.tsx` (if not already done).
- Updating the project detail page to wrap `ProjectCard` in `Suspense`.
- Checking the `FeaturedProjects` component (if it uses a custom list) and ensuring it also uses `Suspense` wrapping (or we can update it to use the same `ProjectList`).
- Ensuring the loading fallback is consistent and does not cause layout shift.

### Out of scope
- Modifying the `ProjectCard` component itself (except for minor bug fixes if discovered during integration).
- Changing the GitHub service or data model.
- Altering the project data population.

## Dependencies
- M09.03: Extend ProjectCard to show GitHub metadata.
- M09.04: Implement loading states (we are applying the Suspense wrapping).
- M09.06: Add fallback data for failed requests (ensuring the card handles failures gracefully).

## Files / Areas Expected To Change
- `src/components/projects/ProjectList.tsx` – ensure Suspense wrapping is present.
- `src/components/projects/project-detail-content.tsx` – wrap ProjectCard in Suspense (if it uses ProjectCard directly).
- `src/components/projects/index.tsx` (the page component) – if it uses a custom list, ensure wrapping.
- `src/components/projects/FeaturedProjects.tsx` (if we kept it; but we removed it earlier, so we now use `ProjectList` directly in the homepage? Actually we created a new `FeaturedProjects` component that uses `ProjectList`. So we need to check that component as well.)
- `src/components/projects/FeaturedProjects.tsx` – if it exists and uses `ProjectList` internally, then the wrapping in `ProjectList` will suffice. If it renders `ProjectCard` directly, we need to wrap it.

## Implementation Guidance
1. Check `src/components/projects/ProjectList.tsx` to see if it already wraps each `ProjectCard` in `Suspense` with a loading fallback. If not, update it to do so.
   - Import `Suspense` from `react`.
   - Define a loading fallback component (or reuse the one from M09.04).
   - In the `projects.map`, wrap each `<ProjectCard key={project.id} project={project} />` with `<Suspense fallback={<ProjectCardLoading />}>...</Suspense>`.
2. Check the project detail page. The project detail page likely uses a component like `ProjectDetailContent` that receives the project data and then renders a `ProjectCard` (or maybe it renders the details directly). We need to inspect.
   - If the detail page uses `ProjectCard`, we wrap it similarly.
   - If the detail page renders the project details without using `ProjectCard`, we may need to adapt: we could still use the `ProjectCard` component for the GitHub metadata part, or we could extract the GitHub metadata logic into a hook or helper. However, to keep things simple, we can ensure that the detail page uses the `ProjectCard` component (which already shows the project's name, value proposition, etc.). If the detail page currently does not use `ProjectCard`, we might refactor it to do so. But we should check the existing implementation.
3. Check the `FeaturedProjects` component (if we still have it). We previously created `src/components/projects/FeaturedProjects.tsx` that uses `ProjectList`. If we kept that, then the wrapping in `ProjectList` will cover it. If we removed it and instead use `ProjectList` directly in the homepage, then we are good.
   - We removed the old `FeaturedProjectsSection` and created a new `FeaturedProjects` component that uses `ProjectList`. So we should verify that the new `FeaturedProjects` component is being used in the homepage (we did that in the previous milestone). Thus, the homepage's featured projects section will benefit from the Suspense wrapping in `ProjectList`.
4. Run lint and typecheck to ensure no errors.
5. Verify that the loading fallback appears in both the list and detail pages when data is fetching.

## Acceptance Criteria
- [ ] The `ProjectList` component wraps each `ProjectCard` in `Suspense` with a loading fallback.
- [ ] The project detail page wraps its usage of `ProjectCard` in `Suspense` with a loading fallback.
- [ ] The `FeaturedProjects` component (if it uses `ProjectList`) indirectly benefits from the Suspense wrapping.
- [ ] When GitHub data is being fetched, a loading fallback is visible in place of the card (or the card's GitHub metadata section).
- [ ] When data is available, the card shows the real GitHub metadata.
- [ ] When data fails to load, the card shows the fallback UI (as implemented in M09.06).
- [ ] TypeScript compiles without errors.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] We can manually verify by visiting the projects index page and the project detail page and observing loading states (we can simulate slow requests by temporarily throttling the network or adding a delay in the service).
- [ ] We can also verify that the fallback UI appears when the service returns null.

## Security / Privacy Considerations
- None.

## Performance / Accessibility Considerations
- Loading states improve perceived performance and prevent layout shift.
- The fallback should be accessible (e.g., if it contains text, ensure sufficient contrast).

## Definition of Done
- The enhanced `ProjectCard` component is correctly integrated into the project index page and project detail page with loading states and fallback UI.
- The task is ready for the next tasks to finalize verification and document the feature.

## Related Requirements
- PRD §20: GitHub should be dynamically integrated.
- PRD §118: Milestone 9 — GitHub Integration (build: GitHub API integration, caching).