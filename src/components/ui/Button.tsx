import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import NeoButton from '@cred/neopop-web';

interface ButtonProps extends React.ComponentPropsWithRef<typeof NeoButton> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  colorScheme?: 'light' | 'dark';
  children: ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', colorScheme = 'light', children, className, ...props }, ref) => {
    // Map our variant to NeoPOP variant
    const neoVariant = variant === 'accent' ? 'primary' : variant; // accent maps to primary for now
    
    // Map our colorScheme to NeoPOP colorMode
    const neoColorMode = colorScheme;
    
    // Map our size to NeoPOP size (string expected: 'small', 'medium', 'big')
    const sizeMap: Record<string, string> = {
      xs: 'small',
      sm: 'small',
      md: 'medium',
      lg: 'big',
      xl: 'big',
    };
    const neoSize = sizeMap[size] || 'medium';
    
    return (
      <NeoButton
        variant={neoVariant}
        colorMode={neoColorMode}
        size={neoSize}
        className={className}
        ref={ref}
        {...props}
      >
        {children}
      </NeoButton>
    );
  }
);

// Set display name for React DevTools
Button.displayName = 'Button';