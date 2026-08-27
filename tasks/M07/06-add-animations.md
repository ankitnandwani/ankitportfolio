# M07.06 — Add animations using Framer Motion

## Objective

Incorporate tasteful entrance and hover animations for achievement cards using Framer Motion while strictly respecting reduced-motion preferences.

## Context

According to PRD §50, animations should provide a subtle, premium feel without compromising performance or causing motion sickness. We will use Framer Motion presets and honor the `prefers-reduced-motion` media query.

## Requirements

- Use Framer Motion (`motion.div`, `AnimatePresence`) for entrance transitions of achievement cards
- Implement a subtle staggered card entrance or fade-in-up animation
- Implement subtle card hover elevation/scale interaction
- Include `prefers-reduced-motion` detection so animations are disabled or duration is set to 0 when reduced motion is preferred
- Ensure animations do not cause layout shifts (CLS < 0.1)

## Scope

### In scope
- Framer Motion animation integration on `AchievementsSection` and `AchievementCard`
- Reduced-motion support hook or check
- Hover states and entrance transitions

### Out of scope
- Changing card content or data
- Accessibility markup beyond motion preferences (handled in M07.07)
- Homepage integration (handled in M07.08)

## Dependencies
- M07.04 – Create achievements section container
- M07.05 – Implement mobile layout adaptation

## Files / Areas Expected To Change
- `src/components/achievements/AchievementsSection.tsx`
- `src/components/achievements/AchievementCard.tsx`

## Implementation Guidance
1. Import `motion` from `framer-motion`
2. Check `window.matchMedia('(prefers-reduced-motion: reduce)')`
3. Wrap cards with `motion.div` with subtle initial opacity / slight Y offset and transition duration (~0.3s)
4. Add hover elevation or slight scale (`scale: 1.01` or `y: -2`)
5. Verify smooth 60fps performance without jank

## Acceptance Criteria
- [ ] Cards animate smoothly on initial viewport render
- [ ] Hover states provide visual feedback
- [ ] `prefers-reduced-motion` is detected and respected (instant render without motion)
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
- PRD §116: Milestone 7 — Achievements
