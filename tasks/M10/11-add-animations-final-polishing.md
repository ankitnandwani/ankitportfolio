# M10.11 — Add animations and final polishing

## Objective

Add subtle, purposeful animations to the resume page components using Framer Motion, and apply final polishing to ensure the resume page matches the site's overall quality, visual language, and user experience standards.

## Context

By this point, the resume page should be fully functional, responsive, accessible, and free of privacy issues. This task focuses on enhancing the user experience with animations (following the site's established patterns with Framer Motion) and making any final adjustments to ensure the page feels cohesive and polished.

## Requirements

- Add entrance animations to the resume page sections (summary, experience, skills, education, certifications, achievements) as they come into view, using Framer Motion variants similar to other sections on the site.
- Ensure animations respect the user's reduced motion preferences (detect via `matchMedia('(prefers-reduced-motion: reduce)')`).
- Consider adding subtle interactive animations (e.g., hover effects on buttons or cards) where appropriate.
- Verify that animations do not hinder accessibility or readability.
- Perform final polishing: check spacing, alignment, typography consistency, and overall visual harmony with the rest of the site.
- Ensure the PDF download button has appropriate hover and focus states.
- Make sure the page loads without layout shifts or visual glitches.

## Scope

### In scope
- Adding entrance animations to resume components using Framer Motion.
- Ensuring animations respect reduced motion preferences.
- Adding subtle interactive animations (hover, focus) where beneficial.
- Final visual polishing and consistency checks.

### Out of scope
- Changing the fundamental layout or structure of resume components.
- Adding complex animations that could distract from the content (e.g., parallax, heavy motion).
- Modifying the data or fixing content inaccuracies (assumed to be correct).
- Addressing accessibility or responsiveness issues (should have been resolved in previous task).

## Dependencies
- All resume components should be implemented and integrated into the resume page.
- The resume page should already be responsive and accessible (from M10.10).

## Files / Areas Expected To Change
- Any of the resume component files (`src/components/resume/*.tsx`) – to add animation variants and motion props.
- `app/resume/page.tsx` – potentially to add container animations or adjust layout for animations.

## Implementation Guidance
1. **Review Animation Patterns**:
   - Look at existing components (e.g., `AchievementsSection`, `ProfessionalSection`, `CareerTimeline`) to see how they implement entrance animations with `motion.div` and variants.
   - Note the use of `containerVariants` and `itemVariants` with staggered children.
   - Observe how reduced motion is handled (checking `prefersReducedMotion` and conditionally applying variants).
2. **Apply to Resume Components**:
   - For each resume component (summary, experience, skills, education, certifications, achievements), wrap the main content in a `motion.div` with entrance variants.
   - If the component displays multiple items (e.g., multiple positions, multiple skills, multiple educations), consider staggering the animation of child elements.
   - Use the same pattern: detect reduced motion, conditionally apply animation variants.
   - Example structure:
     ```typescript
     const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
       if (typeof window !== 'undefined') {
         return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
       }
       return false;
     });
     
     // Animation variants
     const containerVariants = {
       hidden: { opacity: 0 },
       show: {
         opacity: 1,
         transition: {
           staggerChildren: 0.1,
           delayChildren: 0.2,
         },
       },
     };
     
     const itemVariants = {
       hidden: { opacity: 0, y: 20 },
       show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
     };
     
     // In JSX:
     <motion.div
       initial={prefersReducedMotion ? undefined : containerVariants.hidden}
       animate={prefersReducedMotion ? undefined : containerVariants.show}
     >
       {items.map((item, index) => (
         <motion.div
           key={item.id || index}
           initial={prefersReducedMotion ? undefined : itemVariants.hidden}
           animate={prefersReducedMotion ? undefined : itemVariants.show}
         >
           {/* Item content */}
         </motion.div>
       ))}
     </motion.div>
     ```
   - For components that are single containers (e.g., summary), animate the container itself.
3. **Add Interactive Animations**:
   - Consider adding hover animations to buttons (using `whileHover` and `whileTap` as seen in other components).
   - Add focus animations for accessibility (`whileFocus`).
   - Ensure these animations are also disabled when reduced motion is preferred.
4. **Final Polishing**:
   - Check that spacing between sections is consistent (look at other pages for reference).
   - Verify that typography (heading sizes, body text) matches the site's style.
   - Ensure alignment is proper (e.g., text left-aligned, numbers right-aligned if applicable).
   - Look for any visual inconsistencies (e.g., mismatched borders, uneven spacing).
   - Ensure the PDF download button matches the button style used elsewhere (same variant, size, padding).
5. **Test Animations**:
   - Verify that animations play smoothly on entry.
   - Test with reduced motion enabled to ensure animations are disabled.
   - Check that animations do not cause layout shifts or performance issues.

## Acceptance Criteria
- [ ] Entrance animations are added to resume components (or at least to major sections) using Framer Motion.
- [ ] Animations respect the user's reduced motion preferences (are disabled when preferred).
- [ ] Interactive animations (hover, focus) are present where appropriate and also respect reduced motion.
- [ ] The resume page visually polishes and matches the site's overall aesthetic.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and observe entrance animations on page load.
- [ ] Test with reduced motion enabled (via system settings or browser dev tools) and confirm animations are disabled.
- [ ] Check hover and focus states on buttons and interactive elements.
- [ ] Perform final visual inspection: compare to other pages (home, projects) for consistency.
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.
- [ ] Verify that the resume page still builds correctly (`npm run build`).

## Security / Privacy Considerations
- No direct security or privacy implications from animations, as long as they do not inadvertently expose hidden content or affect data handling.

## Performance / Accessibility Considerations
- Animations should be lightweight and not cause jank or performance issues.
- Using `framer-motion` is consistent with the rest of the site and should be performant.
- Animations must not interfere with screen reader accessibility (ensure they do not hide content or cause confusion).
- Reduced motion preference must be respected to avoid triggering vestibular disorders.

## Definition of Done
- Animations have been added to the resume page components, respecting reduced motion preferences.
- Final polishing has been applied to ensure visual consistency and quality.
- The task is ready to be considered complete for the milestone.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume + PDF download.
- PRD §62: Animation library (Framer Motion / Motion) as specified in PRD.
- PRD §61: Visual Language — characteristics like premium, bold, minimal, dimensional, etc.