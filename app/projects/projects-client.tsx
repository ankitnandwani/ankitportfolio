'use client';

import { useState } from 'react';
import { ProjectList } from '@/src/components/projects/ProjectList';
import { projectsData, Project } from '@/src/data/projects';
import { Button } from '@/src/components/ui/Button';

export default function ProjectsClient() {
  const [activeCategory, setActiveCategory] = useState<Project['category'] | 'All'>('All');

  // Get unique categories from projects data
  const categories: Array<Project['category'] | 'All'> = ['All', ...Array.from(new Set(projectsData.map(p => p.category)))];

  // Filter projects based on active category
  const filteredProjects =
    activeCategory === 'All'
      ? projectsData
      : projectsData.filter((project) => project.category === activeCategory);

  return (
    <>
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Projects</h1>
        <p className="text-lg text-muted-foreground">
          Explore professional, personal, and engineering-lab projects with filtering by category.
        </p>
      </header>

      {/* Filtering Controls */}
      <div className="mb-10 flex flex-wrap gap-4">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setActiveCategory(category)}
            className="px-4 py-2"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Projects List */}
      <ProjectList
        projects={filteredProjects}
        heading={activeCategory === 'All' ? 'All Projects' : `${activeCategory} Projects`}
        subtitle={filteredProjects.length > 0 ? `Showing ${filteredProjects.length} project${filteredProjects.length === 1 ? '' : 's'}` : 'No projects found in this category.'}
        className="mb-12"
      />
    </>
  );
}