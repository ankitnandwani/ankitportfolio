/**
 * Contact form validation logic.
 *
 * This module provides Zod schemas and validation functions for the contact form.
 * The same schemas can be used on both client and server side.
 *
 * Validation rules (from PRD §27 and task spec):
 * - Name: required, 1-100 characters, letters/spaces/hyphens/apostrophes only (Unicode-aware)
 * - Email: required, valid email format, max 254 characters
 * - Company: optional, max 100 characters
 * - Message: required, 10-5000 characters
 */

import { z } from 'zod';

import type {
  ContactFormData,
  ContactFormRequest,
  ContactFormResponse,
  ContactFormSuccessResponse,
  ContactFormErrorResponse,
  FieldErrors,
  ContactFormLimits,
} from '../../data/contact.ts';

import { CONTACT_FORM_LIMITS } from '../../data/contact.ts';

/**
 * Zod schema for the name field.
 * Allows letters, spaces, hyphens, apostrophes (Unicode-aware).
 */
const nameSchema = z
  .string()
  .min(CONTACT_FORM_LIMITS.name.min, 'Name is required.')
  .max(CONTACT_FORM_LIMITS.name.max, `Name must be at most ${CONTACT_FORM_LIMITS.name.max} characters.`)
  .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Name can only contain letters, spaces, hyphens, and apostrophes.');

/**
 * Zod schema for the email field.
 * Uses Zod's built-in email validation with length limit.
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required.')
  .max(CONTACT_FORM_LIMITS.email.max, `Email must be at most ${CONTACT_FORM_LIMITS.email.max} characters.`)
  .email('Please enter a valid email address.');

/**
 * Zod schema for the company field.
 * Optional, max 100 characters.
 */
const companySchema = z
  .string()
  .max(CONTACT_FORM_LIMITS.company.max, `Company must be at most ${CONTACT_FORM_LIMITS.company.max} characters.`)
  .optional()
  .or(z.literal(''));

/**
 * Zod schema for the message field.
 * Required, 10-5000 characters.
 */
const messageSchema = z
  .string()
  .min(CONTACT_FORM_LIMITS.message.min, `Message must be at least ${CONTACT_FORM_LIMITS.message.min} characters.`)
  .max(CONTACT_FORM_LIMITS.message.max, `Message must be at most ${CONTACT_FORM_LIMITS.message.max} characters.`);

/**
 * Zod schema for the complete contact form request.
 */
export const contactFormRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: companySchema,
  message: messageSchema,
});

/**
 * The inferred type of the validated contact form request.
 */
export type ValidatedContactFormRequest = z.infer<typeof contactFormRequestSchema>;

/**
 * The result of validating contact form data.
 * This is a discriminated union that never throws.
 */
export type ValidationResult =
  | { ok: true; data: ContactFormData }
  | { ok: false; errors: FieldErrors };

/**
 * Validates contact form data against the schema.
 *
 * @param data The raw form data to validate.
 * @returns A result object with either the validated data or field errors.
 */
export function validateContactForm(data: ContactFormRequest): ValidationResult {
  const result = contactFormRequestSchema.safeParse(data);

  if (result.success) {
    // Transform the validated data to match ContactFormData (ensure company is string, not undefined)
    const validatedData: ContactFormData = {
      name: result.data.name,
      email: result.data.email,
      company: result.data.company ?? '',
      message: result.data.message,
    };
    return { ok: true, data: validatedData };
  }

  // Convert Zod errors to field errors
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof FieldErrors;
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return { ok: false, errors: fieldErrors };
}

/**
 * Validates a single field.
 * Useful for real-time validation on blur/change.
 *
 * @param field The field name to validate.
 * @param value The value to validate.
 * @returns The error message if invalid, undefined if valid.
 */
export function validateField(field: keyof ContactFormRequest, value: string): string | undefined {
  switch (field) {
    case 'name':
      return nameSchema.safeParse(value).success ? undefined : nameSchema.safeParse(value).error?.issues[0]?.message;
    case 'email':
      return emailSchema.safeParse(value).success ? undefined : emailSchema.safeParse(value).error?.issues[0]?.message;
    case 'company':
      return companySchema.safeParse(value).success ? undefined : companySchema.safeParse(value).error?.issues[0]?.message;
    case 'message':
      return messageSchema.safeParse(value).success ? undefined : messageSchema.safeParse(value).error?.issues[0]?.message;
    default:
      return 'Unknown field.';
  }
}

/**
 * Creates a successful API response.
 */
export function createSuccessResponse(message: string = 'Message sent successfully.'): ContactFormSuccessResponse {
  return { ok: true, message };
}

/**
 * Creates an error API response with field errors.
 */
export function createErrorResponse(errors: FieldErrors): ContactFormErrorResponse {
  return { ok: false, errors };
}

/**
 * Checks if a response is a success response.
 */
export function isSuccessResponse(response: ContactFormResponse): response is ContactFormSuccessResponse {
  return response.ok === true;
}

/**
 * Checks if a response is an error response.
 */
export function isErrorResponse(response: ContactFormResponse): response is ContactFormErrorResponse {
  return response.ok === false;
}

export type { ContactFormRequest, FieldErrors } from '../../data/contact.ts';