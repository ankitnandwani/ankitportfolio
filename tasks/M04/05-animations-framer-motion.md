# M04.05 — Animations using Framer Motion

## Objective
Implement subtle animations for the Hero section using Framer Motion, including floating technology tokens, gentle movements, and hover effects on buttons, while respecting reduced-motion preferences.

## Context
Animations should enhance the premium feel of the Hero section without being distracting or causing performance issues. We'll use Framer Motion (already integrated in the project per Milestone 2) to create subtle, natural movements. Key animations may include:
- Floating technology tokens (small decorative elements that drift slowly)
- Gentle hover lift on CTA buttons
- Optional subtle fade-in or scale-up of the Hero content on entry
All animations should respect the user's prefers-reduced-media setting.

## Context
This task builds upon the visual composition from M04.04 and adds motion to bring the Hero section to life. We'll use Framer Motion's motion components and animation variants.

## Requirements
- Use Framer Motion's `motion` component or `useAnimation` hooks for animations
- Implement floating animation for technology tokens (if implemented in M04.04): slow, gentle drift in random directions
- Add subtle hover animation to primary CTA buttons: slight lift or shadow increase on hover
- Optionally add entrance animation for the Hero section (fade-in, scale-up)
- All animations should respect `prefers-reduced-media`: detect reduced motion preference and disable or reduce animations accordingly
- Use design system motion tokens if available (from design/motion.ts) or define appropriate animation values
- Ensure animations are performant and do not cause layout thrashing
- Animations should be subtle and not distract from the core message
- Ensure accessibility: animations should not trigger seizures or discomfort

## Scope

### In scope
- Framer Motion animation implementation for Hero section elements
- Floating tokens animation (if technology tokens are implemented)
- Hover animations on CTA buttons
- Entrance animation for Hero content
- Reduced-motion detection and handling
- Use of motion tokens or appropriate animation values (duration, easing)
- Integration with existing Hero component structure

### Out of scope
- Basic layout and typography (covered in M04.01)
- CTA button functionality (covered in M04.02 and M04.03)
- NeoPOP visual composition structure (covered in M04.04)
- Responsive behavior adjustments (covered in M04.06)
- Complex animations that affect layout or performance
- Animations that require physics or complex interactions
- Integration with actual live data (we'll animate static placeholder elements)

## Dependencies
- M02.05 – Define motion (animation presets) using Framer Motion
- M02.07 – Refine and finalize design tokens
- M02.08 – Implement dark/light themes with token overrides
- M04.01 – Hero typography and basic layout
- M04.04 – NeoPOP visual composition (for elements to animate)

## Files / Areas Expected To Change
- `src/components/hero/Hero.tsx` (to add Framer Motion components and animations)
- May need to update `design/motion.ts` if we need to define specific animation presets for Hero (but we can use inline definitions)
- May need to import `motion` from 'framer-motion' and use `useReducedMotion` hook or media query

## Implementation Guidance
1. Import `{ motion } from 'framer-motion'` in Hero.tsx
2. For floating technology tokens (if implemented):
   - Wrap each token in a `motion.div` or `motion.span`
   - Define animation variants: e.g., `float` animation that moves the element up and down or side to side slowly
   - Use `useCycle` or `useAnimation` with `useEffect` to create continuous looping animation
   - Alternatively, use CSS animations with Framer Motion's `animate` prop with keyframes
   - Keep animation duration long (e.g., 6-10 seconds) and amplitude small (e.g., 4-8px)
   - Use easing like "easeInOut" or "linear" for smooth drifting
3. For hover animations on primary CTA buttons:
   - Wrap each Button (or the Link wrapping Button) in a `motion.div` or use the Button's ability to accept motion props? We'll need to check if our Button component forwards ref and props correctly.
   - Since our Button component uses `forwardRef`, we can wrap it with motion.div and pass the ref through
   - Define hover variant: scale up slightly (e.g., scale: 1.02) or lift (translateY: -2px) with increased shadow
   - Use `whileHover` or `hover` prop on motion component
4. For entrance animation:
   - Wrap the main Hero content (or sections) in a `motion.div`
   - Define initial, animate, and exit variants if needed (e.g., fade in from opacity 0 to 1, scale from 0.95 to 1)
   - Use `animate` prop on mount
5. Implement reduced-motion detection:
   - Use `@media (prefers-reduced-motion: reduce)` in CSS or use React hook to detect JS media query
   - Framer Motion respects the reduced-motion preference by default when using `motion` components? Actually, Framer Motion does not automatically respect prefers-reduced-motion; we need to implement it ourselves.
   - We can create a custom hook or use `useMediaQuery` from 'framer-motion' or use `window.matchMedia`
   - Alternatively, we can define animation variants that are overridden when reduced motion is preferred (e.g., set animation to false or use very subtle animations)
6. Use design system motion tokens if available:
   - Check design/motion.ts for presets
   - If not defined, we can define appropriate values directly in the component (but try to reuse existing patterns)
7. Ensure animations are performant:
   - Use `will-change` or `forceRendering` if needed (but use sparingly)
   - Avoid animating properties that cause layout changes (prefer transform and opacity)
   - Limit the number of simultaneously animating elements
8. Test that animations work smoothly and are not janky
9. Ensure that when reduced motion is preferred, animations are disabled or substantially reduced

## Acceptance Criteria
- [ ] Framer Motion is used to implement animations in the Hero section
- [ ] Technology tokens (if present) have a gentle floating animation
- [ ] Primary CTA buttons have a subtle hover animation (lift or scale)
- [ ] Hero section has an appropriate entrance animation (fade-in/scale-up)
- [ ] All animations respect reduced-motion preferences (disabled or minimized when preferred)
- [ ] Animations are performant and do not cause layout thrashing
- [ ] Animations are subtle and do not distract from the core message
- [ ] Code follows existing patterns and style in the codebase

## Testing Requirements
- Manual verification of animations in light and dark modes
- Verify floating tokens drift gently (if implemented)
- Verify button hover animations work smoothly
- Verify entrance animation occurs on page load
- Test with reduced-motion preference enabled (can simulate in dev tools): animations should be disabled or greatly reduced
- Check performance using browser dev tools (look for dropped frames or layout shifts)
- Verify animations work in both directions (mount/unmount if applicable)
- Test accessibility: ensure animations do not cause discomfort or seizure risk

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only handles visual animations

## Performance / Accessibility Considerations
- Use transform and opacity animations for best performance (avoid top/left changes)
- Keep animation duration reasonable to avoid excessive CPU/GPU usage
- Provide option to disable animations for users who prefer reduced motion
- Ensure animations do not interfere with screen readers (they should not read animated values)
- Follow WCAG 2.2 AA regarding animation (non-interference, ability to disable)

## Definition of Done
- Animations are implemented using Framer Motion in the Hero section
- Animations respect reduced-motion preferences
- Animations are subtle, performant, and enhance the premium feel
- Code is committed and passes linting/typechecking
- All acceptance criteria are met

## Related Requirements
- PRD.md: Hero Section (§10) – Animation and reduced‑motion support
- ROADMAP.md: Milestone 4 – Hero Section (Animation and reduced‑motion support)
- DECISIONS.md: Animation library – Framer Motion / Motion as specified in PRD.