# M08.10 — Ensure accessibility and keyboard navigation

## Objective

Ensure the project components (ProjectList, ProjectCard, FilterBar) and project pages (index and detail) strictly comply with WCAG 2.2 AA accessibility guidelines.

## Context

According to PRD §71, the entire website must achieve WCAG 2.2 AA compliance. The Projects section presents structured project data that must be fully comprehensible to screen reader users and navigable via keyboard.

## Requirements

- Provide accessible section landmark structure for project lists:
  * `<section aria-labelledby="projects-section-heading">`
  * `<h2 id="projects-section-heading">` (for index page) or `<h1 id="project-heading">` (for detail page)
- Use semantic HTML list elements (`<ul role="list" className="grid..." aria-label="Projects">` and `<li>`) for the project card collection
- Use semantic headings for card titles (`<h3>`) and sub-sections (`<h4>Value Proposition</h4>`, `<h4>Why I Built It</h4>`, `<h4>What I Learned</h4>`, `<h4>Architecture</h4>`, `<h4>Technologies</h4>`)
- Mark technology lists with accessible lists (`<ul aria-label="Technologies used">` with `<li>` items)
- Ensure external links (GitHub, Live Demo) have `target="_blank" rel="noopener noreferrer"` and accessible link text
- Ensure all text has sufficient color contrast against background/surface tokens (minimum 4.5:1 ratio for body text, 3:1 for large headings)
- Ensure any interactive elements (filter buttons, GitHub/demo links) have visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`)
- Ensure no focus traps or accessibility tree omissions
- Ensure the project detail page handles 404 cases with appropriate heading and messaging
- Ensure filtering controls are accessible (proper role, aria-pressed for toggle buttons)

## Scope

### In scope
- Semantic markup and ARIA attributes for ProjectList, ProjectCard, FilterBar
- Accessible project index and detail pages
- Color contrast verification
- Screen reader navigation auditing
- Keyboard navigation validation
- Accessible external links

### Out of scope
- Project data population (handled in M08.02)
- Advanced filtering UI (search, multi-select) (can be enhanced later)
- Animation accessibility beyond reduced-motion (handled in M08.09)

## Dependencies
- M08.03 – Create project card component
- M08.04 – Create project list component
- M08.05 – Create project index page
- M08.06 – Create project detail page
- M08.07 – Implement filtering and categories
- M08.08 – Implement mobile layout adaptation
- M08.09 – Add animations using Framer Motion

## Files / Areas Expected To Change
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/ProjectList.tsx`
- `src/components/projects/FilterBar.tsx`
- `app/projects/page.tsx`
- `app/projects/[slug]/page.tsx`

## Implementation Guidance
1. Ensure `ProjectList` has `aria-labelledby="projects-section-heading"` when used in a section with a heading
2. Verify heading levels: Page title is `<h1>`, Section heading is `<h2>`, Card title is `<h3>`, Card subsections are `<h4>`
3. Wrap project cards list in an accessible `<ul role="list">` and `<li>` structure (or use `role="list"` on the container if using divs)
4. Wrap technology badges in a semantic `<ul>` / `<li>` structure with `aria-label="Technologies used"`
5. Ensure GitHub and Live Demo links have `target="_blank" rel="noopener noreferrer"` and clear link text
6. Test with keyboard navigation (Tab order) and screen reader emulator (e.g., VoiceOver, NVDA)
7. Ensure filter buttons in FilterBar are accessible toggle buttons (`role="button"`, `aria-pressed`)
8. Ensure project detail page provides meaningful error handling for invalid slugs

## Acceptance Criteria
- [ ] Project list has valid ARIA landmarks and heading hierarchy (`<h2>` → `<h3>` → `<h4>`)
- [ ] Project cards and technology badges use semantic list elements
- [ ] FilterBar toggle buttons are accessible (aria-pressed, keyboard operable)
- [ ] All text passes WCAG 2.2 AA contrast ratios
- [ ] External links have target="_blank" rel="noopener noreferrer"
- [ ] Keyboard navigation is logical and free of focus traps
- [ ] Project detail page handles invalid slugs gracefully
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeROC typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual keyboard navigation audit
- [ ] Optional: Automated accessibility testing (if tools available)

## Security / Privacy Considerations
- No security concerns.

## Performance / Accessibility Considerations
- Meets WCAG 2.2 AA guidelines (PRD §71).

## Definition of Done
- Project components and pages are fully accessible per WCAG 2.2 AA standards.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §71: Accessibility target WCAG 2.2 AA
- PRD §117: Milestone 8 — Projects