# M06.06 — Implement mobile layout adaptation

## Objective

Ensure the career timeline component adapts to mobile screen sizes, providing a usable and readable experience on narrow viewports.

## Context

The career timeline may initially be designed with a vertical timeline layout suitable for desktop (e.g., alternating cards on sides of a line). On mobile, we need to adjust the layout to stack cards vertically, possibly hiding the timeline line or adapting it for small screens.

## Requirements

- Modify the `CareerTimeline` component (src/components/careerTimeline/CareerTimeline.tsx) to detect or respond to viewport width using Tailwind CSS responsive prefixes
- Change the layout from a multi-column timeline (if implemented) to a single-column stack on mobile (typically sm: breakpoint and below)
- Ensure that the `CompanyCard` component remains usable and readable on mobile (text size, touch targets)
- Adjust spacing and padding appropriately for mobile screens
- Do not break the desktop layout; ensure it still works on larger screens
- Follow the existing responsive design patterns in the repository (e.g., using Tailwind's sm:, md:, lg: prefixes)
- Ensure all interactive elements meet minimum touch target size (48x48px) on mobile

## Scope

### In scope
- Responsive layout changes in CareerTimeline component
- Adjustments to CompanyCard for mobile readability (if needed)
- Use of Tailwind responsive utilities
- Mobile-friendly spacing and touch targets

### Out of scope
- Data modeling or data fetching
- Desktop-specific enhancements beyond ensuring they still work
- Animations (handled in M06.07)
- Accessibility beyond basic touch targets (handled in M06.08)
- Changes to other components on the homepage

## Dependencies
- M06.02 – Create timeline container component (we are modifying it)
- M06.03 – Create company card component (may need adjustments)

## Files / Areas Expected To Change
- src/components/careerTimeline/CareerTimeline.tsx
- src/components/careerTimeline/CompanyCard.tsx (potentially for mobile-specific styling)

## Implementation Guidance
1. Examine the current layout implementation in CareerTimeline.tsx
2. Identify the main container and the timeline line/elements
3. Use Tailwind responsive prefixes to change layout at the `sm` breakpoint (640px) or as per design
   - Example: On desktop (md and above), show timeline with alternating sides; on mobile (below md), stack cards full-width and hide or adapt the line
4. Adjust margins, padding, and widths using responsive classes (e.g., w-full md:w-1/2)
5. Ensure the CompanyCard component's internal layout remains readable on mobile:
   - Text should wrap appropriately
   - Buttons or touch targets should be at least 48x48px
   - Consider using block-level elements for better touch area
6. Test by resizing the browser window or using device emulators in development
7. Verify that the timeline does not overflow its container on mobile
8. Follow the existing component patterns for responsiveness (e.g., look at Hero or ProfessionalSection for how they handle responsive design)

## Acceptance Criteria
- [ ] CareerTimeline component adapts its layout for mobile screens (max-width: sm breakpoint)
- [ ] On mobile, timeline entries are displayed in a single column (full width) without overlapping or horizontal scrolling
- [ ] Desktop layout (md and above) remains functional and visually correct
- [ ] Interactive elements (toggle button) have adequate touch target size on mobile
- [ ] No visual overflow or clipping on mobile
- [ ] TypeScript compiles without errors
- [ ] Lint passes without new errors
- [ ] The responsive behavior works when tested in next dev with responsive design mode

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Manual verification of responsive layout in browser devtools
- [ ] Component renders correctly at various widths (mobile, tablet, desktop)

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves layout adjustments

## Performance / Accessibility Considerations
- Consider performance of rendering on mobile (should be fine)
- Ensure the timeline is accessible on mobile (touch targets, readable text) – contributes to overall accessibility

## Definition of Done
- Career timeline component is fully responsive, providing an optimal layout for both mobile and desktop
- Mobile layout is usable, readable, and accessible
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §13: Career Timeline - interactive timeline component (should work on all devices)
- PRD: "Mobile layout adaptation" is explicitly listed as a task for this milestone