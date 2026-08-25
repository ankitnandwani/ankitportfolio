# Design

Design system scaffolding, tokens, and themes.

The design tokens are integrated with Tailwind CSS via `tailwind.config.js`. The tokens include elevation (shadow) levels and breakpoint values that are also integrated with Tailwind.

See [NEOPOP_EVALUATION.md](./NEOPOP_EVALUATION.md) for the evaluation of NeoPOP components and usage decisions.

## Compatibility Layer

We have created a compatibility layer that wraps NeoPOP primitives to ensure consistent use of our design tokens. The wrapped components are located in `src/components/ui/` and exported from `src/components/ui/index.ts`.

Currently wrapped components:
- Button
- Card
- Badge

These components map our design tokens (colors, spacing, radius) to appropriate NeoPOP props or Tailwind classes, enabling easy consumption across the application.

## Motion

We have defined a set of reusable animation presets using Framer Motion in `design/motion.ts`. These variants include fade, scale, slide, and float animations that can be used with Framer Motion's `motion` components to ensure consistent transitions and interactions across the application.

## Breakpoints

We have defined responsive breakpoint tokens in `design/tokens.ts` and integrated them with Tailwind's `screens` configuration. This allows consistent use of responsive utilities like `sm:`, `md:`, `lg:` etc. across the application.
