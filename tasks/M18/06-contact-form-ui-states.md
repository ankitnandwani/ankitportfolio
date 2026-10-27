# M18.06 – Create Success/Failure UI States

## Objective

Create the success and failure UI states for the contact form, including confirmation messages, error displays, and retry functionality.

## Context

After the form is submitted, the user needs clear feedback. The UI must handle:
- Loading state (during submission)
- Success state (email sent confirmation)
- Error state (validation errors, rate limit, server errors, network errors)
- Retry functionality for recoverable errors

## Requirements

- **Loading state** (in `ContactForm.tsx` from M18.02):
  - Submit button shows spinner, disabled
  - All fields disabled
  - Subtle animation (respects reduced motion)

- **Success state** (new component `ContactFormSuccess.tsx`):
  - Green checkmark icon
  - Heading: "Message Sent"
  - Message: "Thanks for reaching out! I'll get back to you soon."
  - Optional: "Send another message" link/button to reset form
  - Animation on entrance (respects reduced motion)
  - Accessible: `role="status"`, `aria-live="polite"`

- **Error state** (new component `ContactFormError.tsx`):
  - Red alert icon
  - Heading based on error type:
    - Validation: "Please fix the errors above"
    - Rate limit: "Too many requests. Please wait a bit."
    - Server error: "Something went wrong. Please try again."
    - Network error: "Connection failed. Please check your internet."
  - Message from API response
  - "Retry" button (re-enables form, preserves input)
  - "Dismiss" button (hides error, keeps input)
  - Accessible: `role="alert"`, `aria-live="assertive"`

- **Validation error display** (in `ContactFormField.tsx`):
  - Red border on invalid field
  - Error message below field
  - `aria-describedby` linking field to error
  - Error message announced on focus

- All states respect:
  - Light/dark themes
  - Reduced motion
  - Keyboard navigation
  - Screen readers

## Scope

### In scope

- `src/components/contact/ContactFormSuccess.tsx` (new)
- `src/components/contact/ContactFormError.tsx` (new)
- Updates to `src/components/contact/ContactForm.tsx` (from M18.02)
- Updates to `src/components/contact/ContactFormField.tsx` (from M18.02)
- `src/components/contact/index.ts` (updated exports)

### Out of scope

- API route (M18.03)
- Rate limiting (M18.04)
- Email delivery (M18.05)

## Dependencies

- M18.02 – Contact form UI components (base components)

## Files / Areas Expected To Change

- `src/components/contact/ContactFormSuccess.tsx` (new)
- `src/components/contact/ContactFormError.tsx` (new)
- `src/components/contact/ContactForm.tsx` (updated)
- `src/components/contact/ContactFormField.tsx` (updated)
- `src/components/contact/index.ts` (updated)

## Implementation Guidance

1. Follow the pattern of `ChatError` and `TypingIndicator` from `src/components/aiChat/`.
2. Use `motion` from Framer Motion for entrance/exit animations.
3. Use `useTheme()` for theme-aware colors.
4. Use design tokens for spacing, radius, colors.
5. Icons: Use inline SVG (checkmark, alert circle, X, spinner).
6. Colors:
   - Success: green (theme-aware)
   - Error: red/orange (theme-aware)
   - Loading: blue (theme-aware)
7. Animations:
   - Success: fade in + slide up
   - Error: fade in + shake (subtle)
   - Loading: spinner rotation
   - All respect `prefers-reduced-motion`
8. Focus management:
   - On error: focus first invalid field (validation) or error message (server error)
   - On success: focus success message
   - On retry: focus form submit button
9. Retry behavior:
   - Preserves user input
   - Re-enables form
   - Clears error state
   - Submits again

## Acceptance Criteria

- Loading state shows spinner, disables form.
- Success state shows confirmation with checkmark, message, optional reset.
- Error state shows appropriate message based on error type, with retry/dismiss.
- Validation errors show inline on fields with red borders and messages.
- All states work in light/dark themes.
- All animations respect reduced motion.
- All states keyboard accessible and screen reader friendly.
- Retry preserves input and resubmits.
- Lint, typecheck, build pass.

## Testing Requirements

- Unit tests: each state component renders correctly.
- Integration test: submit → loading → success → reset.
- Integration test: submit → error → retry → success.
- Integration test: validation errors show on fields.
- Accessibility test: states announced, focus managed.

## Security / Privacy Considerations

- Error messages don't leak internal details.
- No PII in error messages beyond what user entered.

## Performance / Accessibility Considerations

- Components are client-side only (`'use client'`).
- Animations respect reduced motion.
- ARIA live regions for state changes.
- Focus management for keyboard users.

## Definition of Done

- Success, error, and loading states implemented.
- Integrated into ContactForm component.
- All theme/accessibility/motion requirements met.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §27: Contact form UX
- ROADMAP Milestone 18: Contact Form
- PRD §71: Accessibility
- PRD §66: Reduced Motion