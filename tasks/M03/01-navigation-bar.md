# M03.01 — Navigation bar

## Objective
Create a responsive navigation bar component that provides access to the main sections of the portfolio: HOME, WORK, PROJECTS, EXPERIENCE, ENGINEERING, RESUME, ASK AI, CONTACT. The navigation bar should be visible on desktop and collapse into a mobile menu on smaller screens.

## Context
This is the primary navigation component for the site. It will be used in the root layout to provide consistent navigation across all pages. The navigation bar should follow the design system principles established in Milestone 2, using NeoPOP-inspired components, custom design tokens, and Framer Motion for animations.

## Requirements
- Display primary navigation links: HOME, WORK, PROJECTS, EXPERIENCE, ENGINEERING, RESUME, ASK AI, CONTACT
- On desktop: show links horizontally in the navigation bar
- On mobile: collapse into a hamburger menu that expands to show navigation links vertically
- Include theme switcher toggle (light/dark mode) in the navigation bar
- Use existing design system components (Button, etc.) where appropriate
- Implement smooth animations for menu opening/closing using Framer Motion
- Ensure accessibility (WCAG 2.2 AA) including keyboard navigation and screen reader support
- Highlight current page/link in navigation
- Navigate to appropriate routes when links are clicked

## Scope

### In scope
- Navigation bar component implementation
- Mobile menu (hamburger) implementation
- Theme switcher integration
- Route navigation
- Active link highlighting
- Accessibility features
- Animations using Framer Motion

### Out of scope
- Content of the linked pages (will be implemented in later milestones)
- Advanced search or filtering capabilities
- User authentication (beyond theme switching)
- Logo/branding elements (to be added in later milestones)

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
- `src/components/navigation/NavigationBar.tsx` (new component)
- `src/components/navigation/mobileMenu.tsx` (new component)
- `src/components/navigation/themeToggle.tsx` (new component)
- `src/components/navigation/index.ts` (new barrel file)
- `app/layout.tsx` (to include the navigation bar)
- `app/page.tsx` (home page - may need adjustment for nav bar)
- `src/styles/globals.css` (if additional styles needed)

## Implementation Guidance
1. Create a navigation bar component that uses the design system's tokens for colors, spacing, typography
2. Implement responsive behavior using Tailwind breakpoints
3. Use Framer Motion for smooth animations when opening/closing the mobile menu
4. Implement theme switching using the existing themeContext
5. Ensure proper accessibility attributes (aria-label, role, etc.)
6. Use Next.js navigation (useRouter or usePathname) to highlight active links
7. Follow the existing code style and patterns in the codebase
8. Leverage existing UI components from src/components/ui where applicable
9. Ensure the navigation bar is fixed or positioned appropriately for good UX
10. Test responsiveness across different screen sizes

## Acceptance Criteria
- [ ] Navigation bar displays all primary links on desktop
- [ ] Navigation bar collapses to hamburger menu on mobile
- [ ] Hamburger menu expands to show navigation links vertically when clicked
- [ ] Theme switcher toggles between light and dark modes
- [ ] Current page/link is highlighted in the navigation
- [ ] Clicking navigation links routes to the correct pages
- [ ] Navigation bar is accessible (keyboard navigable, screen reader friendly)
- [ ] Smooth animations for menu opening/closing using Framer Motion
- [ ] Navigation bar follows the design system visual language
- [ ] Component is reusable and can be imported easily

## Testing Requirements
- Manual testing of navigation bar on desktop and mobile views
- Verify theme switching works correctly
- Verify all navigation links route correctly
- Check accessibility using axe or similar tools
- Verify animations work smoothly
- Test responsiveness across various breakpoints

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it doesn't handle user data

## Performance / Accessibility Considerations
- Use efficient rendering (avoid unnecessary re-renders)
- Implement proper focus management for mobile menu
- Ensure sufficient color contrast for text and icons
- Provide skip navigation link for screen readers
- Follow WCAG 2.2 AA guidelines for navigation components

## Definition of Done
- Navigation bar component is implemented and functional
- Mobile menu works correctly with animations
- Theme switching is integrated and functional
- Component is accessible and follows WCAG 2.2 AA
- All acceptance criteria are met
- Code is committed and passes linting/typechecking

## Related Requirements
- PRD.md: Information Architecture section (Primary navigation)
- PRD.md: Homepage section (Navigation structure)
- ROADMAP.md: Milestone 3 – Site Shell