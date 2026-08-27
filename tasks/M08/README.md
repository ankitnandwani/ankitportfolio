# Milestone M08 – Projects

## Objective

Present professional, personal, and engineering-lab projects with filtering and categorization, allowing visitors to discover and explore projects with appropriate context. According to PRD §16 and §117, projects are presented as structured cards highlighting name, value proposition, category, technologies, why built, what learned, architecture, GitHub links, and live demos.

## Definition of Done

Visitors can discover and explore projects with appropriate context via a project index page, project detail pages, filtering by category, and a featured projects section on the homepage. The project showcase communicates engineering breadth and depth rather than simply listing technologies.

## Tasks

| Task | Name | Description |
|------|------|-------------|
| M08.01 | Define project data model | Create TypeScript interfaces and types for project entries. |
| M08.02 | Populate project data from resume | Populate factual project entries based on resume, verified experience, and approved project descriptions. |
| M08.03 | Create project card component | Build the visual ProjectCard component with clear value proposition, technology hierarchy, and action links. |
| M08.04 | Create project list component | Build a reusable ProjectList component that displays projects in a responsive grid with optional filtering. |
| M08.05 | Create project index page | Build the /projects route page displaying all projects with filtering controls. |
| M08.06 | Create project detail page | Build the /projects/[slug] route page displaying detailed project information including architecture visuals. |
| M08.07 | Implement filtering and categories | Add UI controls to filter projects by category (Professional, Personal Engineering, Engineering Lab, Finance, AI) and potentially other facets. |
| M08.08 | Implement mobile layout adaptation | Ensure project lists, cards, and detail pages adapt seamlessly to mobile viewports. |
| M08.09 | Add animations using Framer Motion | Implement subtle entrance and hover animations with reduced-motion support. |
| M08.10 | Ensure accessibility and keyboard navigation | Ensure WCAG 2.2 AA compliance, semantic hierarchy, accessible tags, and keyboard-navigable filters. |
| M08.11 | Integrate featured projects section into homepage | Add the FeaturedProjects component to app/page.tsx in the designated layout order after Engineering Arsenal and before Finance / Trading Lab. |

## Execution Order

```text
M08.01 (Define data model)
   ↓
M08.02 (Populate data)
   ↓
M08.03 (Create project card)
   ↓
M08.04 (Create project list component)
   ↓
M08.05 (Create project index page)
   ↓
M08.06 (Create project detail page)
   ↓
M08.07 (Implement filtering and categories)
   ↓
M08.08 (Mobile layout adaptation)
   ↓
M08.09 (Add animations)
   ↓
M08.10 (Ensure accessibility)
   ↓
M08.11 (Integrate featured projects into homepage)
```

1. **M08.01 – Define project data model**: Foundational TypeScript interfaces for project entries.
2. **M08.02 – Populate project data from resume**: Verified project data content using resume and approved project descriptions as baseline truth.
3. **M08.03 – Create project card component**: Individual project card UI showing name, value proposition, category, technologies, why built, what learned, architecture highlights, and GitHub/live demo links.
4. **M08.04 – Create project list component**: Reusable wrapper that displays an array of ProjectCard components in a responsive grid, with optional filtering UI.
5. **M08.05 – Create project index page**: Standalone /projects page featuring the full project list with filtering controls and SEO optimization.
6. **M08.06 – Create project detail page**: Standalone /projects/[slug] page featuring deep project details, architecture visuals, technologies deep dive, and full GitHub/live demo integration.
7. **M08.07 – Implement filtering and categories**: UI controls (buttons, tabs, or dropdowns) to filter displayed projects by category and potentially technology stacks.
8. **M08.08 – Implement mobile layout adaptation**: Mobile-responsive grids, touch-friendly controls, and adaptive layouts for all project-related components.
9. **M08.09 – Add animations using Framer Motion**: Smooth entrance animations for project cards, hover interactions, and transition effects with prefers-reduced-motion support.
10. **M08.10 – Ensure accessibility and keyboard navigation**: Semantic markup, ARIA labels, sufficient contrast, focus management, and keyboard-navigable filtering controls.
11. **M08.11 – Integrate featured projects section into homepage**: Integration of a FeaturedProjects component (showing only featured projects) into app/page.tsx after Engineering Arsenal and before Finance / Trading Lab, following PRD homepage structure.

## Dependencies

- M08.01 → M08.02 (data model required before populating data)
- M08.01 → M08.03 (card component needs data interface)
- M08.01, M08.03 → M08.04 (list component needs card and data model)
- M08.04 → M08.05 (index page uses project list component)
- M08.04 → M08.06 (detail page may reuse list for related projects)
- M08.04, M08.07 → M08.05 (filtering requires list component and UI controls)
- M08.05, M08.06 → M08.08 (mobile layout applied to pages and components)
- M08.03, M08.04, M08.05, M08.06 → M08.09 (animations applied to cards, lists, and pages)
- M08.03 through M08.06, M08.08 → M08.10 (accessibility audit on all project components)
- M08.01 through M08.10 → M08.11 (integration requires complete featured projects component)

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Project cards (name, value proposition, category, technologies, why built, what learned, architecture, GitHub, live demo) | PRD §16, §17, §117 | M08.01, M08.03 | Planned |
| Project index page with all projects | PRD §117 | M08.05 | Planned |
| Project detail pages | PRD §117 | M08.06 | Planned |
| Filters and categories (Professional, Personal Engineering, Engineering Lab, Finance, AI) | PRD §117 | M08.07 | Planned |
| Use resume and approved descriptions as baseline truth without inventing details | PRD §16 | M08.02 | Planned |
| Visual hierarchy (value proposition prominent) | PRD §17 | M08.03 | Planned |
| Reusable project list component | PRD §117 | M08.04 | Planned |
| Mobile layout adaptation | PRD §74, Roadmap | M08.08 | Planned |
| Animations using Framer Motion | PRD §50 | M08.09 | Planned |
| Accessibility WCAG 2.2 AA | PRD §71 | M08.10 | Planned |
| Homepage integration ("Featured Projects") | PRD §9, §117 | M08.11 | Planned |
| Architecture visuals in project detail | PRD §117 | M08.06 | Planned |
| GitHub and live demo links | PRD §17, §20 | M08.03, M08.06 | Planned |

## Notes

- Do not invent project details, technologies, or outcomes; stick strictly to resume-verified data and approved project descriptions.
- Maintain TypeScript strict mode across all files.
- Adhere to design tokens and NeoPOP component compatibility layer (use Card, Badge, etc. from UI library).
- Project data should be stored in src/data/projects.ts.
- Featured projects should be indicated by a `featured: boolean` field in the project data.
- Architecture visuals can be simple technology icons or diagrams; avoid over-engineering.
- Ensure the project index page is accessible via navigation or footer links (to be determined in later milestones).
