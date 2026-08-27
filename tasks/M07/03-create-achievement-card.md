# M07.03 — Create achievement card component

## Objective

Build the visual `AchievementCard` component displaying an achievement's domain, title, company, problem, responsibility, approach, technology tags, and outcome with a clear visual hierarchy.

## Context

According to PRD §12 and §116, achievements should be presented as cards rather than generic bullet points. The card must clearly differentiate the context (domain/company), the core accomplishment (title & responsibility), the technical methodology (problem & approach), and the results (outcome) with prominent technology badges.

## Requirements

- Create `AchievementCard` in `src/components/achievements/AchievementCard.tsx`
- Utilize the design system `Card` component from `@/src/components/ui/Card`
- Implement clear visual sections inside the card:
  * Domain badge (e.g. "BACKEND QUALITY" in accent/primary color) and Company badge/name
  * Prominent accomplishment title (heading level 3 or 4)
  * Summary/Responsibility statement
  * Structured details for Problem, Approach, and Outcome with clear labels/hierarchy
  * Technology tags rendered as styled badges/pills
- Support light and dark theme using tokens from `useTheme()`
- Follow NeoPOP design tokens for borders, elevation, typography, and colors
- Export component through barrel index `src/components/achievements/index.ts`

## Scope

### In scope
- Component implementation of `AchievementCard`
- Typography and visual styling following NeoPOP tokens
- Displaying all fields from the `Achievement` interface
- Technology badge styling

### Out of scope
- Grid container layout (handled in M07.04)
- Complex motion/animations (handled in M07.06)
- Mobile-specific responsive refactoring (handled in M07.05)
- Homepage integration (handled in M07.08)

## Dependencies
- M07.01 – Define achievements data model (needs `Achievement` interface)

## Files / Areas Expected To Change
- `src/components/achievements/AchievementCard.tsx` (new file)
- `src/components/achievements/index.ts` (new file)

## Implementation Guidance
1. Create `src/components/achievements/AchievementCard.tsx`
2. Accept `achievement: Achievement` prop and optional `className`
3. Use `useTheme()` to retrieve design tokens
4. Style the card with `Card elevation="md"` and NeoPOP border accents
5. Layout the card content logically:
   - Header with domain and company
   - Title
   - Responsibility overview
   - Problem / Approach / Outcome sub-blocks
   - Tech tags at the bottom
6. Create `src/components/achievements/index.ts` exporting `AchievementCard`

## Acceptance Criteria
- [ ] `AchievementCard` component renders title, domain, company, responsibility, problem, approach, outcome, and tech tags
- [ ] Uses design tokens and NeoPOP-inspired card styling
- [ ] Theme switching (light/dark mode) works seamlessly
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

## Security / Privacy Considerations
- Component only renders structured data; no dangerous HTML or unescaped strings.

## Performance / Accessibility Considerations
- Semantic HTML tags, clear visual contrast, and clean React rendering without redundant state.

## Definition of Done
- `AchievementCard` component created, styled, and exported.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §12: Impact / Achievements card structure
- PRD §116: Milestone 7 — Achievements
