'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { achievementsData, AchievementsData } from '@/src/data/achievements';
import { AchievementCard } from './AchievementCard';
import { useTheme } from '@/design/themeContext';

export interface AchievementsSectionProps {
  /**
   * Optional custom data to display instead of the default achievements data.
   */
  data?: AchievementsData;
  /**
   * Optional limit to showcase top/featured achievements.
   */
  limit?: number;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  data = achievementsData,
  limit,
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

  // Filter and limit data if needed
  let displayData = data;
  if (limit !== undefined) {
    displayData = data.slice(0, limit);
  }

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
    <section className={className}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2
            style={{ color: tokens.colors.text }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight"
          >
            Selected Impact
          </h2>
          <p
            style={{ color: tokens.colors.text }}
            className="max-w-xl text-base sm:text-lg leading-relaxed opacity-90"
          >
            Key engineering accomplishments demonstrating measurable outcomes and technical leadership.
          </p>
        </div>

        {/* Achievements Grid */}
        <motion.div
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          initial={prefersReducedMotion ? undefined : containerVariants.hidden}
          animate={prefersReducedMotion ? undefined : containerVariants.show}
        >
          {displayData.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={prefersReducedMotion ? undefined : itemVariants.hidden}
              animate={prefersReducedMotion ? undefined : itemVariants.show}
            >
              <AchievementCard achievement={achievement} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};