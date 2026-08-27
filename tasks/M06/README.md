# Milestone M06 – Career Timeline

## Objective

Create an interactive, browsable career history that allows recruiters to explore Ankit's professional experience in detail.

According to PRD §13, the career timeline should show positions with company, role, dates, domain, key responsibilities, major technologies, and notable projects. Each position should expand into details.

## Definition of Done

Complete career history is browsable: users can navigate through timeline entries, expand/collapse details to view responsibilities, technologies, and notable projects, and the component is responsive and accessible.

## Tasks

| Task | Name | Description |
|------|------|-------------|
| M06.01 | Define career timeline data model | Create TypeScript interfaces and data structures for career timeline entries. |
| M06.02 | Create timeline container component | Build the container component that lays out the timeline and loads data. |
| M06.03 | Create company card component | Create an expandable card for each position with toggle functionality. |
| M06.04 | Populate career timeline data from resume | Fill the data file with verified information from the resume, using placeholders where needed. |
| M06.05 | Integrate timeline into homepage | Add the CareerTimeline component to app/page.tsx after the professional snapshot. |
| M06.06 | Implement mobile layout adaptation | Ensure the timeline adapts to mobile screen sizes (single-column stack). |
| M06.07 | Add animations for expand/collapse | Use Framer Motion to animate the expand/collapse of company card details. |
| M06.08 | Ensure accessibility and keyboard navigation | Make the timeline fully accessible per WCAG 2.2 AA, with keyboard operability and ARIA attributes. |

## Execution Order

1. M06.01 – Define career timeline data model (foundational data)
2. M06.04 – Populate career timeline data from resume (depends on data model)
3. M06.02 – Create timeline container component (needs data to display)
4. M06.03 – Create company card component (used by container)
5. M06.07 – Add animations for expand/collapse (enhances company card)
6. M06.06 – Implement mobile layout adaptation (affects container and card)
7. M06.08 – Ensure accessibility and keyboard navigation (final polish on both components)
8. M06.05 – Integrate timeline into homepage (final integration)

Note: Tasks can be partially parallelized; for example, M06.02 and M06.03 can be worked on in parallel after M06.01 and M06.04 are complete. However, M06.05 should be last.

## Dependencies

- M06.01 → M06.04 (data model before populating data)
- M06.01 → M06.02 (container needs data interface)
- M06.03 → M06.02 (container uses company card)
- M06.03 → M06.07 (animations on company card)
- M06.02 → M06.06 (mobile layout affects container)
- M06.03 → M06.06 (mobile layout affects card)
- M06.02, M06.03, M06.06, M06.07, M06.08 → M06.05 (integration requires all components ready)

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Interactive timeline component | PRD §13 | M06.02, M06.03, M06.05 | Covered |
| Each position expands into details | PRD §13 | M06.03, M06.07, M06.08 | Covered |
| Use resume as baseline source of truth | PRD §13 | M06.04 | Covered |
| Mobile layout adaptation | PRD task list | M06.06 | Covered |
| Animations using Framer Motion | PRD §50 | M06.07 | Covered |
| Accessibility WCAG 2.2 AA | PRD §71 | M06.08 | Covered |
| Interactive, browsable career history | Milestone definition | All tasks | Covered |

## Notes

- Ensure all data is verified against the resume; do not invent professional information.
- Follow existing code patterns and conventions in the repository.
- Maintain TypeScript strict mode.
- Run lint and typecheck after each task.
- Update PROJECT_STATE.md after completing each task.