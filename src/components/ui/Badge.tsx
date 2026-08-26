import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import { Components } from '@cred/neopop-web';
import { useTheme } from '../../../design/themeContext';

interface BadgeProps extends React.ComponentPropsWithRef<typeof Components.Tag> {
  /**
   * Color variant from our design tokens
   * @default 'primary'
   */
  variant?: keyof typeof import('../../../design/tokens').tokens.colors;
  /**
   * Size - we'll map to Tailwind classes for padding and text size
   * @default 'md'
   */
  size?: keyof typeof import('../../../design/tokens').tokens.spacing;
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
    const { getThemeTokens } = useTheme();
    const tokens = getThemeTokens();
    // Get the color value for background
    const bgColor = tokens.colors[variant] || tokens.colors.primary;
    // For text color, we'll use contrast based on background - simplify: use text token for light backgrounds, surface for dark
    // For now, we'll use text color on light backgrounds, and background color on dark backgrounds? 
    // Actually, we need to ensure contrast. Let's just use text color for simplicity and assume variant colors are dark enough.
    const textColor = tokens.colors.text;
    
    // Map size to Tailwind classes for padding and text size
    const spacingValue = tokens.spacing[size];
    const horizontal = spacingValue / 4; // in rem units (since 1 unit = 0.25rem)
    const vertical = spacingValue / 8;   // in rem units
    // Map horizontal padding to text size: we'll define a map from horizontal value to text size class
    const textSizeMap: Record<number, string> = {
      0.5: 'text-xs',
      1: 'text-xs',
      2: 'text-sm',
      4: 'text-base',
      6: 'text-lg',
      8: 'text-xl',
      12: 'text-2xl',
      16: 'text-3xl',
    };
    const textSize = textSizeMap[horizontal] || 'text-base';
    const sizeClass = 'px-' + horizontal + ' py-' + vertical + ' ' + textSize;
    
    // Combine classes
    const combinedClass = sizeClass + (className ? ' ' + className : '');
    
    return (
      <Components.Tag
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
      </Components.Tag>
    );
  }
);

// Set display name for React DevTools
Badge.displayName = 'Badge';