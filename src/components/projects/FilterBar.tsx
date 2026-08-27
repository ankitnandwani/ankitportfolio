'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/Button';

export interface FilterBarOptions {
  label: string;
  value: string;
}

export interface FilterBarProps {
  /**
   * Currently active filter value.
   */
  activeFilter: string;
  /**
   * Callback invoked when filter changes.
   */
  onFilterChange: (value: string) => void;
  /**
   * Array of filter options.
   */
  options: FilterBarOptions[];
  /**
   * Additional CSS class for the container.
   */
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  options,
  className = '',
}) => {
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

  const tapVariant = {
    whileTap: { scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const isActive = activeFilter === option.value;
        return (
          <motion.div
            key={option.value}
            whileTap={prefersReducedMotion ? undefined : tapVariant.whileTap}
          >
            <Button
              variant={isActive ? 'primary' : 'secondary'}
              size="md"
              onClick={() => onFilterChange(option.value)}
              aria-pressed={isActive}
              className="px-4 py-2"
            >
              {option.label}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};