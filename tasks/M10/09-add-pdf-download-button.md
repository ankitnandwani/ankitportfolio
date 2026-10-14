# M10.09 — Add PDF download button and link

## Objective

Add a prominent PDF download button/link to the resume page that allows visitors to download Ankit's traditional PDF resume. This complements the interactive resume component by providing access to the official document.

## Context

The resume page already features an interactive version of the resume (summary, experience, skills, etc.). However, many recruiters and hiring managers prefer or require a traditional PDF resume for printing, ATS systems, or record-keeping. The PDF download button ensures that visitors can easily access the official resume document while still benefiting from the interactive experience.

## Requirements

- Add a PDF download button/link to the resume page (`app/resume/page.tsx`).
- The button should link to the existing PDF resume at `/resume.pdf` (as referenced in the hero section).
- Use the same button styling as other primary/secondary actions on the site (e.g., the `Button` component from `@/src/components/ui/Button`).
- Ensure the button is accessible (proper label, keyboard accessible).
- Consider adding an icon (e.g., file-text or download) to visually indicate PDF download.
- Ensure the button respects the site's theme (light/dark mode) and loading states if needed.
- The button should be placed in a logical location on the resume page (e.g., at the top or bottom, or as a floating action button).

## Scope

### In scope
- Adding a PDF download button/link to the resume page.
- Using the existing `/resume.pdf` path (no need to create or modify the PDF file).
- Styling the button consistently with the site's design system.

### Out of scope
- Creating or modifying the actual PDF resume file.
- Adding PDF viewing capabilities within the page (embed PDF viewer) unless specified separately.
- Changing the URL or location of the PDF file.

## Dependencies
- M10.02 (resume page route and layout) should be completed first.
- The interactive resume components (summary, experience, etc.) should be in place or being developed in parallel.

## Files / Areas Expected To Change
- `app/resume/page.tsx` – to import and include the PDF download button.

## Implementation Guidance
1. Determine the best placement for the PDF download button on the resume page. Common patterns include:
   - At the top of the page (above or below the interactive resume).
   - At the bottom of the page (after all resume sections).
   - As a floating action button (fixed position).
   - In the header or as part of a call-to-action section.
   Given the structure of other pages (e.g., home page has download button in hero secondary CTAs), a reasonable approach is to place it prominently but not disrupt the flow of the interactive resume.
2. Update `app/resume/page.tsx`:
   - Import the `Button` component from `@/src/components/ui/Button`.
   - Add a button that links to `/resume.pdf` using the `next/link` component for prefetching (similar to how it's done in the hero section).
   - Example:
     ```typescript
     import Link from 'next/link';
     import { Button } from '@/src/components/ui/Button';

     // Inside the page component:
     <Link href="/resume.pdf" prefetch>
       <Button variant="secondary" size="lg">
         Download PDF Resume
       </Button>
     </Link>
     ```
   - Optionally add an icon (e.g., from `react-icons` or `heroicons`) to the button.
   - Ensure the button is accessible by providing clear text ("Download PDF Resume").
3. Ensure the button uses appropriate variant (likely secondary, as the primary action might be to view the interactive resume or contact).
4. Verify that the link works correctly and navigates to `/resume.pdf` (or triggers a download, depending on server configuration).

## Acceptance Criteria
- [ ] The PDF download button/link is present on the resume page.
- [ ] The button/link navigates to `/resume.pdf` when clicked.
- [ ] The button follows the site's button styling conventions (using the `Button` component).
- [ ] The button is accessible (proper label, keyboard navigable).
- [ ] TypeScript compiles without errors.
- [ ] ESLint passes without new errors.

## Testing Requirements
- [ ] Manual verification: navigate to `/resume` and confirm the PDF download button is visible.
- [ ] Click the button and verify it navigates to `/resume.pdf` (or triggers a PDF download).
- [ ] Check that the button uses the correct variant and size.
- [ ] Test keyboard navigation (Tab to focus, Enter to activate).
- [ ] Verify light/dark mode toggling works correctly (if theme switching is implemented).
- [ ] Run `npm run lint` and `npm run typecheck` to ensure code quality.

## Security / Privacy Considerations
- The PDF file is assumed to be already hosted at `/resume.pdf`. This task only links to it.
- **Important**: The public website must not expose the phone number. While the interactive resume component should be vetted to ensure it doesn't include the phone number, the PDF file itself may contain the phone number (as noted in the PRD). This is outside the scope of this task; however, the team should be aware that the PDF may contain sensitive information and consider whether to regenerate the PDF with redactions if necessary. This task does not modify the PDF.

## Performance / Accessibility Considerations
- The button should be lightweight and not cause performance issues.
- Ensure sufficient color contrast for the button text and background.
- The link should be keyboard accessible and clearly identifiable as a link/button.
- Consider adding `rel="noopener noreferrer"` if using an external link, but for internal links (`/resume.pdf`) this is less critical.

## Definition of Done
- The PDF download button/link is successfully added to the resume page and functions correctly.
- The task is ready for the next task (M10.10) to depend on it.

## Related Requirements
- PRD §22: Resume Experience — Interactive resume + PDF download.
- ROADMAP Milestone 10: Resume — Interactive resume component + PDF download.
- The hero section already includes a link to `/resume.pdf` (see `src/components/hero/Hero.tsx`).