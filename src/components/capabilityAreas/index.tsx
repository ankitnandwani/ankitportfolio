'use client';

import React from 'react';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/design/themeContext';

interface CapabilityAreasProps {
  /**
   * List of capability strings to display as badges
   */
  capabilities: string[];
  /**
   * Optional className for customization
   */
  className?: string;
  /**
   * Optional badge variant (color) from design tokens
   * @default 'primary'
   */
  variant?: keyof typeof import('../../../design/tokens').tokens.colors;
  /**
   * Optional badge size
   * @default 'md'
   */
  size?: keyof typeof import('../../../design/tokens').tokens.spacing;
}

export const CapabilityAreas = ({ 
  capabilities, 
  className = '', 
  variant = 'primary',
  size = 'md'
}: CapabilityAreasProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Get text color from tokens (adapts to light/dark mode)
  const textColor = tokens.colors.text;

  return (
    <section className={`${className} w-full py-8`}>
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Optional section title */}
        <h2 
          style={{ color: textColor }}
          className="text-2xl md:text-3xl font-semibold mb-6 text-center"
        >
          Capability Areas
        </h2>
        
        {/* Capabilities badges */}
        <div className="flex flex-wrap gap-3 justify-center">
          {capabilities.map((capability, index) => (
            <Badge
              key={index}
              variant={variant}
              size={size}
              className="flex items-center"
            >
              {capability}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};