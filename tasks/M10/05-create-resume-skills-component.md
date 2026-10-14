# M10.05 — Create resume skills component and integrate skills data

## Objective

Create a React component that displays the technical skills section of the resume, using the data from `src/data/skills.ts`. This component will present Ankit's technical competencies in an organized, visually appealing format suitable for a resume.

## Context

The skills data model includes both a flat list of technical skills and an optional categorization by domain (quality engineering, backend/API, CI/CD, cloud/data, AI/modern engineering). The resume skills component should present this information in a way that is easy to read and highlights Ankit's technical breadth and depth.

## Requirements

- Create a new component `ResumeSkills` in `src/components/resume/ResumeSkills.tsx`.
- The component should display skills data from `src/data/skills.ts`.
- Present the skills in a clear, organized manner (e.g., by category if available, or as a list with visual grouping).
- Use appropriate UI elements (e.g., tags, badges, or simple lists) to represent individual skills.
- Ensure the component is accessible and follows reduced motion preferences.
- Integrate the component into the resume page (`app/resume/page.tsx`).

## Scope

### In scope
- Creating the `ResumeSkills` component.
- Importing and displaying skills data from `src/data/skills.ts`.
- Adding the component to the resume page layout.

### Out of scope
- Modifying the skills data model (this is assumed to be correct from M10.01, though the data itself may need verification).
- Creating an interactive skills visualization (such as a radar chart or network graph) unless specified separately.
- Verifying the accuracy of the skills data against the actual resume (separate validation task).

## Dependencies
- M10.02 (resume page route and layout) should be completed first.
- The skills data model exists from M10.01.

## Files / Areas Expected To Change
- `src/components/resume/ResumeSkills.tsx` – new file to be created.
- `app/resume/page.tsx` – to import and include the `ResumeSkills` component.

## Implementation Guidance
1. Create the directory `src/components/resume/` if it doesn't exist.
2. Create `src/components/resume/ResumeSkills.tsx`:
   - Use `'use client'` directive.
   - Import `React`, `motion` from `framer-motion`, `useTheme` from `@/design/themeContext`.
   - Import `skillsData` and `SkillsData` from `@/src/data/skills.ts`.
   - Define props interface if needed.
   - Implement reduced motion detection hook.
   - Decide on presentation format:
     - Option A: Display categorized skills in sections (if `categorizedSkills` is populated).
     - Option B: Display the flat `technicalSkills` list as tags or in columns.
     - Option C: Show both categorized and flat lists.
   - Given that the data model currently has empty arrays (placeholders), the component should handle empty or missing data gracefully (show placeholder text or hide empty sections).
   - Use appropriate spacing and typography.
   - Consider using the `Card` component for the skills section or individual skill tags.
   - Ensure semantic structure (e.g., `<section>` for the component, `<h2>` for section title).
3. Update `app/resume/page.tsx` to import the `ResumeSkills` component and place it after the experience component (or in the desired order).
4. Ensure the component respects the site's theme (light/dark mode) by using theme tokens.

## Acceptance Criteria
- [ ] The `ResumeSkills` component is created and exports correctly.
- [ ] The component attempts to display skills data from `src/data/skills.ts` (handles placeholder data gracefully).
- [ ] The component is integrated into the resume page and visible when navigating to `/resume`.
- [ ] The component follows the site's design system (colors, typography, spacing).
- [ ] The component supports reduced motion preferences.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and confirm the skills section is visible.
- [ ] Check that the component handles empty data gracefully (shows appropriate placeholder or message).
- [ ] Test with reduced motion enabled.
- [ ] Verify light/dark mode toggling works correctly.
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.

## Security / Privacy Considerations
- The skills data should not contain any sensitive information (this is assumed to be already vetted). No additional considerations beyond standard data handling.

## Performance / Accessibility Considerations
- The component should be lightweight and not cause performance issues.
- Ensure sufficient color contrast between text and background.
- Use semantic HTML elements for accessibility.
- Ensure the component is keyboard navigable.

## Definition of Done
- The resume skills component is successfully created, integrated into the resume page, and handles the skills data (even if placeholder).
- The task is ready for the next task (M10.06) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume with summary, experience, skills, education, certifications, achievements.
- The skills data model is defined in `src/data/skills.ts` (created in M10.01).