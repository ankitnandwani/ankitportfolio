import { ResumePageClient } from './ResumePageClient';
import { generateBaseMetadata } from '@/src/seo/metadata';

export const metadata = {
  ...generateBaseMetadata('Resume', 'Ankit Nandwani — Interactive Resume'),
};

export default function ResumePage() {
  return <ResumePageClient />;
}