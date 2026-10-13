'use client';

import React, { useState, useEffect, Suspense } from 'react';
import ProjectCard from '@/src/components/projects/ProjectCard';
import { ProjectList } from '@/src/components/projects/ProjectList';
import { Project } from '@/src/data/projects';
import { useTheme } from '@/design/themeContext';

// Loading fallback for ProjectCard while waiting for GitHub data
const ProjectCardLoading = () => (
  <div className="h-96 w-full bg-muted rounded-lg p-6 flex flex-col space-x-4">
    <div className="h-6 w-20 bg-muted-foreground/20 rounded"></div>
    <div className="h-4 w-36 bg-muted-foreground/20 rounded mt-2"></div>
    <div className="h-4 w-24 bg-muted-foreground/20 rounded mt-1"></div>
    <div className="h-4 w-12 bg-muted-foreground/20 rounded mt-1"></div>
    {/* Add more placeholder lines to mimic the card's content */}
    <div className="h-4 w-32 bg-muted-foreground/20 rounded mt-2"></div>
    <div className="h-4 w-20 bg-muted-foreground/20 rounded mt-1"></div>
    <div className="h-4 w-16 bg-muted-foreground/20 rounded mt-1"></div>
  </div>
);

interface ProjectDetailContentProps {
  project: Project;
  relatedProjects: Project[];
}

export default function ProjectDetailContent({ 
  project, 
  relatedProjects 
}: ProjectDetailContentProps) {
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

  return (
    <>
      {/* Main Content */}
      <div className="space-y-8">
        <Suspense fallback={<ProjectCardLoading />}>
          <ProjectCard
            project={project}
            tokens={tokens}
            prefersReducedMotion={prefersReducedMotion}
          />
        </Suspense>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section>
            <h2
              style={{ color: 'hsl(var(--foreground))' }}
              className="text-lg sm:text-xl font-bold mb-3 break-words"
            >
              Related Projects
            </h2>
            <ProjectList
              projects={relatedProjects}
              heading={undefined}
              subtitle={undefined}
              className="mb-8"
            />
          </section>
        )}
      </div>
    </>
  );
}