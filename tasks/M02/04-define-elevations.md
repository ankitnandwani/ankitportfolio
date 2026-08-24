# M02.04 — Define elevations (shadow levels) and integrate with Tailwind

## Objective

Add elevation (shadow) tokens to the design system and configure Tailwind CSS to generate utility classes for applying consistent shadows across components.

## Context

Our current design tokens include colors, spacing, typography, and radius. Elevations (shadows) are a key aspect of NeoPOP's dimensional style and are essential for creating depth in the UI. We will define a set of shadow levels and map them to Tailwind's `boxShadow` utilities.

## Requirements

- Extend `design/tokens.ts` with an `elevation` object containing named levels (e.g., `none`, `sm`, `md`, `lg`, `xl`, `xxl`). Each value should be a valid CSS `box-shadow` string.
- Update `tailwind.config.js` to extend the `boxShadow` section with our elevation tokens.
- Optionally, add a `dropShadow` mapping if needed.
- Ensure the tokens are accessible via the design system import (e.g., `tokens.elevation.md`).
- Verify that the shadow classes work in the application (e.g., `<div className="shadow-md">`).

## Scope

### In scope

- Defining elevation tokens in the token structure.
- Updating Tailwind configuration to generate shadow utilities.
- Documenting the elevation scale in the design system README.

### Out of scope

- Creating components that use elevations (that will be done in the compatibility layer or custom components).
- Adjusting existing component shadows (if any) – we will rely on the token system for new components.

## Dependencies

- Completion of M02.01 (Tailwind configured with design tokens) so that we can extend the existing config.
- The design tokens file must be importable.

## Files / Areas Expected To Change

- `design/tokens.ts` – add `elevation` field.
- `tailwind.config.js` – extend `theme.boxShadow` with values from tokens.
- `design/README.md` – update to mention elevation tokens.

## Implementation Guidance

1. Choose a set of shadow levels that match NeoPOP's depth. For example:
   ```javascript
   elevation: {
     none: '0 0 #0000',
     sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
     md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
     lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
     xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
   }
   ```
   (We can adjust values later; for planning, we note the need.)

2. In `tailwind.config.js`, under `theme.extend`, add:
   ```javascript
   boxShadow: ({ theme }) => ({
     ...theme('boxShadow'), // preserve default Tailwind shadows if desired
     ...tokens.elevation,
   }),
   ```
   Or we can replace entirely.

3. Run `npm run dev` to ensure no CSS errors.

4. Test by adding a component with a shadow class and verifying the appearance.

## Acceptance Criteria

- [ ] `design/tokens.ts` includes an `elevation` object with at least four levels (none, sm, md, lg).
- [ ] `tailwind.config.js` uses these values to generate `shadow-*` utilities.
- [ ] The Next.js application builds and runs without errors.
- [ ] Manual verification shows that applying `shadow-md` produces a visible shadow.
- [ ] No lint or type‑check errors introduced.

## Testing Requirements

- Manual verification: render a div with a shadow class and inspect the computed style.
- Run `npm run lint` and `npm run typecheck`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Shadows can affect repaint performance; use judiciously. However, our elevation tokens are intended for component depth and should be fine.
- Ensure that sufficient contrast remains when shadows are applied over backgrounds.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Define elevations.
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components. Styling: Tailwind CSS with custom design tokens.
