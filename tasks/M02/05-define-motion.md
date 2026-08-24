# M02.05 — Define motion (animation presets) using Framer Motion

## Objective

Install Framer Motion and create a set of reusable animation presets (variants) that align with the design system's motion principles, enabling consistent transitions and animations across the application.

## Context

The PRD specifies Framer Motion as the animation library. Motion is a key part of the NeoPOP-inspired design system, contributing to the dimensional and interactive feel. We will define a collection of named animation variants (e.g., fadeIn, scaleTap, float) that can be used with the `motion` component or custom wrappers.

## Requirements

- Install `framer-motion` as a dependency.
- Create a file `design/motion.ts` (or `src/animations.ts`) that exports an object of animation variants.
- Define at least the following preset variants:
  - `fadeIn`: opacity from 0 to 1, optional duration.
  - `fadeOut`: opacity from 1 to 0.
  - `scaleIn`: scale from 0 to 1, with opacity.
  - `scaleTap`: a press feedback scale down then up.
  - `float`: a gentle floating animation for hover or idle states.
  - `slideIn` (from left/right/top/bottom).
- Ensure the variants are compatible with Framer Motion's `variants` prop and can be used with `initial`, `animate`, `exit`.
- Optionally, create a custom hook or utility function that simplifies applying these variants.
- Update documentation to explain the motion system.

## Scope

### In scope

- Installing Framer Motion.
- Creating the motion preset file.
- Defining a core set of animation variants.
- Documenting usage.

### Out of scope

- Creating complex animation sequences tied to specific components (that will be done in component implementations).
- Integrating with gesture libraries (e.g., useDrag) unless needed for preset.
- Server‑side rendering considerations beyond what Framer Motion handles automatically.

## Dependencies

- None (except the existing Next.js setup).

## Files / Areas Expected To Change

- `package.json` – add `framer-motion` dependency.
- `design/motion.ts` – new file with animation presets.
- `design/README.md` – update to mention motion presets.
- Possibly `tsconfig.json` if we need to adjust paths (unlikely).

## Implementation Guidance

1. Install Framer Motion:
   ```bash
   npm install framer-motion
   ```

2. Create `design/motion.ts` with content like:
   ```typescript
   import { Variant } from 'framer-motion';

   export const motionVariants = {
     fadeIn: {
       initial: { opacity: 0 },
       animate: { opacity: 1, transition: { duration: 0.2 } },
       exit: { opacity: 0, transition: { duration: 0.2 } },
     },
     fadeOut: {
       initial: { opacity: 1 },
       animate: { opacity: 0, transition: { duration: 0.2 } },
     },
     scaleIn: {
       initial: { scale: 0, opacity: 0 },
       animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
     },
     scaleTap: {
       whileTap: { scale: 0.95 },
     },
     float: {
       initial: { y: 0 },
       animate: { y: [-10, 0, -10], transition: { duration: 3, repeat: Infinity } },
     },
     slideInFromLeft: {
       initial: { x: -100, opacity: 0 },
       animate: { x: 0, opacity: 1, transition: { duration: 0.3 } },
     },
     // Add more as needed
   };
   ```

3. Ensure the file is exported properly (named export or default export).

4. Add a simple test: create a component that uses `motion.div` with one of the variants and verify it animates in dev mode.

5. Run the dev server to ensure no errors.

## Acceptance Criteria

- [ ] `framer-motion` installed and listed in `package.json`.
- [ ] `design/motion.ts` exists and exports animation variants.
- [ ] The Next.js application builds and runs without errors.
- [ ] Manual verification shows that a component using a motion variant animates as expected.
- [ ] No lint or type‑check errors introduced.

## Testing Requirements

- Manual verification: render a `motion.div` with `variants={motionVariants.fadeIn}` and `initial="initial" animate="animate"` and see it fade in.
- Run `npm run lint` and `npm run typecheck`.

## Security / Privacy Considerations

- None.

## Performance / Accessibility Considerations

- Animation preferences: respect `prefers-reduced-motion`. We should consider adding a reduced‑motion variant or using `useReducedMotion` hook from Framer Motion. However, for the definition of motion presets, we can note that we will later integrate reduced‑motion support. For now, we can define variants that are optional and will be conditionally applied based on a reduced‑motion flag.
- Performance: keep animations lightweight; avoid layout‑thrashing properties.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- Type-check passes.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 58 (Design System): Define motion.
- **ROADMAP** – Milestone 2 – Design System.
- **DECISIONS.md** – Animation library: Framer Motion / Motion as specified in PRD.
