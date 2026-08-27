import { ResponsiveContainer } from '@/src/components/layout';
import { generateBaseMetadata } from '@/src/seo/metadata';
import { Hero } from '@/src/components/hero';
import { ProfessionalSection } from '@/src/components/professionalSection';
import { CareerTimeline } from '@/src/components/careerTimeline';

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
          <CareerTimeline className="mt-16" />
        </main>
      </ResponsiveContainer>
    </div>
  );
}