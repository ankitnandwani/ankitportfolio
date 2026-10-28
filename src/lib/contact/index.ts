/**
 * Contact form module.
 *
 * Provides data models, validation, and utilities for the contact form.
 */

// Data model exports
export type {
  ContactFormData,
  ContactFormRequest,
  ContactFormResponse,
  ContactFormSuccessResponse,
  ContactFormErrorResponse,
  FieldErrors,
  ContactFormLimits,
} from '@/src/data/contact.ts';

export { CONTACT_FORM_LIMITS } from '@/src/data/contact.ts';

// Validation exports
export {
  contactFormRequestSchema,
  type ValidatedContactFormRequest,
  validateContactForm,
  validateField,
  createSuccessResponse,
  createErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  type ValidationResult,
} from './validation.ts';