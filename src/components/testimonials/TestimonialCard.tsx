'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';
import { Testimonial } from '@/src/data/testimonials';

export interface TestimonialCardProps {
  /**
   * The testimonial record to display.
   */
  testimonial: Testimonial;
  /**
   * Optional additional className for styling.
   */
  className?: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
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

  const textColor = tokens.colors.text;
  const bgColor = tokens.colors.background;
  const primaryColor = tokens.colors.primary;
  const accentColor = tokens.colors.accent;

  // Animation variants
  const entranceVariant = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const hoverVariant = {
    whileHover: { 
      scale: 1.02, 
      transition: { duration: 0.2 } 
    },
    whileTap: { scale: 0.98 },
  };

  const focusVariant = {
    whileFocus: { 
      scale: 1.02, 
      transition: { duration: 0.2 } 
    },
  };

  return (
    <motion.article
      initial={prefersReducedMotion ? undefined : entranceVariant.initial}
      animate={prefersReducedMotion ? undefined : entranceVariant.animate}
      whileHover={prefersReducedMotion ? undefined : hoverVariant.whileHover}
      whileTap={prefersReducedMotion ? undefined : hoverVariant.whileTap}
      whileFocus={prefersReducedMotion ? undefined : focusVariant.whileFocus}
      className={`w-full flex flex-col justify-between p-4 sm:p-5 md:p-6 transition-all ${className}`}
    >
      <Card
        elevation="md"
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${accentColor}`,
        }}
      >
        <div>
          {/* Testimonial Quote */}
          <p
            style={{ color: textColor }}
            className="text-sm sm:text-base md:text-lg leading-relaxed mb-4 italic"
          >
            “{testimonial.quote}”
          </p>

          {/* Attribution */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              {testimonial.profileUrl ? (
                <a
                  href={testimonial.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: primaryColor }}
                  className="hover:underline font-semibold"
                >
                  {testimonial.name}
                </a>
              ) : (
                <span style={{ color: primaryColor }} className="font-semibold">
                  {testimonial.name}
                </span>
              )}
            </div>
            <div>
              <span
                style={{ color: textColor }}
                className="text-xs sm:text-sm"
              >
                {testimonial.role}
              </span>
              <span
                className="mx-1"
                aria-hidden="true"
              >
                •
              </span>
              <span
                style={{ color: textColor }}
                className="text-xs sm:text-sm"
              >
                {testimonial.company}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.article>
  );
};