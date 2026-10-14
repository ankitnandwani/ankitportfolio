'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { summaryCopyData, SummaryCopyData } from '@/src/data/summaryCopyData';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';

export interface ResumeSummaryProps {
  /**
   * Optional custom data to display instead of the default summary data.
   */
  data?: SummaryCopyData;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ResumeSummary: React.FC<ResumeSummaryProps> = ({
  data = summaryCopyData,
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
            Professional Summary
          </h2>
        </motion.div>

        {/* Summary Text */}
        <motion.div
          initial={prefersReducedMotion ? undefined : textVariants.hidden}
          animate={prefersReducedMotion ? undefined : textVariants.show}
        >
          <Card
            elevation="md"
            className="px-6 py-8"
            style={{ 
              backgroundColor: tokens.colors.background,
            }}
          >
            <p
              style={{ color: tokens.colors.text }}
              className="text-base sm:text-lg leading-relaxed text-center"
            >
              {data.summary}
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};