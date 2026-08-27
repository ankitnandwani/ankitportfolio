'use client';

import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';
import { Achievement } from '@/src/data/achievements';

export interface AchievementCardProps {
  /**
   * The achievement record to display.
   */
  achievement: Achievement;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  className = '',
}) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  const textColor = tokens.colors.text;
  const bgColor = tokens.colors.background;
  const surfaceColor = tokens.colors.surface;
  const primaryColor = tokens.colors.primary;
  const accentColor = tokens.colors.accent;

  const borderColor = achievement.featured ? accentColor : primaryColor;

  return (
    <Card
      elevation="md"
      className={`w-full flex flex-col justify-between p-4 sm:p-5 md:p-6 transition-all ${className}`}
      style={{
        backgroundColor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div>
        {/* Top Header: Domain & Company Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{
                backgroundColor: surfaceColor,
                color: primaryColor,
                borderColor: primaryColor,
              }}
              className="inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded border"
            >
              {achievement.domain}
            </span>
            <span
              style={{
                backgroundColor: surfaceColor,
                color: textColor,
              }}
              className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded border border-zinc-200 dark:border-zinc-700"
            >
              {achievement.company}
            </span>
          </div>

          {achievement.featured && (
            <span
              style={{
                backgroundColor: accentColor,
                color: '#FFFFFF',
              }}
              className="inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded shadow-sm"
            >
              Featured Impact
            </span>
          )}
        </div>

        {/* Accomplishment Title */}
        <h3
          style={{ color: textColor }}
          className="text-lg sm:text-xl md:text-2xl font-bold mb-2 leading-snug break-words"
        >
          {achievement.title}
        </h3>

        {/* Ownership / Responsibility */}
        <p
          style={{ color: textColor }}
          className="text-xs sm:text-sm md:text-base font-medium mb-4 leading-relaxed opacity-90 break-words"
        >
          {achievement.responsibility}
        </p>

        {/* Problem & Approach & Outcome Details */}
        <div className="space-y-3 mb-4">
          {/* Problem */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
            <h4
              style={{ color: accentColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              Challenge / Problem
            </h4>
            <p
              style={{ color: textColor }}
              className="text-xs sm:text-sm leading-relaxed break-words"
            >
              {achievement.problem}
            </p>
          </div>

          {/* Approach */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
            <h4
              style={{ color: primaryColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              Engineering Approach
            </h4>
            <p
              style={{ color: textColor }}
              className="text-xs sm:text-sm leading-relaxed break-words"
            >
              {achievement.approach}
            </p>
          </div>

          {/* Outcome */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
            <h4
              style={{ color: accentColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              Outcome & Impact
            </h4>
            <p
              style={{ color: textColor }}
              className="text-xs sm:text-sm font-semibold leading-relaxed break-words"
            >
              {achievement.outcome}
            </p>
          </div>
        </div>
      </div>

      {/* Technologies Footer */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <h4
          style={{ color: textColor }}
          className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80"
        >
          Technologies
        </h4>
        <ul
          className="flex flex-wrap gap-1.5 sm:gap-2 list-none p-0 m-0"
          aria-label={`Technologies used for ${achievement.title}`}
        >
          {achievement.technologies.map((tech) => (
            <li key={tech}>
              <span
                style={{
                  backgroundColor: surfaceColor,
                  color: textColor,
                }}
                className="inline-block px-2.5 py-1 rounded font-medium text-xs border border-zinc-200 dark:border-zinc-700 break-words"
              >
                {tech}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
