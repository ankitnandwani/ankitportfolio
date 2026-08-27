# M08.07 — Implement filtering and categories

## Objective

Build a reusable filtering UI component that allows visitors to filter projects by category (Professional, Personal Engineering, Engineering Lab, Finance, AI) and potentially other facets, enhancing the project discovery experience.

## Context

According to PRD §117, the Projects section includes "Filters and categories". While the project index page (M08.05) provides the overall structure, a dedicated filtering component ensures consistent UI and logic for filtering projects across different views (e.g., index page, related projects section).

## Requirements

- Create `FilterBar` in `src/components/projects/FilterBar.tsx`
- Accept props:
  * `activeFilter`: current filter value (e.g. category string or "all")
  * `onFilterChange`: callback function to invoke when filter changes
  * `options`: array of filter options (e.g. `[{ label: "All", value: "all" }, { label: "Professional", value: "Professional" }, ...]`)
  * `className?`: string for additional styling
- Render filter options as a set of toggle buttons or tabs (e.g. `flex flex-wrap gap-2`)
- Highlight the active filter visually (using NeoPOP button variants or background styling)
- Support light and dark themes using tokens from `useTheme()`
- Export from `src/components/projects/index.ts`

## Scope

### In scope
- Reusable filter bar component with toggle button UI
- Category filtering logic (string matching)
- Visual indication of active filter
- Keyboard accessibility and focus management

### Out of scope
- Multi-select filtering (AND/OR logic)
- Search/filter by technology or free-text (can be added later)
- Advanced filtering UI (dropdowns, checkboxes, sliders)
- Integration with server-side filtering (all filtering is client-side on static data)

## Dependencies
- M08.02 – Populate project data (defines available categories)
- M08.04 – Create project list component (will consume filtered data)
- M08.05 – Create project index page (will use FilterBar)

## Files / Areas Expected To Change
- `src/components/projects/FilterBar.tsx` (new file)
- `src/components/projects/index.ts`

## Implementation Guidance
1. Create `src/components/projects/FilterBar.tsx`
2. Define filter options for categories: "All", "Professional", "Personal Engineering", "Engineering Lab", "Finance", "AI"
3. Implement button group with active/inactive styling
4. Use `useTheme()` to get colors for active state
5. Layout as a flex wrap gap for responsive behavior
6. Ensure buttons are accessible (proper role, aria-pressed, keyboard navigable)
7. Update `src/components/projects/index.ts` to export `FilterBar`

## Acceptance Criteria
- [ ] `FilterBar` component renders a set of toggle buttons for each category plus "All"
- [ ] Correctly highlights the active filter button
- [ ] Invokes `onFilterChange` callback with the selected value when a button is clicked
- [ ] Works cleanly in light and dark themes
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeROC typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- No security concerns; presents static filter options.

## Performance / Accessibility Considerations
- Semantic button elements with proper ARIA attributes (aria-pressed for toggle state)
- Keyboard navigable (Tab to focus, Enter/Space to activate)
- Clear visual contrast between active and inactive states
- Responsive layout that wraps on smaller screens

## Definition of Done
- FilterBar component created, styled, and exported.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §117: Milestone 8 — Projects
- PRD §16: Projects categories