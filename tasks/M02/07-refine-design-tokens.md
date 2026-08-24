# M02.07 — Refine and finalize design tokens

## Objective

Review and refine the existing design tokens (colors, typography, spacing, radius, elevation, breakpoints, motion) to ensure they align with the NeoPOP‑inspired premium, bold, minimal, dimensional, editorial, technical, experimental, confident visual language defined in the PRD, while maintaining harmony and usability.

## Context

We have an initial set of tokens in `design/tokens.ts`. However, they may not fully capture the desired aesthetic (e.g., the color palette may be too generic, the typography may need a stronger hierarchy, spacing may need adjustment for dense layouts). This task involves iterating on the token values, possibly adding new tokens (e.g., maxWidth, zIndex, opacity), and ensuring consistency across the token set.

## Requirements

- Evaluate each token category against the design principles and the desired characteristics listed in PRD §61 (Visual Language).
- Adjust token values as needed:
  - **Colors**: Select a premium bold palette (e.g., a deep primary color, neutral background/surface, accent for highlights). Ensure sufficient contrast for accessibility (WCAG AA).
  - **Typography**: Choose a font system (we already have Inter, but we may need to adjust font sizes, line heights, letter spacing, font weights). Consider adding a monospace variant for code snippets.
  - **Spacing**: Review the scale for appropriate density; maybe add more granular steps (e.g., xxs, 2xl, 3xl).
  - **Radius**: Define a radius system that works with NeoPOP's dimensional style (maybe include sharp, rounded, pill).
  - **Elevation**: Ensure shadow levels are subtle yet present.
  - **Breakpoints**: Confirm values are appropriate for our layout.
  - **Motion**: Ensure animation durations and easing feel snappy and responsive.
- Update `design/tokens.ts` with the refined values.
- Ensure that all existing uses of tokens (in Tailwind config, compatibility layer, etc.) still work (may need to adjust mapping if token structure changes).
- Update documentation to reflect the final token set.

## Scope

### In scope

- Editing `design/tokens.ts` to finalize token values.
- Updating any derived configurations (tailwind.config.js, motion presets) if they reference tokens directly.
- Updating `design/README.md` to document the token scale and usage guidelines.

### Out of scope

- Creating new components or modifying existing component implementations (except where token changes require prop adjustments in wrappers).
- Changing the fundamental structure of the token object (we can keep the same top‑level keys).

## Dependencies

- Completion of M02.01 through M02.06 (so we have the basic token structure and related configs).
- The design tokens file must be importable.

## Files / Areas Expected To Change

- `design/tokens.ts` – primary file to update.
- `tailwind.config.js` – if we change the shape of token values (e.g., spacing numbers) we may need to adjust mapping.
- `design/motion.ts` – if we adjust animation durations/easing that are derived from tokens (optional).
- `design/README.md` – update documentation.
- Possibly `src/components/ui/*` if wrapper props need to adjust to new token scales (but we can keep backward compatibility by mapping).

## Implementation Guidance

1. Gather inspiration from NeoPOP and CRED to define a premium bold palette. For example:
   - Primary: a deep blue (#0D47A1) or a rich purple.
   - Background: #FFFFFF (white) for light, #121212 for dark.
   - Surface: slightly elevated from background.
   - Text: high contrast on background.
   - Accent: a vibrant color for calls to action (e.g., #FF6F00).
2. Choose typography: Inter is a good choice. Define font weights: regular 400, medium 500, bold 600. Define font sizes: base 1rem, lg 1.125rem, xl 1.25rem, 2xl 1.5rem, 3xl 1.875rem, etc. Line heights: 1.5 for body, 1.2 for headings.
3. Spacing: use a scale that multiplies by 4px (so values: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64). We'll map to Tailwind accordingly.
4. Radius: define none, sm (4px), md (8px), lg (16px), pill (9999px).
5. After updating tokens, run the dev server to ensure everything works.
6. Optionally, create a token visualizer page (e.g., `/design-system/tokens`) to showcase the values.

## Acceptance Criteria

- [ ] `design/tokens.ts` has been updated with refined values for all token categories.
- [ ] The token values internally consistent and follow a clear scale.
- [ ] The Next.js application builds and runs without errors.
- [ ] Manual verification shows that components using tokens (via Tailwind or wrappers) reflect the new values.
- [ ] No lint or type‑check errors introduced.
- [ ] Documentation updated to reflect the final token set.

## Testing Requirements

- Manual verification: inspect the computed style of an element that uses a token‑derived class (e.g., background color, font size, padding) to ensure it matches the token value.
- Run `npm run lint` and `npm run typecheck`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Color contrast ratios must meet WCAG AA for text and interactive components.
- Animation durations should be reasonable to avoid causing distress; we will later integrate reduced‑motion support.
- Token values should not cause layout shifts that hinder accessibility.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Define design tokens (typography, colors, spacing, elevations, motion, breakpoints).
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components. Styling: Tailwind CSS with custom design tokens.
