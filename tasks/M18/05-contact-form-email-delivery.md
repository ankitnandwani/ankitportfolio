# M18.05 – Implement Email Delivery via Transactional Provider

## Objective

Implement the email delivery function that sends the contact form submission to the configured destination email address using a free transactional email provider.

## Context

The contact form needs to deliver the user's message to Ankit's contact email. The PRD §127 and ROADMAP M18 specify: "Email delivery via transactional provider" and "Use a free transactional email provider if available."

Options for free transactional email providers (all have free tiers):
- **Resend** – 3,000 emails/month free, modern API, React email templates
- **SendGrid** – 100 emails/day free, established
- **Mailgun** – No longer has permanent free tier (trial only)
- **Postmark** – No free tier (trial only)
- **Brevo (Sendinblue)** – 300 emails/day free
- **Nodemailer + free SMTP** (e.g., Gmail, Outlook) – requires app passwords

## Requirements

- Create `src/lib/contact/email.ts` with:
  - `sendContactEmail(data: ContactFormData): Promise<void>` function
  - Uses a transactional email provider (decision needed: Resend recommended)
  - Email template with all form fields
  - Plain text and HTML versions
  - Proper error handling with descriptive errors
  - No secrets in logs
- Environment variables for provider:
  - `EMAIL_PROVIDER` (e.g., "resend")
  - `EMAIL_API_KEY` (provider API key)
  - `EMAIL_FROM` (sender address, e.g., "Contact Form <contact@ankitnandwani.com>")
  - `EMAIL_TO` (destination, from `siteConfig.author.email` or override)
  - `EMAIL_REPLY_TO` (optional, set to user's email)
- Add provider dependency to `package.json` (e.g., `resend` or `@sendgrid/mail`)
- Export from `src/lib/contact/index.ts`

## Scope

### In scope

- `src/lib/contact/email.ts` (new)
- `src/lib/contact/index.ts` (updated)
- `package.json` (updated with email provider dependency)
- Environment variables in `src/lib/env.ts`, `src/lib/env.js`, `.env.example`

### Out of scope

- API route integration (M18.03)
- Rate limiting (M18.04)
- Provider selection decision (requires human)

## Dependencies

- M18.01 – Data model (for `ContactFormData` type)
- M18.04 – Rate limiting (applied before email sending)

## Files / Areas Expected To Change

- `src/lib/contact/email.ts` (new)
- `src/lib/contact/index.ts` (updated)
- `package.json` (new dependency)
- `src/lib/env.ts`, `src/lib/env.js`, `.env.example` (updated)

## Implementation Guidance

1. **Provider recommendation: Resend**
   - Modern API, generous free tier (3,000/month)
   - TypeScript SDK available
   - Supports React email templates
   - Simple API: `resend.emails.send({ from, to, subject, html, text })`

2. **Email template**
   - Subject: "New Contact Form Submission from {name}"
   - Include all fields: Name, Email, Company, Message
   - Plain text and HTML versions
   - Professional styling matching site theme
   - Include timestamp and IP (for spam tracking, not in user-facing content)

3. **Error handling**
   - Wrap provider errors in a custom `EmailDeliveryError`
   - Don't leak API keys or internal details in error messages
   - Log errors server-side for debugging (without PII)

4. **Implementation structure**
   ```typescript
   interface EmailConfig {
     provider: 'resend' | 'sendgrid' | 'nodemailer';
     apiKey: string;
     from: string;
     to: string;
   }

   export async function sendContactEmail(
     data: ContactFormData,
     config: EmailConfig
   ): Promise<void>
   ```

5. **Environment variables**
   Add to `src/lib/env.ts`, `src/lib/env.js`, `.env.example`:
   - `EMAIL_PROVIDER` (default: "resend")
   - `EMAIL_API_KEY`
   - `EMAIL_FROM` (default: "Contact Form <contact@ankitnandwani.com>")
   - `EMAIL_TO` (default: `siteConfig.author.email`)
   - `EMAIL_REPLY_TO` (optional)

5. **Get config from environment** in a `getEmailConfig()` function.

## Acceptance Criteria

- Email delivery function implemented with chosen provider.
- Email includes all form fields in professional format.
- Both HTML and plain text versions sent.
- Errors are handled and wrapped, no secrets leaked.
- Environment variables documented and validated.
- Unit tests with mocked provider.
- Lint, typecheck, build pass.

## Testing Requirements

- Unit test: email sent with correct fields (mock provider).
- Unit test: provider error wrapped in EmailDeliveryError.
- Unit test: both HTML and text versions generated.
- Integration test: API route → rate limiter → email delivery.

## Security / Privacy Considerations

- API key never logged.
- User's email used as `reply-to`, not `from` (prevents spoofing).
- No PII in logs beyond what's needed for delivery.
- Rate limiting (M18.04) prevents abuse before email sending.

## Performance / Accessibility Considerations

- Email sending is async, doesn't block API response excessively.
- Provider SDK should be lightweight (Resend is ~50kb).

## Definition of Done

- Email delivery function implemented with provider SDK.
- Professional email template with all fields.
- Environment variables configured.
- Unit tests with mocked provider.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §27: Contact form email delivery
- PRD §127: Milestone 18 requirements
- ROADMAP Milestone 18: Contact Form
- Decision needed: Transactional email provider (Resend recommended)

## Decision Required

**Transactional email provider** – The PRD suggests "a free transactional email provider if available." 

Options:
1. **Resend** (recommended) – 3,000/month free, modern API, TypeScript SDK
2. **SendGrid** – 100/day free, established but older API
3. **Brevo** – 300/day free, good API
4. **Nodemailer + Gmail/Outlook** – Free but requires app passwords, less reliable

Please confirm the provider choice before implementation.