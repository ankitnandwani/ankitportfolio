/**
 * Contact form module.
 *
 * Provides data models, validation, rate limiting, email delivery,
 * and utilities for the contact form.
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

// Rate limiter exports
export {
  createContactRateLimiter,
  getContactRateLimiter,
  setContactRateLimiter,
  type RateLimitStore,
  type RateLimiter,
  type RateLimiterOptions,
  DEFAULT_CONTACT_WINDOW_SECONDS,
  DEFAULT_CONTACT_MAX_REQUESTS,
  DEFAULT_CONTACT_DAILY_WINDOW_SECONDS,
  DEFAULT_CONTACT_DAILY_MAX_REQUESTS,
} from './rateLimiter.ts';

// Email delivery exports
export {
  sendContactEmail,
  validateEmailConfig,
  type EmailResult,
  type EmailConfig,
} from './email.ts';