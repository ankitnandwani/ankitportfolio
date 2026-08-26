import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import { Components } from '@cred/neopop-web/lib-esm';
import { useTheme } from '../../../design/themeContext';

interface CardProps extends React.ComponentPropsWithRef<typeof Components.ElevatedCard> {
  /**
   * Background color from our design tokens
   * @default 'surface'
   */
  bgColor?: keyof typeof import('../../../design/tokens').tokens.colors;
  /**
   * Size/padding - we'll map to Tailwind classes via className
   * @default 'md'
   */
  size?: keyof typeof import('../../../design/tokens').tokens.spacing;
  /**
   * Radius from our design tokens
   * @default 'md'
   */
  radius?: keyof typeof import('../../../design/tokens').tokens.radius;
  children: ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    bgColor = 'surface',
    size = 'md',
    radius = 'md',
    children,
    className,
    ...props
  }, ref) => {
    const { getThemeTokens } = useTheme();
    const tokens = getThemeTokens();
    // Get the actual color value
    const bgColorValue = tokens.colors[bgColor] || tokens.colors.surface;
    
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
    
    return (
      <ElevatedCard
        ref={ref}
        style={{ backgroundColor: bgColorValue }}
        className={combinedClass}
        {...props}
      >
        {children}
      </ElevatedCard>
    );
  }
);

// Set display name for React DevTools
Card.displayName = 'Card';