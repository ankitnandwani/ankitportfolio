# M04.01 — Hero typography and basic layout

## Objective
Create the Hero section's typography and basic layout structure that communicates Ankit's professional identity:
```
ANKIT NANDWANI
Senior SDET / Automation Engineer
Quality Engineering.
Backend Automation.
Cloud.
AI.
Building reliable software and engineering systems
across complex technology stacks.
```
The layout should use design system tokens for typography, spacing, and colors, and establish the foundation for the Hero section.

## Context
This is the first task for the Hero section. It establishes the core text content and basic structure that will be enhanced with CTAs, visual composition, and animations in subsequent tasks. The Hero section will be placed in the homepage (app/page.tsx).

## Requirements
- Display the headline "ANKIT NANDWANI" with appropriate typographic treatment (display size, weight)
- Display the sub-headline "Senior SDET / Automation Engineer"
- Display the three lines of expertise: "Quality Engineering.", "Backend Automation.", "Cloud.", "AI." (each as separate elements)
- Display the tagline: "Building reliable software and engineering systems across complex technology stacks."
- Use design system tokens for font sizes, weights, line heights, letter tracking, and colors
- Apply appropriate spacing between elements using design system spacing tokens
- Structure the content in a way that allows for NeoPOP visual composition (layering, elevation) to be added later
- Ensure the text is accessible (sufficient contrast, semantic HTML)
- Create a reusable Hero component that can be imported and used in app/page.tsx

## Scope

### In scope
- Hero component creation (src/components/hero/Hero.tsx)
- Typographic styling using design system tokens
- Basic layout structure (flex column, appropriate spacing)
- Semantic HTML structure (headings, paragraphs, divs)
- Accessibility considerations (color contrast, screen reader friendly)
- Barrel export (src/components/hero/index.ts)

### Out of scope
- CTA buttons (covered in M04.02 and M04.03)
- NeoPOP visual composition elements (cards, elevation, floating tokens) (covered in M04.04)
- Animations (covered in M04.05)
- Responsive behavior adjustments (covered in M04.06)
- Integration into app/page.tsx (covered in M04.07)

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M03.03 – Responsive container (for layout constraints)

## Files / Areas Expected To Change
- `src/components/hero/Hero.tsx` (new component)
- `src/components/hero/index.ts` (new barrel file)
- `app/page.tsx` (to import and use the Hero component)

## Implementation Guidance
1. Create a new folder `src/components/hero/`
2. Create `Hero.tsx` with the textual content structured appropriately
3. Use Tailwind classes that reference design system tokens (via the configured theme)
4. For the headline "ANKIT NANDWANI", use a large display size (e.g., 4xl or 5xl) with extraBold or black weight
5. For "Senior SDET / Automation Engineer", use lg or xl size with semiBold or bold weight
6. For the expertise lines ("Quality Engineering.", etc.), consider using base or lg size with medium weight, possibly with letter spacing
7. For the tagline, use base or lg size with regular weight
8. Apply appropriate margins/padding between elements using spacing tokens (e.g., mt-4, mb-6)
9. Ensure text colors use the design system text color with appropriate dark mode handling
10. Use semantic HTML: h1 for the main name, h2 for the role, p or div for expertise lines and tagline
11. Add aria-label or role if needed for accessibility
12. Create an index.ts file that exports the Hero component
13. Ensure the component is reusable and accepts optional props (like className for customization)

## Acceptance Criteria
- [ ] Hero component displays all required text content correctly
- [ ] Typography uses design system tokens for font sizes, weights, line heights, letter tracking
- [ ] Spacing between elements uses design system spacing tokens
- [ ] Text is accessible with sufficient contrast in both light and dark modes
- [ ] Component can be imported and used via the barrel export
- [ ] Basic layout structure is in place for subsequent enhancements
- [ ] Code follows existing patterns and style in the codebase
- [ ] Component is reusable and accepts className prop for customization

## Testing Requirements
- Manual visual inspection of the Hero component in isolation
- Verify typography matches design system specifications
- Verify spacing uses design system tokens
- Check accessibility using axe or similar tools (color contrast, semantic HTML)
- Test in both light and dark modes
- Verify the component renders correctly when imported into a test page

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only displays static professional information

## Performance / Accessibility Considerations
- Use efficient rendering (no unnecessary computations)
- Ensure sufficient color contrast (WCAG 2.2 AA minimum)
- Use semantic HTML for screen readers
- Avoid inline styles that prevent optimization
- Keep the component lightweight

## Definition of Done
- Hero component is implemented with correct typography and basic layout
- Component uses design system tokens consistently
- Component is accessible and follows WCAG 2.2 AA guidelines
- Code is committed and passes linting/typechecking
- All acceptance criteria are met

## Related Requirements
- PRD.md: Hero Section (§10)
- ROADMAP.md: Milestone 4 – Hero Section (Hero typography)