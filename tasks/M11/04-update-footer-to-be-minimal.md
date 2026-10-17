# M11.04 — Update footer to be minimal

## Objective

Update the footer component to be minimal, removing the extensive social links list and replacing it with a smaller set of essential links (if any) or just copyright information, in accordance with the PRD directive to use the dedicated Social Hub for the complete list of social links.

## Context

The PRD §93 states: "Minimal. [...] Do not put every social network in the footer. Use the dedicated Social Hub for the complete list." The current footer (`src/components/footer/Footer.tsx`) includes a SocialLinks component that displays five social links. After implementing the Social Hub section on the homepage, the footer should be simplified to avoid duplication and maintain a clean design.

## Requirements

- Edit `src/components/footer/Footer.tsx` to remove or minimize the social links display.
- Options for minimal footer:
  a) Remove the SocialLinks component entirely, leaving only copyright.
  b) Show only one or two essential links (e.g., LinkedIn and GitHub) as text links or small icons.
  c) Keep the SocialLinks component but limit it to a subset (e.g., only LinkedIn and GitHub).
- Follow the existing footer styling and layout patterns.
- Ensure the footer remains responsive and accessible.
- Do not remove the copyright section.
- Update any related imports or utility functions if needed.
- Ensure the footer continues to build and run without errors.

## Scope

### In scope
- Modifying `src/components/footer/Footer.tsx` to reduce social links display.
- Adjusting the footer layout accordingly (spacing, alignment).
- Updating imports if the SocialLinks component is no longer needed (or keeping it for a subset).

### Out of scope
- Creating the SocialHub component (handled in M11.02).
- Integrating SocialHub into homepage (handled in M11.03).
- Updating social links configuration (handled in M11.01).
- Changing the footer's visual design beyond minimizing social links (e.g., changing background color, typography) unless necessary for minimalism.

## Dependencies
- M11.03: Integrate SocialHub component into homepage (should be completed first to ensure the Social Hub exists).
- Existing footer component.

## Files / Areas Expected To Change
- `src/components/footer/Footer.tsx` – to be updated.
- Possibly `src/components/footer/socialLinks.tsx` if we decide to keep it for a subset (but we may leave it unchanged and just use fewer links by filtering in Footer.tsx).

## Implementation Guidance
1. Open `src/components/footer/Footer.tsx`.
2. Examine the current JSX:
   ```typescript
   <div className="flex flex-wrap items-center gap-4">
     <SocialLinks className="space-x-4" />
   </div>
   ```
3. Decide on the minimal approach. Based on the PRD and common practice, a minimal footer might only show the copyright, or perhaps a small "Follow me" with two icons.
4. To be safe, we can keep the SocialLinks component but pass a filtered list of links (e.g., only LinkedIn and GitHub). However, that would require modifying the socialLinks data or creating a filtered copy. Simpler: replace the SocialLinks component with just two icon links manually, or remove it entirely.
5. Let's choose to remove the SocialLinks component entirely and keep only the copyright, as the PRD says "Do not put every social network in the footer" and we now have a dedicated Social Hub. This keeps the footer truly minimal.
6. Remove the `<SocialLinks className="space-x-4" />` line and the surrounding `<div>` if it becomes empty. Ensure the footer layout still looks good.
7. Adjust the flexbox layout to center the copyright if needed.
8. Save the file and verify the footer still loads correctly.

## Acceptance Criteria
- [ ] The footer no longer displays the extensive social links list (i.e., the SocialLinks component is removed or minimized).
- [ ] The footer still displays the copyright section.
- [ ] The footer layout remains intact and responsive.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.
- [ ] The footer builds successfully for production.

## Testing Requirements
- [ ] Manual verification: visit any page and confirm the footer is visible and minimal.
- [ ] Check that the footer does not contain the five social icons (LinkedIn, GitHub, X, Medium, Instagram) unless intentionally kept as a subset.
- [ ] Verify responsive behavior: resize viewport to see footer changes.
- [ ] Run `npm run typecheck` to check TypeScript correctness.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Run `npm run build` to ensure the footer builds correctly.

## Security / Privacy Considerations
- No direct security or privacy implications.

## Performance / Accessibility Considerations
- The footer should remain accessible (copyright text is readable).
- No performance impact from removing links.

## Definition of Done
- The footer is updated to be minimal, in line with the PRD guidance.
- The task is ready for the next task (M11.05) to depend on it.

## Related Requirements
- PRD §93: Footer — Minimal; use dedicated Social Hub for complete list.
- ROADMAP Milestone 11: Social Hub — Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.