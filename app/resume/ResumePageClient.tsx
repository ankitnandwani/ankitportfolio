"use client";

import Link from 'next/link';
import { ResponsiveContainer } from '@/src/components/layout';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';
import { ResumeSummary } from '@/src/components/resume/ResumeSummary';
import { ResumeExperience } from '@/src/components/resume/ResumeExperience';
import { ResumeEducation } from '@/src/components/resume/ResumeEducation';
import { ResumeCertifications } from '@/src/components/resume/ResumeCertifications';
import { ResumeSkills } from '@/src/components/resume/ResumeSkills';
import { ResumeAchievements } from '@/src/components/resume/ResumeAchievements';
import React from 'react';

export const ResumePageClient: React.FC = () => {
  // Hook to detect if user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Animation variants for button hover and tap
  const hoverVariant = {
    whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const tapVariant = {
    whileTap: { scale: 0.98, transition: { duration: 0.1 } },
  };

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
          <Link href="/resume.pdf" prefetch>
            <motion.div
              initial={prefersReducedMotion ? undefined : hoverVariant.whileHover}
              animate={prefersReducedMotion ? undefined : hoverVariant.whileHover}
              whileTap={prefersReducedMotion ? undefined : tapVariant.whileTap}
            >
              <Button variant="secondary" size="lg" className="mt-8">
                Download PDF Resume
              </Button>
            </motion.div>
          </Link>
        </main>
      </ResponsiveContainer>
    </div>
  );
};