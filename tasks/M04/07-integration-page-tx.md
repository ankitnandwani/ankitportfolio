# M04.07 — Integration into app/page.tsx and final polishing

## Objective
Integrate the completed Hero component into the homepage (app/page.tsx), replace the default Next.js content, and perform final polishing to ensure the Hero section works correctly within the overall site layout.

## Context
After implementing the Hero component with its typography, CTAs, visual composition, animations, and responsive behavior, we need to place it in the homepage and ensure it integrates well with the site shell (navigation bar, footer, responsive container, etc.). This task involves updating app/page.tsx to use the Hero component and making any necessary adjustments.

## Requirements
- Import the Hero component from '@/src/components/hero' in app/page.tsx
- Replace the default Next.js homepage content with the Hero component
- Ensure the Hero component is placed within the ResponsiveContainer (if used) or directly in the main layout
- Verify that the Hero section works correctly with the existing navigation bar and footer (via layout.tsx)
- Check for any CSS conflicts or styling issues between the Hero component and global styles
- Ensure the Hero section respects the site's dark/light theme
- Perform final polishing: verify spacing, alignment, and visual harmony with the rest of the page
- Ensure that the Hero section loads efficiently and does not cause layout shift (CLS)
- Verify that all links and buttons work correctly in the context of the full page
- Add any necessary accessibility improvements discovered during integration

## Scope

### In scope
- Importing and using the Hero component in app/page.tsx
- Replacing default homepage content
- Ensuring proper integration with layout.tsx (navigation bar, footer, page transitions)
- Checking and resolving any CSS conflicts
- Verifying theme consistency (dark/light mode)
- Final polishing of spacing, alignment, and visual harmony
- Ensuring no layout shift or performance issues
- Verifying all interactive elements work correctly

### Out of scope
- Hero component internal implementation (covered in M04.01 through M04.06)
- Navigation bar or footer modifications (unless absolutely necessary for integration)
- Route definitions for "Explore My Work" and "Ask My AI" (these are placeholders; actual routes will be implemented in later milestones)
- Adding additional sections below the Hero (will be done in later milestones)

## Dependencies
- M03.01 – Navigation bar (for ensuring compatibility with existing nav)
- M03.02 – Footer (for ensuring compatibility with existing footer)
- M03.03 – Responsive container (for layout constraints)
- M03.04 – Page transitions and theme switching (for ensuring transitions work)
- M04.01 – Hero typography and basic layout
- M04.02 – Primary CTA buttons
- M04.03 – Secondary CTA buttons
- M04.04 – NeoPOP visual composition
- M04.05 – Animations using Framer Motion
- M04.06 – Responsive behavior and reduced-motion support

## Files / Areas Expected To Change
- `app/page.tsx` (to import and use Hero component, remove default content)
- May need to adjust `app/layout.tsx` if there are any conflicts (but unlikely)
- May need to adjust `src/components/hero/Hero.tsx` based on integration findings (but ideally minimal)

## Implementation Guidance
1. In app/page.tsx, import the Hero component: `import Hero from '@/src/components/hero';`
2. Replace the current default content (the Next.js logo and getting started text) with the Hero component
3. Wrap the Hero component appropriately:
   - The current app/page.tsx already uses ResponsiveContainer from '@/src/components/layout'
   - We should keep using ResponsiveContainer to maintain consistent max-width and padding
   - So: <ResponsiveContainer><Hero /></ResponsiveContainer>
   - Or if Hero already includes its own container, we may adjust; but let's keep ResponsiveContainer for consistency
4. Remove the existing Image, headings, paragraphs, and buttons from app/page.tsx
5. Ensure the exported metadata remains (it's already there for SEO)
6. Check that the Hero component renders correctly within the layout:
   - Verify that the navigation bar appears at the top (via layout.tsx)
   - Verify that the footer appears at the bottom (via layout.tsx)
   - Verify that page transitions work when navigating to/from the homepage
7. Test dark/light mode switching: ensure the Hero section adapts correctly
8. Check for any z-index issues (e.g., Hero content appearing behind nav or footer)
9. Verify that the Hero section does not cause horizontal overflow
10. Test the CTA button navigation:
   - "Explore My Work" should navigate to /work (placeholder)
   - "Ask My AI" should navigate to /ask-ai (placeholder)
   - These routes may not exist yet; that's okay for now (they'll show 404, but we can verify the link is correct)
11. Test the secondary CTA links:
   - "Download Resume" should link to the resume PDF
   - "LinkedIn" and "GitHub" should open in new tabs
12. Perform final visual polishing:
    - Adjust spacing if needed (using margin/padding utilities)
    - Ensure typographic hierarchy is balanced
    - Verify that visual composition looks integrated and not floating awkwardly
    - Check that animations work correctly in the context of the page
    - Ensure reduced-motion handling works site-wide
13. Run linting, typechecking, and tests to ensure no regressions
14. Check Lighthouse performance metrics (especially CLS and LCP) to ensure the Hero section doesn't hurt performance

## Acceptance Criteria
- [ ] Hero component is successfully imported and used in app/page.tsx
- [ ] Default Next.js homepage content is replaced with the Hero section
- [ ] Hero section appears correctly below the navigation bar and above the footer
- [ ] Hero section respects the site's dark/light theme
- [ ] Page transitions work when navigating to/from the homepage
- [ ] All primary and secondary CTA buttons/links function correctly
- [ ] Hero section is responsive and adapts to different screen sizes
- [ ] Hero section respects reduced-motion preferences
- [ ] No CSS conflicts or styling issues between Hero and existing components
- [ ] Hero section does not cause layout shift or performance regressions
- [ ] Code follows existing patterns and style in the codebase
- [ ] Accessibility is maintained (WCAG 2.2 AA)

## Testing Requirements
- Manual verification of the homepage layout:
  - Check that navigation bar is present at top
  - Verify Hero section is visible and correctly formatted
  - Verify footer is present at bottom
- Test navigation:
  - Click primary CTAs to verify they navigate to correct placeholder routes
  - Click secondary CTAs to verify they link to correct destinations
- Test responsiveness:
  - Resize browser to various widths and verify layout adapts
  - Test on mobile device emulation
- Test dark/light mode switching via theme toggle in navigation bar
- Test reduced-motion preference:
  - Enable reduced motion in OS or simulate via dev tools
  - Verify animations are disabled or minimized
- Run linting: `npm run lint`
- Run typechecking: `npm run typecheck`
- Run tests: `npm test` (if applicable)
- Check Lighthouse performance (especially CLS and LCP) using Chrome Dev Tools
- Perform accessibility audit using axe or similar tool

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only displays static professional information and links
- Ensure no sensitive data is exposed in the Hero section

## Performance / Accessibility Considerations
- Use efficient rendering (avoid unnecessary re-renders)
- Ensure sufficient color contrast in all states
- Optimize images if any are added later (currently none)
- Follow WCAG 2.2 AA for responsive design and accessibility
- Monitor performance impact using Lighthouse (aim for good scores)

## Definition of Done
- Hero component is integrated into app/page.tsx successfully
- Default homepage content is replaced
- Hero section works correctly with the existing site shell (nav, footer, layout)
- All acceptance criteria are met
- Code is committed and passes linting/typechecking
- The homepage loads and functions correctly

## Related Requirements
- PRD.md: Hero Section (§10)
- ROADMAP.md: Milestone 4 – Hero Section
- PRD.md: Homepage section (§9) – Recommended structure (Hero first)