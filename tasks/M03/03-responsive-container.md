# M03.03 — Responsive container

## Objective
Create a responsive container component that provides consistent content width, padding, and centering across all pages of the portfolio. This component will ensure optimal readability and visual consistency regardless of screen size.

## Context
A responsive container is a fundamental layout primitive that ensures content doesn't stretch too wide on large screens while maintaining appropriate padding on smaller screens. This component will be used throughout the site to wrap page content and provide consistent spacing.

## Requirements
- Center content horizontally on large screens
- Apply appropriate horizontal padding on mobile screens
- Constrain maximum width for optimal readability (typically around 80-120ch for text)
- Use design system tokens for spacing and breakpoints
- Be flexible enough to accommodate full-width sections when needed
- Work consistently across light and dark themes
- Be lightweight and not impact performance

## Scope

### In scope
- Responsive container component implementation
- Configurable max-width and padding
- Integration with design system breakpoints
- Optional full-width variant
- Consistent application across pages

### Out of scope
- Complex grid layouts
- Masonry or waterfall layouts
- Animation or motion primitives
- Theme-specific container variations
- Server-side rendering optimizations

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.02 – Evaluate NeoPOP components and document selection
- M02.03 – Create compatibility layer
- M02.04 – Define elevations (shadow levels) and integrate with Tailwind
- M02.05 – Define motion (animation presets) using Framer Motion
- M02.06 – Define breakpoints and integrate with Tailwind
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M02.09 – Create design system showcase route

## Files / Areas Expected To Change
- `src/components/layout/ResponsiveContainer.tsx` (new component)
- `src/components/layout/index.ts` (new barrel file)
- `app/layout.tsx` (to use the container for overall layout)
- `app/page.tsx` and other page files (to wrap content with container)
- `src/styles/globals.css` (if additional styles needed)

## Implementation Guidance
1. Create a responsive container component that uses design system tokens for spacing
2. Implement responsive behavior using Tailwind breakpoints (container, px-, etc.)
3. Set appropriate max-width based on design tokens or constants (e.g., 7xl or custom value)
4. Provide horizontal padding on smaller screens using spacing tokens
5. Create a variant prop for full-width containers when needed
6. Ensure the component works with both light and dark themes
7. Follow the existing code style and patterns in the codebase
8. Keep the component simple and composable
9. Document usage with JSDoc comments
10. Test across different screen sizes and content types

## Acceptance Criteria
- [ ] Container centers content on large screens
- [ ] Container applies appropriate padding on mobile screens
- [ ] Container constrains maximum width for readability
- [ ] Container uses design system tokens for spacing and breakpoints
- [ ] Container works consistently in light and dark themes
- [ ] Full-width variant functions correctly when needed
- [ ] Component is lightweight and doesn't cause layout shifts
- [ ] Content remains accessible and readable at all sizes

## Testing Requirements
- Manual testing of container on various screen sizes
- Verify max-width and padding values match design specifications
- Test with different content types (text, images, cards, etc.)
- Check behavior in both light and dark themes
- Validate that content remains accessible and readable
- Ensure no horizontal overflow or scrolling issues

## Security / Privacy Considerations
- No security concerns for this layout component
- No privacy concerns as it doesn't handle user data

## Performance / Accessibility Considerations
- Minimize CSS and DOM complexity
- Ensure container doesn't cause unnecessary re-renders
- Maintain proper contrast ratios for content within container
- Support text resizing without breaking layout
- Follow WCAG 2.2 AA guidelines for text spacing and contrast

## Definition of Done
- Responsive container component is implemented and functional
- Container provides appropriate constraints and padding across breakpoints
- Component is flexible enough for full-width content when needed
- Implementation follows design system principles
- All acceptance criteria are met
- Code is committed and passes linting/typechecking

## Related Requirements
- PRD.md: Information Architecture section (layout consistency)
- PRD.md: Homepage section (content presentation)
- ROADMAP.md: Milestone 3 – Site Shell