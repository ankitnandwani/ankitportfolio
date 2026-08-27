'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';
import { Project } from '@/src/data/projects';

export interface ProjectCardProps {
  /**
   * The project record to display.
   */
  project: Project;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
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

  const textColor = tokens.colors.text;
  const bgColor = tokens.colors.background;
  const surfaceColor = tokens.colors.surface;
  const primaryColor = tokens.colors.primary;
  const accentColor = tokens.colors.accent;

  const borderColor = project.featured ? accentColor : primaryColor;

  // Animation variants
  const hoverVariant = {
    whileHover: { 
      scale: 1.02, 
      transition: { duration: 0.2 } 
    },
    whileTap: { scale: 0.98 },
  };

  const focusVariant = {
    whileFocus: { 
      scale: 1.02, 
      transition: { duration: 0.2 } 
    },
  };

  return (
    <motion.article
      whileHover={prefersReducedMotion ? undefined : hoverVariant.whileHover}
      whileTap={prefersReducedMotion ? undefined : hoverVariant.whileTap}
      whileFocus={prefersReducedMotion ? undefined : focusVariant.whileFocus}
      className={`w-full flex flex-col justify-between p-4 sm:p-5 md:p-6 transition-all ${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary`}
    >
      <Card
        elevation="md"
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${borderColor}`,
        }}
      >
        <div>
          {/* Header with category badge and project name */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category badge */}
              <span
                style={{
                  backgroundColor: surfaceColor,
                  color: primaryColor,
                  borderColor: primaryColor,
                }}
                className="inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded border"
              >
                {project.category}
              </span>
              {/* Project name */}
              <h3
                style={{ color: textColor }}
                className="text-lg sm:text-xl md:text-2xl font-bold mb-0 leading-snug break-words"
              >
                {project.name}
              </h3>
            </div>

            {/* Featured flag if applicable */}
            {project.featured && (
              <span
                style={{
                  backgroundColor: accentColor,
                  color: '#FFFFFF',
                }}
                className="inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded shadow-sm"
              >
                Featured
              </span>
            )}
          </div>

          {/* Value proposition (one-line description) */}
          <p
            style={{ color: textColor }}
            className="text-sm sm:text-base md:text-lg font-medium mb-4 leading-relaxed opacity-90 break-words"
          >
            {project.valueProposition}
          </p>

          {/* Why I built it (motivation/context) */}
          <div className="mb-4">
            <h4
              style={{ color: textColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              Why I built it
            </h4>
            <p
              style={{ color: textColor }}
              className="text-sm leading-relaxed break-words"
            >
              {project.whyBuilt}
            </p>
          </div>

          {/* What I learned (outcomes/insights) */}
          <div className="mb-4">
            <h4
              style={{ color: textColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              What I learned
            </h4>
            <p
              style={{ color: textColor }}
              className="text-sm leading-relaxed break-words"
            >
              {project.whatLearned}
            </p>
          </div>

          {/* Architecture (high-level overview) */}
          <div className="mb-4">
            <h4
              style={{ color: textColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              Architecture
            </h4>
            <p
              style={{ color: textColor }}
              className="text-sm leading-relaxed break-words"
            >
              {project.architecture}
            </p>
          </div>

          {/* Technologies (as styled badges/pills) */}
          <div className="mb-4">
            <h4
              style={{ color: textColor }}
              className="text-xs font-bold uppercase tracking-wider mb-1"
            >
              Technologies
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {project.technologies.map((tech, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: surfaceColor,
                    color: textColor,
                  }}
                  className="inline-block px-3 py-1.5 rounded font-medium text-xs border border-zinc-200 dark:border-zinc-700 break-words"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* GitHub and Live Demo links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: surfaceColor,
                  color: textColor,
                }}
                className="inline-flex items-center px-4 py-2 rounded font-medium text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                <span className="mr-2">GitHub</span>
                {/* Simple GitHub icon placeholder */}
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 1.07a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                {/* Screen reader text for link behavior */}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: surfaceColor,
                  color: textColor,
                }}
                className="inline-flex items-center px-4 py-2 rounded font-medium text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                <span className="mr-2">Live Demo</span>
                {/* Simple external link icon placeholder */}
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                {/* Screen reader text for link behavior */}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            )}
          </div>
        </div>
      </Card>
    </motion.article>
  );
};