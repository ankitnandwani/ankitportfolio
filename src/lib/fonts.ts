import { Geist_Mono } from 'next/font/google';

/**
 * The family of the monospaced letters of the site.
 *
 * The family is loaded by the pages that use it and by no other page:
 *
 * - the page of the design system, that prints the value of a token of the
 *   design system in the family, in `app/design-system/page-client.tsx`;
 * - the page of the analyzer of a job, that shows the description of the job
 *   in the family, in `src/components/jobFit/JobFitAnalyzer.tsx`.
 *
 * The family of the text of the site is a different one and it is loaded by
 * the layout, because the text of every page needs it.
 *
 * The variable keeps its name, `--font-geist-mono`, and it keeps its meaning:
 * the class `font-mono` of Tailwind asks for it, and the rule of the CSS of
 * the site that points at it does not change.
 */
export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
