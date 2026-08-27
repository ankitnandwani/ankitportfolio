# M08.06 — Create project detail page

## Objective

Create the dynamic `/projects/[slug]` route page that displays detailed information about a single project, including architecture visuals, deep technical dives, and external links.

## Context

According to PRD §117, milestone 8 includes building "project detail pages". These pages provide deep dives into individual projects, showcasing architecture, learning outcomes, technologies used, and full GitHub/live demo integration. The detail page complements the project index page by offering extensive detail for visitors who want to explore a specific project thoroughly.

## Requirements

- Create `app/projects/[slug]/page.tsx` route file
- Implement a page that:
  * Sets appropriate metadata based on the project (title: "{project.name} - Ankit Nandwani", description from value proposition)
  * Uses `ResponsiveContainer` for consistent content width
  * Displays the project name as a prominent heading
  * Renders the project's value proposition (one-line description)
  * Shows category as a badge
  * Presents "Why I built it" section (motivation/context)
  * Presents "What I learned" section (outcomes/insights)
  * Displays "Architecture" section with architectural overview or visual representation
  * Lists technologies used as badges/pills
  * Provides prominent GitHub and Live Demo buttons (if URLs exist)
  * Optionally shows related projects (same category) at the bottom
  * Supports light and dark themes
  * Handles 404 cases for invalid slugs gracefully
- Export the page as the default Next.js route component

## Scope

### In scope
- Dynamic route file creation at `app/projects/[slug]/page.tsx`
- Metadata setup using `generateBaseMetadata` with project-specific data
- Detailed project presentation with all fields from `Project` interface
- Architecture visualization (can be simple text/icons or optional diagram)
- External link rendering with security attributes
- Related projects section (same category)

### Out of scope
- Project index page (handled in M08.05)
- Dynamic data fetching (all project data is static in `src/data/projects.ts`)
- Advanced architecture diagrams (can be enhanced later)
- Comments or discussion system
- Edit/delete functionality (admin-only, later milestones)

## Dependencies
- M08.02 – Populate project data (data source)
- M08.03 – Create project card component (may reuse for related projects)
- M08.04 – Create project list component (may reuse for related projects)

## Files / Areas Expected To Change
- `app/projects/[slug]/page.tsx` (new file)
- `app/projects/layout.tsx` (optional, for route group layout - but likely not needed)

## Implementation Guidance
1. Create `app/projects/[slug]/page.tsx`
2. Import necessary modules: `generateBaseMetadata`, `ResponsiveContainer`, `useParams` from `next/navigation`, `Project` and `projectsData` from `@/src/data/projects`, `ProjectCard` and `ProjectList` from `@/src/components/projects`
3. In the page component:
   * Use `useParams()` to get the `slug` parameter
   * Find the project in `projectsData` that matches the slug (case-sensitive)
   * If not found, return a 404-like response (or redirect to projects page)
   * Set metadata using `generateBaseMetadata(project.name, project.valueProposition)` or similar
   * Use `ResponsiveContainer` to constrain width
   * Layout the page with:
     - Project name as heading (h1)
     - Category badge
     - Value proposition (one-line)
     - Why I built it section
     - What I learned section
     - Architecture section (text description or simple visual)
     - Technologies as badges
     - GitHub and Live Demo buttons (open in new tab with rel="noopener noreferrer")
     - Optional: Related projects section (same category, excluding current project)
4. Ensure the page works in both light and dark themes
5. Handle loading and error states appropriately (though data is static)

## Acceptance Criteria
- [ ] `app/projects/[slug]/page.tsx` exists and exports a default React component
- [ ] Page loads successfully for valid project slugs (e.g., `/projects/ccgeek`)
- [ ] Page displays project name, value proposition, category, whyBuilt, whatLearned, architecture, technologies, and GitHub/demo links
- [ ] Metadata reflects the project name and description
- [ ] Invalid slugs show appropriate error/404 handling
- [ ] GitHub and demo links open in new tab with rel="noopener noreferrer"
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Next.js build succeeds (`npm run build`)

## Security / Privacy Considerations
- No security concerns; uses static project data.
- External links should include rel="noopener noreferrer" for security.
- Ensure no confidential information is included in project details.

## Performance / Accessibility Considerations
- Semantic heading structure (h1 for project name, h2 for section headings)
- Keyboard-navigable buttons and links
- Focus management on interactive elements
- Page title announced on route change
- Consider lazy loading for architecture visuals if they become heavy

## Definition of Done
- Project detail page accessible at `/projects/[slug]` with comprehensive project information.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §17: Project Card (for detail page foundation)
- PRD §117: Milestone 8 — Projects
- PRD §20: GitHub Integration (for githubUrl field)