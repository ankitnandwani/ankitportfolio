'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/design/themeContext';
import { Project } from '@/src/data/projects';
import { ProjectCard } from './ProjectCard';

export interface ProjectListProps {
  /**
   * Array of projects to display.
   */
  projects: Project[];
  /**
   * Optional filters to apply (currently supports category filtering).
   */
  filters?: {
    category?: Project['category'];
  };
  /**
   * Optional section heading.
   */
  heading?: string;
  /**
   * Optional section subtitle.
   */
  subtitle?: string;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  filters,
  heading,
  subtitle,
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

  // Apply filters
  let filteredProjects = projects;
  if (filters) {
    if (filters.category) {
      filteredProjects = projects.filter(project => project.category === filters.category);
    }
    // Additional filters can be added here in the future
  }

  return (
    <section className={className}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Optional Section Header */}
        {heading || subtitle ? (
          <div className="mb-8">
            {heading && (
              <h2
                style={{ color: tokens.colors.text }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              >
                {heading}
              </h2>
            )}
            {subtitle && (
              <p
                style={{ color: tokens.colors.text }}
                className="max-w-xl text-base sm:text-lg leading-relaxed opacity-90"
              >
                {subtitle}
              </p>
            )}
          </div>
        ) : null}

        {/* Projects Grid */}
        <motion.div
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          initial={prefersReducedMotion ? undefined : containerVariants.hidden}
          animate={prefersReducedMotion ? undefined : containerVariants.show}
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={prefersReducedMotion ? undefined : itemVariants.hidden}
              animate={prefersReducedMotion ? undefined : itemVariants.show}
            >
              <ProjectCard key={project.id} project={project} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};