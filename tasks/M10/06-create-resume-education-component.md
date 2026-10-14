# M10.06 — Create resume education component and integrate education data

## Objective

Create a React component that displays the education section of the resume, using the data from `src/data/education.ts`. This component will present Ankit's educational background in a clear, concise format suitable for a professional resume.

## Context

The education data model defines the structure for educational qualifications (institution, degree, field of study, dates, location, description). The resume education component should present this information in a way that is easy to read and fits naturally within the overall resume layout.

## Requirements

- Create a new component `ResumeEducation` in `src/components/resume/ResumeEducation.tsx`.
- The component should display education data from `src/data/education.ts`.
- Present each educational entry with appropriate detail:
  - Institution name, degree, field of study.
  - Date range.
  - Location (if available).
  - Description (if available).
- The presentation should be suitable for a resume (typically reverse-chronological order).
- Ensure the component is accessible and follows reduced motion preferences.
- Integrate the component into the resume page (`app/resume/page.tsx`).

## Scope

### In scope
- Creating the `ResumeEducation` component.
- Importing and displaying education data from `src/data/education.ts`.
- Adding the component to the resume page layout.

### Out of scope
- Modifying the education data model (this is assumed to be correct from M10.01, though the data itself may need verification).
- Creating additional sections such as certifications or professional development unless specified separately.
- Verifying the accuracy of the education data against the actual resume (separate validation task).

## Dependencies
- M10.02 (resume page route and layout) should be completed first.
- The education data model exists from M10.01.

## Files / Areas Expected To Change
- `src/components/resume/ResumeEducation.tsx` – new file to be created.
- `app/resume/page.tsx` – to import and include the `ResumeEducation` component.

## Implementation Guidance
1. Create the directory `src/components/resume/` if it doesn't exist.
2. Create `src/components/resume/ResumeEducation.tsx`:
   - Use `'use client'` directive.
   - Import `React`, `motion` from `framer-motion`, `useTheme` from `@/design/themeContext`.
   - Import `educationData` and `EducationEntry` from `@/src/data/education.ts`.
   - Define props interface if needed.
   - Implement reduced motion detection hook.
   - Decide on layout: likely a simple list of entries, possibly using cards or a simple container.
   - For each educational entry, display:
     - Institution and degree as a header.
     - Field of study.
     - Date range (formatted nicely).
     - Location (if present).
     - Description (if present).
   - Use appropriate spacing and typography (heading levels, body text).
   - Consider using the `Card` component for each entry or a container card for the entire section.
   - Ensure semantic structure (e.g., `<section>` for the component, `<h2>` for section title, `<article>` or `<div>` for each entry).
3. Update `app/resume/page.tsx` to import the `ResumeEducation` component and place it in the desired order (typically after experience and before skills, or according to standard resume order).
4. Ensure the component respects the site's theme (light/dark mode) by using theme tokens.

## Acceptance Criteria
- [ ] The `ResumeEducation` component is created and exports correctly.
- [ ] The component attempts to display education data from `src/data/education.ts` (handles placeholder data gracefully).
- [ ] The component is integrated into the resume page and visible when navigating to `/resume`.
- [ ] The component follows the site's design system (colors, typography, spacing).
- [ ] The component supports reduced motion preferences.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and confirm the education section is visible.
- [ ] Check that the component handles empty data gracefully (shows appropriate placeholder or message).
- [ ] Test with reduced motion enabled.
- [ ] Verify light/dark mode toggling works correctly.
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.

## Security / Privacy Considerations
- The education data should not contain any sensitive information beyond what is appropriate for a public resume (this is assumed to be already vetted). No additional considerations beyond standard data handling.

## Performance / Accessibility Considerations
- The component should be lightweight and not cause performance issues.
- Ensure sufficient color contrast between text and background.
- Use semantic HTML elements for accessibility.
- Ensure the component is keyboard navigable.

## Definition of Done
- The resume education component is successfully created, integrated into the resume page, and handles the education data (even if placeholder).
- The task is ready for the next task (M10.07) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume with summary, experience, skills, education, certifications, achievements.
- The education data model is defined in `src/data/education.ts` (created in M10.01).