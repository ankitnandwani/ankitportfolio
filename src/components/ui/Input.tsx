'use client';

import React, { forwardRef, useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@/design/themeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  maxChars?: number;
  helperText?: string;
  autoResize?: boolean;
  maxHeight?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      maxChars,
      helperText,
      autoResize = false,
      maxHeight = 160,
      className,
      style,
      disabled,
      required,
      id,
      value: valueProp,
      defaultValue,
      onChange: onChangeProp,
      'aria-describedby': ariaDescribedByProp,
      ...restProps
    },
    ref
  ) => {
    const { theme } = useTheme();
    const prefersReducedMotion = React.useMemo(
      () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      []
    );

    // Determine if controlled or uncontrolled
    const isControlled = valueProp !== undefined;
    const [value, setValue] = useState<string>('');
    const currentValue = isControlled ? (valueProp as string) : value;
    const [height, setHeight] = useState(48);
    const inputRef = useRef<HTMLInputElement>(null);

    const charCount = currentValue.length;
    const maxCharsLimit = maxChars;

    // Merge refs
    const mergedRef = useCallback((node: HTMLInputElement | null) => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref && typeof ref === 'object') {
          ref.current = node;
        }
      }
    }, [ref]);

    // Auto-resize for textarea-like behavior (not typically used for Input, but kept for consistency)
    const adjustHeight = useCallback(() => {
      if (autoResize && inputRef.current) {
        inputRef.current.style.height = 'auto';
        const newHeight = Math.min(inputRef.current.scrollHeight, maxHeight);
        setHeight(newHeight);
      }
    }, [autoResize, maxHeight]);

    React.useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [currentValue, adjustHeight, autoResize]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        if (maxChars && newValue.length > maxChars) {
          return;
        }
        setValue(newValue);
        if (!event.currentTarget) return;
        // We don't call onChangeProp here since it's controlled/uncontrolled
        // The parent will handle the value change via onChange prop
      },
      []
    );

    const isError = !!error;
    const isNearLimit = maxChars && currentValue.length > (maxChars || 0) * 0.8;

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: theme === 'dark' ? '#E0E0E0' : '#212121',
      marginBottom: 4,
    };

    const inputWrapperStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    };

    const inputStyle: React.CSSProperties = {
      minHeight: 48,
      maxHeight: autoResize ? maxHeight : 48,
      height: autoResize ? height : 48,
      padding: '12px 16px',
      backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
      border: isError
        ? theme === 'dark'
          ? '1px solid #EF5350'
          : '1px solid #EF5350'
        : theme === 'dark'
        ? '1px solid #3D3D3D'
        : '1px solid #E0E0E0',
      borderRadius: 12,
      color: theme === 'dark' ? '#E0E0E0' : '#212121',
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
      transition: prefersReducedMotion
        ? 'none'
        : 'border-color 0.2s ease, box-shadow 0.2s ease, height 0.1s ease',
      boxShadow: isError
        ? theme === 'dark'
          ? '0 0 0 3px rgba(239, 83, 80, 0.2)'
          : '0 0 0 3px rgba(239, 83, 80, 0.15)'
        : 'none',
      width: '100%',
      boxSizing: 'border-box',
    };

    const errorStyle: React.CSSProperties = {
      fontSize: '0.75rem',
      color: theme === 'dark' ? '#EF5350' : '#C62828',
      marginTop: 2,
    };

    const charCountStyle: React.CSSProperties = {
      fontSize: '0.625rem',
      color: maxChars && currentValue.length > (maxChars || 0) * 0.8
        ? theme === 'dark'
          ? '#EF5350'
          : '#C62828'
        : theme === 'dark'
        ? '#757575'
        : '#9E9E9E',
      textAlign: 'right',
      paddingRight: 4,
    };

    const helperStyle: React.CSSProperties = {
      fontSize: '0.625rem',
      color: theme === 'dark' ? '#757575' : '#9E9E9E',
      marginTop: 2,
    };

    // Generate unique IDs for accessibility (must be at top level for Hooks rules)
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const charCountId = maxChars ? `${inputId}-charcount` : undefined;
    const describedBy = [
      errorId,
      helperId,
      maxChars ? charCountId : undefined,
      undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div style={containerStyle} className={className}>
        <label htmlFor={inputId} style={labelStyle}>
          {label}
          {required && <span style={{ color: theme === 'dark' ? '#EF5350' : '#C62828', marginLeft: 4 }} aria-hidden="true">*</span>}
        </label>
        <div style={inputWrapperStyle}>
          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              if (maxChars && newValue.length > maxChars) return;
              setValue(newValue);
            }}
            onClick={adjustHeight}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            style={inputStyle}
            spellCheck={false}
            {...restProps}
          />
          {maxChars && (
            <div id={charCountId} style={charCountStyle} aria-live="polite">
              {currentValue.length}/{maxChars}
            </div>
          )}
          {error && (
            <div id={errorId} style={errorStyle} role="alert" aria-live="polite">
              {error}
            </div>
          )}
          {helperText && !error && (
            <div id={helperId} style={helperStyle}>
              {helperText}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';