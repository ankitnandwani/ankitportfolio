import { generateBaseMetadata } from '@/src/seo/metadata';
import { ResponsiveContainer } from '@/src/components/layout';
import { notFound } from 'next/navigation';
import { projectsData } from '@/src/data/projects';
import ProjectDetailContent from './project-detail-content';

export const generateMetadata = async ({ params }: { params: { slug: string } }) => {
  const { slug } = params;
  
  // Find project by slug (id field)
  const project = projectsData.find((p) => p.id === slug);
  
  if (!project) {
    // Return empty metadata for 404 page
    return {};
  }
  
  return generateBaseMetadata(
    project.name,
    project.valueProposition
  );
};

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Find project by slug (id field)
  const project = projectsData.find((p) => p.id === slug);
  
  // Handle 404 case
  if (!project) {
    notFound();
  }
  
  // Get related projects (same category, excluding current project)
  const relatedProjects = projectsData
    .filter((p) => p.category === project.category && p.id !== project.id)
    .slice(0, 3); // Show up to 3 related projects
  
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <ResponsiveContainer>
        <ProjectDetailContent 
          project={project} 
          relatedProjects={relatedProjects} 
        />
      </ResponsiveContainer>
    </div>
  );
}