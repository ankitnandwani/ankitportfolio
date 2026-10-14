# M10.07 — Create resume certifications component and integrate certifications data

## Objective

Create a React component that displays the certifications section of the resume, using the data from `src/data/certifications.ts`. This component will present Ankit's professional certifications in a clear, verifiable format suitable for a resume.

## Context

The certifications data model includes certification name, issuer, date, and optional verification URL. The resume certifications component should present this information in a way that is easy to read and allows viewers to verify the credentials if desired (while being careful not to fabricate verification links).

## Requirements

- Create a new component `ResumeCertifications` in `src/components/resume/ResumeCertifications.tsx`.
- The component should display certifications data from `src/data/certifications.ts`.
- Present each certification with appropriate detail:
  - Certification name.
  - Issuing organization.
  - Date of certification.
  - Verification URL (if available and valid) – note: never fabricate verification links.
- The presentation should be suitable for a resume (typically listed in reverse-chronological order or by relevance).
- Ensure the component is accessible and follows reduced motion preferences.
- Integrate the component into the resume page (`app/resume/page.tsx`).

## Scope

### In scope
- Creating the `ResumeCertifications` component.
- Importing and displaying certifications data from `src/data/certifications.ts`.
- Adding the component to the resume page layout.

### Out of scope
- Modifying the certifications data model (this is assumed to be correct from M10.01, though the data itself may need verification).
- Creating additional sections such as awards or honors unless specified separately.
- Verifying the accuracy of the certifications data against the actual resume (separate validation task).
- Implementing actual verification of certification links (beyond displaying them if provided).

## Dependencies
- M10.02 (resume page route and layout) should be completed first.
- The certifications data model exists from M10.01.

## Files / Areas Expected To Change
- `src/components/resume/ResumeCertifications.tsx` – new file to be created.
- `app/resume/page.tsx` – to import and include the `ResumeCertifications` component.

## Implementation Guid
1. Create the directory `src/components/resume/` if it doesn't exist.
2. Create `src/components/resume/ResumeCertifications.tsx`:
   - Use `'use client'` directive.
   - Import `React`, `motion` from `framer-motion`, `useTheme` from `@/design/themeContext`.
   - Import `certificationsData` and `CertificationEntry` from `@/src/data/certifications.ts`.
   - Define props interface if needed.
   - Implement reduced motion detection hook.
   - Decide on layout: likely a simple list of certifications, possibly using cards or a simple container.
   - For each certification, display:
     - Name and issuer as a header.
     - Date (formatted nicely).
     - Verification URL (if present) as a link (with appropriate rel attributes for security: `target="_blank" rel="noopener noreferrer"`).
     - Description (if present).
   - Use appropriate spacing and typography.
   - Consider using the `Card` component for each certification or a container card for the entire section.
   - Ensure semantic structure (e.g., `<section>` for the component, `<h2>` for section title, `<article>` or `<div>` for each certification).
   - Important: Never assume or fabricate verification URLs; only display them if they exist in the data and are valid URLs.
3. Update `app/resume/page.tsx` to import the `ResumeCertifications` component and place it in the desired order (typically after education and before skills, or according to standard resume order).
4. Ensure the component respects the site's theme (light/dark mode) by using theme tokens.

## Acceptance Criteria
- [ ] The `ResumeCertifications` component is created and exports correctly.
- [ ] The component attempts to display certifications data from `src/data/certifications.ts` (handles placeholder data gracefully).
- [ ] The component is integrated into the resume page and visible when navigating to `/resume`.
- [ ] The component follows the site's design system (colors, typography, spacing).
- [ ] The component supports reduced motion preferences.
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and confirm the certifications section is visible.
- [ ] Check that the component handles empty data gracefully (shows appropriate placeholder or message).
- [ ] If verification URLs are present, verify they render as links and open in a new tab with proper security attributes.
- [ ] Test with reduced motion enabled.
- [ ] Verify light/dark mode toggling works correctly.
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.

## Security / Privacy Considerations
- The certifications data should not contain any sensitive information beyond what is appropriate for a public resume.
- **Critical**: Never fabricate or assume verification URLs. Only display URLs that are explicitly provided in the data model.
- If verification URLs are included, ensure they are rendered with `target="_blank" rel="noopener noreferrer"` to prevent security vulnerabilities.

## Performance / Accessibility Considerations
- The component should be lightweight and not cause performance issues.
- Ensure sufficient color contrast between text and background.
- Use semantic HTML elements for accessibility.
- Ensure the component is keyboard navigable.
- Links to verification URLs should be clearly identifiable as links and accessible.

## Definition of Done
- The resume certifications component is successfully created, integrated into the resume page, and handles the certifications data (even if placeholder).
- The task is ready for the next task (M10.08) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume with summary, experience, skills, education, certifications, achievements.
- The certifications data model is defined in `src/data/certifications.ts` (created in M10.01).