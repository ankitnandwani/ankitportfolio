# M11.05 — Ensure SocialHub accessibility and responsiveness

## Objective

Ensure the SocialHub component is fully accessible (WCAG 2.2 AA) and responsive across different screen sizes. This task focuses on refining the SocialHub component created in M11.02 to meet accessibility guidelines and adapt gracefully to mobile, tablet, and desktop viewports.

## Context

The SocialHub component should be usable by everyone, including those relying on screen readers, keyboard navigation, and those with reduced motion preferences. It should also layout appropriately on various devices: a grid on desktop, possibly a vertical stack or horizontal scroll on mobile. This task does not change the core functionality but refines the implementation for accessibility and responsiveness.

## Requirements

- Review and update the SocialHub component (`src/components/socialHub/SocialHub.tsx`) to ensure:
  a) Each social link card is accessible via keyboard (tab focus) and has a clear focus indicator.
  b) Icons are hidden from screen readers (`aria-hidden="true"`) if the label is visible and descriptive.
  c) Each card (or its inner link) has an appropriate `aria-label` that describes the destination (e.g., "LinkedIn: Visit Ankit's LinkedIn profile").
  d) The component respects `prefers-reduced-motion` media query; animations should be disabled or reduced when the user prefers reduced motion.
  e) The layout is responsive:
     - On large screens (desktop): display cards in a grid with multiple columns (e.g., 3-4 columns).
     - On medium screens (tablet): possibly 2 columns.
     - On small screens (mobile): display cards in a single column stack or a horizontally scrollable list if space is limited.
  f) Touch targets are at least 44x48 pixels (or follow accessibility guidelines).
  g) Color contrast between icon/button and background meets WCAG AA ratios.
  h) The component does not rely solely on color to convey information.
- Use existing utilities or patterns from the codebase for accessibility (e.g., sr-only classes if needed).
- Ensure the component does not break when socialLinks array is empty (graceful handling).
- Do not change the core data structure or external dependencies.

## Scope

### In scope
- Updating `src/components/socialHub/SocialHub.tsx` for accessibility and responsiveness.
- Adding responsive classes (Tailwind) to adjust grid layout.
- Adding focus styles and keyboard navigation support.
- Implementing reduced motion respect.
- Ensuring adequate touch targets and color contrast.

### Out of scope
- Creating the SocialHub component (done in M11.02).
- Updating social links configuration (done in M11.01).
- Integrating into homepage (done in M11.03).
- Updating footer (done in M11.04).
- Adding animations beyond basic hover/focus (done in M11.06).

## Dependencies
- M11.02: Create SocialHub component (must be completed first).
- Existing Tailwind CSS configuration.
- Framer Motion for animations (if used).

## Files / Areas Expected To Change
- `src/components/socialHub/SocialHub.tsx` – to be updated.

## Implementation Guidance
1. Open `src/components/socialHub/SocialHub.tsx`.
2. Assess the current implementation for accessibility gaps.
3. Ensure each social link is wrapped in an `<a>` tag (or the Card itself is a link) with:
   - `href` set to the social link URL.
   - `target="_blank"` and `rel="noopener noreferrer"` for external links.
   - `aria-label` that includes the platform label and a description (e.g., `Visit Ankit's ${link.label} profile`).
   - `tabIndex={0}` if not naturally focusable.
   - Remove `aria-hidden` from the link itself; keep it on the icon if the label is present.
4. Add focus visible styles: use Tailwind's `focus-visible` classes or CSS to show a clear outline when focused.
5. For responsiveness, adjust the grid template columns:
   - Use classes like `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` or similar.
   - Alternatively, use a responsive breakpoint approach with Tailwind.
6. For reduced motion, use Framer Motion's `variants` or the `useReducedMotion` hook if available, or conditionally disable animations based on `matchMedia('(prefers-reduced-motion: reduce)')`.
7. Ensure touch targets are large enough: the Card component already has padding; verify that the overall clickable area is sufficient.
8. Check color contrast: the icon color (likely `text-muted-foreground` or `text-primary`) against the card background (`bg-background`) should meet contrast ratios. If not, adjust colors.
9. Add a fallback message if `socialLinks.length === 0` (e.g., "Social links coming soon").
10. Save the file and verify the component still works.

## Acceptance Criteria
- [ ] The SocialHub component is navigable via keyboard (Tab key moves focus to each card).
- [ ] Each card has a clear focus indicator (visible outline or ring).
- [ ] Icons are hidden from screen readers (`aria-hidden="true"`).
- [ ] Each link has an appropriate `aria-label` describing the destination.
- [ ] The component respects `prefers-reduced-motion` (animations are disabled or reduced).
- [ ] The layout is responsive: grid columns change appropriately at breakpoints.
- [ ] Touch targets are at least 44x48 pixels (or follow accessibility best practices).
- [ ] Color contrast between interactive elements and background meets WCAG AA.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.
- [ ] The component handles an empty socialLinks array gracefully.

## Testing Requirements
- [ ] Manual verification: use Tab key to navigate to each social link card; verify focus indicator is visible.
- [ ] Use a screen reader (or simulate) to verify that icons are not announced but labels are.
- [ ] Check that `aria-label` is present and descriptive.
- [ ] Test responsiveness: resize browser to see layout changes (mobile, tablet, desktop).
- [ ] Simulate reduced motion preference (via dev tools) and verify animations are disabled.
- [ ] Run `npm run typecheck` to check TypeScript correctness.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Run `npm run build` to ensure the component builds correctly.

## Security / Privacy Considerations
- No direct security or privacy implications.

## Performance / Accessibility Considerations
- The component should not introduce significant performance overhead.
- Accessibility enhancements should not negatively impact performance.

## Definition of Done
- The SocialHub component is fully accessible and responsive.
- The task is ready for the next task (M11.06) to depend on it.

## Related Requirements
- PRD §71: Accessibility target — WCAG 2.2 AA.
- PRD §70: Mobile experience — vertical storytelling, compact navigation.
- PRD §66: Reduced motion — respect `prefers-reduced-motion`.
- ROADMAP Milestone 11: Social Hub — Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.