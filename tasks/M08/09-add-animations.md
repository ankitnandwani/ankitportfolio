# M08.09 — Add animations using Framer Motion

## Objective

Incorporate tasteful entrance and hover animations for project cards using Framer Motion while strictly respecting reduced-motion preferences.

## Context

According to PRD §50, animations should provide a subtle, premium feel without comprometing performance or causing motion sickness. We will use Framer Motion presets and honor the `prefers-reduced-motion` media query.

## Requirements

- Use Framer Motion (`motion.div`, `AnimatePresence`) for entrance transitions of project cards
- Implement a subtle staggered card entrance or fade-in-up animation
- Implement subtle card hover elevation/scale interaction
- Include `prefers-reduced-motion` detection so animations are disabled or duration is set to 0 when reduced motion is preferred
- Ensure animations do not cause layout shifts (CLS < 0.1)
- Apply similar animation principles to the FilterBar (optional subtle entrance)
- Ensure project page transitions (if any) are smooth

## Scope

### In scope
- Framer Motion animation integration on `ProjectList` and `ProjectCard`
- Reduced-motion support hook or check
- Hover states and entrance transitions
- Optional: subtle animations for FilterBar buttons

### Out of scope
- Changing project card content or data
- Accessibility markup beyond motion preferences (handled in M08.10)
- Complex page transition animations (can be enhanced later)

## Dependencies
- M08.04 – Create project list component
- M08.05 – Create project index page
- M08.06 – Create project detail page
- M08.07 – Implement filtering and categories
- M08.08 – Implement mobile layout adaptation

## Files / Areas Expected To Change
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/ProjectList.tsx`
- `src/components/projects/FilterBar.tsx`
- `app/projects/page.tsx`
- `app/projects/[slug]/page.tsx`

## Implementation Guidance
1. Import `motion` from `framer-motion`
2. Check `window.matchMedia('(prefers-reduced-motion: reduce)')` via a hook or utility
3. In `ProjectList`, wrap the grid or individual cards with `motion.div` for staggered entrance (e.g., initial={{ opacity: 0, y: 20 }}, animate={{ opacity: 1, y: 0 }}, transition={{ duration: 0.3, delay: index * 0.05 }})
4. In `ProjectCard`, add hover scale or elevation using `whileTap` or `hover` props from Framer Motion
5. For `FilterBar`, consider subtle button press animations
6. Verify smooth 60fps performance without jank
7. Ensure no layout shifts by avoiding animating properties that trigger reflows (prefer opacity and transform)

## Acceptance Criteria
- [ ] Project cards animate smoothly on initial viewport render (staggered or simultaneous)
- [ ] Hover states provide visual feedback (scale or elevation change)
- [ ] `prefers-reduced-motion` is detected and respected (instant render without motion)
- [ ] FilterBar buttons have subtle press animation (optional)
- [ ] No animation layout shift or content flickering
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- No security implications.

## Performance / Accessibility Considerations
- Meets WCAG 2.2 AA guideline 2.3.3 (Animation from Interactions) by respecting reduced-motion preferences.

## Definition of Done
- Framer Motion animations implemented with full reduced-motion support.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §50: Animation & Motion
- PRD §117: Milestone 8 — Projects