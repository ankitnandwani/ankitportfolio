import { ResponsiveContainer } from '@/src/components/layout';
import { generateBaseMetadata } from '@/src/seo/metadata';
import { Hero } from '@/src/components/hero';
import { ProfessionalSection } from '@/src/components/professionalSection';
import { CareerTimeline } from '@/src/components/careerTimeline';
import { AchievementsSection } from '@/src/components/achievements';
import { CapabilityAreas } from '@/src/components/capabilityAreas';
import { FeaturedProjects } from '@/src/components/projects';
import { SocialHub } from '@/src/components/socialHub/SocialHub';
import { capabilityAreasData } from '@/src/data/capabilityAreasData';

export const metadata = {
  ...generateBaseMetadata('Home', 'Senior SDET / Automation Engineer Portfolio & AI Recruiter Assistant'),
  // Override Open Graph image if needed
  openGraph: {
    ...generateBaseMetadata('Home', 'Senior SDET / Automation Engineer Portfolio & AI Recruiter Assistant').openGraph,
    // Optional: specify a specific image for homepage
  },
  twitter: {
    ...generateBaseMetadata('Home', 'Senior SDET / Automation Engineer Portfolio & AI Recruiter Assistant').twitter,
  },
};

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ResponsiveContainer>
        <main className="flex flex-1 w-full flex-col items-center justify-between">
          <Hero className="flex-1" />
          <ProfessionalSection className="mt-12" />
          <AchievementsSection className="mt-16" />
          <CareerTimeline className="mt-16" />
          <CapabilityAreas
            capabilities={capabilityAreasData.capabilities}
            className="mt-16"
          />
          <FeaturedProjects className="mt-16" limit={3} />
          <section className="mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              >
                Social Hub
              </h2>
              <SocialHub />
            </div>
          </section>
        </main>
      </ResponsiveContainer>
    </div>
  );
}