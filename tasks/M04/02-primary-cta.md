# M04.02 — Primary CTA buttons

## Objective
Implement the primary call-to-action buttons for the Hero section: "Explore My Work" and "Ask My AI". These buttons should use the design system's Button component, be visually prominent, and navigate to the appropriate routes when clicked.

## Context
The primary CTAs are the main actions we want visitors to take from the Hero section. "Explore My Work" should navigate to the work/projects section of the site, while "Ask My AI" should navigate to the AI chat interface. These buttons need to be styled appropriately using the design system and placed horizontally or vertically depending on the layout.

## Requirements
- Create two Button components: "Explore My Work" and "Ask My AI"
- Use the existing Button component from src/components/ui/Button.tsx (which wraps NeoPOP)
- Apply appropriate variants: likely "primary" for both, or differentiate if needed
- Size should be appropriate for the Hero section (md or lg)
- "Explore My Work" should navigate to the work route (likely /work or /projects - to be determined based on future milestones)
- "Ask My AI" should navigate to the AI chat route (likely /ask-ai)
- Buttons should be accessible (proper label, keyboard navigable)
- Buttons should have appropriate hover and focus states using the design system
- Layout should allow for side-by-side placement on desktop and stacked on mobile (to be coordinated with responsive behavior task)
- Use design system tokens for spacing between buttons if needed

## Scope

### In scope
- Primary CTA button components using the design system Button
- Navigation logic using Next.js useRouter or usePathname and <Link> component
- Styling using design system tokens via Tailwind configuration
- Accessibility attributes (aria-label, role if needed)
- Hover and focus states
- Barrel export considerations (buttons will be part of Hero component, not separate exports)

### Out of scope
- Secondary CTA buttons (covered in M04.03)
- Visual composition elements (covered in M04.04)
- Animations (covered in M04.05)
- Responsive behavior adjustments (covered in M04.06)
- Definition of the actual work and AI chat routes (will be implemented in later milestones; use placeholder routes for now)

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.03 – Create compatibility layer (for NeoPOP Button)
- M02.07 – Refine and finalize design tokens
- M03.01 – Navigation bar (for routing patterns and useRouter usage)
- M03.05 – Command palette (for potential keyboard shortcuts, though not required)

## Files / Areas Expected To Change
- `src/components/hero/Hero.tsx` (to include the primary CTA buttons)
- Potentially `src/components/ui/Button.tsx` if any enhancements are needed (unlikely)
- `app/layout.tsx` or route files if we need to define placeholder routes (but we can use temporary paths)

## Implementation Guidance
1. In Hero.tsx, import the Button component from '@/src/components/ui/Button'
2. Create two Button elements:
   - First button: "Explore My Work" with variant="primary", size="lg" or "md"
   - Second button: "Ask My AI" with variant="primary", size="lg" or "md"
3. Use Next.js Link component for client-side navigation:
   - Import Link from 'next/link'
   - Wrap each Button in a Link to the appropriate route
   - For now, use placeholder routes: "/work" for Explore My Work, "/ask-ai" for Ask My AI
   - Add appropriate prefetching if needed
4. Ensure buttons are accessible: they are native button elements, so they are keyboard accessible by default
5. Add appropriate spacing between buttons (using margin or gap in flex container)
6. Consider making the buttons full-width on mobile and side-by-side on desktop (this will be handled by the overall Hero layout and responsive behavior task)
7. Apply any additional styling using Tailwind classes that reference design system tokens (if needed beyond the Button component's defaults)
8. Ensure the Button component's colorScheme prop is handled correctly for dark/light mode (it already is via themeContext)

## Acceptance Criteria
- [ ] Two primary CTA buttons are displayed: "Explore My Work" and "Ask My AI"
- [ ] Buttons use the design system's Button component (NeoPOP-inspired)
- [ ] Buttons have appropriate visual styling (size, variant, hover/focus states)
- [ ] Clicking "Explore My Work" navigates to the work route (placeholder: /work)
- [ ] Clicking "Ask My AI" navigates to the AI chat route (placeholder: /ask-ai)
- [ ] Buttons are accessible (keyboard navigable, screen reader friendly)
- [ ] Buttons respect dark and light mode themes
- [ ] Buttons have adequate spacing and layout within the Hero section
- [ ] Code follows existing patterns and style in the codebase

## Testing Requirements
- Manual testing of button clicks and navigation
- Verify button visual appearance in light and dark modes
- Verify hover and focus states work correctly
- Test keyboard navigation (tab to buttons, press enter to activate)
- Verify navigation to correct placeholder routes
- Check accessibility using axe or similar tools
- Test in different viewport sizes to ensure layout works

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only handles navigation

## Performance / Accessibility Considerations
- Use Next.js Link for efficient client-side navigation
- Ensure buttons are focusable and have visible focus indicators
- Keep button rendering efficient (no unnecessary re-renders)
- Follow WCAG 2.2 AA for button contrast and hit area size

## Definition of Done
- Primary CTA buttons are implemented and functional
- Buttons use the design system Button component correctly
- Navigation works to placeholder routes
- Buttons are accessible and follow WCAG 2.2 AA
- Code is committed and passes linting/typechecking
- All acceptance criteria are met

## Related Requirements
- PRD.md: Hero Section (§10) – Primary CTAs
- ROADMAP.md: Milestone 4 – Hero Section (Primary CTA)