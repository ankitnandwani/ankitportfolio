'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { testimonials } from '@/src/data/testimonials';
import { TestimonialCard } from './TestimonialCard';
import { useTheme } from '@/design/themeContext';

export interface TestimonialsSectionProps {
  /**
   * Optional custom testimonials data to display instead of the default data.
   */
  data?: typeof testimonials;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  data = testimonials,
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

  // If no testimonials data, return null to hide the entire section
  if (!data || data.length === 0) {
    return null;
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className={className}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2
            style={{ color: tokens.colors.text }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight"
          >
            Testimonials
          </h2>
          <p
            style={{ color: tokens.colors.text }}
            className="max-w-xl text-base sm:text-lg leading-relaxed opacity-90"
          >
            Professional endorsements from colleagues, managers, and clients.
          </p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          initial={prefersReducedMotion ? undefined : containerVariants.hidden}
          animate={prefersReducedMotion ? undefined : containerVariants.show}
        >
          {data.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              initial={prefersReducedMotion ? undefined : itemVariants.hidden}
              animate={prefersReducedMotion ? undefined : itemVariants.show}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};