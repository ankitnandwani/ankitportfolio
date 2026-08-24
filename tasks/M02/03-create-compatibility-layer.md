# M02.03 — Create compatibility layer

## Objective

Create a set of wrapper components that adapt NeoPOP primitives to our design system, ensuring consistent use of design tokens (colors, spacing, typography, radius) and enabling easy consumption across the application.

## Context

After evaluating NeoPOP components (M02.02), we will wrap the selected primitives to expose a stable API that aligns with our token scale. This layer allows us to change the underlying implementation (e.g., switch to a different library) without affecting consumers, and ensures all components inherit our design language.

## Requirements

- Create a directory `src/components/ui` (or similar) to house the compatibility layer.
- For each NeoPOP component decided to be used (e.g., Button, Card, etc.), create a wrapper component that:
  - Accepts props compatible with our design system (e.g., `size`, `variant`, `colorScheme`).
  - Maps our design tokens to appropriate NeoPOP props or Tailwind classes.
  - Forward ref and remaining props to the underlying NeoPOP component.
  - Include proper TypeScript typings.
- Export the wrapped components from a single index (e.g., `src/components/ui/index.ts`) for easy import.
- Ensure the wrappers are purely presentational; they should not contain business logic.
- Optionally, create a base wrapper that handles common token mapping (e.g., converting our spacing tokens to NeoPOP's spacing prop if applicable).
- Update any documentation to reflect the new component location.

## Scope

### In scope

- Creating wrapper components for NeoPOP primitives that we intend to use as‑is or with minor adaptation.
- Setting up the component export structure.
- Adding TypeScript definitions.
- Basic usage example in a story or test (optional).

### Out of scope

- Building custom components from scratch (e.g., navigation, timeline) – those are part of later milestones.
- Implementing complex logic or state management within wrappers.
- Styling with CSS modules or styled-components; we will rely on Tailwind and token passing.

## Dependencies

- Completion of M02.01 (NeoPOP installed) and M02.02 (evaluation) to know which components to wrap.
- Tailwind configured with design tokens (M02.01) so that we can use token-based classes if needed.

## Files / Areas Expected To Change

- `src/components/ui/` – new directory with wrapper component files (e.g., `Button.tsx`, `Card.tsx`, etc.).
- `src/components/ui/index.ts` – exports.
- Possibly `src/components/index.ts` if we have a barrel export.
- Update `design/README.md` to reference the compatibility layer.

## Implementation Guidance

1. Based on the evaluation, select a small set of primitives to wrap first (e.g., Button, Card, Badge, Input, Avatar). We can expand later.
2. For each component:
   - Create a file `src/components/ui/Button.tsx`.
   - Import the NeoPOP equivalent (e.g., `import { Button as NeoButton } from '@neopop/react';`).
   - Define props interface that includes our design system attributes (e.g., `variant?: 'primary' | 'secondary' | 'accent'; size?: keyof typeof tokens.spacing;`).
   - Map props to NeoPOP props: e.g., convert our size token to NeoPOP's size prop (maybe NeoPOP uses `size: 'sm' | 'md' | 'lg'`). We may need to create a mapping object.
   - Use Tailwind classes for any additional styling not covered by NeoPOP props (optional).
   - Export the component.
   - Add to `src/components/ui/index.ts`.
3. Ensure all components are properly typed and ref‑forwarded if needed.
4. Add a simple story or example in `docs/` or `stories/` to verify rendering (optional).
5. Run the dev server to ensure no errors.

## Acceptance Criteria

- [ ] Directory `src/components/ui` exists with at least three wrapped NeoPOP components (e.g., Button, Card, Badge).
- [ ] Each wrapper correctly maps design token props to NeoPOP props or Tailwind classes.
- [ ] The wrappers are exported from a common index file.
- [ ] The application still builds and runs without errors.
- [ ] No lint or type‑check errors introduced.
- [ ] Documentation updated to reflect the compatibility layer.

## Testing Requirements

- Manual verification: render a wrapped component in a test page and inspect that it adopts the expected styling from tokens.
- Run `npm run lint` and `npm run typecheck`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Wrappers should not add unnecessary render overhead; they should forward props efficiently.
- Ensure that the wrapped components inherit accessibility features from NeoPOP (or add missing ones).

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Create compatibility layer.
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Design system: Custom NeoPOP‑inspired design system, built on top of NeoPOP components.
