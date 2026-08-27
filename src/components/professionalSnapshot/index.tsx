'use client';

import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { professionalSnapshotData } from '@/src/data/professionalSnapshot';
import { useTheme } from '@/design/themeContext';

interface ProfessionalSnapshotProps {
  /**
   * Optional className for customization
   */
  className?: string;
  /**
   * Optional data override (for testing or flexibility)
   */
  data?: typeof professionalSnapshotData;
}

export const ProfessionalSnapshot = ({ 
  className = '', 
  data = professionalSnapshotData 
}: ProfessionalSnapshotProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Get text color from tokens (adapts to light/dark mode)
  const textColor = tokens.colors.text;
  // Get muted text color for labels (slightly lighter/darker based on background)
  const mutedTextColor = tokens.colors.text; // Could adjust opacity if needed

  return (
    <section className={`${className} w-full py-12`}>
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Section title */}
        <h2 
          style={{ color: textColor }}
          className="text-3xl md:text-4xl font-black text-center mb-10"
        >
          Professional Snapshot
        </h2>
        
        {/* Metric cards grid */}
        <div className="grid gap-6">
          {/* Desktop: 4 cards in a row, Mobile: stack vertically */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Engineering Experience */}
            <Card
              elevation="md"
              className="flex flex-col items-center justify-center p-6 text-center"
              style={{ 
                backgroundColor: tokens.colors.background,
              }}
            >
              <div 
                style={{ color: tokens.colors.primary }}
                className="text-4xl md:text-5xl font-black mb-2"
              >
                {data.yearsExperience}+
              </div>
              <div 
                style={{ color: mutedTextColor }}
                className="text-sm md:text-base font-medium"
              >
                YEARS OF ENGINEERING EXPERIENCE
              </div>
            </Card>
            
            {/* Multi-domain Experience */}
            <Card
              elevation="md"
              className="flex flex-col items-center justify-center p-6 text-center"
              style={{ 
                backgroundColor: tokens.colors.background,
              }}
            >
              <div 
                style={{ color: tokens.colors.accent }}
                className="text-2xl md:text-3xl font-bold mb-2"
              >
                {data.domains.length}
              </div>
              <div 
                style={{ color: mutedTextColor }}
                className="text-sm md:text-base font-medium"
              >
                PROFESSIONAL DOMAINS
              </div>
              {/* Optional: show domains as tooltip or on hover */}
              {data.domains.length > 0 && (
                <div className="mt-2 text-xs text-center whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ color: tokens.colors.text }}
                >
                  {data.domains.join(', ')}
                </div>
              )}
            </Card>
            
            {/* Automation Experience */}
            <Card
              elevation="md"
              className="flex flex-col items-center justify-center p-6 text-center"
              style={{ 
                backgroundColor: tokens.colors.background,
              }}
            >
              <div 
                style={{ color: tokens.colors.primary }}
                className="text-2xl md:text-3xl font-bold mb-2"
              >
                API + UI + MOBILE
              </div>
              <div 
                style={{ color: mutedTextColor }}
                className="text-sm md:text-base font-medium"
              >
                AUTOMATION EXPERIENCE
              </div>
            </Card>
            
            {/* Cloud + CI/CD Practices */}
            <Card
              elevation="md"
              className="flex flex-col items-center justify-center p-6 text-center"
              style={{ 
                backgroundColor: tokens.colors.background,
              }}
            >
              <div 
                style={{ color: tokens.colors.accent }}
                className="text-2xl md:text-3xl font-bold mb-2"
              >
                CLOUD + CI/CD
              </div>
              <div 
                style={{ color: mutedTextColor }}
                className="text-sm md:text-base font-medium"
              >
                PRODUCTION ENGINEERING PRACTICES
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};