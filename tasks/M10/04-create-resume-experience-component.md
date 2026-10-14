# M10.04 — Create resume experience component and integrate experience data

## Objective

Create a React component that displays the professional experience section of the resume, using the data from `src/data/careerTimeline.ts`. This component will present Ankit's work history in a format suitable for a resume (potentially different from the interactive career timeline used on the homepage).

## Context

While the homepage features an interactive career timeline component (`CareerTimeline`), the resume may benefit from a different presentation of experience — perhaps a more traditional reverse-chronological list with detailed descriptions, or a hybrid approach. This task focuses on creating an experience component tailored for the resume page, leveraging the existing career timeline data model.

## Requirements

- Create a new component `ResumeExperience` in `src/components/resume/ResumeExperience.tsx`.
- The component should display each position from `careerTimelineData` with appropriate detail:
  - Company name, role, and dates.
  - Optionally: domain, responsibilities, technologies, and notable projects.
- The presentation should be suitable for a resume (clear, concise, easy to skim).
- Reuse existing UI patterns where appropriate (e.g., `Card` component, typography from theme).
- Ensure the component is accessible and follows reduced motion preferences.
- Integrate the component into the resume page (`app/resume/page.tsx`).

## Scope

### In scope
- Creating the `ResumeExperience` component.
- Importing and displaying data from `src/data/careerTimeline.ts`.
- Adding the component to the resume page layout.

### Out of scope
- Modifying the career timeline data model (this is assumed to be correct from previous milestones).
- Creating an exact duplicate of the homepage career timeline component (the resume may need a different layout).
- Verifying the accuracy of the experience data against the actual resume (separate validation task).

## Dependencies
- M10.02 (resume page route and layout) should be completed first.
- The career timeline data model exists from earlier milestones (M06).

## Files / Areas Expected To Change
- `src/components/resume/ResumeExperience.tsx` – new file to be created.
- `app/resume/page.tsx` – to import and include the `ResumeExperience` component.

## Implementation Guidance
1. Create the directory `src/components/resume/` if it doesn't exist.
2. Create `src/components/resume/ResumeExperience.tsx`:
   - Use `'use client'` directive.
   - Import `React`, `motion` from `framer-motion`, `useTheme` from `@/design/themeContext`.
   - Import `careerTimelineData` and `CareerTimelineEntry` from `@/src/data/careerTimeline`.
   - Define props interface if needed (e.g., to accept data override).
   - Implement reduced motion detection hook.
   - Decide on layout: possibly a simple list or using cards for each position.
   - For each position, display:
     - Role and company as a header.
     - Date range.
     - Domain (if available).
     - Responsibilities (as a list).
     - Technologies (as tags or list).
     - Notable projects (if any).
   - Use appropriate spacing and typography (heading levels, body text).
   - Consider using the `Card` component for each position or a container card for the entire section.
   - Ensure semantic structure (e.g., `<section>` for the component, `<h2>` for section title, `<article>` or `<div>` for each position).
3. Update `app/resume/page.tsx` to import the `ResumeExperience` component and place it after the summary component.
4. Ensure the component respects the site's theme (light/dark mode) by using theme tokens.

## Acceptance Criteria
- [ ] The `ResumeExperience` component is created and exports correctly.
- [ ] The component displays data from `src/data/careerTimeline.ts` (role, company, dates, etc.).
- [ ] The component is integrated into the resume page and visible when navigating to `/resume`.
- [ ] The component follows the site's design system (colors, typography, spacing).
- [ ] The component supports reduced motion preferences.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and confirm the experience section is visible and shows the expected positions.
- [ ] Check that all positions from `careerTimelineData` are displayed.
- [ ] Verify that the information displayed matches the data (e.g., role, company, dates).
- [ ] Test with reduced motion enabled.
- [ ] Verify light/dark mode toggling works correctly.
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.

## Security / Privacy Considerations
- The experience data should not contain any sensitive information beyond what is appropriate for a public resume (no internal project names that are confidential, etc.). This task assumes the data model is correct; verification of actual content is a separate concern.

## Performance / Accessibility Considerations
- The component should be lightweight and not cause performance issues.
- Ensure sufficient color contrast between text and background.
- Use semantic HTML elements for accessibility.
- Ensure the component is keyboard navigable.

## Definition of Done
- The resume experience component is successfully created, integrated into the resume page, and displays the experience data.
- The task is ready for the next task (M10.05) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume with summary, experience, skills, education, certifications, achievements.
- The career timeline data model is defined in `src/data/careerTimeline.ts` (used in M06 for the homepage career timeline).