# M07.07 — Ensure accessibility and keyboard navigation

## Objective

Ensure the `AchievementsSection` and `AchievementCard` components strictly comply with WCAG 2.2 AA accessibility guidelines.

## Context

According to PRD §71, the entire website must achieve WCAG 2.2 AA compliance. The Achievements section presents structured accomplishment data that must be fully comprehensible to screen reader users and navigable via keyboard.

## Requirements

- Provide accessible section landmark structure:
  * `<section aria-labelledby="achievements-section-heading">`
  * `<h2 id="achievements-section-heading">`
- Use semantic HTML list elements (`<ul role="list" className="grid..." aria-label="Key professional achievements">` and `<li>`) for the card collection
- Use semantic headings for card titles (`<h3>`) and sub-sections (`<h4>Problem & Context</h4>`, `<h4>Approach</h4>`, `<h4>Outcome</h4>`, `<h4>Technologies</h4>`)
- Mark technology lists with accessible lists (`<ul aria-label="Technologies used">` with `<li>` items)
- Ensure all text has sufficient color contrast against background/surface tokens (minimum 4.5:1 ratio for body text, 3:1 for large headings)
- Ensure any interactive elements have visible keyboard focus rings (`focus-visible:ring-2`)
- Ensure no focus traps or accessibility tree omissions

## Scope

### In scope
- Semantic markup and ARIA attributes for `AchievementsSection` and `AchievementCard`
- Color contrast verification
- Screen reader navigation auditing
- Heading hierarchy validation

### Out of scope
- Homepage integration (handled in M07.08)

## Dependencies
- M07.03 – Create achievement card component
- M07.04 – Create achievements section container
- M07.05 – Mobile layout adaptation
- M07.06 – Add animations

## Files / Areas Expected To Change
- `src/components/achievements/AchievementsSection.tsx`
- `src/components/achievements/AchievementCard.tsx`

## Implementation Guidance
1. Ensure `AchievementsSection` has `aria-labelledby="achievements-section-heading"`
2. Verify heading levels: Section is `<h2>`, Card title is `<h3>`, Card subsections are `<h4>`
3. Wrap cards list in an accessible `<ul role="list">` and `<li>` structure
4. Wrap technology badges in a semantic `<ul>` / `<li>` structure with `aria-label`
5. Test with keyboard navigation (Tab order) and screen reader emulator

## Acceptance Criteria
- [ ] Section has valid ARIA landmarks and heading hierarchy (`<h2>` → `<h3>` → `<h4>`)
- [ ] Achievement cards and technology badges use semantic list elements
- [ ] All text passes WCAG 2.2 AA contrast ratios
- [ ] Keyboard navigation is logical and free of focus traps
- [ ] TypeScript compiles cleanly without errors
- [ ] Lint passes without new errors

## Testing Requirements
- [ ] TypeScript typecheck passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual keyboard navigation audit

## Security / Privacy Considerations
- No security concerns.

## Performance / Accessibility Considerations
- Meets WCAG 2.2 AA guidelines (PRD §71).

## Definition of Done
- Achievements section is fully accessible per WCAG 2.2 AA standards.
- Task completed when all acceptance criteria are met and checks pass.

## Related Requirements
- PRD §71: Accessibility target WCAG 2.2 AA
- PRD §116: Milestone 7 — Achievements
