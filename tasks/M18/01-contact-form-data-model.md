# M18.01 – Define Contact Form Data Model and Validation

## Objective

Define the data model for the contact form, including field types, validation rules, and the shape of the API request/response.

## Context

The contact form is the final step in the recruiter flow (PRD §91):

```
Recruiter arrives → Understands role in 10 seconds → Sees achievements →
Explores experience → Checks projects → Asks AI a question → Pastes JD →
AI explains fit → Downloads resume → Contacts Ankit
```

The form has four fields as specified in PRD §27:

- Name
- Email
- Company
- Message

No account creation is required. Validation and spam protection/rate limiting are required.

## Requirements

- Define the `ContactFormData` interface with the four fields.
- Define validation rules for each field:
  - Name: required, 1-100 characters, letters/spaces/hyphens/apostrophes only
  - Email: required, valid email format, max 254 characters
  - Company: optional, max 100 characters
  - Message: required, 10-5000 characters
- Define the API request shape (`ContactFormRequest`) and response shape (`ContactFormResponse`).
- Define error response shapes with field-specific errors.
- Create a validation function that returns validated data or field errors.
- Export types and validation from `src/data/contact.ts` and `src/lib/contact/validation.ts`.

## Scope

### In scope

- `src/data/contact.ts` (new) — data model interfaces
- `src/lib/contact/validation.ts` (new) — validation logic
- `src/lib/contact/index.ts` (new) — exports

### Out of scope

- UI components (M18.02)
- API route (M18.03)
- Rate limiting (M18.04)
- Email delivery (M18.05)

## Dependencies

- None (this is the first task of the milestone)

## Files / Areas Expected To Change

- `src/data/contact.ts` (to be created)
- `src/lib/contact/validation.ts` (to be created)
- `src/lib/contact/index.ts` (to be created)

## Implementation Guidance

1. Follow the pattern of other data models in `src/data/` (e.g., `professionalSnapshot.ts`, `skills.ts`).
2. Use Zod for validation schemas (already a dependency) so the same schema can be used client and server side.
3. The validation function should return a discriminated union: `{ ok: true; data: ContactFormData } | { ok: false; errors: FieldErrors }`.
4. Field errors should map field names to error messages.
5. Email validation should use a proper regex (not just `@` check).
5. Name validation should allow international characters (use Unicode property escapes).
6. Export a `CONTACT_FORM_LIMITS` object with all limits for use by UI (character counters, etc.).

## Acceptance Criteria

- `ContactFormData` interface exists with all four fields.
- Validation function correctly validates valid inputs.
- Validation function rejects invalid inputs with specific field errors:
  - Empty name → error
  - Name too long → error
  - Invalid email → error
  - Email too long → error
  - Company too long → error
  - Empty message → error
  - Message too short (<10 chars) → error
  - Message too long (>5000 chars) → error
- Zod schema exports work for both client and server.
- Limits are exported as constants for UI use.
- All unit tests pass.

## Testing Requirements

- Unit tests for each validation rule (valid and invalid cases).
- Test edge cases: Unicode names, various email formats, boundary lengths.
- Test that the Zod schema matches the TypeScript interface.

## Security / Privacy Considerations

- No PII is logged in validation.
- Validation is pure (no side effects).
- Email format validation prevents injection attempts.

## Performance / Accessibility Considerations

- Validation is synchronous and fast.
- Error messages are clear and actionable for screen readers.

## Definition of Done

- Data model and validation logic implemented in `src/data/contact.ts` and `src/lib/contact/validation.ts`.
- Exports available from `src/lib/contact/index.ts`.
- Unit tests cover all validation rules.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §27: Contact form fields and validation
- PRD §91: Recruiter flow
- ROADMAP Milestone 18: Contact Form