'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { achievementsData, Achievement } from '@/src/data/achievements';
import { AchievementCard } from '@/src/components/achievements/AchievementCard';
import { useTheme } from '@/design/themeContext';

export interface ResumeAchievementsProps {
  /**
   * Optional custom data to display instead of the default achievements data.
   */
  data?: Achievement[];
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ResumeAchievements: React.FC<ResumeAchievementsProps> = ({
  data = achievementsData,
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
            Achievements
          </h2>
        </motion.div>

        {/* Achievements Content */}
        <motion.div
          initial={prefersReducedMotion ? undefined : textVariants.hidden}
          animate={prefersReducedMotion ? undefined : textVariants.show}
        >
          {data.length > 0 ? (
            <div className="space-y-6">
              {data.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={prefersReducedMotion ? undefined : entryVariants.hidden}
                  animate={prefersReducedMotion ? undefined : entryVariants.show}
                >
                  <AchievementCard achievement={achievement} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p
              style={{ color: tokens.colors.mutedForeground }}
              className="text-center text-sm italic"
            >
              Achievements data pending verification against resume.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};