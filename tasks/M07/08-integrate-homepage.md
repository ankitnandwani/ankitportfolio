# M07.08 — Integrate achievements section into homepage

## Objective

Integrate the `AchievementsSection` component into `app/page.tsx` in accordance with the PRD homepage information architecture.

## Context

According to PRD §9 (Homepage structure), the sequence is:
```text
Hero
 ↓
Professional Snapshot
 ↓
Selected Impact (Achievements)
 ↓
Career Journey (Career Timeline)
...
```
We will import `AchievementsSection` into `app/page.tsx` and place it after `ProfessionalSection` and before `CareerTimeline`.

## Requirements

- Import `AchievementsSection` from `@/src/components/achievements` in `app/page.tsx`
- Render `<AchievementsSection className="mt-16" />` between `<ProfessionalSection />` and `<CareerTimeline />` within `<ResponsiveContainer>`
- Maintain consistent spacing between sections
- Ensure the page compiles, renders, and passes production build checks

## Scope

### In scope
- Editing `app/page.tsx` to import and render `AchievementsSection`
- Spacing and container alignment

### Out of scope
- Modifying `AchievementsSection` or other section internals
- Modifying site navigation or metadata

## Dependencies
- M07.01 through M07.07 (all achievement components and data must be ready)

## Files / Areas Expected To Change
- `app/page.tsx`

## Implementation Guidance
1. Open `app/page.tsx`
2. Add `import { AchievementsSection } from '@/src/components/achievements';`
3. In the `<main>` JSX structure, insert `<AchievementsSection className="mt-16" />` between `<ProfessionalSection className="mt-12" />` and `<CareerTimeline className="mt-16" />`
4. Run typecheck, lint, and build to confirm clean integration

## Acceptance Criteria
- [ ] `app/page.tsx` imports and renders `AchievementsSection`
- [ ] Section is positioned between `ProfessionalSection` and `CareerTimeline`
- [ ] Layout spacing is clean and consistent
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors
- [ ] Next.js production build (`npm run build`) completes successfully

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Production build passes (`npm run build`)

## Security / Privacy Considerations
- No security concerns.

## Performance / Accessibility Considerations
- Section rendered within responsive container with no layout shifts.

## Definition of Done
- Achievements section is live on the homepage in its PRD-designated position.
- Milestone 7 complete once this task is executed.

## Related Requirements
- PRD §9: Homepage Selected Impact section
- PRD §116: Milestone 7 — Achievements
