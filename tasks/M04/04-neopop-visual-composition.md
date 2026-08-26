# M04.04 — NeoPOP visual composition

## Objective
Implement the NeoPOP-inspired visual composition for the Hero section, including layered cards, elevated typography, subtle perspective, depth, and optional floating technology tokens or subtle grid. The Hero should feel like an engineered interface, not a generic 3D illustration.

## Context
The NeoPOP visual composition is what gives the Hero section its premium, engineered feel. This task builds upon the basic layout and typography from M04.01 and adds visual depth, layering, and subtle animations that characterize the NeoPOP aesthetic. We'll use NeoPOP Card components with elevation, strategic positioning, and potentially some decorative elements.

## Requirements
- Use NeoPOP Card components (via src/components/ui/Card.tsx) to create layered/elevated surfaces
- Apply elevation tokens (shadow levels) to create depth perception
- Position elements to create a subtle perspective or asymmetric composition
- Optionally add subtle grid pattern in the background (using Tailwind gradients or background pattern)
- Optionally add floating technology tokens (small circular badges with tech icons or abbreviations) that can be animated later
- Ensure the visual composition does not obscure or hinder readability of the text content
- Use design system tokens for elevation, spacing, border radius, and colors
- Maintain proper semantic structure and accessibility (screen readers should still navigate the content logically)
- The visual composition should work in both light and dark modes
- Avoid creating a generic 3D developer illustration; focus on abstract, engineered interfaces

## Scope

### In scope
- NeoPOP Card components wrapped in the Hero component
- Application of elevation classes (sm, md, lg, xl) to create depth
- Strategic positioning (relative, absolute) for layering effect
- Subtle grid background pattern (if implemented)
- Floating technology tokens (small decorative elements) - optional but encouraged
- Use of design system tokens via Tailwind configuration
- Ensuring text remains legible over any background elements
- Integration with the existing Hero layout and typography

### Out of scope
- Basic typography and layout (covered in M04.01)
- CTA buttons (covered in M04.02 and M04.03)
- Animations using Framer Motion (covered in M04.05) - though we may add subtle hover animations here
- Responsive behavior adjustments (covered in M04.06)
- Complex 3D transformations or perspective transforms
- Animated floating tokens (covered in M04.05)
- Integration with actual technology data (we'll use static placeholder tokens if any)

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.03 – Create compatibility layer (for NeoPOP Card)
- M02.04 – Define elevations (shadow levels) and integrate with Tailwind
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M04.01 – Hero typography and basic layout

## Files / Areas Expected To Change
- `src/components/hero/Hero.tsx` (to add NeoPOP visual composition elements)
- `src/components/ui/Card.tsx` (if we need to enhance the Card component for additional variants, but unlikely)
- May need to add utility classes or styles in globals.css or via Tailwind (but we should try to use existing tokens)

## Implementation Guidance
1. In Hero.tsx, wrap sections of content in NeoPOP Card components to create elevation and layering
   - For example, wrap the entire content in a Card with elevation="sm" to lift it off the background
   - Or create multiple layers: a background Card with elevation="none", a middle layer with elevation="md", and a foreground layer with elevation="lg" for the text
2. Use absolute positioning relative to a container to create overlapping layers
   - Create a relatively positioned container (div)
   - Place absolutely positioned Card elements within it with different top/left/right/bottom offsets and z-index
3. Apply elevation using Tailwind classes that correspond to the elevation tokens (we need to check how elevation is exposed in Tailwind)
   - From tailwind.config.js, we see boxShadow extends tokens.elevation
   - So we can use classes like shadow-sm, shadow-md, shadow-lg, shadow-xl (assuming they map to the tokens)
   - Let's verify: in tailwind.config.js, boxShadow: ({ theme }) => ({ ...theme('boxShadow'), ...tokens.elevation, })
   - This means tokens.elevation values are added to the default boxShadow theme
   - We need to see what keys are available in tokens.elevation: none, sm, md, lg, xl
   - Therefore we can use shadow-sm, shadow-md, shadow-lg, shadow-xl
4. Consider using a subtle grid pattern in the background:
   - Use Tailwind gradient classes or a background-image pattern
   - Example: bg-[url('data:image/svg+xml;utf8,<svg...>')]
   - Or use a combination of background-gradient-from, background-gradient-to, etc.
   - Keep it very subtle (low opacity)
5. For floating technology tokens:
   - Create small circular elements (using div with rounded-full) with background colors from tokens
   - Place them absolutely positioned around the Hero section
   - Optionally add small tech abbreviations (like "AI", "CI/CD", "AWS") inside them
   - Use animation from M04.05 to make them float gently
6. Ensure the composition is asymmetric and feels engineered, not symmetrical
7. Test readability: ensure text contrast is sufficient over any background elements
8. Test in both light and dark modes: adjust background/elevation colors as needed (tokens should handle this)
9. Keep the DOM structure logical for screen readers: the actual text content should be in a logical order; decorative elements can be hidden with aria-hidden="true" if they are purely visual

## Acceptance Criteria
- [ ] Hero section uses NeoPOP Card components to create visual depth and layering
- [ ] Elevation is applied using design system tokens (shadow-sm, shadow-md, etc.) to create depth perception
- [ ] Visual composition feels engineered and premium, not generic or illustrative
- [ ] Text content remains legible and readable over any background elements
- [ ] Visual composition works in both light and dark modes
- [ ] Any decorative elements (floating tokens, grid) are subtle and do not distract from the core message
- [ ] The composition avoids resembling a generic 3D developer illustration
- [ ] Code follows existing patterns and style in the codebase

## Testing Requirements
- Manual visual inspection of the Hero section in light and dark modes
- Verify that elevation and layering are visible and create depth
- Check text readability and contrast using axe or similar tools
- Verify the composition does not look like a generic 3D illustration
- Test responsiveness to ensure composition adapts (or gracefully degrades) on smaller screens
- Verify decorative elements are subtle and not distracting
- Ensure the DOM order is logical for screen readers (use inspect element to check)

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only displays static visual elements

## Performance / Accessibility Considerations
- Use efficient rendering (avoid overly complex layouts with many absolutely positioned elements)
- Ensure sufficient color contrast (WCAG 2.2 AA minimum)
- Hide purely decorative elements from screen readers using aria-hidden="true" if appropriate
- Keep the number of DOM elements reasonable to avoid performance issues
- Test with reduced motion preferences (if we add animations later)

## Definition of Done
- NeoPOP visual composition is implemented in the Hero section
- Elevation and layering create a premium, engineered feel
- Text remains legible and accessible
- Code is committed and passes linting/typechecking
- All acceptance criteria are met

## Related Requirements
- PRD.md: Hero Section (§10) – Hero visual concept
- ROADMAP.md: Milestone 4 – Hero Section (NeoPOP visual composition)
- DECISIONS.md: Design system – Custom NeoPOP‑inspired design system