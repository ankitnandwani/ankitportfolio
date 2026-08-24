# M02.08 — Implement dark/light themes with token overrides

## Objective

Create fully featured dark and light themes that override design tokens appropriately (colors, elevations, etc.) to ensure proper contrast and visual harmony in both modes, and provide a mechanism for consuming components to access the active theme.

## Context

We already have basic light and dark theme files that spread the base tokens and override a few colors. However, a robust theme system should also adjust elevations (shadows may need to be lighter in dark mode), possibly adjust radius or other tokens, and provide a React context or hook to access the current theme. This task will refine the theme files and optionally create a theme provider.

## Requirements

- Update `design/themes/light.ts` and `design/themes/dark.ts` to override not only colors but also any other tokens that should differ between modes (e.g., elevation shadows may need to be softer in dark mode, or we may want to adjust accent colors).
- Ensure that the themes are typed correctly and extend the base token structure.
- Optionally, create a `design/themeContext.ts` that provides a React context for the current theme and a toggle function.
- Ensure that the themes are used in the application (e.g., via a class on the `<html>` element or via Tailwind's dark mode strategy). We are already using Tailwind's dark mode via class strategy? Let's check: In `app/globals.css` we see a `@media (prefers-color-scheme: dark)` block that sets CSS variables. We are not using Tailwind's dark mode class; we are using CSS variables. We need to decide on a strategy. The PRD does not specify, but we can continue with CSS variables approach. However, for consistency with Tailwind, we might want to enable Tailwind's dark mode using a class (e.g., `dark:`). We'll need to adjust Tailwind config to add `darkMode: ['class', '[data-theme="dark"]']` or similar. We'll decide during implementation; for planning, we will note that we need to ensure the theme system works with our chosen styling approach.
- Update the `app/globals.css` or create a wrapper that applies the theme tokens as CSS variables or adds a class to the root.
- Provide a simple way to toggle themes (e.g., a button in the design system showcase) for testing.
- Document the theme usage.

## Scope

### In scope

- Refining light and dark theme files with appropriate token overrides.
- Creating a theme context/provider if desired.
- Ensuring the theme is applied globally (either via CSS variables or Tailwind dark mode).
- Adding a theme toggle for demonstration (can be placed in the design system showcase).

### Out of scope

- Persisting the user's theme preference (e.g., in localStorage) – that could be a later enhancement.
- Implementing automatic theme detection based on OS preference (we already have some via CSS media query, but we may want to override).

## Dependencies

- Completion of M02.07 (refined design tokens) so that we have the final token values to override.
- Tailwind configured with design tokens (M02.01).

## Files / Areas Expected To Change

- `design/themes/light.ts` – update overrides.
- `design/themes/dark.ts` – update overrides.
- Possibly `design/themeContext.ts` – new file.
- `app/globals.ts` or `app/layout.tsx` – to apply theme (if we go with CSS variables approach).
- `tailwind.config.js` – if we enable Tailwind dark mode with a class strategy.
- `design/README.md` – update to explain theme usage.

## Implementation Guidance

1. Determine the theme strategy: We already have CSS variables in `app/globals.css` that change based on `prefers-color-scheme`. We can keep that and also support a manual override by adding a `data-theme` attribute to the `<html>` element and adjusting the CSS variables accordingly. This is a common approach.
   - We can update `app/globals.css` to define CSS variables based on tokens, and then use a class or attribute to switch.
   - Alternatively, we can use Tailwind's dark mode by setting `darkMode: 'class'` and then adding a `dark` class to the `<html>` element when dark mode is active. Then we can use `dark:` utilities.
   Given we are already using Tailwind, the latter might be simpler for component styling. However, we already have CSS variables for background and foreground. We can keep both: use CSS variables for global colors and Tailwind dark mode for component-level utilities that need to change based on dark mode (e.g., border colors, shadows). We'll need to decide.

   For planning, we will assume we will adopt Tailwind's dark mode with a class strategy, and we will store the theme preference in a context that adds/removes the `dark` class on the `<html>` element.

2. Update `tailwind.config.js` to set `darkMode: ['class', '[data-theme="dark"]']` or simply `'class'` and we will manage the class via a context.

3. Create a theme context that provides a `theme` value ('light' | 'dark') and a toggle function, and updates the class on the documentElement.

4. Wrap the application in the theme provider (e.g., in `app/layout.tsx`).

5. Update the theme files to output the token overrides in a format that can be used by the context (maybe we just keep them as JavaScript objects and the context merges them with base tokens).

6. Ensure that components can access the current theme via the context if needed.

7. Add a theme toggle button in the design system showcase (later).

## Acceptance Criteria

- [ ] Light and dark theme files define overrides for at least colors and elevations.
- [ ] A theme context/provider exists that allows toggling between themes.
- [ ] The application correctly applies the selected theme (e.g., background color changes when toggled).
- [ ] No lint or type‑check errors introduced.
- [ ] Documentation updated to reflect theme usage.

## Testing Requirements

- Manual verification: toggle the theme and observe that colors, shadows, etc., change accordingly.
- Run `npm run lint` and `npm run typecheck`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Theme switching should not cause layout thrashing; we should avoid forcing synchronous layouts.
- Ensure that contrast ratios meet WCAG AA in both themes.
- The mechanism for storing theme preference (if added later) should not expose private data.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Create dark/light themes.
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components. Styling: Tailwind CSS with custom design tokens.
