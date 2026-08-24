# M02.06 — Define responsive breakpoints and integrate with Tailwind

## Objective

Add responsive breakpoint tokens to the design system and configure Tailwind CSS to use these breakpoints for responsive utilities, ensuring consistent responsive behavior across the application.

## Context

Tailwind comes with a default set of screen breakpoints. Our design system may require specific breakpoint values that match our layout needs (e.g., based on common device widths or NeoPOP's breakpoints). We will define breakpoint tokens and update Tailwind's `screens` configuration accordingly.

## Requirements

- Extend `design/tokens.ts` with a `breakpoints` object containing named breakpoints (e.g., `sm`, `md`, `lg`, `xl`, `xxl`) with pixel values as strings (e.g., `'640px'`).
- Update `tailwind.config.js` to replace or extend the `screens` section with our breakpoint tokens.
- Ensure that existing Tailwind responsive utilities (e.g., `md:hidden`, `lg:flex`) work with our breakpoint values.
- Optionally, add a comment about the rationale for chosen values.
- Verify that the application builds and that responsive classes apply correctly at the expected widths.

## Scope

### In scope

- Defining breakpoint tokens in the token structure.
- Updating Tailwind configuration to use custom screens.
- Documenting the breakpoint scale in the design system README.

### Out of scope

- Creating layout components that use these breakpoints (that will be done in later milestones).
- Changing the underlying Tailwind responsive behavior beyond screen definitions.

## Dependencies

- Completion of M02.01 (Tailwind configured with design tokens) so that we can extend the existing config.

## Files / Areas Expected To Change

- `design/tokens.ts` – add `breakpoints` field.
- `tailwind.config.js` – set `theme.screens` to our breakpoint values (or extend).
- `design/README.md` – update to mention breakpoint tokens.

## Implementation Guidance

1. Choose breakpoint values that suit our design. For example, we might start with Tailwind's defaults and adjust if needed. We can define:
   ```javascript
   breakpoints: {
     sm: '640px',
     md: '768px',
     lg: '1024px',
     xl: '1280px',
     xxl: '1536px',
   }
   ```
   (We can also add more granular ones like `sm-` for max-width, but Tailwind uses min-width by default; we can rely on default behavior.)

2. In `tailwind.config.js`, under `theme`, set:
   ```javascript
   screens: {
     sm: tokens.breakpoints.sm,
     md: tokens.breakpoints.md,
     lg: tokens.breakpoints.lg,
     xl: tokens.breakpoints.xl,
     // optionally add 2xl: tokens.breakpoints.xxl,
   },
   ```
   Note: The token values are strings with 'px' suffix; Tailwind expects strings (they can be raw numbers interpreted as pixels, but we can keep the 'px').

3. Run `npm run dev` to ensure no errors.

4. Test by adding a component with responsive classes (e.g., `<div className="w-full md:w-half">`) and resizing the browser to see if the change occurs at the expected width.

## Acceptance Criteria

- [ ] `design/tokens.ts` includes a `breakpoints` object with at least three breakpoints (sm, md, lg).
- [ ] `tailwind.config.js` uses these values for the `screens` configuration.
- [ ] The Next.js application builds and runs without errors.
- [ ] Manual verification shows that responsive classes trigger at the correct widths.
- [ ] No lint or type‑check errors introduced.

## Testing Requirements

- Manual verification: inspect the computed width of an element at different viewport sizes to confirm breakpoint activation.
- Run `npm run lint` and `npm run typecheck`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Breakpoints should be chosen to support accessibility; ensure that content remains usable at all screen sizes.
- Avoid extremely large breakpoint values that could cause horizontal scrolling on small screens.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Define responsive breakpoints.
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components. Styling: Tailwind CSS with custom design tokens.
