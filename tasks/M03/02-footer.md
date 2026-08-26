# M03.02 — Footer

## Objective
Create a responsive footer component that contains essential information, social links, and secondary navigation. The footer should be consistent across all pages and follow the design system established in Milestone 2.

## Context
The footer will appear at the bottom of every page and provide supplementary information such as social media links, copyright information, and potentially secondary navigation options. It should complement the navigation bar and complete the site layout structure.

## Requirements
- Display social media links (LinkedIn, GitHub, etc.) using icons
- Include copyright information with current year
- Provide secondary navigation links (optional, for less critical pages)
- Be responsive: stack vertically on mobile, display horizontally on desktop
- Use existing design system components and tokens
- Implement subtle animations on hover/interactions using Framer Motion
- Ensure accessibility (WCAG 2.2 AA) including proper color contrast and keyboard navigation
- Be lightweight and not impact page performance significantly

## Scope

### In scope
- Footer component implementation
- Social links integration (using configuration/data)
- Copyright information display
- Responsive layout
- Hover/focus animations
- Accessibility features

### Out of scope
- Dynamic content fetching (social links will be static/config-based)
- User-generated content
- Complex interactive widgets
- Newsletter signup forms
- Language/country selectors

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
- `src/components/footer/Footer.tsx` (new component)
- `src/components/footer/socialLinks.tsx` (new component)
- `src/components/footer/index.ts` (new barrel file)
- `app/layout.tsx` (to include the footer)
- `src/data/socialLinks.ts` (new data file for social link configuration)
- `app/page.tsx` and other pages (may need adjustment for footer spacing)

## Implementation Guidance
1. Create a footer component that uses the design system's tokens for colors, spacing, typography
2. Implement responsive behavior using Tailwind (flex-col on mobile, flex-row on desktop)
3. Create social links component that maps to configuration data
4. Use Framer Motion for subtle hover animations on social icons
5. Implement proper accessibility attributes for links (aria-label, etc.)
6. Ensure copyright year updates automatically
7. Follow the existing code style and patterns in the codebase
8. Leverage existing UI components from src/components/ui where applicable
9. Keep the footer lightweight to avoid impacting LCP
10. Test across different screen sizes and themes

## Acceptance Criteria
- [ ] Footer displays social media links with proper icons
- [ ] Footer shows copyright information with current year
- [ ] Footer is responsive (vertical on mobile, horizontal on desktop)
- [ ] Social links have hover/focus animations using Framer Motion
- [ ] Footer is accessible (proper color contrast, keyboard navigable)
- [ ] Footer appears consistently on all pages
- [ ] Component follows the design system visual language
- [ ] Social links open in new tabs with appropriate rel attributes
- [ ] No broken links or missing icons

## Testing Requirements
- Manual testing of footer on desktop and mobile views
- Verify social links work and open in new tabs
- Check color contrast ratios meet WCAG AA standards
- Verify animations work smoothly
- Test in both light and dark themes
- Validate HTML accessibility using automated tools

## Security / Privacy Considerations
- Ensure social links use target="_blank" with rel="noopener noreferrer"
- No privacy concerns as it doesn't collect user data
- No external scripts or iframes that could pose security risks

## Performance / Accessibility Considerations
- Optimize SVG icons or use font icons for better performance
- Lazy load non-critical footer content if needed (though footer is typically critical)
- Ensure sufficient touch targets for mobile devices
- Provide visible focus outlines for keyboard navigation
- Minimize DOM nodes and CSS complexity

## Definition of Done
- Footer component is implemented and functional
- Social links are configurable and display correctly
- Responsive behavior works across breakpoints
- Component is accessible and follows WCAG 2.2 AA
- All acceptance criteria are met
- Code is committed and passes linting/typechecking

## Related Requirements
- PRD.md: Social Hub section
- PRD.md: Contact section
- ROADMAP.md: Milestone 3 – Site Shell