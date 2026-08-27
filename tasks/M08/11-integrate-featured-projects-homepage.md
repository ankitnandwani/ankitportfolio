# M08.11 — Integrate featured projects section into homepage

## Objective

Integrate a `FeaturedProjects` component into `app/page.tsx` in accordance with the PRD homepage information architecture, displaying featured projects after the Engineering Arsenal section and before the Finance / Trading Lab section.

## Context

According to PRD §9 (Homepage structure), the sequence is:
```text
Hero
 ↓
Professional Snapshot
 ↓
Selected Impact (Achievements)
 ↓
Career Journey (Career Timeline)
 ↓
Engineering Arsenal
 ↓
Featured Projects
 ↓
Finance / Trading Lab
 ↓
...
```
We will create a `FeaturedProjects` component (showing only projects with `featured: true`) and insert it into `app/page.tsx` after `ProfessionalSection` (or more precisely, after the Engineering Arsenal section) and before the Finance / Trading Lab section.

## Requirements

- Create `FeaturedProjects` component in `src/components/projects/FeaturedProjects.tsx` (or reuse `ProjectList` with filtered data)
- Import `FeaturedProjects` into `app/page.tsx`
- Render `<FeaturedProjects className="mt-16" />` between the Engineering Arsenal section (which may be the `CapabilityAreas` component) and the Finance / Trading Lab section (to be implemented in later milestones)
- Maintain consistent spacing between sections
- Ensure the page compiles, renders, and passes production build checks
- Only display projects where `featured: true` is set in the project data

## Scope

### In scope
- Creating `FeaturedProjects` component (filtering `ProjectList` by `featured: true`)
- Editing `app/page.tsx` to import and render `FeaturedProjects`
- Spacing and container alignment

### Out of scope
- Modifying `ProjectList` or `ProjectCard` internals (except as needed for filtering)
- Modifying site navigation or metadata
- Implementing the Finance / Trading Lab section (future milestone)

## Dependencies
- M08.01 through M08.10 (all project components and data must be ready)
- Engineering Arsenal section (likely `CapabilityAreas` component) must exist
- Finance / Trading Lab section not required for this task (just ensure correct placement)

## Files / Areas Expected To Change
- `src/components/projects/FeaturedProjects.tsx` (new file)
- `src/components/projects/index.ts` (to export `FeaturedProjects`)
- `app/page.tsx`

## Implementation Guidance
1. Create `src/components/projects/FeaturedProjects.tsx`
   - Import `ProjectList` from `./ProjectList`
   - Import `projectsData` from `@/src/data/projects`
   - Filter `projectsData` to only include projects where `featured === true`
   - Render `<ProjectList projects={featuredProjects} heading="Featured Projects" subtitle="Highlighted engineering endeavors" />`
   - Export the component
2. Update `src/components/projects/index.ts` to export `FeaturedProjects`
3. Open `app/page.tsx`
4. Add `import { FeaturedProjects } from '@/src/components/projects';`
5. In the `<main>` JSX structure, insert `<FeaturedProjects className="mt-16" />` after the Engineering Arsenal section (which is likely the `CapabilityAreas` component imported from `@/src/components/capabilityAreas`) and before the Finance / Trading Lab section (which may not yet exist; ensure correct ordering)
6. Run typecheck, lint, and build to confirm clean integration

## Acceptance Criteria
- [ ] `app/page.tsx` imports and renders `FeaturedProjects`
- [ ] Section is positioned after Engineering Arsenal and before Finance / Trading Lab (or where Finance / Trading Lab will be)
- [ ] Only projects with `featured: true` are displayed
- [ ] Layout spacing is clean and consistent
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors
- [ ] Next.js production build (`npm run build`) completes successfully

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Production build passes (`npm run build`)

## Security / Privacy Considerations
- No security concerns.

## Performance / Accessibility Considerations
- Section rendered within responsive container with no layout shifts.
- Featured projects component inherits accessibility from `ProjectList` and `ProjectCard`.

## Definition of Done
- Featured projects section is live on the homepage in its PRD-designated position.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §9: Homepage Featured Projects section
- PRD §117: Milestone 8 — Projects