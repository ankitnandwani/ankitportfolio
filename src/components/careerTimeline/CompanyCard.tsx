'use client';

import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CareerTimelineEntry } from '@/src/data/careerTimeline';

interface CompanyCardProps {
  entry: CareerTimelineEntry;
  index: number;
}

export const CompanyCard = ({ entry, index }: CompanyCardProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  const [expanded, setExpanded] = useState(false);

  const textColor = tokens.colors.text;
  const mutedTextColor = tokens.colors.text;
  const bgColor = tokens.colors.background;
  const surfaceColor = tokens.colors.surface;

  // Format dates
  const startDate = new Date(entry.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
  const endDate = entry.endDate 
    ? new Date(entry.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : 'Present';

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  // Handle keyboard events (Escape to close when expanded)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && expanded) {
      e.preventDefault();
      setExpanded(false);
    }
  };

  const detailsId = `company-card-details-${index}`;

  return (
    <Card
      elevation="md"
      className="w-full max-w-full md:max-w-3xl"
      style={{ 
        backgroundColor: bgColor,
        borderLeft: `4px solid ${tokens.colors.primary}`,
      }}
    >
      {/* Header - semantic button with accessible name, state, and minimum 48px touch target */}
      <button
        type="button"
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${entry.role} at ${entry.company}`}
        className="w-full text-left flex items-center justify-between p-3 sm:p-4 min-h-[48px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-md select-none transition-colors"
      >
        <div className="flex-1 pr-2 min-w-0">
          <h3 
            style={{ color: textColor }}
            className="text-lg sm:text-xl font-bold mb-1 leading-snug break-words"
          >
            {entry.role}
          </h3>
          <p 
            style={{ color: mutedTextColor }}
            className="text-xs sm:text-sm font-medium leading-normal break-words opacity-90"
          >
            {entry.company} · {entry.domain}
          </p>
          <p 
            style={{ color: mutedTextColor }}
            className="text-xs mt-1 leading-normal opacity-75"
          >
            {startDate} – {endDate}
          </p>
        </div>
        {/* Expand/Collapse Icon with 48x48 touch target container */}
        <div 
          className="flex-shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center -mr-1 sm:-mr-2"
          aria-hidden="true"
        >
          <span 
            style={{ 
              color: tokens.colors.primary,
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            className="text-sm font-bold transition-transform duration-300"
          >
            ▼
          </span>
        </div>
      </button>

      {/* Collapsible Content with animation */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            id={detailsId}
            role="region"
            aria-label={`Details for ${entry.role} at ${entry.company}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 md:p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
              {/* Responsibilities */}
              {entry.responsibilities.length > 0 && (
                <div>
                  <h4
                    style={{ color: textColor }}
                    className="text-sm sm:text-base font-semibold mb-2"
                  >
                    Responsibilities
                  </h4>
                  <ul 
                    className="list-disc list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed"
                    aria-label={`Responsibilities at ${entry.company}`}
                  >
                    {entry.responsibilities.map((resp, i) => (
                      <li key={i} style={{ color: textColor }} className="break-words">
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              {entry.technologies.length > 0 && (
                <div>
                  <h4
                    style={{ color: textColor }}
                    className="text-sm sm:text-base font-semibold mb-2"
                  >
                    Technologies
                  </h4>
                  <ul 
                    className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm list-none p-0 m-0"
                    aria-label={`Technologies used at ${entry.company}`}
                  >
                    {entry.technologies.map((tech, i) => (
                      <li key={i}>
                        <span
                          style={{
                            backgroundColor: surfaceColor,
                            color: textColor,
                          }}
                          className="inline-block px-2.5 py-1 sm:px-3 sm:py-1 rounded font-medium text-xs sm:text-sm break-words border border-zinc-200 dark:border-zinc-700"
                        >
                          {tech}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notable Projects */}
              {entry.notableProjects.length > 0 && (
                <div>
                  <h4
                    style={{ color: textColor }}
                    className="text-sm sm:text-base font-semibold mb-2"
                  >
                    Notable Projects
                  </h4>
                  <ul 
                    className="list-disc list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed"
                    aria-label={`Notable projects at ${entry.company}`}
                  >
                    {entry.notableProjects.map((proj, i) => (
                      <li key={i} style={{ color: textColor }} className="break-words">
                        {proj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};