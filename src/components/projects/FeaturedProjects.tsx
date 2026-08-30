'use client';

import React from 'react';
import { ProjectList } from './ProjectList';
import { projectsData } from '@/src/data/projects';

export interface FeaturedProjectsProps {
  /**
   * Optional limit to showcase top/featured projects.
   */
  limit?: number;
  /**
   * Optional additional className for styling.
   */
  className?: string;
  /**
   * Optional section heading.
   */
  heading?: string;
  /**
   * Optional section subtitle.
   */
  subtitle?: string;
}

export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({
  limit,
  className = '',
  heading,
  subtitle,
}) => {
  // Filter to only featured projects
  let featuredProjects = projectsData.filter(project => project.featured === true);

  // Apply limit if provided
  if (limit !== undefined) {
    featuredProjects = featuredProjects.slice(0, limit);
  }

  return (
    <ProjectList
      projects={featuredProjects}
      heading={heading || 'Featured Projects'}
      subtitle={subtitle || 'Highlighted engineering endeavors'}
      className={className}
    />
  );
};