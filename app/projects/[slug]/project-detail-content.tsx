'use client';

import { ProjectList } from '@/src/components/projects/ProjectList';
import { Project } from '@/src/data/projects';

interface ProjectDetailContentProps {
  project: Project;
  relatedProjects: Project[];
}

export default function ProjectDetailContent({ 
  project, 
  relatedProjects 
}: ProjectDetailContentProps) {
  return (
    <>
      {/* Page Header */}
      <header className="mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category badge */}
            <span
              style={{
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
              }}
              className="inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded border"
            >
              {project.category}
            </span>
            {/* Project name */}
            <h1
              style={{ color: 'hsl(var(--foreground))' }}
              className="text-4xl sm:text-5xl font-bold mb-0 leading-snug break-words"
            >
              {project.name}
            </h1>
          </div>
        </div>
        
        {/* Value proposition (one-line description) */}
        <p
          style={{ color: 'hsl(var(--foreground))' }}
          className="text-base sm:text-lg font-medium mb-6 leading-relaxed opacity-90 break-words"
        >
          {project.valueProposition}
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Why I built it */}
        <section>
          <h2
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-lg sm:text-xl font-bold mb-3 break-words"
          >
            Why I built it
          </h2>
          <p
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-sm sm:text-base leading-relaxed break-words"
          >
            {project.whyBuilt}
          </p>
        </section>

        {/* What I learned */}
        <section>
          <h2
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-lg sm:text-xl font-bold mb-3 break-words"
          >
            What I learned
          </h2>
          <p
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-sm sm:text-base leading-relaxed break-words"
          >
            {project.whatLearned}
          </p>
        </section>

        {/* Architecture */}
        <section>
          <h2
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-lg sm:text-xl font-bold mb-3 break-words"
          >
            Architecture
          </h2>
          <p
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-sm sm:text-base leading-relaxed break-words"
          >
            {project.architecture}
          </p>
        </section>

        {/* Technologies */}
        <section>
          <h2
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-lg sm:text-xl font-bold mb-3 break-words"
          >
            Technologies
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
            {project.technologies.map((tech, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                }}
                className="inline-block px-4 py-2 rounded font-medium text-sm border break-words"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* External Links */}
        <section>
          <h2
            style={{ color: 'hsl(var(--foreground))' }}
            className="text-lg sm:text-xl font-bold mb-3 break-words"
          >
            External Links
          </h2>
          <div className="flex flex-wrap gap-4">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                }}
                className="inline-flex items-center px-5 py-3 rounded font-medium text-sm border hover:bg-opacity-90 transition-colors break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                <span className="mr-3">GitHub</span>
                {/* Simple GitHub icon */}
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
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                }}
                className="inline-flex items-center px-5 py-3 rounded font-medium text-sm border hover:bg-opacity-90 transition-colors break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                <span className="mr-3">Live Demo</span>
                {/* Simple external link icon */}
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                {/* Screen reader text for link behavior */}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            )}
          </div>
        </section>

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