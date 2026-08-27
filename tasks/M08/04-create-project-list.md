# M08.04 — Create project list component

## Objective

Build the reusable `ProjectList` component that displays an array of projects in a responsive grid with optional filtering capabilities.

## Context

According to PRD §117, the Projects section includes a project index page with filtering and categories. The `ProjectList` component serves as the core visualization layer for displaying projects, whether on the standalone index page or the featured projects section on the homepage.

## Requirements

- Create `ProjectList` in `src/components/projects/ProjectList.tsx`
- Accept props:
  * `projects`: Array of `Project` objects to display
  * `filters`: Optional object containing active filters (e.g. `{ category: "Professional" }`)
  * `className?`: string for additional styling
- Filter projects based on provided filters (currently supporting category filtering)
- Render a responsive grid of `ProjectCard` components (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`)
- Include optional section heading and subtitle props (similar to AchievementsSection)
- Support light and dark themes using tokens from `useTheme()`
- Export from `src/components/projects/index.ts`

## Scope

### In scope
- Reusable project list component with filtering logic
- Responsive grid layout using CSS Grid
- Props interface and filtering implementation
- Section heading/subtitle support

### Out of scope
- Individual card internal styling (handled in M08.03)
- Mobile-specific responsive refinement (handled in M08.08)
- Entrance animations (handled in M08.09)
- Accessibility polish (handled in M08.10)
- Standalone index page routing (handled in M08.05)
- Featured projects section integration (handled in M08.11)

## Dependencies
- M08.02 – Populate project data (data source)
- M08.03 – Create project card component (required for rendering)

## Files / Areas Expected To Change
- `src/components/projects/ProjectList.tsx` (new file)
- `src/components/projects/index.ts`

## Implementation Guidance
1. Create `src/components/projects/ProjectList.tsx`
2. Import `Project`, `ProjectData` from `@/src/data/projects`
3. Import `ProjectCard` from `./ProjectCard`
4. Implement filtering logic based on `filters` prop (start with category filtering)
5. Layout the component with optional heading/subtitle, then a grid container (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`)
6. Map filtered projects to `ProjectCard` components
7. Update `src/components/projects/index.ts` to export `ProjectList`

## Acceptance Criteria
- [ ] `ProjectList` component renders a responsive grid of project cards
- [ ] Accepts `projects`, `filters`, `heading`, `subtitle`, and `className` props
- [ ] Correctly filters projects by category when filter is provided
- [ ] Works cleanly in light and dark themes
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- No security concerns; uses static project data.

## Performance / Accessibility Considerations
- Efficient grid layout with responsive breakpoints.
- Consider virtual scrolling for large lists (not required for MVP).

## Definition of Done
- `ProjectList` component created, styled, and exported.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §117: Milestone 8 — Projects
- PRD §16: Projects categories