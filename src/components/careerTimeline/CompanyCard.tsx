'use client';

import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyCardProps {
  entry: {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    domain: string;
    responsibilities: string[];
    technologies: string[];
    notableProjects: string[];
  };
  index: number;
}

export const CompanyCard = ({ entry, index }: CompanyCardProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  const [expanded, setExpanded] = useState(false);

  const textColor = tokens.colors.text;
  const mutedTextColor = tokens.colors.text; // Could adjust opacity
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
    setExpanded(!expanded);
  };

  // Handle keyboard events (Enter or Space)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <Card
      elevation="md"
      className="w-full max-w-xl p-6"
      style={{ 
        backgroundColor: bgColor,
        borderLeft: `4px solid ${tokens.colors.primary}`,
      }}
    >
      {/* Header - always visible, clickable to toggle */}
      <div 
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-controls={`company-card-details-${index}`}
        className="flex items-center justify-between p-4 mb-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      >
        <div>
          <h3 
            style={{ color: textColor }}
            className="text-xl font-bold mb-1"
          >
            {entry.role}
          </h3>
          <p 
            style={{ color: mutedTextColor }}
            className="text-sm"
          >
            {entry.company} · {entry.domain}
          </p>
          <p 
            style={{ color: mutedTextColor }}
            className="text-xs mt-1"
          >
            {startDate} – {endDate}
          </p>
        </div>
        {/* Expand/Collapse Icon */}
        <span 
          style={{ 
            color: textColor,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}
          className="ml-4 transition-transform duration-300"
        >
          {/* Using a simple chevron icon (can be replaced with a proper icon later) */}
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Collapsible Content with animation */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="details"
            id={`company-card-details-${index}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-primary/20">
              {/* Responsibilities */}
              {entry.responsibilities.length > 0 && (
                <div className="mb-4">
                  <h4
                    style={{ color: textColor }}
                    className="text-lg font-medium mb-2"
                  >
                    Responsibilities
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {entry.responsibilities.map((resp, i) => (
                      <li key={i} style={{ color: textColor }}>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              {entry.technologies.length > 0 && (
                <div className="mb-4">
                  <h4
                    style={{ color: textColor }}
                    className="text-lg font-medium mb-2"
                  >
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {entry.technologies.map((tech, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: surfaceColor,
                          color: textColor,
                        }}
                        className="px-3 py-1 rounded font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notable Projects */}
              {entry.notableProjects.length > 0 && (
                <div className="mb-4">
                  <h4
                    style={{ color: textColor }}
                    className="text-lg font-medium mb-2"
                  >
                    Notable Projects
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {entry.notableProjects.map((proj, i) => (
                      <li key={i} style={{ color: textColor }}>
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