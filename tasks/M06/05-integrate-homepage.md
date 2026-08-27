# M06.05 — Integrate timeline into homepage

## Objective

Add the career timeline component to the homepage layout, positioning it after the professional snapshot section (or as defined in the information architecture).

## Context

According to PRD §9 (Homepage structure), the career timeline (referred to as "Career Journey") appears after the professional snapshot and selected impact sections. For Milestone 6, we are adding the career timeline component. The homepage currently renders Hero and ProfessionalSection. We will insert the CareerTimeline component after ProfessionalSection.

## Requirements

- Import the `CareerTimeline` component from `src/components/careerTimeline` in `app/page.tsx`
- Place the `<CareerTimeline />` component after `<ProfessionalSection className="mt-12" />` (or with appropriate spacing)
- Ensure the component is wrapped within the `ResponsiveContainer` (as are Hero and ProfessionalSection)
- Add appropriate spacing or styling to separate the timeline from adjacent sections (use margin or padding)
- Do not modify any existing functionality of Hero or ProfessionalSection
- Ensure the homepage still compiles and renders correctly
- Follow the existing import and component usage patterns in the repository

## Scope

### In scope
- Import and inclusion of CareerTimeline component in app/page.tsx
- Proper placement in the JSX order
- Spacing/layout adjustments for visual separation
- Ensuring the component receives no additional props (it imports its own data)

### Out of scope
- Styling of the CareerTimeline component itself (handled in its own implementation)
- Data validation or modification
- Changes to other sections (Hero, ProfessionalSection)
- Mobile-specific layout adjustments (handled in M06.06)
- Animations (handled in M06.07)

## Dependencies
- M06.02 – Create timeline container component (component must be available)
- M06.04 – Populate career timeline data from resume (data must be available)

## Files / Areas Expected To Change
- app/page.tsx (modify to import and include CareerTimeline)

## Implementation Guidance
1. Open app/page.tsx
2. Import CareerTimeline at the top with other imports: `import { CareerTimeline } from '@/src/components/careerTimeline';`
   - Adjust the path if the component uses a barrel index or direct path
3. In the JSX, after the ProfessionalSection component, add `<CareerTimeline className="mt-16" />` (or similar spacing)
   - Use a margin-top that matches the spacing used between sections (currently ProfessionalSection has mt-12; we can use mt-16 or mt-20 for consistency)
4. Ensure the component is placed within the main element inside ResponsiveContainer
5. Save the file and verify that the homepage still builds correctly
6. Run lint and typecheck to ensure no errors

## Acceptance Criteria
- [ ] app/page.tsx imports CareerTimeline component
- [ ] app/page.tsx renders <CareerTimeline /> after ProfessionalSection
- [ ] Appropriate spacing is added (e.g., mt-16 or consistent with design)
- [ ] No existing functionality is altered
- [ ] TypeScript compiles without errors
- [ ] Lint passes without new errors
- [ ] The homepage renders correctly in development (next dev)

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] The component renders on the homepage when running next dev and inspecting the DOM

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves importing and rendering a component

## Performance / Accessibility Considerations
- Consider the performance impact of rendering additional components (should be fine)
- Ensure the timeline is accessible (will be addressed in M06.08)

## Definition of Done
- Career timeline component is visible on the homepage after the professional snapshot section
- Component is properly imported and placed
- Spacing is appropriate
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §9: Homepage structure - Career Journey after Professional Snapshot and Selected Impact
- PRD §13: Career Timeline - interactive timeline component