# M06.02 — Create timeline container component

## Objective

Create a React component that serves as the container for the career timeline, responsible for layout, loading the timeline data, and providing the overall structure for individual timeline entries.

## Context

The career timeline will be displayed as a vertical timeline (or horizontal on larger screens) where each entry represents a professional position. The container component will manage the timeline data and pass each entry to the company card component for display.

## Requirements

- Create a React component named `CareerTimeline` in `src/components/careerTimeline/CareerTimeline.tsx`
- The component should import the timeline data from `src/data/careerTimeline.ts`
- The component should map over the timeline entries and render each entry using the `CompanyCard` component (to be created in M06.03)
- Implement a basic layout that positions entries in a vertical timeline with a connecting line (or dots) on larger screens, and adapts to a stacked layout on mobile
- Use the existing design system tokens and styling conventions (Tailwind CSS with custom design tokens)
- Ensure the component is reusable and does not contain any hardcoded professional information
- Follow the existing component structure in the repository (e.g., similar to `ProfessionalSection` or `Hero`)

## Scope

### In scope
- Container component for the career timeline
- Layout for timeline entries (vertical line with cards on sides, or alternating sides)
- Importing and passing timeline data to child components
- Basic responsive behavior (mobile vs desktop layout)
- Use of design system tokens for spacing, colors, etc.

### Out of scope
- Individual company card UI and expandable details (handled in M06.03)
- Data modeling (handled in M06.01)
- Animations for expand/collapse (handled in M06.07)
- Integration into the homepage (handled in M06.05)
- Mobile-specific layout adaptations beyond basic responsiveness (handled in M06.06)

## Dependencies
- M06.01 – Define career timeline data model (data must be available)
- M06.03 – Create company card component (child component)

## Files / Areas Expected To Change
- src/components/careerTimeline/CareerTimeline.tsx (new file)
- src/components/careerTimeline/index.ts (optional, for barrel export)
- Potential updates to existing imports if any

## Implementation Guidance
1. Create the directory `src/components/careerTimeline/`
2. Create `CareerTimeline.tsx` with a functional component
3. Import the timeline data from `src/data/careerTimeline.ts`
4. Map over the data and render each entry with a `<CompanyCard />` component
5. Implement a timeline layout using Tailwind CSS:
   - A vertical line (border) on the left or center
   - Cards positioned to the right (or alternating left/right) of the line
   - Use pseudo-elements or separate divs for the line and cards
6. Ensure the component is responsive: on mobile, cards stack full-width and the line may be omitted or adapted
7. Follow the existing component patterns in the repository (e.g., export default the component)
8. Add PropTypes or TypeScript props if needed (likely none besides children, but we can accept a prop for data override for testing)
9. Ensure the component does not fetch data directly; it should receive data as props or import from the data file (we choose import for simplicity)
10. Use existing design tokens for spacing (e.g., from `~/design/tokens`) if applicable

## Acceptance Criteria
- [ ] src/components/careerTimeline/CareerTimeline.tsx file created
- [ ] Component imports timeline data from src/data/careerTimeline.ts
- [ ] Component maps over timeline entries and renders CompanyCard for each entry
- [ ] Component implements a basic timeline layout (visual representation of a timeline with connecting line)
- [ ] Component is responsive (at least distinguishes between mobile and desktop layout)
- [ ] No hardcoded professional information in the component
- [ ] TypeScript compiles without errors
- [ ] Code follows existing code style and conventions in the repository

## Testing Requirements
- [ ] TypeScript typecheck passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] No new lint errors introduced
- [ ] Component renders without errors when imported and used with mock data

## Security / Privacy Considerations
- No security or privacy concerns as this task only involves UI component creation with imported data
- Ensure no personal identifiable information (PII) is invented or included in the component

## Performance / Accessibility Considerations
- Consider rendering performance for a large number of entries (should be fine for a career timeline)
- Ensure the timeline is navigable via keyboard (tab focus) – basic accessibility will be enhanced in M06.08
- Use semantic HTML where appropriate (e.g., <section>, <article>)

## Definition of Done
- Timeline container component created and functional
- Component correctly imports and displays timeline data (using placeholder data from M06.01)
- Basic timeline layout implemented
- Component is responsive
- Task completed when all acceptance criteria are met and checks pass

## Related Requirements
- PRD §13: Career Timeline - interactive timeline
- PRD: "Each position should expand into: company, role, dates, domain, key responsibilities, major technologies, notable projects"