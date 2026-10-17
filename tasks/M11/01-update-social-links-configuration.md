# M11.01 — Update social links configuration

## Objective

Update the social links configuration in `src/data/socialLinks.ts` to include all desired platforms mentioned in the PRD (LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume). Use placeholder values that must be verified against actual accounts before launch, following the same pattern as other data files (e.g., educationData).

## Context

The social links configuration serves as the single source of truth for social links used throughout the application. Currently, it only contains five platforms. The PRD specifies a more comprehensive list for the Social Hub. This task updates the configuration to include all relevant platforms, preparing for the Social Hub component.

## Requirements

- Edit `src/data/socialLinks.ts` to include entries for all platforms: LinkedIn, GitHub, X (Twitter), Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.
- For each entry, include fields: `platform`, `url`, `label`, `icon`.
- Use placeholder URLs that follow the format `https://placeholder.com/{platform}` or similar, clearly marked as needing verification.
- Add a TODO comment or warning note indicating that URLs must be verified against actual accounts before launch.
- Follow the same code style and commenting patterns as other data files (e.g., educationData.ts).
- Ensure the exported `socialLinks` array is sorted logically (e.g., alphabetically or by priority).
- Do not invent professional information; all URLs must be placeholders that will be replaced with real values by the owner.

## Scope

### In scope
- Updating `src/data/socialLinks.ts` with placeholder entries for all desired platforms.
- Adding verification warnings and documentation.

### Out of scope
- Creating the SocialHub component (handled in M11.02).
- Verifying actual URLs (to be done by owner before launch).
- Implementing icon mappings for new platforms (handled in M11.02).

## Dependencies

- None (foundational data update).

## Files / Areas Expected To Change
- `src/data/socialLinks.ts` – to be updated.

## Implementation Guidance
1. Open `src/data/socialLinks.ts`.
2. Review the existing structure and commenting style.
3. Replace the existing array with an expanded array containing all platforms.
4. For each platform, choose an appropriate icon name that maps to a react-icon component (to be handled in the SocialHub component).
5. Use placeholder URLs like `https://www.linkedin.com/in/TO_BE_VERIFIED` or `https://github.com/TO_BE_VERIFIED`, making it clear they need verification.
6. Add a file-level comment warning that values are placeholders and must be verified.
7. Ensure TypeScript types are correct (if any exist; otherwise, rely on implicit typing).
8. Run `npm run typecheck` to ensure no TypeScript errors.

## Acceptance Criteria
- [ ] `src/data/socialLinks.ts` contains entries for all 13 platforms.
- [ ] Each entry has `platform`, `url`, `label`, `icon` fields.
- [ ] URLs are clearly placeholders (e.g., contain "TO_BE_VERIFIED" or similar).
- [ ] File includes a warning comment about verifying URLs before launch.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.
- [ ] The existing social links (LinkedIn, GitHub, X, Medium, Instagram) are preserved with updated placeholder URLs if needed.

## Testing Requirements
- [ ] Manual verification: inspect the file to ensure all platforms are present.
- [ ] Run `npm run typecheck` to check TypeScript correctness.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Verify that the existing import of `socialLinks` in `src/components/footer/socialLinks.tsx` still works (no breaking changes).

## Security / Privacy Considerations
- No direct security or privacy implications; only placeholder URLs.

## Performance / Accessibility Considerations
- No performance impact.

## Definition of Done
- The social links configuration is updated with placeholder entries for all desired platforms.
- The task is ready for the next task (M11.02) to depend on it.

## Related Requirements
- PRD §21: Social Hub — Create one elegant social section rather than placing 15 icons in the footer.
- ROADMAP Milestone 11: Social Hub — Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.