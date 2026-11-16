'use client';

import React from 'react';
import '@/src/components/motion/motion.css';
import { Button } from '@/src/components/ui/Button';
import type { ComponentProps } from 'react';

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
  return (
    <div
      role="radiogroup"
      aria-label="Filter projects by category"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {options.map((option) => {
        const isActive = activeFilter === option.value;
        const buttonProps = {
          variant: isActive ? 'primary' : 'secondary',
          size: 'md',
          onClick: () => onFilterChange(option.value),
          role: 'radio',
          'aria-checked': isActive,
          className: 'px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
          children: option.label
        };
        return (
          <div key={option.value} className="filter-button">
            <Button {...(buttonProps as ComponentProps<typeof Button>)} />
          </div>
        );
      })}
    </div>
  );
}