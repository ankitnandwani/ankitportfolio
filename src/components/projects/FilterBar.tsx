'use client';

import React from 'react';
import { Button } from '@/src/components/ui/Button';
import { useTheme } from '@/design/themeContext';

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
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = tokens.colors.primary;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const isActive = activeFilter === option.value;
        return (
          <Button
            key={option.value}
            variant={isActive ? 'primary' : 'secondary'}
            size="md"
            onClick={() => onFilterChange(option.value)}
            aria-pressed={isActive}
            className="px-4 py-2"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};