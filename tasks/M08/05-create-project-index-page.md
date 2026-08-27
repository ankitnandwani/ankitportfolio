# M08.05 — Create project index page

## Objective

Create the standalone `/projects` route page that displays all projects with filtering controls and serves as the central hub for project exploration.

## Context

According to PRD §117, milestone 8 includes building a "project index page". This page should be accessible via navigation (to be added in later milestones) and provide visitors with a comprehensive view of all projects, categorized and filterable by type.

## Requirements

- Create `app/projects/page.tsx` route file
- Implement a page that:
  * Sets appropriate metadata (title: "Projects", description)
  * Uses `ResponsiveContainer` for consistent content width
  * Displays a section heading (e.g. "Featured Projects" or "All Projects") with supportive subtitle
  * Renders a `ProjectList` component with all projects from `src/data/projects.ts`
  * Includes filtering UI controls (category tabs/buttons) above the project list
  * Supports light and dark themes
  * Follows the same layout patterns as other pages (e.g., design-system showcase)
- Export the page as the default Next.js route component

## Scope

### In scope
- Route file creation at `app/projects/page.tsx`
- Metadata setup for the projects page
- Integration of ResponsiveContainer, heading, filtering UI, and ProjectList
- Basic filtering UI (category tabs) that updates the displayed projects

### Out of scope
- Project detail page routing (handled in M08.06)
- Dynamic filtering by technology or search (can be added later)
- SEO optimization beyond basic metadata (can be refined later)
- Integration into main navigation (to be handled in later milestones)

## Dependencies
- M08.02 – Populate project data (data source)
- M08.03 – Create project card component (used by ProjectList)
- M08.04 – Create project list component (required for rendering)

## Files / Areas Expected To Change
- `app/projects/page.tsx` (new file)
- `app/projects/layout.tsx` (optional, if needed for route group - but likely not needed)
- `src/components/projects/ProjectList.tsx` (may need enhancement for filtering UI - but filtering UI can be in page)

## Implementation Guidance
1. Create `app/projects/page.tsx`
2. Import necessary modules: `generateBaseMetadata`, `ResponsiveContainer`, `ProjectList`, `projectsData`
3. Define metadata using `generateBaseMetadata('Projects', 'Explore Ankit\\'s professional, personal, and engineering-lab projects')`
4. In the page component:
   * Use `ResponsiveContainer` to constrain width
   * Add a section heading (e.g. "Projects") with optional subtitle
   * Implement category filtering UI (e.g. buttons for Professional, Personal Engineering, Engineering Lab, Finance, AI, All)
   * Use React state to track active filter
   * Filter `projectsData` based on active category
   * Pass filtered projects to `ProjectList` component
   * Ensure the list renders in a responsive grid
5. Ensure the page works in both light and dark themes

## Acceptance Criteria
- [ ] `app/projects/page.tsx` exists and exports a default React component
- [ ] Page loads successfully at `/projects` route
- [ ] Page displays a heading and list of projects
- [ ] Filtering UI allows switching between categories and shows appropriate projects
- [ ] Projects are displayed in a responsive grid using ProjectList and ProjectCard
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Next.js build succeeds (`npm run build`)

## Security / Privacy Considerations
- No security concerns; uses static project data.

## Performance / Accessibility Considerations
- Semantic heading structure (h1 for page title, h2 for section)
- Keyboard-navigable filtering controls
- Focus management when switching filters
- Page title announced on route change

## Definition of Done
- Project index page accessible at `/projects` with filtering and project display.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §117: Milestone 8 — Projects
- PRD §9: Homepage structure (for consistent page layout patterns)