'use client';

import React from 'react';
import { careerTimelineData } from '@/src/data/careerTimeline';
import { CompanyCard } from './CompanyCard'; // To be implemented in M06.03
import { useTheme } from '@/design/themeContext';

interface CareerTimelineProps {
  /**
   * Optional className for customization
   */
  className?: string;
  /**
   * Optional data override (for testing or flexibility)
   */
  data?: typeof careerTimelineData;
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
    <section className={`${className} w-full py-12`}>
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Section title */}
        <h2 
          style={{ color: textColor }}
          className="text-3xl md:text-4xl font-black text-center mb-10"
        >
          Career Timeline
        </h2>
        
        {/* Timeline container */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute inset-0 w-0.5 bg-primary" />
          
          {/* Timeline entries */}
          <div className="relative pt-4">
            {data.map((entry, index) => (
              <div key={entry.company} className="mb-8">
                {/* Timeline dot */}
                <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-primary border-2 border-white" />
                
                {/* Card content */}
                <div className="ml-6">
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