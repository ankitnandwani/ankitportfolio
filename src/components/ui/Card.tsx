import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import ElevatedCard from '@cred/neopop-web/lib-esm/components/ElevatedCard';
import { tokens } from '../../../design/tokens';

interface CardProps extends React.ComponentPropsWithRef<typeof ElevatedCard> {
  /**
   * Background color from our design tokens
   * @default 'surface'
   */
  bgColor?: keyof typeof tokens.colors;
  /**
   * Size/padding - we'll map to Tailwind classes via className
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Radius from our design tokens
   * @default 'md'
   */
  radius?: keyof typeof tokens.radius;
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
    // Get the actual color value
    const bgColorValue = tokens.colors[bgColor] || tokens.colors.surface;
    
    // Map radius to Tailwind class (we'll use Tailwind for radius since NeoPOP doesn't expose it)
    const radiusMap: Record<keyof typeof tokens.radius, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
    };
    const radiusClass = radiusMap[radius] || 'rounded-md';
    
    // Map size to Tailwind padding classes
    const sizeMap: Record<keyof typeof tokens.spacing, string> = {
      xs: 'p-1',   // 4px padding -> 0.25rem -> p-1 (since 1 = 0.25rem)
      sm: 'p-2',   // 8px -> 0.5rem -> p-2
      md: 'p-4',   // 16px -> 1rem -> p-4
      lg: 'p-6',   // 24px -> 1.5rem -> p-6
      xl: 'p-8',   // 32px -> 2rem -> p-8
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