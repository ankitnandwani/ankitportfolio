import { ResponsiveContainer } from '@/src/components/layout';
import { generateBaseMetadata } from '@/src/seo/metadata';
import { ResumeSummary } from '@/src/components/resume/ResumeSummary';

export const metadata = {
  ...generateBaseMetadata('Resume', 'Ankit Nandwani — Interactive Resume'),
};

export default function ResumePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ResponsiveContainer>
        <main className="flex flex-1 w-full flex-col items-center justify-between">
          <ResumeSummary />
        </main>
      </ResponsiveContainer>
    </div>
  );
}