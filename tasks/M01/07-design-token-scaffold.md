# M01.07 — Design Token Scaffold

## Objective

Provide an initial set of design tokens (colors, spacing, typography, etc.) and theme files that will serve as the foundation for the custom NeoPOP‑inspired design system.

## Context

The Architecture milestone calls for “Create design‑token architecture scaffold.” This prepares the visual language early, allowing downstream components to reference a single source of truth. The PRD’s design‑system section (§58) emphasizes a custom design token layer.

## Requirements

1. Create a `design/` directory at the repository root (if not already present from M01.06).
2. Inside `design/`, add:
   - `tokens.ts` – Export a `tokens` object containing at least:
     ```ts
     export const tokens = {
       colors: {
         primary: "#1A73E8",
         background: "#FFFFFF",
         surface: "#F5F5F5",
         text: "#212121",
         accent: "#FF5722",
       },
       spacing: {
         xs: 4,
         sm: 8,
         md: 16,
         lg: 24,
         xl: 32,
       },
       typography: {
         fontFamily: ""Inter, system-ui, sans-serif",
         fontSize: {
           base: "1rem",
           lg: "1.125rem",
           xl: "1.25rem",
         },
         lineHeight: {
           normal: 1.5,
           relaxed: 1.75,
         },
       },
       radius: {
         none: "0",
         sm: "4px",
         md: "8px",
         lg: "12px",
       },
       // Additional tokens can be added later.
     } as const;
     ```
   - `themes/light.ts` – Export a `lightTheme` object that spreads `tokens` and optionally overrides any values (e.g., `background`).
   - `themes/dark.ts` – Export a `darkTheme` object that adapts colors for dark mode (e.g., `background: "#121212"`).
3. Add an `index.ts` file inside `design/` that re‑exports the tokens and themes:
   ```ts
   export { tokens } from "./tokens";
   export { lightTheme } from "./themes/light";
   export { darkTheme } from "./themes/dark";
   ```
4. Commit the new files.

## Scope

### In scope
- Creation of the `design/` directory and token/theme files.
- Exporting the token objects for later consumption.

### Out of scope
- Integrating the tokens into UI components (that will happen in later milestones).
- Adding a full design‑system library (NeoPOP will be added later).

## Dependencies

- **M01.06** – The `design/` folder must exist (created in the architecture task).
- **M01.02** – The project must already be a TypeScript Next.js app for the token files to be type‑checked.

## Files / Areas Expected To Change

- `design/tokens.ts`
- `design/themes/light.ts`
- `design/themes/dark.ts`
- `design/index.ts`

## Implementation Guidance

- Keep the token definitions simple and flat; they will be expanded later.
- Use `as const` to preserve literal types for strong TypeScript inference.
- Ensure the files compile without errors (`npm run typecheck`).

## Acceptance Criteria

- [ ] `design/tokens.ts` exists and exports a `tokens` constant.
- [ ] `design/themes/light.ts` and `design/themes/dark.ts` exist and export theme objects.
- [ ] `design/index.ts` re‑exports the tokens and themes.
- [ ] `npm run typecheck` succeeds with the new files.
- [ ] All files are committed.

## Testing Requirements

- Import `tokens` and `lightTheme` in a temporary TypeScript file (e.g., `src/lib/token-test.ts`) and run `tsc` to confirm type safety.
- Run `npm run typecheck` – should report **0 errors**.

## Security / Privacy Considerations

- No secrets are introduced.
- Tokens should not contain brand‑specific sensitive data.

## Performance / Accessibility Considerations

- Tokens are static and have negligible runtime cost.
- Designing a clear token system supports consistency and accessibility (e.g., defined contrast colors).

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- No unrelated changes were made.

## Related Requirements

- **PRD** – Section 58 (Design System) – calls for a custom token architecture.
- **ROADMAP** – Milestone 1 (Architecture) – “Create design‑token architecture scaffold”.
- **AGENTS.md** – Rule: “Maintain TypeScript strict mode.”
