# M04.03 — Secondary CTA buttons

## Objective
Implement the secondary call-to-action buttons for the Hero section: "Download Resume", "LinkedIn", and "GitHub". These buttons should be less prominent than the primary CTAs but still accessible, linking to the resume PDF and external profiles.

## Context
The secondary CTAs provide additional ways for visitors to engage: downloading the resume, viewing the LinkedIn profile, and viewing the GitHub profile. These should be styled appropriately (likely as text links or secondary buttons) and placed together, possibly below the primary CTAs or in a separate row.

## Requirements
- Create three secondary CTA elements:
  1. "Download Resume" - links to the resume PDF (likely /resume.pdf or the actual PDF URL)
  2. "LinkedIn" - links to Ankit's LinkedIn profile
  3. "GitHub" - links to Ankit's GitHub profile
- Use appropriate styling: likely secondary button variant or text links with icons
- For the resume link, ensure it opens in a new tab or same tab appropriately
- For external links (LinkedIn, GitHub), they should open in a new tab with rel="noopener noreferrer"
- Use icons for LinkedIn and GitHub (can use simple text or consider adding icon components later)
- Ensure accessibility: proper labels, keyboard navigable, screen reader friendly
- Use design system tokens for sizing, spacing, and colors where applicable
- Layout should allow for appropriate placement (likely horizontally spaced or wrapped)

## Scope

### In scope
- Secondary CTA button/link components
- Navigation logic for resume download and external links
- Styling using design system tokens (via Tailwind or custom classes)
- Accessibility attributes (target, rel, aria-label if needed)
- Use of Next.js Link for internal resume link (if internal) or anchor tags for external
- Integration into the Hero component

### Out of scope
- Primary CTA buttons (covered in M04.02)
- Visual composition elements (covered in M04.04)
- Animations (covered in M04.05)
- Responsive behavior adjustments (covered in M04.06)
- Actual icon components (if we decide to add them later; can use text for now)
- Dynamic generation of LinkedIn/GitHub URLs (we'll use static URLs from configuration or constants)

## Dependencies
- M02.01 – Install NeoPOP and configure Tailwind with design tokens
- M02.03 – Create compatibility layer
- M02.07 – Refine and finalize design tokens
- M03.01 – Navigation bar (for external link patterns)
- M03.02 – Footer (for social link patterns, though we may create our own)

## Files / Areas Expected To Change
- `src/components/hero/Hero.tsx` (to include the secondary CTA buttons/links)
- Potentially create a constants file for URLs if not already present (we can use siteConfig.ts or create a new one)
- May need to update `siteConfig.ts` to include LinkedIn and GitHub URLs if not already there

## Implementation Guidance
1. Check if siteConfig.ts already contains LinkedIn and GitHub URLs; if not, add them
2. For the resume link, we can link to the existing resume.pdf at the root (or /resume.pdf)
3. In Hero.tsx, create three elements:
   - Download Resume: use an anchor tag or Button with variant="secondary" (if we have a secondary variant) linking to the resume PDF
   - LinkedIn: anchor tag with LinkedIn URL, target="_blank", rel="noopener noreferrer"
   - GitHub: anchor tag with GitHub URL, target="_blank", rel="noopener noreferrer"
4. Consider using the Button component for Download Resume with a secondary variant (we may need to extend Button.tsx to support secondary variant, or use a different approach like outline button)
   - Alternatively, we can use a simple styled link that looks like a secondary button
   - Let's check if Button.tsx supports variant="secondary"; from earlier code, it maps 'accent' to primary, and only primary/secondary/accent are accepted. The variant prop is used: neoVariant = variant === 'accent' ? 'primary' : variant; So secondary should work as is (maps to secondary). However, NeoPOP Button may not have a secondary variant; we need to check. But we can still use the Button component and it will fallback to something.
   - For simplicity, we can use the Button component for Download Resume with variant="secondary", and for LinkedIn/GitHub use plain anchor tags styled appropriately.
5. Apply appropriate spacing between the secondary CTAs (using gap or margin)
6. Ensure the secondary CTAs are visually distinct from primary CTAs (less prominent)
7. Add appropriate hover/focus styling for accessibility
8. For external links, add visually hidden screen reader text indicating they open in a new tab (or use aria-label)
9. Ensure the resume link works correctly (opens PDF in browser or downloads)

## Acceptance Criteria
- [ ] Three secondary CTA elements are displayed: "Download Resume", "LinkedIn", "GitHub"
- [ ] "Download Resume" links to the resume PDF and opens/displays it correctly
- [ ] "LinkedIn" links to Ankit's LinkedIn profile in a new tab
- [ ] "GitHub" links to Ankit's GitHub profile in a new tab
- [ ] Secondary CTAs are visually distinct from primary CTAs (less prominent)
- [ ] All secondary CTA elements are accessible (keyboard navigable, screen reader friendly)
- [ ] External links open in new tab with proper rel attributes
- [ ] Secondary CTAs respect dark and light mode themes
- [ ] Code follows existing patterns and style in the codebase

## Testing Requirements
- Manual testing of each link:
  - Verify Download Resume navigates to/resumes.pdf and displays/downloads correctly
  - Verify LinkedIn link opens LinkedIn profile in new tab
  - Verify GitHub link opens GitHub profile in new tab
- Verify visual appearance in light and dark modes
- Test keyboard navigation (tab to each element, press enter to activate)
- Check accessibility using axe or similar tools (focus order, labels, new tab warnings)
- Verify external links have target="_blank" and rel="noopener noreferrer"
- Test in different viewport sizes to ensure layout works

## Security / Privacy Considerations
- No security concerns for this component
- No privacy concerns as it only links to public profiles and resume
- Ensure no sensitive information is exposed in the resume (phone number should be redacted per PRD §37)

## Performance / Accessibility Considerations
- Use efficient rendering for links/buttons
- Ensure sufficient contrast for secondary CTA text/buttons
- Provide clear indication that external links open in new tab (for accessibility)
- Keep hit areas appropriately sized for touch targets
- Follow WCAG 2.2 AA for link contrast and focus indicators

## Definition of Done
- Secondary CTA buttons/links are implemented and functional
- Links work correctly to their respective destinations
- Secondary CTAs are accessible and follow WCAG 2.2 AA
- Code is committed and passes linting/typechecking
- All acceptance criteria are met

## Related Requirements
- PRD.md: Hero Section (§10) – Secondary CTAs
- ROADMAP.md: Milestone 4 – Hero Section (Secondary CTA)
- PRD.md: Resume Experience (§22) – PDF download and phone number redaction