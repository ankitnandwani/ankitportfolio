# M12.02 — Create testimonial card component

## Objective

Create a reusable testimonial card component that displays an individual testimonial with proper styling, following the NeoPOP-inspired design system and patterns established by other card components (e.g., AchievementCard, ProjectCard). The component should show the quote, name, role, company, and optionally link to a profile URL.

## Context

This component will be used by the testimonials section to render each endorsement. It should follow the same patterns as existing cards: use the `Card` component from `@/src/components/ui/Card`, apply appropriate elevations, styling, and interactive states (hover, focus) with Framer Motion animations. The design should be consistent with the overall site aesthetic.

## Requirements

- Create `src/components/testimonials/TestimonialCard.tsx`
- Accept a `testimonial` prop of type `Testimonial` (from `../data/testimonials`)
- Display the testimonial quote prominently
- Show the person's name, role, and company
- Optionally make the name or a button link to the profile URL if provided
- Use the `Card` component with appropriate elevation (likely "md")
- Apply styling consistent with other cards (border accent, typography, spacing)
- Add Framer Motion animations for entrance, hover, and focus states
- Respect `prefers-reduced-motion` media query
- Ensure accessibility: proper semantic HTML, aria-label if needed, keyboard navigable
- Follow the existing component structure and patterns

## Scope

### In scope

- `src/components/testimonials/TestimonialCard.tsx` file
- Component interface and implementation
- Styling using Tailwind classes and design tokens
- Framer Motion animation variants
- Accessibility considerations
- Export of the component for use in other modules

### Out of scope

- Fetching or processing testimonial data (handled by data layer)
- Integration into the testimonials section (handled in M12.03)
- Validation of testimonial content (assumed to be valid from data layer)

## Dependencies

- M12.01: Testimonial data model must be defined first
- Existing dependencies: `framer-motion`, `@/src/components/ui/Card`, `@/design/themeContext`

## Files / Areas Expected To Change

- `src/components/testimonials/TestimonialCard.tsx` (new file)
- May need to create `src/components/testimonials/` directory

## Implementation Guidance

1. Create the directory `src/components/testimonials/` if it doesn't exist
2. Create `TestimonialCard.tsx` with a `use client` directive (since it uses Framer Motion hooks)
3. Import necessary dependencies:
   - React, useState, useEffect
   - motion from framer-motion
   - Card from '@/src/components/ui/Card'
   - useTheme from '@/design/themeContext'
   - Testimonial type from '@/src/data/testimonials'
4. Define props interface: `TestimonialCardProps` with `testimonial: Testimonial` and optional `className`
5. Implement the component following the pattern of `AchievementCard.tsx`:
   - Get theme tokens via `useTheme()`
   - Set up `prefersReducedMotion` state and effect
   - Define animation variants for entrance, hover, focus
   - Render motion.wrapper (motion.article or motion.div) with variants
   - Inside, use the `Card` component with appropriate styling
   - Layout: quote in quotation marks, then attribution with name, role, company
   - If `profileUrl` exists, consider making the name a link or adding a "View profile" button
   - Ensure proper contrast and readability
6. Style using Tailwind classes, referencing the design tokens for colors, spacing, typography
7. Add comments explaining the component's purpose and any important implementation details
8. Ensure the component is exported as a named export (or default)

## Acceptance Criteria

- [ ] `src/components/testimonials/TestimonialCard.tsx` file exists
- [ ] Component accepts a `testimonial` prop of correct type
- [ ] Component renders the quote, name, role, company appropriately
- [ ] Component uses the `Card` component with elevation
- [ ] Component includes Framer Motion animations for entrance, hover, focus
- [ ] Component respects `prefers-reduced-motion`
- [ ] Component follows accessibility best practices (semantic HTML, etc.)
- [ ] No lint or TypeScript errors
- [ ] Component can be imported and used without errors

## Testing Requirements

- Run `npm run typecheck` to verify no TypeScript errors
- Run `npm run lint` to verify no linting errors
- Optionally, test the component in isolation with sample data (but note: we should not fabricate testimonials for final production; sample data for development should be clearly marked as placeholder and not committed if it contains false information)

## Security / Privacy Considerations

- Do not display any private information; only show what's provided in the testimonial data
- When profile URL is provided, ensure it's a public professional profile (LinkedIn, personal site, etc.)
- The component itself does not introduce privacy risks

## Performance / Accessibility Considerations

- Use `useState` and `useEffect` efficiently for prefers-reduced-motion detection
- Animations should be lightweight and not cause layout thrashing
- Ensure touch targets are adequate if interactive elements are present
- Maintain proper color contrast ratios

## Definition of Done

- The testimonial card component is fully implemented and ready for use
- All acceptance criteria are met
- The component follows established patterns and conventions

## Related Requirements

- PRD §25: Testimonials / Social Proof
- ROADMAP Milestone 12: Render testimonial cards