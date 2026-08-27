# M06.08 — Ensure accessibility and keyboard navigation

## Objective

Ensure the career timeline component is fully accessible, complying with WCAG 2.2 AA guidelines, and provides intuitive keyboard navigation for all interactive elements.

## Context

Accessibility is a core requirement for the project (PRD §71). The career timeline must be usable by individuals relying on keyboards, screen readers, and other assistive technologies. We need to audit and enhance the timeline container and company card components for accessibility.

## Requirements

- Review and enhance the `CareerTimeline` and `CompanyCard` components for accessibility:
  * Ensure all interactive elements are keyboard operable (tab focus, Enter/Space to activate)
  * Ensure proper ARIA attributes are used for expandable regions (aria-expanded, aria-controls, aria-label if needed)
  * Ensure the timeline conveys its structure to screen readers (consider using role or aria-label on the timeline container)
  * Ensure color contrast meets WCAG AA ratios for text and interactive elements (rely on design system tokens which should already be compliant)
  * Ensure focus styles are visible and appropriate (use Tailwind's focus-*:outline, focus-*:ring classes)
  * Ensure the timeline is navigable in a logical order (tab order follows visual order)
  * Ensure that expanded content is announced appropriately by screen readers (dynamic content changes)
  * Consider adding a skip-to-content mechanism or landmark roles if appropriate
- Do not invent any accessibility features that are not required; follow established patterns in the repository
- Test accessibility using automated tools (e.g., axe) and manual keyboard navigation where possible

## Scope

### In scope
- Accessibility enhancements for CareerTimeline and CompanyCard components
- Keyboard navigation and focus management
- ARIA attributes for expandable sections
- Color contrast verification (reliance on design system)
- Focus styling
- Screen reader friendliness

### Out of scope
- Data modeling or data fetching
- Animations (though ensure they don't hinder accessibility)
- Mobile layout adjustments (though ensure they don't break accessibility)
- Changes to other components on the homepage
- Setting up automated accessibility testing in CI (if not already present)

## Dependencies
- M06.02 – Create timeline container component
- M06.03 – Create company card component
- M06.06 – Mobile layout adaptation (ensure changes don't break accessibility)
- M06.07 – Add animations (ensure animations don't hinder accessibility)

## Files / Areas Expected To Change
- src/components/careerTimeline/CareerTimeline.tsx
- src/components/careerTimeline/CompanyCard.tsx

## Implementation Guidance
1. Review the current implementation of both components for accessibility issues:
   - Check that the toggle button is focusable and has a clear accessible name (company + role + "details")
   - Ensure the toggle button uses `<button>` element (not a div) for inherent accessibility
   - Ensure that when the details section is expanded, it is identified as such via aria-expanded on the button
   - Ensure the details section has an id that matches aria-controls on the button
   - Consider using `aria-labelledby` on the details section to label it with the heading (if present)
   - Ensure the timeline container has a meaningful aria-label or role (e.g., aria-label="Career timeline" or role="region")
   - Check color contrast by verifying that the design system tokens (should already be compliant)
   - Ensure focus styles are present (use focus-*:outline-none? Actually we need focus-*:ring or focus-*:outline)
   - Test tab order: ensure users can tab into the toggle button, then into the details section when expanded
   - Ensure that when details are collapsed, tabbing skips over the hidden content (should be inert)
   - If using Framer Motion for animations, ensure that the animation does not remove content from the accessibility tree
2. Implement any missing accessibility features:
   - Change any non-button toggle to a proper `<button>` element
   - Add id to details section and reference it in aria-controls
   - Set aria-expanded on the button dynamically based on state
   - Add aria-label to the button if the visual content is not sufficient (e.g., "Show details for [Company] [Role]")
   - Consider using a heading (h3 or h4) inside the card for the company/role, but adjust heading levels based on context
   - Ensure the timeline container is marked as a landmark or has an aria-label
3. Test accessibility:
   - Use keyboard only: Tab, Shift+Tab, Enter, Space, Escape
   - Use screen reader software if available (NVDA, VoiceOver, TalkBack) or rely on automated tools
   - Run `npm run lint` and any accessibility linting rules if configured
   - Consider using `vitest` or other testing libraries for accessibility unit tests if applicable
4. Follow existing patterns in the repository for accessibility (e.g., look at navigation bar, command palette, etc.)

## Acceptance Criteria
- [ ] All interactive elements in the timeline are keyboard operable (toggle button via Enter/Space)
- [ ] Toggle button uses `<button>` element with appropriate aria-expanded and aria-controls
- [ ] Details section has an id matching aria-controls on the button
- [ ] Timeline container has an appropriate aria-label or role indicating its purpose
- [ ] Focus styles are visible and appropriate when navigating via keyboard
- [ ] Color contrast meets WCAG AA (reliance on design system tokens; no manual changes needed if tokens are compliant)
- [ ] No accessibility regressions introduced
- [ ] TypeScript compiles without errors
- [ ] Lint passes without new errors
- [ ] Manual keyboard navigation works without trapping focus

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Manual verification of keyboard navigation in browser devtools
- [ ] Optional: run any configured accessibility testing scripts

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves accessibility enhancements

## Performance / Accessibility Considerations
- Consider performance of accessibility enhancements (should be negligible)
- Ensure accessibility enhancements do not negatively impact performance (e.g., causing unnecessary renders)

## Definition of Done
- Career timeline component is accessible for keyboard and screen reader users
- ARIA attributes, focus management, and color contrast are addressed
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §71: Accessibility target: WCAG 2.2 AA compliance
- PRD §13: Career Timeline - interactive timeline component (must be accessible)