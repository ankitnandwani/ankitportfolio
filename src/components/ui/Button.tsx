import React, { forwardRef, ReactNode } from 'react';
// @ts-expect-error TS7016
import NeoButton from '@cred/neopop-web';
import { useTheme } from '../../../design/themeContext';

interface ButtonProps extends React.ComponentPropsWithRef<typeof NeoButton> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  colorScheme?: 'light' | 'dark';
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', colorScheme, children, className, ...props }, ref) => {
    const { theme } = useTheme();
    // Use the provided colorScheme or fall back to the current theme
    const effectiveColorScheme = colorScheme ?? theme;
    
    // Map our variant to NeoPOP variant
    const neoVariant = variant === 'accent' ? 'primary' : variant; // accent maps to primary for now
    
    // Map our colorScheme to NeoPOP colorMode
    const neoColorMode = effectiveColorScheme;
    
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