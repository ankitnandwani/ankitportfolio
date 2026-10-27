# M18.07 – Add Contact Form to Site (Homepage/Footer)

## Objective

Integrate the contact form into the site so recruiters can reach it from the homepage and footer, following the recruiter flow in PRD §91.

## Context

PRD §91 defines the recruiter flow:

```
Recruiter arrives → Understands role in 10 seconds → Sees achievements →
Explores experience → Checks projects → Asks AI a question → Pastes JD →
AI explains fit → Downloads resume → Contacts Ankit
```

The contact form is the final step "Contacts Ankit". It should be accessible from:
1. **Homepage** – Near the CTA section or after the job fit analyzer entry point
2. **Footer** – As a "Contact" link that opens the form (modal or dedicated page)

## Requirements

### Option A: Dedicated Contact Page (`/contact`)
- Create `app/contact/page.tsx` with the ContactForm component
- Add to navigation decision: PRD §8/§92 fix the navigation (8 items), so contact is NOT in main nav
- Link from footer "Contact" goes to `/contact`

### Option B: Modal on Homepage
- Contact form in a modal triggered from footer and homepage CTA
- More complex, but keeps user on page

### Recommended: Option A (Dedicated Page)
- Simpler implementation
- Better for SEO and direct linking
- Consistent with `/job-fit` and `/resume` pages
- Footer link navigates to `/contact`

## Requirements

- Create `app/contact/page.tsx`:
  - Server component with metadata
  - Renders `ContactForm` client component
  - Uses `generateBaseMetadata('Contact', ...)`
- Update `src/components/footer/Footer.tsx`:
  - Add "Contact" link in footer navigation
  - Links to `/contact`
  - Consistent with existing footer style
- Update `app/page.tsx`:
  - Add contact form entry point near job-fit analyzer entry
  - Or in a "Get in Touch" section near bottom of homepage
- Ensure the form works on the dedicated page
- No changes to main navigation (PRD §8/§92)

## Scope

### In scope

- `app/contact/page.tsx` (new)
- `src/components/footer/Footer.tsx` (updated)
- `app/page.tsx` (updated)

### Out of scope

- Contact form component (M18.02)
- API route (M18.03)
- Rate limiting (M18.04)
- Email delivery (M18.05)

## Dependencies

- M18.02 – ContactForm component
- M18.03 – API route
- M18.06 – Success/error states

## Files / Areas Expected To Change

- `app/contact/page.tsx` (new)
- `src/components/footer/Footer.tsx` (updated)
- `app/page.tsx` (updated)

## Implementation Guidance

1. **Contact page** (`app/contact/page.tsx`):
   - Follow the pattern of `app/job-fit/page.tsx` and `app/resume/page.tsx`
   - Server component with metadata
   - Renders `ContactForm` client component
   - Title: "Contact Ankit"
   - Description: "Get in touch for opportunities, collaborations, or questions."

2. **Footer update** (`src/components/footer/Footer.tsx`):
   - Add "Contact" link in the footer navigation section
   - Style consistent with existing footer links
   - Link to `/contact`

3. **Homepage entry point** (`app/page.tsx`):
   - Add a "Get in Touch" section near the bottom (after testimonials)
   - Brief intro + link to `/contact`
   - Style consistent with other homepage sections
   - Or add as a CTA near the job-fit analyzer entry point

4. **Metadata**:
   - Use `generateBaseMetadata('Contact', 'Get in touch with Ankit Nandwani')`
   - Open Graph tags for social sharing

## Acceptance Criteria

- `/contact` page exists and renders the contact form.
- Page has correct metadata and title.
- Footer has "Contact" link navigating to `/contact`.
- Homepage has entry point to contact form.
- Form submits correctly from the contact page.
- Navigation unchanged (8 items per PRD §8/§92).
- Lint, typecheck, build pass.

## Testing Requirements

- Test: `/contact` page loads and renders form.
- Test: Form submission works from contact page.
- Test: Footer link navigates to `/contact`.
- Test: Homepage entry point links to `/contact`.
- Test: Metadata correct on contact page.
- Test: Navigation still has 8 items.

## Security / Privacy Considerations

- No changes to authentication or data handling.
- Contact page is public, form has its own rate limiting.

## Performance / Accessibility Considerations

- Contact page follows same patterns as other pages.
- Form accessibility already verified in M18.06.

## Definition of Done

- Contact page created with metadata.
- Footer updated with contact link.
- Homepage has contact entry point.
- Form works end-to-end from contact page.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §8, §92: Navigation fixed (no contact in nav)
- PRD §91: Recruiter flow ends with "Contacts Ankit"
- ROADMAP Milestone 18: Contact Form
- PRD §27: Contact form may be included