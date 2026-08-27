# M05.02 — Create ProfessionalSnapshot component with metric cards

## Objective

Create a React component that displays the professional snapshot metrics in a visually strong layout using the design system. The component should consume the data model defined in M05.01 and present the information as metric cards suitable for quick recruiter comprehension.

## Context

After defining the data structures for professional snapshot metrics, we need to create a UI component that presents this information effectively. The ProfessionalSnapshot component will be placed below the hero section on the homepage and should use NeoPOP-inspired elevated cards or similar design system components to create a premium, dimensional appearance as specified in the PRD and design system guidelines.

## Requirements
- Create a ProfessionalSnapshot React component that imports and uses the professional snapshot data model
- Display four metric cards as described in PRD §11:
  1. Engineering experience (e.g., "10+ YEARS")
  2. Multi-domain experience (list of domains)
  3. API + UI + Mobile automation experience
  4. Cloud + CI/CD production engineering practices
- Use the Card component from src/components/ui/Card.tsx or create custom elevated cards following the design system
- Apply appropriate typography from the design system tokens (strong display font for numbers, readable body font for labels)
- Ensure the component is responsive and works well on mobile and desktop
- Follow the visual language principles: premium, bold, minimal, dimensional, technical
- Do not invent professional information; component should display whatever data is provided from the data model
- Component should be reusable and accept data as props for flexibility

## Scope

### In scope
- ProfessionalSnapshot React component (src/components/professionalSnapshot/index.tsx)
- Usage of design system Card component or creation of custom card variants
- Layout of four metric cards in a responsive grid
- Typography styling using design system tokens
- Responsive behavior (adjust layout for different screen sizes)
- Proper TypeScript typing for props consuming the professional snapshot data model
- Export from index.ts for easy import

### Out of scope
- Creating the actual professional snapshot data (this is M05.01)
- Summary copy section (M05.03)
- Capability areas section (M05.04)
- Data validation against resume
- Integration into homepage layout (M05.05)
- Styling that requires invented professional information

## Dependencies
- M05.01: Define professional snapshot data model (must be completed first)
- Existing design system components (Card, etc.)
- Theme context for accessing design tokens

## Files / Areas Expected To Change
- src/components/professionalSnapshot/index.tsx (new file)
- src/components/professionalSnapshot/index.ts (new file)
- Potential updates to src/components/index.ts if barrel exports are used

## Implementation Guidance
1. Create src/components/professionalSnapshot directory
2. Create index.tsx with the ProfessionalSnapshot component
3. Create index.ts export file
4. Import the professional snapshot data model from src/data/professionalSnapshot.ts
5. Use the Card component to create elevated metric cards
6. For each metric:
   - Display a prominent number/value (for years experience) or list (for domains)
   - Display a descriptive label underneath
   - Use appropriate sizing and spacing from design tokens
7. Implement responsive layout:
   - On desktop: display cards in a row or grid
   - On mobile: stack cards vertically or in two-column grid
8. Use Framer Motion for subtle animations if appropriate (follow hero section pattern)
9. Ensure accessibility:
   - Proper heading structure if needed
   - Sufficient color contrast (use design system colors)
   - Support for reduced motion preferences
10. Follow the existing code style in the repository (TypeScript, React best practices)

## Acceptance Criteria
- [ ] src/components/professionalSnapshot/index.tsx file created
- [ ] ProfessionalSnapshot component renders four metric cards
- [ ] Component correctly imports and uses data from professional snapshot data model
- [ ] Uses design system Card component for elevated appearance
- [ ] Responsive layout works on mobile and desktop
- [ ] No invented professional information is displayed (will show placeholder data)
- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Component can be imported and used in other files

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Optional: Add a simple test to verify component renders without crashing (if using testing framework)

## Security / Privacy Considerations
- No security concerns as component only displays provided data
- Ensure no PII is inadvertently included in component logic
- Component should not perform any data validation or transformation that could invent information

## Performance / Accessibility Considerations
- [ ] Component should be lightweight and not cause unnecessary re-renders
- [ ] Follow accessibility guidelines:
   * Use semantic HTML where appropriate
   * Ensure sufficient color contrast ratio (WCAG AA)
   * Support reduced motion preferences if animations are used
   * Ensure touch targets are adequate size on mobile
- [ ] Performance: efficient rendering, no expensive calculations in render loop

## Definition of Done
- ProfessionalSnapshot component created and exported
- Component displays four metric cards using design system principles
- Responsive layout implemented
- TypeScript and lint checks pass
- No invented professional information in component
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §11: Professional Snapshot - metric cards section
- PRD §60: Design System - use of NeoPOP-inspired elevated cards
- PRD §62: Typography - strong display font for metrics
- PRD §71: Accessibility target WCAG 2.2 AA
- PRD §74: Performance targets