import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import Tag from '@cred/neopop-web/lib-esm/components/Tags';
import { tokens } from '../../../design/tokens';

interface BadgeProps extends React.ComponentPropsWithRef<typeof Tag> {
  /**
   * Color variant from our design tokens
   * @default 'primary'
   */
  variant?: keyof typeof tokens.colors;
  /**
   * Size - we'll map to Tailwind classes for padding and text size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Color scheme for light/dark mode
   * @default 'light'
   */
  colorScheme?: 'light' | 'dark';
  children: ReactNode;
  className?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    variant = 'primary',
    size = 'md',
    colorScheme = 'light',
    children,
    className,
    ...props
  }, ref) => {
    // Get the color value for background
    const bgColor = tokens.colors[variant] || tokens.colors.primary;
    // For text color, we'll use contrast based on background - simplify: use text token for light backgrounds, surface for dark
    // For now, we'll use text color on light backgrounds, and background color on dark backgrounds? 
    // Actually, we need to ensure contrast. Let's just use text color for simplicity and assume variant colors are dark enough.
    const textColor = tokens.colors.text;
    
    // Map size to Tailwind classes for padding and text size
    const sizeMap: Record<string, string> = {
      xs: 'px-1 py-0.5 text-xs',   // 4px px, 2px py -> 0.25rem, 0.125rem
      sm: 'px-2 py-1 text-sm',     // 8px px, 4px py -> 0.5rem, 0.25rem
      md: 'px-3 py-1.5 text-base', // 12px px, 6px py -> 0.75rem, 0.375rem
      lg: 'px-4 py-2 text-lg',     // 16px px, 8px py -> 1rem, 0.5rem
      xl: 'px-5 py-2.5 text-xl',   // 20px px, 10px py -> 1.25rem, 0.625rem
    };
    const sizeClass = sizeMap[size] || 'px-3 py-1.5 text-base';
    
    // Combine classes
    const combinedClass = `${sizeClass} ${className || ''}`.trim();
    
    return (
      <Tag
        ref={ref}
        colorMode={colorScheme}
        colorConfig={{
          background: bgColor,
          color: textColor,
        }}
        className={combinedClass}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

// Set display name for React DevTools
Badge.displayName = 'Badge';