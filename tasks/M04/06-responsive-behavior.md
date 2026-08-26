# M04.06 — Responsive behavior and reduced-motion support

## Objective
Ensure the Hero section adapts correctly to different screen sizes (mobile, tablet, desktop) and respects the user's reduced-motion preference for accessibility.

## Context
The Hero section must provide an optimal experience across all devices. On mobile, the layout may need to stack vertically, adjust spacing, and modify typographic scales. On desktop, we can maintain the intended asymmetric composition. Additionally, we must respect the user's prefers-reduced-media setting by disabling or minimizing animations.

## Requirements
- Implement responsive layout using Tailwind breakpoints (sm, md, lg, xl)
- On mobile (max-width: md): stack elements vertically, adjust spacing, possibly center-align text
- On desktop (min-width: lg): maintain the intended layout with potential side-by-side elements for CTAs or asymmetric composition
- Adjust typographic scales appropriately for different screen sizes (may use different font sizes from tokens)
- Ensure touch targets are appropriately sized for mobile (minimum 48x48px)
- Respect reduced-motion preference: detect via CSS @media (prefers-reduced-motion: reduce) or JS media query and disable or reduce animations accordingly
- Ensure that when reduced motion is preferred, animations are disabled or substituted with static states
- Test that the Hero section remains usable and readable at all breakpoints
- Use design system tokens for responsive values (breakpoints, spacing, typography) where applicable

## Scope

### In scope
- Responsive layout adjustments using Tailwind breakpoint prefixes
- Typography scaling for different screen sizes
- Spacing and layout adjustments for mobile vs desktop
- Touch target size considerations for mobile
- Reduced-motion detection and handling (CSS and/or JS)
- Ensuring animations are disabled or minimized when preferred
- Testing across multiple viewport sizes

### Out of scope
- Basic layout and typography (covered in M04.01)
- CTA button functionality (covered in M04.02 and M04.03)
- NeoPOP visual composition structure (covered in M04.04)
- Animations implementation (covered in M04.05)
- Complex layout changes that alter the fundamental structure
- Integration with actual technology data (still using placeholders)

## Dependencies
- M02.06 – Define breakpoint tokens and integrate with Tailwind
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M03.03 – Responsive container (for layout constraints, though we may not use it directly in Hero)
- M04.01 – Hero typography and basic layout
- M04.04 – NeoPOP visual composition
- M04.05 – Animations using Framer Motion

## Files / Areas Expected To Change
- `src/components/hero/Hero.tsx` (to add responsive classes and reduced-motion handling)
- May need to update `design/motion.ts` if we need to define reduced-motion animation variants
- May need to add utility classes or use Tailwind's responsive prefixes directly

## Implementation Guidance
1. Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:) to adjust styles at different breakpoints
2. For layout:
   - On mobile: use flex-col (column) to stack elements vertically
   - On desktop: may use flex-row for certain elements (e.g., primary CTAs side-by-side) or maintain flex-col with adjusted alignment
   - Consider using grid layout for more complex asymmetric composition on desktop
3. Adjust spacing: use smaller spacing values on mobile (e.g., mt-2 vs mt-6)
4. Adjust typography: use responsive font size classes (e.g., text-base md:text-lg) to scale text appropriately
5. For CTAs:
   - On mobile: make buttons full-width (w-full) with margin between them
   - On desktop: buttons can be size md or lg with appropriate spacing (space-x-4)
6. For secondary CTAs: similar responsiveness adjustments
7. For visual composition elements:
   - On mobile: may need to simplify or reduce the number of layered elements to avoid clutter
   - On desktop: can display the full asymmetric composition
   - Consider hiding certain decorative elements on mobile if they impede readability
8. Implement reduced-motion detection:
   - Option 1: Use CSS @media (prefers-reduced-motion: reduce) to override animation properties
   - Option 2: Use a React hook to detect JS media query and conditionally apply animation props
   - We can create a custom hook `useReducedMotion` that returns true if reduced motion is preferred
   - Then conditionally set animation props on motion.components (e.g., animate={reducedMotion ? undefined : animationVariant})
   - Alternatively, we can define two sets of animation variants: normal and reduced (where reduced has no animation or very subtle)
9. Ensure that when reduced motion is preferred, any floating tokens or hover animations are disabled or greatly reduced
10. Test using browser dev tools to simulate different devices and reduced-motion preference
11. Verify that the Hero section remains accessible and readable at all sizes
12. Ensure that the composition does not cause horizontal overflow on small screens

## Acceptance Criteria
- [ ] Hero section adapts correctly to mobile, tablet, and desktop screen sizes
- [ ] On mobile, elements stack vertically with appropriate spacing and touch target sizes
- [ ] On desktop, the intended layout and composition are preserved
- [ ] Typography scales appropriately across breakpoints
- [ ] Touch targets are at least 48x48px on mobile
- [ ] Reduced-motion preference is respected: animations are disabled or minimized when preferred
- [ ] When reduced motion is preferred, the Hero section remains usable and visually appealing
- [ ] No horizontal overflow or layout issues at any breakpoint
- [ ] Code follows existing patterns and style in the codebase

## Testing Requirements
- Manual testing using browser dev tools to simulate various devices (iPhone, iPad, desktop)
- Verify layout changes at each breakpoint
- Test touch target sizes using dev tools or manual inspection
- Test with reduced-motion preference enabled (can toggle in dev tools or system settings):
  - Animations should be disabled or greatly reduced
  - Verify that the Hero section still functions and looks appropriate
- Check for horizontal overflow at all sizes
- Verify accessibility using axe or similar tools at different breakpoints
- Test both light and dark modes at different sizes
- Verify that the composition remains engineered and premium across sizes

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only handles layout and presentation

## Performance / Accessibility Considerations
- Use efficient CSS (avoid overuse of absolute positioning that could cause performance issues)
- Ensure sufficient color contrast at all breakpoints
- Hide purely decorative elements on mobile if they impede readability or performance
- Follow WCAG 2.2 AA for responsive design (reflow, non-loss of content)
- Ensure that reducing motion does not remove essential information or functionality

## Definition of Done
- Hero section implements responsive behavior correctly across breakpoints
- Reduced-motion preference is respected and handled appropriately
- Hero section is accessible and usable on all screen sizes
- Code is committed and passes linting/typechecking
- All acceptance criteria are met

## Related Requirements
- PRD.md: Hero Section (§10) – Responsive behavior
- ROADMAP.md: Milestone 4 – Hero Section (Responsive behavior)
- PRD.md: Animation and reduced‑motion support (§10)
- DECISIONS.md: Breakpoint tokens integrated with Tailwind