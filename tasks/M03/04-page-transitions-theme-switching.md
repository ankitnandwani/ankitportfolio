# M03.04 — Page transitions and theme switching

## Objective
Implement smooth page transitions between route changes and ensure theme switching is properly integrated throughout the site shell. This will enhance the user experience with polished animations and consistent theme application.

## Context
Page transitions provide visual continuity when navigating between pages, making the application feel more cohesive and polished. Theme switching (light/dark mode) was implemented in Milestone 2 but needs to be fully integrated into the site shell components (navigation bar, footer, etc.) and potentially enhanced with smooth transitions.

## Requirements
- Implement page transitions using Framer Motion's AnimatePresence and motion components
- Create smooth fade-in/fade-out or slide transitions between route changes
- Ensure theme switching works globally and persists across route changes
- Integrate theme switcher from navigation bar with global theme context
- Apply theme-appropriate transitions that respect reduced motion preferences
- Ensure transitions work correctly with Next.js app router
- Maintain accessibility during transitions (no motion that could trigger vestibular disorders)

## Scope

### In scope
- Page transition implementation using Framer Motion
- Theme switching integration in site shell components
- Reduced motion preference handling
- Transition variants for different page types
- Integration with Next.js app router

### Out of scope
- Complex shared element transitions between pages
- Page-specific custom animations beyond standard transitions
- Theme persistence in cookies/localStorage (beyond existing implementation)
- Transition-based state management
- Server-side transition rendering

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.02 – Evaluate NeoPOP components and document selection
- M02.03 – Create compatibility layer
- M02.04 – Define elevations (shadow levels) and integrate with Tailwind
- M02.05 – Define motion (animation presets) using Framer Motion
- M02.06 – Define breakpoints and integrate with Tailwind
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M02.09 – Create design system showcase route

## Files / Areas Expected To Change
- `src/components/layout/PageTransitions.tsx` (new component)
- `src/components/layout/index.ts` (update barrel file)
- `app/layout.tsx` (to wrap children with page transitions)
- `src/components/navigation/NavigationBar.tsx` (to integrate theme switcher)
- `src/components/footer/Footer.tsx` (to ensure theme consistency)
- `src/data/themeSettings.ts` (optional, for transition configuration)
- `app/page.tsx` and other pages (may need adjustment for transitions)

## Implementation Guidance
1. Create a PageTransitions component using Framer Motion's AnimatePresence
2. Define transition variants (fade, slide, etc.) using motion presets from design system
3. Wrap route children with AnimatePresence in the root layout
4. Ensure theme switching from navigation bar updates global theme context
5. Implement reduced motion preference detection using media queries
6. Create transition variants that respect user's motion preferences
7. Use Next.js usePathname or useRouter to detect route changes
8. Apply appropriate exit/enter animations based on navigation direction
9. Ensure theme colors transition smoothly when switching modes
10. Test transitions across different routes and themes

## Acceptance Criteria
- [ ] Page transitions occur when navigating between routes
- [ ] Transitions are smooth and use Framer Motion
- [ ] Theme switching works correctly from navigation bar
- [ ] Theme persists across route changes
- [ ] Reduced motion preferences are respected (minimal animation when preferred)
- [ ] Transitions work with Next.js app router
- [ ] No layout shifts or visual glitches during transitions
- [ ] Accessibility is maintained during transitions
- [ ] Transitions feel polished and professional

## Testing Requirements
- Manual testing of transitions between different pages
- Verify theme switching works and persists across navigation
- Test with reduced motion enabled in system preferences
- Check that transitions don't cause accessibility issues
- Verify performance isn't significantly impacted
- Test in both light and dark themes
- Ensure transitions work with browser back/forward buttons

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it doesn't handle user data

## Performance / Accessibility Considerations
- Use efficient animation properties (opacity, transform) to minimize layout thrashing
- Respect prefers-reduced-media CSS media query
- Ensure transitions don't interfere with screen reader announcements
- Keep animation durations reasonable (typically 200-300ms)
- Avoid animations that could trigger seizures or vestibular disorders
- Follow WCAG 2.2 AA guidelines for animation and transitions

## Definition of Done
- Page transitions are implemented and functional
- Theme switching is properly integrated throughout site shell
- Reduced motion preferences are respected
- All acceptance criteria are met
- Code is committed and passes linting/typechecking

## Related Requirements
- PRD.md: Information Architecture section (page transitions)
- PRD.md: Homepage section (visual experience)
- ROADMAP.md: Milestone 3 – Site Shell