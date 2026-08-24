# M02.09 — Create design system showcase route

## Objective

Create a dedicated route `/design-system` that documents and showcases the design system components, tokens, themes, and motion presets, serving as a visual reference and testing ground for developers and designers.

## Context

A design system is most valuable when it is easily accessible and understandable. By providing a showcase route, we can visualize how tokens translate to styles, see components in different states and themes, and experiment with motion presets. This route will be internal (not linked from the public site) but accessible during development.

## Requirements

- Create a new route under the `app` directory: `app/design-system/page.tsx` (and optionally a loading.tsx, error.tsx if needed).
- The showcase should include sections for:
  - Design tokens: display color palette, spacing scale, typography samples, radius, elevation, breakpoints, motion presets.
  - Components: render each wrapped component from the compatibility layer in various variants (e.g., Button primary/secondary, sizes, with icons).
  - Themes: show a toggle to switch between light and dark themes and see how components adapt.
  - Motion: demonstrate animation presets (maybe with a button to trigger).
- Use the design system components and tokens themselves to style the showcase (dogfooding).
- Ensure the route is responsive and accessible.
- Optionally, add a source code link or note that the implementation is open for inspection.
- Do not add any unnecessary dependencies.

## Scope

### In scope

- Creating the route and its UI.
- Populating the showcase with token tables and component examples.
- Implementing a theme toggle for the showcase (using the theme context from M02.08 if available).
- Ensuring the showcase uses the design system for its own styling.

### Out of scope

- Adding the route to the public site navigation (it should remain discoverable only by knowing the path).
- Writing extensive documentation beyond what fits in the showcase (we can link to external docs if needed).
- Implementing a live code editor or advanced interactivity beyond simple demonstrations.

## Dependencies

- Completion of M02.01 through M02.08 (so we have tokens, Tailwind, compatibility layer, motion presets, theme system).
- The app router is already set up.

## Files / Areas Expected To Change

- `app/design-system/page.tsx` – new file.
- Possibly `app/design-system/layout.tsx` if we need a separate layout (we can reuse the root layout).
- `app/design-system/tokens.tsx`, `app/design-system/components.tsx`, etc. – optional subcomponents to keep the page file clean.
- Update `design/README.md` to mention the showcase route.

## Implementation Guidance

1. Create the route directory and file:
   ```bash
   mkdir -p app/design-system
   ```
   Then create `page.tsx`.

2. In `page.tsx`, import React and any needed components from the compatibility layer and design tokens.

3. Structure the page with sections:
   - Header: "Ankit Design System Showcase"
   - Tokens section: display color swatches, spacing scale (visual bars), typography samples (different font sizes and weights), radius examples, elevation samples (boxes with shadows), breakpoint descriptions.
   - Components section: render each wrapped component (Button, Card, Badge, etc.) with props variations.
   - Themes section: a button that toggles the theme (using theme context) and shows the current theme.
   - Motion section: a button that triggers an animation (e.g., a card that pulses on click).

4. Use Tailwind classes derived from tokens for layout and styling (e.g., `container mx-auto py-8`, `space-y-6`, etc.). Since we have configured Tailwind with tokens, we can use the token values directly if we have configured them as theme extensions (e.g., `bg-primary` from tokens.colors.primary). If we haven't mapped all tokens to Tailwind, we can use inline styles with token values for demonstration.

5. Ensure the page is accessible: use semantic HTML, proper contrast, focusable controls.

6. Add a link to the showcase in the design system README for easy access.

7. Run the dev server to verify the route loads at `/design-system`.

## Acceptance Criteria

- [ ] Route `/design-system` is accessible and returns a 200 status.
- [ ] The page loads without errors in the development server.
- [ ] The showcase includes at least: token visualization, component examples, theme toggle, motion demonstration.
- [ ] The showcase uses design system components and tokens for its own styling (dogfooding).
- [ ] No lint or type‑check errors introduced.
- [ ] Documentation updated to mention the showcase.

## Testing Requirements

- Manual verification: navigate to `/design-system` and inspect each section.
- Run `npm run lint` and `npm run typecheck`.
- Ensure no build errors when running `npm run build`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- The showcase should be efficient; avoid rendering large lists of unnecessary items.
- Ensure sufficient contrast in both light and dark themes.
- Interactive elements should be keyboard accessible.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Create a private design-system showcase route.
- **ROADMAP** – Milestone 2 – Design System: Deliverable – A private design-system showcase route (e.g., `/design-system`).
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components. Styling: Tailwind CSS with custom design tokens.
