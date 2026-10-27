'use client';

import React from 'react';
import { useTheme } from '@/design/themeContext';

interface AlignmentBarsProps {
  bands: ReadonlyArray<{
    key: 'strong' | 'transferable' | 'growth';
    label: string;
    filledSegments: number;
  }>;
}

/**
 * Alignment bars component.
 *
 * Renders three bars showing the qualitative alignment summary of PRD §89.
 * Each bar has up to 4 segments (one per requirement in that band).
 * No percentages or fit scores are shown.
 */
export function AlignmentBars({ bands }: AlignmentBarsProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  };

  const bandStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const labelWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: 0,
  };

  const countStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme === 'dark' ? '#90CAF9' : '#0D47A1',
    whiteSpace: 'nowrap',
  };

  const barContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  };

  const segmentStyle: React.CSSProperties = {
    width: 40,
    height: 12,
    borderRadius: 4,
    transition: prefersReducedMotion
      ? 'none'
      : 'background-color 0.3s ease, transform 0.2s ease',
  };

  const segmentFilledStyle: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#0D47A1' : '#0D47A1',
    boxShadow: theme === 'dark'
      ? '0 2px 4px rgba(13, 71, 161, 0.4)'
      : '0 2px 4px rgba(13, 71, 161, 0.3)',
  };

  const segmentEmptyStyle: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#3D3D3D' : '#E0E0E0',
    border: theme === 'dark' ? '1px solid #4D4D4D' : '1px solid #E0E0E0',
  };

  // Generate text alternative for screen readers
  const textAlternative = bands
    .map((band) => `${band.label}: ${band.filledSegments} of 4 requirements`)
    .join('; ');

  return (
    <section
      style={containerStyle}
      role="img"
      aria-roledescription="alignment bars"
      aria-label={textAlternative}
    >
      {bands.map((band) => (
        <div key={band.key} style={bandStyle}>
          <div style={labelWrapperStyle}>
            <h3 style={labelStyle}>{band.label}</h3>
            <span style={countStyle} aria-hidden="true">
              {band.filledSegments} of 4
            </span>
          </div>
          <div style={barContainerStyle} role="list" aria-label={`${band.label} bar`}>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                role="listitem"
                style={{
                  ...segmentStyle,
                  ...(i < band.filledSegments ? segmentFilledStyle : segmentEmptyStyle),
                }}
                aria-label={`Requirement ${i + 1}: ${i < band.filledSegments ? 'in this band' : 'not in this band'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}