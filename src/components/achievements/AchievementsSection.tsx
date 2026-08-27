'use client';

import React from 'react';
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

  // Filter and limit data if needed
  let displayData = data;
  if (limit !== undefined) {
    displayData = data.slice(0, limit);
  }

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
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          {displayData.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </div>
      </div>
    </section>
  );
};