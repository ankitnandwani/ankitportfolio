# M05.05 — Integrate into homepage and ensure responsiveness

## Objective

Integrate the ProfessionalSnapshot, SummaryCopy, and CapabilityAreas components into the homepage layout below the hero section, ensuring proper responsiveness, accessibility, and visual hierarchy. This task completes the professional snapshot section (Milestone 5) implementation.

## Context

After creating the individual components for the professional snapshot (metric cards, summary copy, capability areas), we need to assemble them into a cohesive section on the homepage. This integration should follow the information architecture outlined in PRD §9 and the visual hierarchy designed for recruiter comprehension. The professional snapshot section should appear directly below the hero section and above other sections like career timeline or projects.

## Requirements
- Create a ProfessionalSection container component that orchestrates the three sub-components
- Import and use ProfessionalSnapshot, SummaryCopy, and CapabilityAreas components
- Arrange components in the following order:
  1. ProfessionalSnapshot (metric cards)
  2. SummaryCopy (brief professional summary)
  3. CapabilityAreas (key capability labels)
- Ensure proper spacing and visual hierarchy between sections
- Use the ResponsiveContainer component from src/components/layout/ResponsiveContainer.tsx for consistent width constraints
- Ensure the section is responsive and works well on mobile and desktop
- Follow the visual language: premium, bold, minimal, dimensional, technical
- Ensure accessibility:
   * Proper heading structure if needed
   * Sufficient color contrast
   * Support for reduced motion preferences
   * Logical tab order
- Do not invent professional information; section should display whatever data is provided to sub-components
- The section should be easily importable and usable in app/page.tsx or other layout files

## Scope

### In scope
- ProfessionalSection React component (src/components/professionalSection/index.tsx)
- Integration of ProfessionalSnapshot, SummaryCopy, and CapabilityAreas components
- Usage of ResponsiveContainer for layout constraints
- Proper spacing and visual hierarchy using design system spacing tokens
- Responsive behavior (mobile/desktop layouts)
- Accessibility considerations (heading structure, color contrast, etc.)
- Export from index.ts for easy import
- Update to app/page.tsx to include the professional section below the hero

### Out of scope
- Creating the individual components (M05.02, M05.03, M05.04)
- Creating the data models or data files (M05.01)
- Data validation against resume
- Styling that requires invented professional information
- Sections beyond the professional snapshot (career timeline, projects, etc.)
- Complex animations beyond what's in the individual components

## Dependencies
- M05.02: Create ProfessionalSnapshot component (must be completed first)
- M05.03: Add summary copy section (must be completed first)
- M05.04: Add capability areas section (must be completed first)
- Existing ResponsiveContainer component
- Theme context for accessing design tokens

## Files / Areas Expected To Change
- src/components/professionalSection/index.tsx (new file)
- src/components/professionalSection/index.ts (new file)
- app/page.tsx (update to include professional section below hero)
- Potential updates to src/components/index.ts if barrel exports are used

## Implementation Guidance
1. Create src/components/professionalSection directory
2. Create index.tsx with the ProfessionalSection component
3. Create index.ts export file
4. Import the three sub-components:
   * ProfessionalSnapshot from '@/src/components/professionalSnapshot'
   * SummaryCopy from '@/src/components/summaryCopy'
   * CapabilityAreas from '@/src/components/capabilityAreas'
5. Import ResponsiveContainer from '@/src/components/layout/ResponsiveContainer'
6. Structure the component:
   * Wrap everything in ResponsiveContainer
   * Create a section with appropriate spacing (use design system spacing)
   * Render ProfessionalSnapshot first
   * Add vertical spacing
   * Render SummaryCopy
   * Add vertical spacing
   * Render CapabilityAreas
7. Apply appropriate typography and styling:
   * Use design system spacing for margins/padding between components
   * Consider adding a visually hidden heading for screen readers if beneficial
   * Ensure background colors work with both light and dark modes
8. Implement responsive behavior:
   * The ResponsiveContainer already handles width constraints
   * Internal components should handle their own responsiveness
   * Ensure overall section flows well on different screen sizes
9. Follow accessibility guidelines:
   * Ensure logical document order (header -> hero -> professional snapshot -> ...)
   * Check color contrast between text and backgrounds
   * Support reduced motion preferences (already handled in sub-components if they use motion)
   * Avoid causing focus traps or accessibility regressions
10. Update app/page.tsx:
    * Import ProfessionalSection from '@/src/components/professionalSection'
    * Place the ProfessionalSection component below the Hero component inside the ResponsiveContainer
    * Maintain existing structure and metadata
11. Do not invent professional information; use placeholder data from the data models during development
12. Follow the existing code style in the repository (TypeScript, React best practices)

## Acceptance Criteria
- [ ] src/components/professionalSection/index.tsx file created
- [ ] ProfessionalSection component integrates all three sub-components
- [ ] Component uses ResponsiveContainer for layout
- [ ] Proper spacing and visual hierarchy between sub-components
- [ ] Updated app/page.tsx includes the professional section below the hero
- [ ] Responsive layout works on mobile and desktop
- [ ] No invented professional information is displayed (will show placeholder data from sub-components)
- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Component can be imported and used in other files

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Optional: Verify that the homepage renders correctly in development mode
- [ ] Optional: Check that there are no console errors or warnings related to the new component

## Security / Privacy Considerations
- No security concerns as components only display provided data
- Ensure no PII is inadvertently introduced through component props or state
- Components should not perform any data validation or transformation that could invent information

## Performance / Accessibility Considerations
- [ ] Section should be lightweight and not cause unnecessary re-renders
- [ ] Accessibility:
   * Color contrast ratio >= 4.5:1 for normal text
   * Font sizes >= 16px equivalent for body text
   * Logical heading structure (consider adding visually hidden heading for section if beneficial)
   * Support for user-scaled text (relative units)
   * Touch targets adequate size if any interactive elements
   * Navigation flow: hero -> professional snapshot -> next section should be logical
- [ ] Performance: efficient rendering, no expensive calculations in render loop
- [ ] Consider using React.memo for sub-components if they receive stable props and re-render frequently

## Definition of Done
- ProfessionalSection component created and exported
- Component successfully integrates ProfessionalSnapshot, SummaryCopy, and CapabilityAreas
- Section is properly placed in homepage below hero
- Responsive layout implemented and working
- TypeScript and lint checks pass
- No invented professional information in the section
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §9: Homepage structure - Professional Snapshot section placement
- PRD §11: Professional Snapshot - all sub-sections (metric cards, summary copy, capability areas)
- PRD §60: Design System - use of NeoPOP-inspired elevated cards and components
- PRD §62: Typography - proper hierarchical typography
- PRD §71: Accessibility target WCAG 2.2 AA
- PRD §74: Performance targets
- PRD §3.1: Beautiful + useful - visual design should enhance comprehension
- PRD §3.2: Form is function - visual presentation should communicate engineering quality