'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { careerTimelineData, CareerTimelineEntry } from '@/src/data/careerTimeline';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';

export interface ResumeExperienceProps {
  /**
   * Optional custom data to display instead of the default career timeline data.
   */
  data?: CareerTimelineEntry[];
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ResumeExperience: React.FC<ResumeExperienceProps> = ({
  data = careerTimelineData,
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
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
            Professional Experience
          </h2>
        </motion.div>

        {/* Experience Timeline */}
        <motion.div
          className="space-y-6"
          initial={prefersReducedMotion ? undefined : containerVariants.hidden}
          animate={prefersReducedMotion ? undefined : containerVariants.show}
        >
          {data.map((entry) => (
            <motion.div
              key={entry.company + entry.role + entry.startDate}
              initial={prefersReducedMotion ? undefined : itemVariants.hidden}
              animate={prefersReducedMotion ? undefined : itemVariants.show}
            >
              <Card
                elevation="md"
                className="p-6"
                style={{ 
                  backgroundColor: tokens.colors.background,
                }}
              >
                {/* Role and Company */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <h3
                      style={{ color: tokens.colors.text }}
                      className="text-xl font-bold"
                    >
                      {entry.role}
                    </h3>
                    <p
                      style={{ color: tokens.colors.text }}
                      className="text-sm font-medium"
                    >
                      {entry.company}
                    </p>
                  </div>
                  <p
                    style={{ color: tokens.colors.mutedForeground }}
                    className="text-sm sm:text-base whitespace-nowrap"
                  >
                    {entry.startDate} – {entry.endDate || 'Present'}
                  </p>
                </div>

                {/* Domain */}
                {entry.domain && (
                  <p
                    style={{ color: tokens.colors.mutedForeground }}
                    className="mb-2"
                  >
                    <span className="font-medium">Domain:</span> {entry.domain}
                  </p>
                )}

                {/* Responsibilities */}
                {entry.responsibilities.length > 0 && (
                  <>
                    <p className="font-medium mb-1">Responsibilities:</p>
                    <ul className="list-disc list-space mb-4">
                      {entry.responsibilities.map((resp, idx) => (
                        <li key={idx}>
                          <p style={{ color: tokens.colors.text }}>{resp}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Technologies */}
                {entry.technologies.length > 0 && (
                  <>
                    <p className="font-medium mb-1">Technologies:</p>
                    <ul className="list-disc list-space mb-4">
                      {entry.technologies.map((tech, idx) => (
                        <li key={idx}>
                          <span style={{ color: tokens.colors.text }}>{tech}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Notable Projects */}
                {entry.notableProjects.length > 0 && (
                  <>
                    <p className="font-medium mb-1">Notable Projects:</p>
                    <ul className="list-disc list-space mb-4">
                      {entry.notableProjects.map((proj, idx) => (
                        <li key={idx}>
                          <p style={{ color: tokens.colors.text }}>{proj}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};