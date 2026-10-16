'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { skillsData, SkillsData } from '@/src/data/skills';
import { Badge } from '@/src/components/ui/Badge';
import { useTheme } from '@/design/themeContext';

export interface ResumeSkillsProps {
  /**
   * Optional custom data to display instead of the default skills data.
   */
  data?: SkillsData;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const ResumeSkills: React.FC<ResumeSkillsProps> = ({
  data = skillsData,
  className = '',
}) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Hook to detect if user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  // Get categorized skills with fallback to empty array
  const qeSkills = data.categorizedSkills?.qualityEngineering ?? [];
  const beSkills = data.categorizedSkills?.backendApi ?? [];
  const cicdSkills = data.categorizedSkills?.ciCd ?? [];
  const cloudSkills = data.categorizedSkills?.cloudData ?? [];
  const aiSkills = data.categorizedSkills?.aiModernEngineering ?? [];

  // Check if any categorized skills exist
  const hasCategorizedData = () => {
    return (
      qeSkills.length > 0 ||
      beSkills.length > 0 ||
      cicdSkills.length > 0 ||
      cloudSkills.length > 0 ||
      aiSkills.length > 0
    );
  };

  return (
    <section className={`${className} w-full py-12`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={prefersReducedMotion ? undefined : containerVariants.hidden}
          animate={prefersReducedMotion ? undefined : containerVariants.show}
        >
          <h2
            style={{ color: tokens.colors.text }}
            className="mb-6 text-2xl sm:text-3xl md:text-4xl font-black text-center"
          >
            Technical Skills
          </h2>
        </motion.div>

        {/* Skills Content */}
        <motion.div
          initial={prefersReducedMotion ? undefined : textVariants.hidden}
          animate={prefersReducedMotion ? undefined : textVariants.show}
        >
          {hasCategorizedData() ? (
            <>
              {/* Quality Engineering */}
              {qeSkills.length > 0 && (
                <>
                  <h3
                    style={{ color: tokens.colors.text }}
                    className="mb-3 text-xl font-semibold"
                  >
                    Quality Engineering
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {qeSkills.map((skill, idx) => (
                      <motion.div
                        key={`qe-${skill}-${idx}`}
                        initial={prefersReducedMotion ? undefined : badgeVariants.hidden}
                        animate={prefersReducedMotion ? undefined : badgeVariants.show}
                      >
                        <Badge variant="primary" size="md">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Backend/API */}
              {beSkills.length > 0 && (
                <>
                  <h3
                    style={{ color: tokens.colors.text }}
                    className="mb-3 text-xl font-semibold"
                  >
                    Backend/API
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {beSkills.map((skill, idx) => (
                      <motion.div
                        key={`be-${skill}-${idx}`}
                        initial={prefersReducedMotion ? undefined : badgeVariants.hidden}
                        animate={prefersReducedMotion ? undefined : badgeVariants.show}
                      >
                        <Badge variant="primary" size="md">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* CI/CD */}
              {cicdSkills.length > 0 && (
                <>
                  <h3
                    style={{ color: tokens.colors.text }}
                    className="mb-3 text-xl font-semibold"
                  >
                    CI/CD
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cicdSkills.map((skill, idx) => (
                      <motion.div
                        key={`cicd-${skill}-${idx}`}
                        initial={prefersReducedMotion ? undefined : badgeVariants.hidden}
                        animate={prefersReducedMotion ? undefined : badgeVariants.show}
                      >
                        <Badge variant="primary" size="md">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Cloud/Data */}
              {cloudSkills.length > 0 && (
                <>
                  <h3
                    style={{ color: tokens.colors.text }}
                    className="mb-3 text-xl font-semibold"
                  >
                    Cloud/Data
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cloudSkills.map((skill, idx) => (
                      <motion.div
                        key={`cloud-${skill}-${idx}`}
                        initial={prefersReducedMotion ? undefined : badgeVariants.hidden}
                        animate={prefersReducedMotion ? undefined : badgeVariants.show}
                      >
                        <Badge variant="primary" size="md">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* AI/Modern Engineering */}
              {aiSkills.length > 0 && (
                <>
                  <h3
                    style={{ color: tokens.colors.text }}
                    className="mb-3 text-xl font-semibold"
                  >
                    AI / Modern Engineering
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {aiSkills.map((skill, idx) => (
                      <motion.div
                        key={`ai-${skill}-${idx}`}
                        initial={prefersReducedMotion ? undefined : badgeVariants.hidden}
                        animate={prefersReducedMotion ? undefined : badgeVariants.show}
                      >
                        <Badge variant="primary" size="md">
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : data.technicalSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {data.technicalSkills.map((skill, idx) => (
                <motion.div
                  key={`skill-${skill}-${idx}`}
                  initial={prefersReducedMotion ? undefined : badgeVariants.hidden}
                  animate={prefersReducedMotion ? undefined : badgeVariants.show}
                >
                  <Badge variant="primary" size="md">
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p
              style={{ color: tokens.colors.mutedForeground }}
              className="text-center text-sm italic"
            >
              Skills data pending verification against resume.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};