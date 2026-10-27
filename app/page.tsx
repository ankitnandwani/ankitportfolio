import { ResponsiveContainer } from '@/src/components/layout';
import { generateBaseMetadata } from '@/src/seo/metadata';
import { Hero } from '@/src/components/hero';
import { ProfessionalSection } from '@/src/components/professionalSection';
import { CareerTimeline } from '@/src/components/careerTimeline';
import { AchievementsSection } from '@/src/components/achievements';
import { CapabilityAreas } from '@/src/components/capabilityAreas';
import { FeaturedProjects } from '@/src/components/projects';
import { SocialHub } from '@/src/components/socialHub/SocialHub';
import { TestimonialsSection } from '@/src/components/testimonials/TestimonialsSection';
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
          <section className="mt-16" aria-labelledby="job-fit-heading">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2
                    id="job-fit-heading"
                    className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-tight"
                  >
                    Job Description Analyzer
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl">
                    Paste a job description to see how Ankit&apos;s experience maps to the role.
                    Evidence-based, qualitative fit analysis powered by AI.
                  </p>
                </div>
                <a
                  href="/job-fit"
                  className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-medium rounded-full hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  Analyse a job description
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            </div>
          </section>
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
          <TestimonialsSection className="mt-16" />
        </main>
      </ResponsiveContainer>
    </div>
  );
}