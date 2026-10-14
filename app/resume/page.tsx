import { ResponsiveContainer } from '@/src/components/layout';
import { generateBaseMetadata } from '@/src/seo/metadata';

export const metadata = {
  ...generateBaseMetadata('Resume', 'Ankit Nandwani — Interactive Resume'),
};

export default function ResumePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ResponsiveContainer>
        <main className="flex flex-1 w-full flex-col items-center justify-between">
          {/* Placeholder for resume content */}
          <div className="py-12 text-center">
            <h2 className="text-2xl font-bold">Resume Content Loading...</h2>
            <p className="mt-4 text-muted-foreground">Interactive resume section will appear here.</p>
          </div>
        </main>
      </ResponsiveContainer>
    </div>
  );
}