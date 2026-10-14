# M10.03 — Create resume summary component and integrate summary data

## Objective

Create a React component that displays the professional summary section of the resume, using the data from `src/data/summaryCopyData.ts`. This component will be used in the resume page to showcase Ankit's professional summary.

## Context

The resume summary provides a concise overview of Ankit's professional background, expertise, and value proposition. The data for this section is already defined in `summaryCopyData.ts` (though currently contains placeholder values that need to be verified against the resume in a separate task). This task focuses on creating the UI component and integrating the existing data model.

## Requirements

- Create a new component `ResumeSummary` in `src/components/resume/ResumeSummary.tsx`.
- The component should accept the summary data as a prop (or import it directly from `src/data/summaryCopyData.ts`).
- Display the summary text in a visually prominent but appropriate style consistent with the site's design system.
- Use appropriate typography (likely a slightly larger font size than body text) and spacing.
- Ensure the component is accessible (semantic HTML, proper contrast).
- Follow the same patterns as other section components (e.g., `ProfessionalSection`, `AchievementsSection`) regarding layout, theming, and reduced motion support.
- Integrate the component into the resume page (`app/resume/page.tsx`).

## Scope

### In scope
- Creating the `ResumeSummary` component.
- Importing and displaying the summary data from `src/data/summaryCopyData.ts`.
- Adding the component to the resume page layout.

### Out of scope
- Verifying the accuracy of the summary data against the actual resume (this should be done separately as part of data validation).
- Adding animations beyond what is standard for section components.
- Creating alternative layouts or variations.

## Dependencies
- M10.02 (resume page route and layout) should be completed first, as this task adds a component to that page.
- The summary data model exists from M10.01 (though the data itself may need verification).

## Files / Areas Expected To Change
- `src/components/resume/ResumeSummary.tsx` – new file to be created.
- `app/resume/page.tsx` – to import and include the `ResumeSummary` component.

## Implementation Guidance
1. Create the directory `src/components/resume/` if it doesn't exist.
2. Create `src/components/resume/ResumeSummary.tsx` following the pattern of other section components:
   - Use `'use client'` directive.
   - Import necessary dependencies: `React`, `motion` from `framer-motion`, `useTheme` from `@/design/themeContext`.
   - Define props interface (if accepting data as prop) or import data directly.
   - Implement reduced motion detection hook.
   - Create motion variants for container and content.
   - Render the summary text with appropriate styling (using theme tokens for colors).
   - Consider using a `Card` component from `@/src/components/ui/Card` for elevation and styling.
   - Ensure proper heading level (likely `<h2>` for section title and `<p>` for summary text, or vice versa depending on semantic structure).
3. Update `app/resume/page.tsx` to import the `ResumeSummary` component and place it in the main content area, replacing the placeholder text.
4. Ensure the component respects the site's theme (light/dark mode) by using theme tokens.

## Acceptance Criteria
- [ ] The `ResumeSummary` component is created and exports correctly.
- [ ] The component displays the summary text from `src/data/summaryCopyData.ts`.
- [ ] The component is integrated into the resume page and visible when navigating to `/resume`.
- [ ] The component follows the site's design system (colors, typography, spacing).
- [ ] The component supports reduced motion preferences.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and confirm the summary section is visible and readable.
- [ ] Check that the summary text matches the data in `summaryCopyData.ts`.
- [ ] Test with reduced motion enabled (if possible) to ensure no problematic animations.
- [ ] Verify light/dark mode toggling works correctly (if theme switching is implemented).
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.

## Security / Privacy Considerations
- The summary data should not contain any personally identifiable information beyond what is already public in a professional resume (no phone number, address, etc.). This task assumes the data model is correct; verification of actual content is a separate concern.

## Performance / Accessibility Considerations
- The component should be lightweight and not cause performance issues.
- Ensure sufficient color contrast between text and background.
- Use semantic HTML elements (e.g., `<section>`, `<h2>`, `<p>`) for accessibility.
- Ensure the component is keyboard navigable (though it's primarily static content).

## Definition of Done
- The resume summary component is successfully created, integrated into the resume page, and displays the summary data.
- The task is ready for the next task (M10.04) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume with summary, experience, skills, education, certifications, achievements.
- The summary data model is defined in `src/data/summaryCopyData.ts` (created in M10.01).