# Design

Design system scaffolding, tokens, and themes.

The design tokens are integrated with Tailwind CSS via `tailwind.config.js`. The tokens include elevation (shadow) levels, breakpoint values, typography, spacing, radius, and color values that are also integrated with Tailwind.

See [NEOPOP_EVALUATION.md](./NEOPOP_EVALUATION.md) for the evaluation of NeoPOP components and usage decisions.

## Design Tokens

Our design system includes the following token categories:

### Colors
- Primary: `#0D47A1` (deep blue)
- Background: `#FFFFFF` (white)
- Surface: `#F5F5F5` (light gray)
- Text: `#212121` (dark gray)
- Accent: `#FF6F00` (vibrant orange)

### Spacing
Values are in pixels and divided by 4 for Tailwind's spacing scale (1 unit = 4px):
- xxs: 2px → 0.5
- xs: 4px → 1
- sm: 8px → 2
- md: 16px → 4
- lg: 24px → 6
- xl: 32px → 8
- xxl: 48px → 12
- xxxl: 64px → 16

### Typography
- Font Family: `Inter, system-ui, sans-serif`
- Font Sizes: 
  xxs: 0.75rem, xs: 0.875rem, sm: 1rem, base: 1.125rem, lg: 1.25rem, xl: 1.5rem, 2xl: 1.875rem, 3xl: 2.25rem, 4xl: 3rem, 5xl: 3.75rem, 6xl: 4.5rem
- Font Weights: regular (400), medium (500), semiBold (600), bold (700), extraBold (800), black (900)
- Line Heights: none (1), tight (1.25), snug (1.375), normal (1.5), relaxed (1.625), loose (2)
- Letter Tracking: tighter (-0.05em), tight (-0.025em), normal (0), wide (0.025em), wider (0.05em), widest (0.1em)

### Radius
- none: 0px
- sm: 4px
- md: 8px
- lg: 16px
- xl: 24px
- pill: 9999px

### Elevation (Shadow Levels)
- none: `0 0 #0000`
- sm: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- md: `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.08)`
- lg: `0 8px 10px rgba(0,0,0,0.14), 0 3px 14px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2)`
- xl: `0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)`

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
