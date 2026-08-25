# Design

Design system scaffolding, tokens, and themes.

The design tokens are integrated with Tailwind CSS via `tailwind.config.js`.

See [NEOPOP_EVALUATION.md](./NEOPOP_EVALUATION.md) for the evaluation of NeoPOP components and usage decisions.

## Compatibility Layer

We have created a compatibility layer that wraps NeoPOP primitives to ensure consistent use of our design tokens. The wrapped components are located in `src/components/ui/` and exported from `src/components/ui/index.ts`.

Currently wrapped components:
- Button
- Card
- Badge

These components map our design tokens (colors, spacing, radius) to appropriate NeoPOP props or Tailwind classes, enabling easy consumption across the application.
