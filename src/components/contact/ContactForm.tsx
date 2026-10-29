'use client';

import React, { useState, useCallback, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/design/themeContext';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Textarea } from '@/src/components/ui/Textarea';
import { validateContactForm, validateField, type ContactFormRequest, type FieldErrors } from '@/src/lib/contact/validation';
import { ContactFormSuccess } from './ContactFormSuccess';
import { ContactFormError, getErrorType } from './ContactFormError';

interface ContactFormProps {
  onSubmit?: (data: { name: string; email: string; company: string; message: string }) => Promise<void>;
}

type FormFieldName = 'name' | 'email' | 'company' | 'message';

interface FormState {
  values: ContactFormRequest;
  errors: FieldErrors;
  touched: Record<FormFieldName, boolean>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  submitError: string;
}

const INITIAL_VALUES: ContactFormRequest = {
  name: '',
  email: '',
  company: '',
  message: '',
};

const INITIAL_ERRORS: FieldErrors = {
  name: '',
  email: '',
  company: '',
  message: '',
};

const INITIAL_TOUCHED: Record<FormFieldName, boolean> = {
  name: false,
  email: false,
  company: false,
  message: false,
};

const FIELD_CONFIG: Record<FormFieldName, { label: string; placeholder: string; maxChars: number; type?: 'text' | 'email'; multiline: boolean; required: boolean }> = {
  name: {
    label: 'Full Name',
    placeholder: 'Your full name',
    maxChars: 100,
    type: 'text',
    multiline: false,
    required: true,
  },
  email: {
    label: 'Email Address',
    placeholder: 'your@email.com',
    maxChars: 254,
    type: 'email',
    multiline: false,
    required: true,
  },
  company: {
    label: 'Company (Optional)',
    placeholder: 'Your company or organization',
    maxChars: 100,
    multiline: false,
    required: false,
  },
  message: {
    label: 'Message',
    placeholder: 'Tell me about your project, role, or how I can help...',
    maxChars: 5000,
    multiline: true,
    required: true,
  },
};

const FIELD_ORDER: FormFieldName[] = ['name', 'email', 'company', 'message'];

export function ContactForm({ onSubmit }: ContactFormProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [formState, setFormState] = useState<FormState>({
    values: INITIAL_VALUES,
    errors: INITIAL_ERRORS,
    touched: INITIAL_TOUCHED,
    isSubmitting: false,
    submitStatus: 'idle',
    submitError: '',
  });

  const firstInvalidRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (formState.submitStatus === 'error' && firstInvalidRef.current) {
      firstInvalidRef.current.focus();
      firstInvalidRef.current = null;
    }
  }, [formState.submitStatus]);

  const handleChange = useCallback((name: FormFieldName, value: string) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      errors: prev.touched[name] ? { ...prev.errors, [name]: validateField(name, value) ?? '' } : prev.errors,
    }));
  }, []);

  const handleBlur = useCallback((name: FormFieldName) => {
    const value = formState.values[name];
    const error = validateField(name, value);
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: true },
      errors: { ...prev.errors, [name]: error ?? '' },
    }));
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const allTouched = FIELD_ORDER.reduce((acc, name) => ({ ...acc, [name]: true }), {} as Record<FormFieldName, boolean>);

    const validationResult = validateContactForm(formState.values);

    if (!validationResult.ok) {
      const newErrors = validationResult.errors;
      const firstInvalidName = Object.keys(newErrors).find((key) => newErrors[key as FormFieldName]) as FormFieldName | undefined;

      setFormState((prev) => ({
        ...prev,
        touched: allTouched,
        errors: newErrors,
        submitStatus: 'error',
        submitError: 'Please fix the errors above.',
      }));

      if (firstInvalidName) {
        setTimeout(() => {
          const element = document.getElementById(`contact-${firstInvalidName}`);
          element?.focus();
        }, 100);
      }
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      submitStatus: 'idle',
      submitError: '',
    }));

    try {
      await onSubmit?.(validationResult.data);
      setFormState((prev) => ({
        ...prev,
        values: INITIAL_VALUES,
        errors: INITIAL_ERRORS,
        touched: INITIAL_TOUCHED,
        isSubmitting: false,
        submitStatus: 'success',
        submitError: '',
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      // Try to extract status code from error if available
      const statusCode = (err as { statusCode?: number; response?: { status?: number } })?.statusCode ??
        (err as { response?: { status?: number } })?.response?.status;

      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        submitStatus: 'error',
        submitError: errorMessage,
      }));
    }
  }, [formState.values, onSubmit]);

  const handleRetry = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      submitStatus: 'idle',
      submitError: '',
    }));
    // Re-trigger submit with current values
    const form = document.getElementById('contact-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }, []);

  const handleDismissError = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      submitStatus: 'idle',
      submitError: '',
    }));
  }, []);

  const handleSendAnother = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      submitStatus: 'idle',
    }));
  }, []);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 600,
    margin: '0 auto',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        {formState.submitStatus === 'success' && (
          <ContactFormSuccess
            theme={theme}
            onSendAnother={handleSendAnother}
          />
        )}

        {formState.submitStatus === 'error' && (
          <ContactFormError
            theme={theme}
            errorType={getErrorType(formState.submitError)}
            message={formState.submitError}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            isSubmitting={formState.isSubmitting}
          />
        )}

        {formState.submitStatus === 'idle' && (
          <form id="contact-form" onSubmit={handleSubmit} style={formStyle} noValidate>
            {FIELD_ORDER.map((fieldName) => {
              const config = FIELD_CONFIG[fieldName];
              const value = formState.values[fieldName];
              const error = formState.touched[fieldName] ? formState.errors[fieldName] : '';
              const isRequired = config.required;

              return (
                <div key={fieldName} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {config.multiline ? (
                    <Textarea
                      id={`contact-${fieldName}`}
                      label={config.label}
                      name={fieldName}
                      value={value}
                      onChange={(val) => handleChange(fieldName, val)}
                      onBlur={() => handleBlur(fieldName)}
                      error={error}
                      required={isRequired}
                      disabled={formState.isSubmitting}
                      placeholder={config.placeholder}
                      maxChars={config.maxChars}
                      autoResize={true}
                      maxHeight={200}
                    />
                  ) : (
                    <Input
                      id={`contact-${fieldName}`}
                      label={config.label}
                      name={fieldName}
                      value={value}
                      onChange={(val) => handleChange(fieldName, val)}
                      onBlur={() => handleBlur(fieldName)}
                      error={error}
                      helperText={fieldName === 'company' ? 'Optional' : undefined}
                      required={isRequired}
                      disabled={formState.isSubmitting}
                      placeholder={config.placeholder}
                      maxChars={config.maxChars}
                      type={config.type}
                    />
                  )}
                </div>
              );
            })}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={formState.isSubmitting}
                style={{ marginTop: 8, minWidth: 200 }}
              >
                {formState.isSubmitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <svg
                      className="animate-spin"
                      style={{ marginLeft: -8, marginRight: 8, width: 20, height: 20 }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </Button>
            </div>
          </form>
        )}
      </AnimatePresence>
    </div>
  );
}