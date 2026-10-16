'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { educationData, EducationEntry } from '@/src/data/education';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';

export interface ResumeEducationProps {
  /**
   * Optional custom data to display instead of the default education data.
   */
  data?: EducationEntry[];
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ResumeEducation: React.FC<ResumeEducationProps> = ({
  data = educationData,
  className = '',
}) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Hook to detect if user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const entryVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Helper to format date from ISO string to readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    } catch {
      return dateString; // fallback to original string if parsing fails
    }
  };

  return (
    <section className={`${className} w-full py-12`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={prefersReducedMotion ? undefined : containerVariants.hidden}
          animate={prefersReducedMotion ? undefined : containerVariants.show}
        >
          <h2
            style={{ color: tokens.colors.text }}
            className="mb-6 text-2xl sm:text-3xl md:text-4xl font-black text-center"
          >
            Education
          </h2>
        </motion.div>

        {/* Education Content */}
        <motion.div
          initial={prefersReducedMotion ? undefined : textVariants.hidden}
          animate={prefersReducedMotion ? undefined : textVariants.show}
        >
          {data.length > 0 ? (
            <div className="space-y-6">
              {data.map((entry, index) => (
                <motion.div
                  key={`${entry.institution}-${entry.degree}-${index}`}
                  initial={prefersReducedMotion ? undefined : entryVariants.hidden}
                  animate={prefersReducedMotion ? undefined : entryVariants.show}
                >
                  <Card
                    elevation="md"
                    className="p-6"
                    style={{ 
                      backgroundColor: tokens.colors.background,
                    }}
                  >
                    {/* Institution and Degree */}
                    <div className="mb-2">
                      <h3
                        style={{ color: tokens.colors.text }}
                        className="text-xl font-bold"
                      >
                        {entry.institution}
                      </h3>
                      <p
                        style={{ color: tokens.colors.text }}
                        className="text-lg font-medium"
                      >
                        {entry.degree}
                      </p>
                    </div>

                    {/* Field of Study */}
                    {entry.fieldOfStudy && (
                      <p
                        style={{ color: tokens.colors.mutedForeground }}
                        className="mb-2"
                      >
                        <span className="font-medium">Field of Study:</span> {entry.fieldOfStudy}
                      </p>
                    )}

                    {/* Date Range */}
                    <p
                      style={{ color: tokens.colors.mutedForeground }}
                      className="mb-2"
                    >
                      <span className="font-medium">Date:</span> 
                      {formatDate(entry.startDate)} – {formatDate(entry.endDate)}
                    </p>

                    {/* Location */}
                    {entry.location && (
                      <p
                        style={{ color: tokens.colors.mutedForeground }}
                        className="mb-2"
                      >
                        <span className="font-medium">Location:</span> {entry.location}
                      </p>
                    )}

                    {/* Description */}
                    {entry.description && (
                      <div className="mt-4">
                        <p
                          style={{ color: tokens.colors.text }}
                          className="text-base leading-relaxed"
                        >
                          {entry.description}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <p
              style={{ color: tokens.colors.mutedForeground }}
              className="text-center text-sm italic"
            >
              Education data pending verification against resume.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};