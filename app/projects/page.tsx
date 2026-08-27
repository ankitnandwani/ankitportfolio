import { generateBaseMetadata } from '@/src/seo/metadata';
import { ResponsiveContainer } from '@/src/components/layout';
import ProjectsClient from './projects-client';

export const metadata = generateBaseMetadata(
  'Projects',
  "Explore Ankit's professional, personal, and engineering-lab projects"
);

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <ResponsiveContainer>
        <ProjectsClient />
      </ResponsiveContainer>
    </div>
  );
}