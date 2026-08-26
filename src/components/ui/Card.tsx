import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import { Components } from '@cred/neopop-web';
import { useTheme } from '../../../design/themeContext';
import { tokens } from '../../../design/tokens';

interface CardProps {
  /**
   * Background color from our design tokens
   * @default 'surface'
   */
  bgColor?: keyof typeof tokens.colors;
  /**
   * Size/padding - we'll map to Tailwind classes via className
   * @default 'md'
   */
  size?: keyof typeof tokens.spacing;
  /**
   * Radius from our design tokens
   * @default 'md'
   */
  radius?: keyof typeof tokens.radius;
  /**
   * Elevation level from our design tokens
   * @default 'md'
   */
  elevation?: keyof typeof tokens.elevation;
  /**
   * CSS style object
   */
  style?: React.CSSProperties;
  children?: ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    bgColor = 'surface',
    size = 'md',
    radius = 'md',
    elevation = 'md',
    children,
    className,
    style,
    ...props
  }, ref) => {
    const { getThemeTokens } = useTheme();
    const themeTokens = getThemeTokens();
    // Get the actual color value
    const bgColorValue = themeTokens.colors[bgColor] || themeTokens.colors.surface;
    
    // Map radius to Tailwind class (we'll use Tailwind for radius since NeoPOP doesn't expose it)
    const radiusMap: Record<keyof typeof tokens.radius, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-3xl', // 24px
      pill: 'rounded-full',
    };
    const radiusClass = radiusMap[radius] || 'rounded-md';
    
    // Map size to Tailwind padding classes
    const sizeMap: Record<keyof typeof tokens.spacing, string> = {
      xxs: 'p-0.5', // 2px
      xs: 'p-1',    // 4px
      sm: 'p-2',    // 8px
      md: 'p-4',    // 16px
      lg: 'p-6',    // 24px
      xl: 'p-8',    // 32px
      xxl: 'p-12',  // 48px
      xxxl: 'p-16', // 64px
    };
    const sizeClass = sizeMap[size] || 'p-4';
    
    // Combine classes
    const combinedClass = `${sizeClass} ${radiusClass} ${className || ''}`.trim();
    
    // Merge base style with any passed style
    const baseStyle = { backgroundColor: bgColorValue };
    const mergedStyle = style ? { ...baseStyle, ...style } : baseStyle;
    
    return (
      <div
        ref={ref}
        className={combinedClass}
        style={mergedStyle}
        {...props}
      >
        <Components.ElevatedCard elevation={elevation}>
          {children}
        </Components.ElevatedCard>
      </div>
    );
  }
);

// Set display name for React DevTools
Card.displayName = 'Card';