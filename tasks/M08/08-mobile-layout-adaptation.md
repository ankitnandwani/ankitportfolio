# M08.08 — Implement mobile layout adaptation

## Objective

Ensure the project components (ProjectList, ProjectCard, FilterBar) and project pages (index and detail) adapt gracefully to mobile and tablet screen sizes, ensuring optimal readability, proper spacing, and no horizontal overflow.

## Context

According to PRD §74, performance targets include responsiveness. On narrow screens (smartphones, small tablets), multi-column grids must collapse into a clean single-column stack. Text must wrap properly, badge pills must wrap naturally, and card padding must be scaled appropriately to ensure sufficient content area without cramping.

## Requirements

- Adjust `ProjectList` grid: single column on mobile (`grid-cols-1`), scaling to 2 columns on tablet (`sm:grid-cols-2`) and 3 columns on desktop (`lg:grid-cols-3`)
- Optimize `ProjectCard` padding: `p-4 sm:p-5 md:p-6`
- Ensure technology badge lists wrap neatly (`flex-wrap gap-1.5 sm:gap-2`)
- Ensure `FilterBar` button group wraps or scrolls horizontally on very narrow screens
- Ensure all text has word-breaking (`break-words`) to prevent horizontal overflow on long technical terms or URLs
- Verify no horizontal scrollbar occurs on 320px, 375px, and 414px viewports for project-related components
- Ensure project detail page content is readable on mobile (appropriate heading sizes, padding)
- Ensure project index page filtering UI adapts to mobile (dropdown or vertical buttons if horizontal space insufficient)

## Scope

### In scope
- Responsive classes on `ProjectList`, `ProjectCard`, `FilterBar`
- Responsive layout adjustments in `app/projects/page.tsx` and `app/projects/[slug]/page.tsx`
- Spacing and typography adjustments for mobile viewports
- Testing across mobile breakpoints (`sm`, `md`, `lg`)

### Out of scope
- Desktop animations (handled in M08.09)
- Accessibility labeling (handled in M08.10)
- Project data population (handled in M08.02)

## Dependencies
- M08.03 – Create project card component
- M08.04 – Create project list component
- M08.05 – Create project index page
- M08.06 – Create project detail page
- M08.07 – Implement filtering and categories

## Files / Areas Expected To Change
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/ProjectList.tsx`
- `src/components/projects/FilterBar.tsx`
- `app/projects/page.tsx`
- `app/projects/[slug]/page.tsx`

## Implementation Guidance
1. Inspect `ProjectCard` content across small viewports
2. Apply Tailwind responsive utility classes (`text-base sm:text-lg md:text-xl`, `p-4 sm:p-6`)
3. Ensure `ProjectList` grid container uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
4. Ensure `FilterBar` uses `flex flex-wrap gap-2` and considers overflow-x-auto on extreme narrowness
5. For project detail page, ensure heading sizes scale appropriately (`text-3xl sm:text-4xl`)
6. For project index page, ensure heading and filter bar adapt
7. Test at 320px viewport width in dev tools

## Acceptance Criteria
- [ ] Project list displays as a single column on mobile viewports
- [ ] Project card displays as a single column on mobile viewports
- [ ] No visual clipping or horizontal overflow on narrow screens (down to 320px width)
- [ ] Technology badges and text wrap naturally without overflowing card boundaries
- [ ] Filter bar adapts to narrow screens (wraps or becomes scrollable)
- [ ] Project detail page remains readable on mobile
- [ ] Desktop and tablet layouts remain visually appealing and structured
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- Layout changes only; no security impact.

## Performance / Accessibility Considerations
- Responsive CSS via Tailwind utility classes with zero runtime performance cost.

## Definition of Done
- Project components and pages are fully responsive across mobile, tablet, and desktop viewports.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §74: Performance and responsiveness targets
- PRD §117: Milestone 8 — Projects