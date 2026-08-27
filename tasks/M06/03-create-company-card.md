# M06.03 — Create company card component with expandable details

## Objective

Create a React component that represents a single position in the career timeline, displaying company, role, dates, and domain in a compact form, with the ability to expand to reveal detailed information such as responsibilities, technologies, and notable projects.

## Context

Each entry in the career timeline should be tappable/clickable to expand and show more details about the position. This follows the pattern described in PRD §13 where each position expands into details. The component should be used within the timeline container.

## Requirements

- Create a React component named `CompanyCard` in `src/components/careerTimeline/CompanyCard.tsx`
- The component should accept a prop for a single timeline entry (matching the interface from M06.01)
- In its collapsed state, the component should display:
  * Company name
  * Role
  * Dates (e.g., "Jan 2021 – Present" or "Mar 2020 – Dec 2020")
  * Domain (if applicable)
- In its expanded state, the component should additionally display:
  * Responsibilities (as a list)
  * Technologies used (as a list or tags)
  * Notable projects (as a list)
- Implement expand/collapse functionality using React state (useState)
- Use smooth animations for expanding/collapsing (can be enhanced with Framer Motion in M06.07, but basic CSS transitions are acceptable for now)
- Follow the existing design system styling (NeoPOP-inspired elevated cards, use of design tokens)
- Ensure the component is accessible: keyboard operable (Enter/Space to toggle), proper ARIA attributes (aria-expanded, aria-controls)
- Do not invent any professional information; rely solely on the passed data prop

## Scope

### In scope
- Company card component with collapsed and expanded views
- Toggle functionality via click and keyboard
- Basic expand/collapse animation (CSS transition)
- Display of all fields from the timeline entry data
- Accessibility basics (focus management, ARIA attributes)

### Out of scope
- Timeline container layout (handled in M06.02)
- Data modeling (handled in M06.01)
- Advanced animations using Framer Motion (handled in M06.07)
- Mobile-specific layout adaptations (handled in M06.06)
- Integration into the timeline container (handled in M06.02)
- Fetching or validating data against resume

## Dependencies
- M06.01 – Define career timeline data model (data interface)
- M06.02 – Create timeline container component (will use this component)

## Files / Areas Expected To Change
- src/components/careerTimeline/CompanyCard.tsx (new file)
- src/components/careerTimeline/index.ts (optional, for barrel export)
- Potential updates to existing imports if any

## Implementation Guidance
1. Create the file `src/components/careerTimeline/CompanyCard.tsx`
2. Define the component props TypeScript interface based on the timeline entry interface
3. Implement state for expanded/collapsed (boolean)
4. Render the header (company, role, dates, domain) always visible
5. Conditionally render the details section when expanded
6. Use a button or the entire card header as the toggle trigger
7. Add appropriate ARIA attributes: aria-expanded on the button, id/aria-controls for the details section
8. Ensure keyboard focus is manageable (tabindex on button)
9. Use Tailwind CSS for styling, following the design system:
   - Elevated card appearance (shadow, border-radius)
   - Use of design tokens for colors, spacing
   - Consider using NeoPOP-inspired elevated card if available via the design system
10. Implement a simple CSS transition for the details section (max-height transition or use Framer Motion later)
11. Ensure the component does not modify the data prop
12. Export the component as default or named export (consistent with other components)

## Acceptance Criteria
- [ ] src/components/careerTimeline/CompanyCard.tsx file created
- [ ] Component accepts a prop matching the timeline entry interface
- [ ] Collapsed state displays company, role, dates, domain
- [ ] Expanded state additionally displays responsibilities, technologies, notable projects
- [ ] Clicking the header toggles expanded/collapsed state
- [ ] Pressing Enter or Space when focused on the header toggles the state
- [ ] Basic expand/collapse animation is present (smooth transition)
- [ ] ARIA attributes are correctly set (aria-expanded, aria-controls)
- [ ] No hardcoded professional information in the component
- [ ] TypeScript compiles without errors
- [ ] Code follows existing code style and conventions in the repository

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Component renders without errors when imported and used with mock data
- [ ] Interactive toggle works via mouse and keyboard

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves UI component creation with passed data
- Ensure no personal identifiable information (PII) is invented or included in the component

## Performance / Accessibility Considerations
- Consider performance of rendering many cards (should be fine)
- Ensure the component is accessible to screen readers (proper labeling, role if needed)
- Keyboard navigation should be intuitive

## Definition of Done
- Company card component created with collapsed and expanded views
- Toggle functionality works via mouse and keyboard
- Basic animation for expand/collapse
- Accessibility basics implemented (ARIA, keyboard operable)
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §13: Career Timeline - each position expands into details
- PRD: "Each position should expand into: company, role, dates, domain, key responsibilities, major technologies, notable projects"