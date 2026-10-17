# M11.06 — Add animations and final polishing

## Objective

Add final animations, visual refinements, and polishing to the Social Hub implementation to ensure it feels cohesive with the rest of the site, follows the design system's motion language, and provides a pleasant user experience. This task builds upon the accessible and responsive SocialHub component to add subtle animations and ensure visual consistency.

## Context

The SocialHub component should feel integrated into the site's overall design, using the same animation principles as other components (e.g., Framer Motion for entrance animations, hover effects, and tap feedback). Polishing includes ensuring consistent spacing, alignment, and visual hierarchy with other homepage sections.

## Requirements

- Enhance the SocialHub component with entrance animations (e.g., fade-in or slide-up) as cards appear in the viewport.
- Refine hover and tap animations to feel consistent with other interactive elements on the site (e.g., using the same scale values or motion patterns).
- Ensure the component uses the same elevation and radius tokens as other cards for visual consistency.
- Add subtle styling refinements: maybe a slight border, shadow, or background variation to make cards stand out.
- Ensure the section heading (if present) follows the same typography and styling as other section headings on the homepage.
- Check that the Social Hub section aligns with the homepage's overall vertical rhythm and spacing.
- Do not introduce animations that hinder accessibility or performance; respect `prefers-reduced-motion`.
- Run a final visual review to ensure the Social Hub looks intentional and polished.

## Scope

### In scope
- Adding entrance animations to the SocialHub component (e.g., using Framer Motion's `motion.div` with `initial`, `whileInView`, or `animatePresence`).
- Refining hover/tap animations for consistency.
- Making minor styling adjustments (spacing, borders, shadows) for visual polish.
- Ensuring the section heading matches the site's heading style.
- Verifying alignment with homepage vertical rhythm.

### Out of scope
- Changing the core layout or responsive behavior (done in M11.05).
- Adding new social links or changing configuration (done in M11.01).
- Creating the component structure (done in M11.02).
- Accessibility fixes (done in M11.05).
- Footer modifications (done in M11.04).

## Dependencies
- M11.05: Ensure SocialHub accessibility and responsiveness (must be completed first).
- Existing Framer Motion setup.
- Existing design tokens for elevation, radius, etc.

## Files / Areas Expected To Change
- `src/components/socialHub/SocialHub.tsx` – to be updated with animations and polishing.
- Possibly the section heading styling if we adjust the heading component (unlikely).

## Implementation Guidance
1. Open `src/components/socialHub/SocialHub.tsx`.
2. If not already using Framer Motion for entrance animations, wrap the grid or each card in a motion component that animates on entry.
   - Example: use `motion.div` for the container with `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}`.
   - Alternatively, use `whileInView` if using the `framer-motion` viewport package.
3. Ensure entrance animations respect `prefers-reduced-motion` (disable or reduce motion when preferred).
4. Refine hover and tap animations: check the current scale values (if any) and adjust to match other components (e.g., hover scale 1.03, tap scale 0.98).
5. Consider adding a subtle border to cards: `border` class with `border-border/20` or similar.
6. Ensure the card background uses the correct token (`bg-background` or `bg-surface`) for consistency.
7. Check the section heading: if we added a heading in M11.03, verify it uses the same font size, weight, and spacing as other section headings (e.g., using the same classes as ProfessionalSection or AchievementsSection).
8. Verify vertical spacing: the Social Hub section should have consistent `mt-16` or similar margins like other sections.
9. Save the file and verify the component animates smoothly.

## Acceptance Criteria
- [ ] The SocialHub component includes entrance animations (fade-in or slide-up) as it enters the viewport.
- [ ] Entrance animations respect `prefers-reduced-motion` (disabled or reduced when preferred).
- [ ] Hover and tap animations are consistent with other interactive elements on the site.
- [ ] The component uses consistent elevation and radius tokens as other cards.
- [ ] Minor styling refinements are applied (e.g., borders, shadows, spacing) for visual polish.
- [ ] The section heading (if present) matches the site's heading typography and style.
- [ ] The Social Hub section aligns with the homepage's overall vertical rhythm.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.
- [ ] The component builds successfully for production.

## Testing Requirements
- [ ] Manual verification: visit the homepage and observe the Social Hub section animating in as you scroll (if using entrance animations on scroll).
- [ ] Alternatively, verify that animations occur when the component mounts (if using mount animations).
- [ ] Check hover and tap animations feel smooth and consistent.
- [ ] Simulate reduced motion preference and verify animations are disabled or minimized.
- [ ] Run `npm run typecheck` to check TypeScript correctness.
- [ ] Run `npm run lint` to check for linting errors.
- [ ] Run `npm run build` to ensure the component builds correctly.
- [ ] Run `npm run dev` to verify the homepage loads in development mode.

## Security / Privacy Considerations
- No direct security or privacy implications.

## Performance / Accessibility Considerations
- Entrance animations should not cause significant layout shifts or performance degradation.
- Animations should be lightweight and respect user preferences.

## Definition of Done
- The SocialHub component is fully animated, polished, and visually consistent with the site.
- The task marks the completion of Milestone M11 – Social Hub.

## Related Requirements
- PRD §21: Social Hub — Create one elegant social section rather than placing 15 icons in the footer.
- PRD §65: Motion System — animations should communicate arrival, transition, depth, relationship, feedback.
- PRD §66: Reduced Motion — respect `prefers-reduced-motion`.
- ROADMAP Milestone 11: Social Hub — Social cards for LinkedIn, GitHub, X, Medium, Stack Overflow, Telegram, Discord, Instagram, Quora, Facebook, LeetCode, Codewars, Resume.