# M18 – Contact Form

This milestone enables visitors to reach out via a contact form. The form collects Name, Email, Company, and Message, validates the input, protects against spam with rate limiting, and delivers the message via a transactional email provider.

## Execution Order

| Order | Task | Depends On | Parallel |
|-------|------|------------|----------|
| 1 | M18.01 – Define contact form data model and validation | – | – |
| 2 | M18.02 – Create contact form UI components (Input, Textarea, Form) | M18.01 | – |
| 3 | M18.03 – Implement contact form API route with validation | M18.01, M18.02 | – |
| 4 | M18.04 – Add spam protection/rate limiting for contact form | M18.03 | – |
| 5 | M18.05 – Implement email delivery via transactional provider | M18.03, M18.04 | – |
| 6 | M18.06 – Create success/failure UI states | M18.02, M18.03 | – |
| 7 | M18.07 – Add contact form to site (homepage/footer) | M18.06 | – |
| 8 | M18.08 – Test and verify contact form end to end | M18.07 | – |

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Contact form with Name, Email, Company, Message fields | PRD §27, ROADMAP M18 | M18.01, M18.02 | Planned |
| Validation of all fields | PRD §27, ROADMAP M18 | M18.01, M18.03 | Planned |
| Spam protection/rate limiting | PRD §27, ROADMAP M18 | M18.04 | Planned |
| Email delivery via transactional provider | ROADMAP M18, PRD §127 | M18.05 | Planned |
| Success/failure UI states | ROADMAP M18 | M18.06 | Planned |
| Form integrated into site (homepage/footer) | PRD §91, ROADMAP M18 | M18.07 | Planned |
| No account creation required | PRD §27 | M18.03 | Planned |
| Free transactional email provider | ROADMAP M18, PRD §127 | M18.05 | Planned |
| Secure delivery without exposing private data | ROADMAP M18 | M18.03, M18.05 | Planned |

## Parallel Work

- M18.02 (UI components) and M18.04 (rate limiting) can be developed in parallel once M18.01 is complete.
- M18.05 (email delivery) and M18.06 (UI states) can be developed in parallel once M18.04 is complete.

## Decisions Requiring Human Approval

1. **Transactional email provider** – The PRD suggests "a free transactional email provider if available." Options include Resend, SendGrid, Mailgun, or Postmark. A decision is needed on which provider to use (or if a self-hosted option like nodemailer with a free SMTP service is preferred).

2. **Contact email destination** – Currently `siteConfig.author.email` is `contact@ankitnandwani.com`. Confirm this is the correct destination for form submissions.

3. **Rate limit thresholds for contact form** – The PRD doesn't specify exact values. The job-fit analyzer uses 5/30min, 10/day. The chat uses 20/30min, 100/day. A contact form likely needs stricter limits (e.g., 3/30min, 5/day) since it sends emails.

4. **CAPTCHA/honeypot** – In addition to rate limiting, decide if a honeypot field or CAPTCHA is needed for spam protection.

5. **Form placement** – The PRD §91 shows the recruiter flow ends with "Contacts Ankit" after "Downloads resume". The form should be accessible from the homepage (near the CTA) and potentially the footer. Exact placement needs confirmation.

## Files Expected to Change

- `src/data/contact.ts` (new) — contact form data model
- `src/components/ui/Input.tsx` (new) — form input component
- `src/components/ui/Textarea.tsx` (new) — form textarea component
- `src/components/ui/index.ts` (updated) — exports
- `src/components/contact/ContactForm.tsx` (new) — main form component
- `src/components/contact/ContactFormField.tsx` (new) — individual field component
- `src/components/contact/index.ts` (new) — exports
- `src/lib/contact/validation.ts` (new) — validation logic
- `src/lib/contact/email.ts` (new) — email delivery
- `src/lib/contact/rateLimiter.ts` (new) — contact-specific rate limiter
- `src/lib/contact/index.ts` (new) — exports
- `app/api/contact/route.ts` (new) — API route
- `app/contact/page.tsx` (new) — dedicated contact page (optional)
- `src/components/footer/Footer.tsx` (updated) — add contact form link
- `app/page.tsx` (updated) — add contact form section
- `src/lib/env.ts`, `src/lib/env.js`, `.env.example` (updated) — environment variables
- `package.json` (updated) — email provider dependency
- `test-plan.md` (updated) — contact form test cases
- `scripts/verifyContact.mts` (new) — verification script

## Acceptance Criteria (Milestone Definition of Done)

- Form submissions are delivered securely without exposing private data.
- All four fields (Name, Email, Company, Message) are validated on client and server.
- Spam protection and rate limiting prevent abuse.
- Email is delivered via a free transactional provider.
- Success and failure UI states are shown to the user.
- The form is accessible from the homepage and/or footer.
- No account creation is required.
- All tests pass, lint clean, typecheck clean, build succeeds.