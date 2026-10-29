'use client';

import React, { forwardRef } from 'react';
import { Input } from '@/src/components/ui/Input';
import { Textarea } from '@/src/components/ui/Textarea';

interface ContactFormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxChars?: number;
  type?: 'text' | 'email' | 'tel' | 'url';
  multiline?: boolean;
  autoResize?: boolean;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ContactFormField component.
 *
 * A wrapper component that combines label, input/textarea, error message,
 * character counter, and helper text into a single form field.
 * Handles both single-line and multi-line inputs.
 */
export const ContactFormField = forwardRef<HTMLDivElement, ContactFormFieldProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      onBlur,
      error,
      helperText,
      required = false,
      disabled = false,
      placeholder,
      maxChars,
      type = 'text',
      multiline = false,
      autoResize = true,
      maxHeight = 200,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const handleChange = React.useCallback(
      (value: string) => {
        onChange(value);
      },
      [onChange]
    );

    const handleBlur = React.useCallback(() => {
      onBlur?.();
    }, [onBlur]);

    if (multiline) {
      return (
        <div ref={ref} className={className} style={style} {...props}>
          <Textarea
            label={label}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            error={error}
            helperText={helperText}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            maxChars={maxChars}
            autoResize={true}
            maxHeight={200}
          />
        </div>
      );
    }

    return (
      <div ref={ref} className={className} style={style} {...props}>
        <Input
          label={label}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          maxChars={maxChars}
          type={type}
          autoResize={false}
        />
      </div>
    );
  }
);

ContactFormField.displayName = 'ContactFormField';