# M12.05 — Add animations and interactive states

## Objective

Add Framer Motion animations and interactive states (hover, focus) to the testimonials section and testimonial card components. This includes entrance animations for the section and cards, hover effects for cards, and focus states for keyboard accessibility. Animations should communicate arrival, transition, and relationship while respecting user preferences for reduced motion.

## Context

Following the design principles in PRD §65-66, animations should be meaningful and not distracting. The testimonial card and section should use the same animation patterns as other sections (e.g., AchievementsSection) to maintain consistency. This task focuses on enhancing the user experience with subtle, purposeful motion.

## Requirements

- Enhance `TestimonialCard` component (if needed) to include hover and focus states with appropriate scale transitions
- Enhance `TestimonialsSection` component to include entrance animation for the section container and staggered entrance for cards
- Ensure all animations respect the `prefers-reduced-motion` media query
- Use appropriate animation variants: initial, animate, whileHover, whileTap, whileFocus
- Maintain consistency with animation timing and easing used in other sections (e.g., AchievementsSection)
- Do not override or remove existing animation functionality; only enhance where needed
- Ensure interactive elements (if any, like profile links) have clear hover and focus states

## Scope

### In scope

- `src/components/testimonials/TestimonialCard.tsx`: animation enhancements
- `src/components/testimonials/TestimonialsSection.tsx`: animation enhancements

### Out of scope

- Creating new animation libraries or changing the animation approach
- Modifying non-testimonial components
- Adding animations that conflict with reduced motion preferences

## Dependencies

- M12.02: TestimonialCard component must exist
- M12.03: TestimonialsSection component must exist
- `framer-motion` library must be installed (it is, as used by other components)

## Files / Areas Expected To Change

- `src/components/testimonials/TestimonialCard.tsx`
- `src/components/testimonials/TestimonialsSection.tsx`

## Implementation Guidance

For TestimonialCard:
1. If not already present, add `useState` and `useEffect` to track `prefersReducedMotion`
2. Define animation variants:
   - `entranceVariant`: for initial appearance (e.g., { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } })
   - `hoverVariant`: scale to 1.02 on hover, 0.98 on tap
   - `focusVariant`: scale to 1.02 on focus
3. Apply these variants to the motion wrapper using the `initial`, `animate`, `whileHover`, `whileTap`, `whileFocus` props
4. Condition variants on `prefersReducedMotion` being false (if true, use `undefined` to disable animations)

For TestimonialsSection:
1. Ensure `prefersReducedMotion` state is set up (if not already)
2. Define section entrance variant (similar to AchievementsSection: hidden -> show with opacity and stagger)
3. Define card entrance variant (similar to AchievementsSection item variants)
4. Apply variants to the motion wrappers:
   - Section container: initial and animate props
   - Card wrappers: initial and animate props with stagger via `transition` on the container
5. Use the same staggerChildren and delayChildren values as in AchievementsSection for consistency
6. Ensure all animation props are set to `undefined` when `prefersReducedMotion` is true

## Acceptance Criteria

- [ ] Both testimonial card and section components have entrance animations
- [ ] Testimonial cards have hover and focus visual feedback (scale change)
- [ ] All animations are disabled when `prefers-reduced-motion: reduce` is active
- [ ] Animation timing and easing are consistent with other sections (e.g., AchievementsSection)
- [ ] No lint or TypeScript errors introduced
- [ ] Existing functionality remains intact

## Testing Requirements

- Run `npm run typecheck` to verify no TypeScript errors
- Run `npm run lint` to verify no linting errors
- Test in development:
  - Verify cards animate in when section appears
  - Verify hover and focus states produce visual feedback
  - Verify reducing motion via system preferences or disabling JavaScript turns off animations
  - Verify no console errors related to animations

## Security / Privacy Considerations

- No new considerations; animations do not introduce privacy risks

## Performance / Accessibility Considerations

- Animations should be lightweight and not cause layout thrashing
- Ensure animated elements do not trigger accessibility issues (e.g., motion sickness)
- Respect for `prefers-reduced-motion` is critical for accessibility compliance
- Focus styles must be visible for keyboard navigation

## Definition of Done

- Animations are properly implemented in both components
- Interactive states provide visual feedback
- Animations respect user motion preferences
- All acceptance criteria are met

## Related Requirements

- PRD §65: Motion System
- PRD §66: Reduced Motion
- PRD §71: Accessibility (WCAG 2.2 AA)