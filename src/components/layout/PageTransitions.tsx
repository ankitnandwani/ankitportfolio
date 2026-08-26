'use client';

import { PropsWithChildren } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Page transition variants
 * Uses fade transition by default, respecting reduced motion preferences
 */
const getPageVariants = (reducedMotion: boolean) => {
  if (reducedMotion) {
    // No animation when reduced motion is preferred
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };
};

interface PageTransitionsProps extends PropsWithChildren {
  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * PageTransitions component provides smooth fade-in/fade-out transitions
 * between route changes using Framer Motion's AnimatePresence.
 * Respects reduced motion preferences.
 */
export const PageTransitions = ({ children, className = '' }: PageTransitionsProps) => {
  /**
   * Hook to detect if user prefers reduced motion
   */
  function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };
      setPrefersReducedMotion(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
  }

  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const variants = getPageVariants(reducedMotion);

  return (
    <AnimatePresence>
      <motion.div
        key={pathname} // Change key when route changes to trigger animation
        className={className}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};