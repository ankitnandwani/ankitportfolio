# M06.07 — Add animations for expand/collapse using Framer Motion

## Objective

Enhance the company card expand/collapse interaction with smooth animations using Framer Motion, the approved animation library for the project.

## Context

The company card component currently may use basic CSS transitions for expanding and collapsing the details section. To align with the project's animation standards and provide a polished user experience, we should use Framer Motion for these animations.

## Requirements

- Modify the `CompanyCard` component (src/components/careerTimeline/CompanyCard.tsx) to use Framer Motion's `AnimatePresence` and `motion` components for animating the expand/collapse of the details section
- Ensure the animation respects reduced motion preferences (using `useReducedMotion` hook if available, or respecting the `prefers-reduced-motion` media query)
- The animation should smoothly animate the height (or use opacity and scale) of the details section when expanding and collapsing
- Maintain the existing accessibility features (ARIA attributes, keyboard operability) and ensure they work with the animated elements
- Do not animate any other parts of the card unless it enhances the experience (e.g., subtle fade-in of content)
- Follow the existing usage of Framer Motion in the repository (e.g., as seen in Hero, ProfessionalSection, or design system components)

## Scope

### In scope
- Integration of Framer Motion for expand/collapse animation in CompanyCard
- Animation of the details section (height fade or similar)
- Respect for reduced motion preferences
- Maintenance of accessibility

### Out of scope
- Timeline container animations (unless related to card expansion)
- Page transition animations
- Other UI animations not related to the company card
- Changes to the data model or data fetching
- Mobile layout adjustments (handled in M06.06)

## Dependencies
- M06.03 – Create company card component (we are enhancing it)
- The project already has Framer Motion installed (as per PRD and existing usage)

## Files / Areas Expected To Change
- src/components/careerTimeline/CompanyCard.tsx

## Implementation Guidance
1. Import necessary components from Framer Motion: `{ motion, AnimatePresence }` from 'framer-motion'
2. Wrap the details section in `AnimatePresence` to animate entering and exiting
3. Use `motion.div` (or `motion.section`) for the details container, defining initial, animate, and exit variants
   - Example: initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }
   - Note: Animating height to 'auto' is not directly possible with Framer Motion; we may need to use a different approach like animating maxHeight or using layout animation. Alternatively, we can use the `layout` attribute for automatic layout animations.
4. Consider using Framer Motion's `layout` and `transition` properties for smooth layout changes when the content changes size.
5. Ensure that the animation does not interfere with screen readers; animation should not hide content from assistive technologies.
6. Respect reduced motion: we can use the `useReducedMotion` hook from `@/src/design/motion` (if available) or directly use `window.matchMedia('(prefers-reduced-motion: reduce)')` to disable animations.
7. Test the animation in development and ensure it works smoothly.
8. Follow the existing code style and patterns for Framer Motion usage in the repository.

## Acceptance Criteria
- [ ] CompanyCard component uses Framer Motion for animating the expand/collapse of the details section
- [ ] Animation is smooth and visually appealing
- [ ] Animation respects reduced motion preferences (disabled when user prefers reduced motion)
- [ ] Accessibility features (ARIA, keyboard operability) remain functional
- [ ] No regression in the component's basic functionality (toggle still works)
- [ ] TypeScript compiles without errors
- [ ] Lint passes without new errors
- [ ] The animation works correctly when inspected in the browser

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Manual verification of animation in browser devtools
- [ ] Verify that reduced motion preference disables the animation

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves adding animations to a component

## Performance / Accessibility Considerations
- Consider performance of animation rendering (should be fine for a small component)
- Ensure animations do not cause accessibility issues (e.g., triggering seizures) – respecting reduced motion is key
- Animations should not distract from the content

## Definition of Done
- Company card expand/collapse animation implemented using Framer Motion
- Animation respects reduced motion preferences
- Accessibility maintained
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §13: Career Timeline - interactive timeline component (should have smooth interactions)
- PRD: "Animation library: Framer Motion / Motion" – use approved library