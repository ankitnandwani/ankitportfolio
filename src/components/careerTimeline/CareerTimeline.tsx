'use client';

import React from 'react';
import { careerTimelineData, CareerTimelineData } from '@/src/data/careerTimeline';
import { CompanyCard } from './CompanyCard';
import { useTheme } from '@/design/themeContext';

interface CareerTimelineProps {
  /**
   * Optional className for customization
   */
  className?: string;
  /**
   * Optional data override (for testing or flexibility)
   */
  data?: CareerTimelineData;
}

export const CareerTimeline = ({ 
  className = '', 
  data = careerTimelineData 
}: CareerTimelineProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Get text color from tokens (adapts to light/dark mode)
  const textColor = tokens.colors.text;

  return (
    <section className={`${className} w-full py-8 sm:py-12`}>
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6">
        {/* Section title */}
        <h2 
          style={{ color: textColor }}
          className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-8 sm:mb-12"
        >
          Career Timeline
        </h2>
        
        {/* Timeline container */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div 
            className="absolute top-3 bottom-3 left-2.5 sm:left-3 md:left-4 w-0.5" 
            style={{ backgroundColor: tokens.colors.primary }}
            aria-hidden="true"
          />
          
          {/* Timeline entries */}
          <div className="space-y-6 sm:space-y-8">
            {data.map((entry, index) => (
              <div 
                key={`${entry.company}-${entry.startDate}`} 
                className="relative pl-7 sm:pl-9 md:pl-12"
              >
                {/* Timeline dot */}
                <div 
                  className="absolute left-2.5 sm:left-3 md:left-4 -translate-x-1/2 top-4 sm:top-5 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm"
                  style={{ backgroundColor: tokens.colors.primary }}
                  aria-hidden="true"
                />
                
                {/* Card content */}
                <div className="w-full">
                  <CompanyCard 
                    entry={entry} 
                    index={index} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};