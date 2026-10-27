import { JobFitAnalyzer } from '@/src/components/jobFit';
import { generateBaseMetadata } from '@/src/seo/metadata';

export const metadata = {
  ...generateBaseMetadata(
    'Job Description Analyzer',
    'Paste a job description to see how Ankit\'s experience maps to the role. Evidence-based, qualitative fit analysis.'
  ),
};

export default function JobFitPage() {
  return <JobFitAnalyzer />;
}