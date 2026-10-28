/**
 * Contact form data model.
 *
 * This module defines the data structures for the contact form.
 * The form has four fields as specified in PRD §27:
 * - Name (required)
 * - Email (required)
 * - Company (optional)
 * - Message (required)
 */

/**
 * The data submitted through the contact form.
 */
export interface ContactFormData {
  /** The sender's full name. Required, 1-100 characters. */
  name: string;

  /** The sender's email address. Required, valid email format, max 254 characters. */
  email: string;

  /** The sender's company or organization. Optional, max 100 characters. */
  company: string;

  /** The message content. Required, 10-5000 characters. */
  message: string;
}

/**
 * The shape of the request to the contact form API.
 */
export interface ContactFormRequest {
  name: string;
  email: string;
  company: string;
  message: string;
}

/**
 * The shape of a successful response from the contact form API.
 */
export interface ContactFormSuccessResponse {
  ok: true;
  message: string;
}

/**
 * The shape of an error response from the contact form API.
 */
export interface ContactFormErrorResponse {
  ok: false;
  errors: FieldErrors;
}

/**
 * The union of possible API responses.
 */
export type ContactFormResponse =
  | ContactFormSuccessResponse
  | ContactFormErrorResponse;

/**
 * Field-level validation errors.
 */
export interface FieldErrors {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
}

/**
 * The validation limits for the contact form.
 * These are exported as constants for use by UI components (character counters, etc.).
 */
export const CONTACT_FORM_LIMITS = {
  /** Maximum length of the name field. */
  name: { min: 1, max: 100 },

  /** Maximum length of the email field. */
  email: { max: 254 },

  /** Maximum length of the company field. */
  company: { max: 100 },

  /** Minimum and maximum length of the message field. */
  message: { min: 10, max: 5000 },
} as const;

/**
 * Type for the limits object.
 */
export type ContactFormLimits = typeof CONTACT_FORM_LIMITS;