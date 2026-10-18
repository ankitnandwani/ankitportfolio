# M12.03 — Create testimonials section component

## Objective

Create a testimonials section component that renders a heading and a grid/list of testimonial cards. The component should conditionally render nothing if there are no testimonials available, following the principle of hiding the section when empty. It should layout testimonials in a responsive grid and include appropriate heading and introductory text.

## Context

This section will be integrated into the homepage after the Social Hub component. It should follow the same patterns as other sections like `AchievementsSection` and `ProfessionalSection`: a container with max width, heading, description, and a grid of cards. The component should receive testimonials data as a prop (or import it directly) and handle the empty state gracefully.

## Requirements

- Create `src/components/testimonials/TestimonialsSection.tsx`
- Import testimonials data from `@/src/data/testimonials`
- Display a section heading (e.g., "Testimonials" or "Social Proof")
- Include a brief introductory sentence or two about what the testimonials represent
- Render testimonials in a responsive grid (1 column on mobile, 2 on tablet, 3+ on desktop)
- Use the `TestimonialCard` component for each testimonial
- Conditionally render the entire section (or return null) if the testimonials array is empty
- Follow the same layout patterns as other sections: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 container
- Add appropriate spacing and typography using design tokens
- Include Framer Motion animations for the section entrance and staggered card entrance
- Respect `prefers-reduced-motion`
- Ensure accessibility: proper heading levels, aria-label if needed
- Export the component for use in other modules

## Scope

### In scope

- `src/components/testimonials/TestimonialsSection.tsx` file
- Component that imports and displays testimonials data
- Heading, description, grid layout
- Conditional rendering for empty state
- Framer Motion animations
- Accessibility considerations

### Out of scope

- Fetching or modifying testimonial data (handled by data layer)
- Individual testimonial card implementation (handled in M12.02)
- Integration into homepage layout (handled in M12.04)

## Dependencies

- M12.01: Testimonial data model must exist
- M12.02: TestimonialCard component must exist
- Existing dependencies: `framer-motion`, `@/src/components/ui/Card`, `@/design/themeContext`, etc.

## Files / Areas Expected To Change

- `src/components/testimonials/TestimonialsSection.tsx` (new file)

## Implementation Guidance

1. Create `src/components/testimonials/TestimonialsSection.tsx` with `use client` directive
2. Import dependencies:
   - React
   - motion from framer-motion
   - TestimonialCard from './TestimonialCard'
   - testimonials data from '@/src/data/testimonials'
   - useTheme from '@/design/themeContext'
3. Define props interface (optional, could accept testimonials as prop for flexibility, but we can import directly)
4. Implement the component:
   - Get theme tokens
   - Set up prefers-reduced-motion state and effect
   - If testimonials array is empty, return null (to hide entire section)
   - Define animation variants for section entrance and card stagger
   - Render section with appropriate className
   - Container div with max width and padding
   - Heading (h2) with styled text
   - Description paragraph (optional)
   - motion.div for grid layout with entrance animation
   - Map testimonials to motion.wrapper (motion.div) containing TestimonialCard, with staggered animation
5. Use responsive grid classes: `grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
6. Style heading and text using theme tokens for colors
7. Add appropriate margins and spacing (mt-16 or similar to match other sections)
8. Ensure the quote is properly formatted (maybe with quotation marks)
9. Add comments explaining the component's behavior
10. Export the component

## Acceptance Criteria

- [ ] `src/components/testimonials/TestimonialsSection.tsx` file exists
- [ ] Component imports and uses the testimonials data
- [ ] Component returns null when testimonials array is empty
- [ ] Component renders a heading and testimonial cards when data is present
- [ ] Component uses responsive grid layout
- [ ] Component includes Framer Motion animations for entrance and staggered card display
- [ ] Component respects `prefers-reduced-motion`
- [ ] Component follows accessibility best practices
- [ ] No lint or TypeScript errors
- [ ] Component can be imported and used without errors

## Testing Requirements

- Run `npm run typecheck` to verify no TypeScript errors
- Run `npm run lint` to verify no linting errors
- Verify the section hides when testimonials array is empty
- Verify the section shows when testimonials array has items (can test with temporary placeholder data in development, but ensure such data is not committed if fabricated)

## Security / Privacy Considerations

- No additional considerations beyond those in the data model and card component
- The section does not introduce new privacy risks

## Performance / Accessibility Considerations

- Efficient rendering: only maps over testimonials array
- Animations are optimized with Framer Motion
- Lazy loading not needed for this section (small content)
- Proper semantic heading structure

## Definition of Done

- The testimonials section component correctly displays testimonials when available and hides when empty
- All acceptance criteria are met
- The component follows established patterns and is ready for integration

## Related Requirements

- PRD §25: Testimonials / Social Proof
- ROADMAP Milestone 12: Render testimonial cards, hide section if no testimonials