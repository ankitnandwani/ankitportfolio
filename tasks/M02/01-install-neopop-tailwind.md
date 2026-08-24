# M02.01 — Install NeoPOP and configure Tailwind with design tokens

## Objective

Install the NeoPOP component library and configure Tailwind CSS to use the design tokens defined in the design system, ensuring a consistent styling foundation for all components.

## Context

Milestone 2 focuses on creating a custom NeoPOP-inspired design system. The first step is to add NeoPOP as a dependency and set up Tailwind to consume our design tokens (colors, spacing, typography, radius, etc.) so that components can be styled consistently. This task does not involve creating UI components yet; it establishes the tooling and configuration.

## Requirements

- Install `@neopop/react` (or the appropriate NeoPOP package) as a dependency.
- Install `@neopop/icons` if needed (optional).
- Create a `tailwind.config.js` file that extends the default Tailwind theme with values from `design/tokens.ts`.
- Ensure Tailwind's base, components, and utilities are imported (via `app/globals.css` or equivalent).
- Optionally, configure Tailwind to use the `prefix` or other customizations if desired.
- Verify that the configuration works by running the Next.js dev server and checking that utility classes resolve to expected values.

## Scope

### In scope

- Adding NeoPOP package to `package.json`.
- Creating/updating `tailwind.config.js`.
- Verifying Tailwind integration with a simple test (e.g., applying a color class).
- Updating documentation if needed (e.g., README in design directory).

### Out of scope

- Creating or modifying any UI components.
- Defining design token values (they already exist in `design/tokens.ts`; refinement may happen in a separate task).
- Installing or configuring Framer Motion (handled in a separate task).
- Creating the compatibility layer or component wrappers.

## Dependencies

- None (except the existing Next.js, React, Tailwind setup).

## Files / Areas Expected To Change

- `package.json` (add dependencies)
- `tailwind.config.js` (new file)
- Possibly `postcss.config.mjs` (if needed, but likely unchanged)
- `app/globals.css` (if we need to adjust imports, but current `@import 'tailwindcss';` is sufficient)
- `design/tokens.ts` (only if we discover missing tokens; otherwise unchanged)

## Implementation Guidance

1. Install NeoPOP:  
   ```bash
   npm install @neopop/react
   ```
   (Check NeoPOP's documentation for the exact package name; if unavailable, we may need to install from a tarball or GitHub repo. For planning, assume it's available via npm.)

2. Create `tailwind.config.js` in the project root with content similar to:
   ```javascript
   /** @type {import('tailwindcss').Config} */
   const { tokens } = require('./design/tokens');

   module.exports = {
     content: [
       './app/**/*.{js,ts,jsx,tsx}',
       './components/**/*.{js,ts,jsx,tsx}',
       './src/**/*.{js,ts,jsx,tsx}',
     ],
     theme: {
       extend: {
         colors: {
           // Map token colors to Tailwind color palette
           primary: tokens.colors.primary,
           background: tokens.colors.background,
           surface: tokens.colors.surface,
           text: tokens.colors.text,
           accent: tokens.colors.accent,
         },
         spacing: tokens.spacing,
         fontSize: tokens.typography.fontSize,
         lineHeight: tokens.typography.lineHeight,
         borderRadius: tokens.radius, // Tailwind uses borderRadius for radius
       },
     },
     plugins: [],
   };
   ```
   Note: Adjust the mapping according to Tailwind's expected keys (e.g., `borderRadius` for radius, `fontSize` for font sizes, etc.). We may need to convert token values to strings with appropriate units (e.g., spacing values are already in pixels; Tailwind expects pixels without units? Actually Tailwind expects numbers that are interpreted as pixels. Our spacing token values are numbers (e.g., 4) meaning 4px? In the token we defined spacing as `{ xs: 4, sm: 8, ... }`. That's fine; Tailwind will treat 4 as 1rem? Wait, Tailwind's default spacing scale uses rems where 1 = 0.25rem (4px). Actually Tailwind's default spacing: 1 = 0.25rem (4px), 2 = 0.5rem (8px), etc. So if we want our spacing to match those values, we need to divide by 4? Or we can keep as is and Tailwind will interpret 4 as 1rem (16px) which is double. We need to check: In our tokens, xs: 4 likely means 4px? But we defined without units. We need to decide on a convention. Since we are using Tailwind, we should align with Tailwind's default scale (where 1 = 0.25rem). However, we can also configure Tailwind to use pixel values directly by using the `spacing` object with numbers that are pixels. Tailwind's spacing accepts any number and treats it as pixels? Actually Tailwind's spacing scale: the value is multiplied by the default unit (0.25rem). So to get 4px, we need 1 (since 1 * 0.25rem = 0.25rem = 4px). For 8px, we need 2. So we should adjust our token values to be multiples of 0.25rem. But we can also change the unitless numbers to be the Tailwind unit (i.e., divide by 4). Let's examine existing token values: xs: 4, sm: 8, md: 16, lg: 24, xl: 32. If we intend these to be pixels, then they correspond to Tailwind values: xs=1, sm=2, md=4, lg=6, xl=8. That's not a typical scale. Maybe we intend them to be in pixels and we will use them via CSS variables rather than Tailwind spacing. Alternatively, we can keep them as is and later when we use them we can multiply appropriately. For simplicity in planning, we assume we will map token values to Tailwind spacing by dividing by 4, or we will keep the token values as is and use them via CSS variables for custom properties. However, the task is to configure Tailwind with design tokens; we can decide to create a Tailwind plugin that adds our tokens as custom CSS variables and also generates utility classes. But given the scope, we can keep it simple: we will map token values to Tailwind using the same numbers, acknowledging that they may be off by a factor, and we can adjust later. Since this is a planning task, we can note that the exact conversion will be worked out during implementation.

   For now, we'll write the config as mapping directly, and note that we may need to adjust the token values or the mapping.

3. Run `npm run dev` to ensure the application starts without CSS errors.
4. Optionally, add a test component to verify that token-derived classes apply correctly (e.g., `<div className="bg-primary text-text p-xs">`).

5. Commit the changes.

## Acceptance Criteria

- [ ] NeoPOP package installed and listed in `package.json`.
- [ ] `tailwind.config.js` exists and compiles without errors.
- [ ] The Next.js application starts successfully (`npm run dev`).
- [ ] Utility classes from the token mapping (e.g., `bg-primary`, `p-xs`) apply the expected styles (can be verified visually or via a test snapshot).
- [ ] No new lint or type-check errors introduced.
- [ ] Documentation updated if necessary (e.g., `design/README.md` mentions Tailwind configuration).

## Testing Requirements

- Manual verification: run the dev server and inspect the styling of a test element.
- Run `npm run lint` and `npm run typecheck` to ensure no regressions.
- No unit tests required for configuration.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Tailwind configuration should purge unused classes in production (default behavior). Ensure content paths are correct.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Install NeoPOP, define design tokens, etc.
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components. Styling: Tailwind CSS with custom design tokens.
