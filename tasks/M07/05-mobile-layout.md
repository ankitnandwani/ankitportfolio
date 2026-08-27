# M07.05 — Implement mobile layout adaptation

## Objective

Ensure the `AchievementsSection` and `AchievementCard` components adapt gracefully to mobile and tablet screen sizes, ensuring optimal readability, proper spacing, and no horizontal overflow.

## Context

On narrow screens (smartphones, small tablets), multi-column grids must collapse into a clean single-column stack. Text must wrap properly, badge pills must wrap naturally, and card padding must be scaled appropriately to ensure sufficient content area without cramping.

## Requirements

- Adjust `AchievementsSection` grid: single column on mobile (`grid-cols-1`), scaling to 2 columns on tablet (`md:grid-cols-2`) and 2 or 3 columns on desktop (`lg:grid-cols-2` or `lg:grid-cols-3`)
- Optimize `AchievementCard` padding: `p-4 sm:p-5 md:p-6`
- Ensure technology badge lists wrap neatly (`flex-wrap gap-1.5 sm:gap-2`)
- Ensure all text has word-breaking (`break-words`) to prevent horizontal overflow on long technical terms or URLs
- Verify no horizontal scrollbar occurs on 320px, 375px, and 414px viewports

## Scope

### In scope
- Responsive classes on `AchievementsSection` and `AchievementCard`
- Spacing and typography adjustments for mobile viewports
- Testing across mobile breakpoints (`sm`, `md`, `lg`)

### Out of scope
- Desktop animations (handled in M07.06)
- Accessibility labeling (handled in M07.07)
- Homepage integration (handled in M07.08)

## Dependencies
- M07.03 – Create achievement card component
- M07.04 – Create achievements section container

## Files / Areas Expected To Change
- `src/components/achievements/AchievementsSection.tsx`
- `src/components/achievements/AchievementCard.tsx`

## Implementation Guidance
1. Inspect `AchievementCard` content across small viewports
2. Apply Tailwind responsive utility classes (`text-base sm:text-lg md:text-xl`, `p-4 sm:p-6`)
3. Ensure grid container uses `grid-cols-1 md:grid-cols-2 gap-6`
4. Test at 320px viewport width in dev tools

## Acceptance Criteria
- [ ] Section displays as a single column on mobile viewports
- [ ] No visual clipping or horizontal overflow on narrow screens (down to 320px width)
- [ ] Technology badges and text wrap naturally without overflowing card boundaries
- [ ] Desktop and tablet layouts remain visually appealing and structured
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- Layout changes only; no security impact.

## Performance / Accessibility Considerations
- Responsive CSS via Tailwind utility classes with zero runtime performance cost.

## Definition of Done
- Achievements section and cards are fully responsive across mobile, tablet, and desktop viewports.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §74: Performance and responsiveness targets
- PRD §116: Milestone 7 — Achievements
