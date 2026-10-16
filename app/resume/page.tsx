import { ResponsiveContainer } from '@/src/components/layout';
import { generateBaseMetadata } from '@/src/seo/metadata';
import { ResumeSummary } from '@/src/components/resume/ResumeSummary';
import { ResumeExperience } from '@/src/components/resume/ResumeExperience';
import { ResumeEducation } from '@/src/components/resume/ResumeEducation';
import { ResumeCertifications } from '@/src/components/resume/ResumeCertifications';
import { ResumeSkills } from '@/src/components/resume/ResumeSkills';
import { ResumeAchievements } from '@/src/components/resume/ResumeAchievements';

export const metadata = {
  ...generateBaseMetadata('Resume', 'Ankit Nandwani — Interactive Resume'),
};

export default function ResumePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ResponsiveContainer>
        <main className="flex flex-1 w-full flex-col items-center justify-between">
          <ResumeSummary />
          <ResumeExperience />
          <ResumeEducation />
          <ResumeCertifications />
          <ResumeSkills />
          <ResumeAchievements />
        </main>
      </ResponsiveContainer>
    </div>
  );
}