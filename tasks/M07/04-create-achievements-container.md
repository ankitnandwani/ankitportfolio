# M07.04 — Create achievements section container

## Objective

Build the `AchievementsSection` container component that manages layout, renders the section heading, and lays out achievement cards in a responsive grid.

## Context

According to PRD §9 and §116, the Selected Impact / Achievements section is an essential part of the recruiter journey, presenting concrete engineering outcomes. The container component coordinates the display of multiple achievement cards.

## Requirements

- Create `AchievementsSection` component in `src/components/achievements/AchievementsSection.tsx`
- Render section heading (e.g. "Selected Impact" or "Key Achievements") with supportive subtitle
- Render a grid of `AchievementCard` components sourced from `@/src/data/achievements`
- Accept optional props:
  * `className?: string`
  * `data?: AchievementsData` (for testing or customization)
  * `limit?: number` (optional limit to showcase top/featured achievements)
- Support light and dark themes using tokens from `useTheme()`
- Export from `src/components/achievements/index.ts`

## Scope

### In scope
- Container section layout and header
- Grid mapping of achievement cards
- Props interface and defaults

### Out of scope
- Individual card internal styling (handled in M07.03)
- Mobile-specific responsive refinement (handled in M07.05)
- Entrance animations (handled in M07.06)
- Accessibility polish (handled in M07.07)
- Homepage integration (handled in M07.08)

## Dependencies
- M07.02 – Populate achievements data
- M07.03 – Create achievement card component

## Files / Areas Expected To Change
- `src/components/achievements/AchievementsSection.tsx` (new file)
- `src/components/achievements/index.ts`

## Implementation Guidance
1. Create `src/components/achievements/AchievementsSection.tsx`
2. Import `achievementsData`, `AchievementsData` from `@/src/data/achievements`
3. Import `AchievementCard` from `./AchievementCard`
4. Layout the section with a max-width container, header title & subtitle, and grid container (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)
5. Update `src/components/achievements/index.ts` to export `AchievementsSection`

## Acceptance Criteria
- [ ] `AchievementsSection` component renders section header and list/grid of achievement cards
- [ ] Accepts optional `data`, `limit`, and `className` props
- [ ] Works cleanly in light and dark themes
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- No security concerns; uses static data.

## Performance / Accessibility Considerations
- Efficient grid layout with responsive breakpoints.

## Definition of Done
- `AchievementsSection` container component created and exported.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §9: Homepage Selected Impact section
- PRD §116: Milestone 7 — Achievements
