# M18.02 – Create Contact Form UI Components

## Objective

Create the reusable UI components for the contact form: Input, Textarea, and the main ContactForm component with proper styling, accessibility, and integration with the design system.

## Context

The contact form needs four fields (Name, Email, Company, Message) with labels, placeholders, character counters, validation states, and submission handling. The components must follow the NeoPOP design system, support light/dark themes, respect reduced motion, and be fully accessible.

## Requirements

- Create `Input` component in `src/components/ui/Input.tsx`:
  - Single-line text input with label, placeholder, error state
  - Character counter for fields with max length
  - Proper TypeScript props interface
  - NeoPOP styling via design tokens
  - Dark/light theme support
  - Disabled and error states

- Create `Textarea` component in `src/components/ui/Textarea.tsx`:
  - Multi-line text input with auto-resize (up to max height)
  - Label, placeholder, error state
  - Character counter
  - Dark/light theme support
  - Disabled and error states

- Create `ContactFormField` component in `src/components/contact/ContactFormField.tsx`:
  - Wrapper combining label, input/textarea, error message, character counter
  - Handles both Input and Textarea
  - Shows validation error from form state

- Create `ContactForm` component in `src/components/contact/ContactForm.tsx`:
  - Manages form state (values, errors, touched, submitting)
  - Four fields: Name (Input), Email (Input), Company (Input), Message (Textarea)
  - Client-side validation on blur and submit
  - Submit handler calls API route
  - Loading state with spinner
  - Success state with confirmation message
  - Error state with message and retry
  - Character counters for all fields
  - Reset form on success

- Create `src/components/contact/index.ts` with exports.

## Scope

### In scope

- `src/components/ui/Input.tsx` (new)
- `src/components/ui/Textarea.tsx` (new)
- `src/components/ui/index.ts` (updated)
- `src/components/contact/ContactFormField.tsx` (new)
- `src/components/contact/ContactForm.tsx` (new)
- `src/components/contact/index.ts` (new)

### Out of scope

- API route (M18.03)
- Rate limiting (M18.04)
- Email delivery (M18.05)
- Page integration (M18.07)

## Dependencies

- M18.01 – Data model and validation (for types and validation functions)

## Files / Areas Expected To Change

- `src/components/ui/Input.tsx` (new)
- `src/components/ui/Textarea.tsx` (new)
- `src/components/ui/index.ts` (updated)
- `src/components/contact/ContactFormField.tsx` (new)
- `src/components/contact/ContactForm.tsx` (new)
- `src/components/contact/index.ts` (new)

## Implementation Guidance

1. Follow the existing UI component patterns (Button, Card, Badge in `src/components/ui/`).
2. Use `useTheme()` from `@/design/themeContext` for theme-aware styling.
3. Use design tokens from `@/design/tokens` for colors, spacing, radius, etc.
4. Use Framer Motion for subtle animations (submit loading, success/error transitions).
5. Respect `prefers-reduced-motion` via `window.matchMedia`.
6. Use the validation functions from `src/lib/contact/validation` for client-side validation.
6. Form submission should call `/api/contact` via `fetch`.
7. Character counters should update in real-time and show warning colors near limits.
8. Error messages should be announced via `aria-live="polite"`.
9. Focus management: on error, focus first invalid field; on success, focus confirmation message.
10. The form should be fully keyboard navigable.

## Acceptance Criteria

- Input and Textarea components render with NeoPOP styling in both themes.
- ContactForm renders all four fields with labels, placeholders, counters.
- Client-side validation runs on blur and shows field-specific errors.
- Submit button disabled while submitting, shows loading spinner.
- Success state shows confirmation message, form resets.
- Error state shows message with retry option.
- All interactions work with keyboard only.
- Dark/light theme works correctly.
- Reduced motion disables animations.
- Lint, typecheck, build pass.

## Testing Requirements

- Unit tests for Input and Textarea rendering.
- Unit tests for ContactForm validation logic.
- Integration test: fill form, submit, verify API call.
- Accessibility test: form is keyboard navigable, errors announced.

## Security / Privacy Considerations

- No sensitive data in component state beyond what user enters.
- No analytics in the form component itself (handled by API route).

## Performance / Accessibility Considerations

- Components are client-side only (`'use client'`).
- Framer Motion animations respect reduced motion.
- ARIA labels and live regions for errors.
- Focus management for error/success states.

## Definition of Done

- All UI components created and exported.
- ContactForm integrates with validation from M18.01.
- Components follow design system and accessibility standards.
- Lint, typecheck, build pass.

## Related Requirements

- PRD §27: Contact form fields
- PRD §91: Recruiter flow
- ROADMAP Milestone 18: Contact Form