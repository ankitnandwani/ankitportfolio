'use client';

import React from 'react';
import { ProfessionalSnapshot } from '@/src/components/professionalSnapshot';
import { SummaryCopy } from '@/src/components/summaryCopy';
import { ResponsiveContainer } from '@/src/components/layout/ResponsiveContainer';
import { professionalSnapshotData } from '@/src/data/professionalSnapshot';
import { summaryCopyData } from '@/src/data/summaryCopyData';
interface ProfessionalSectionProps {
  /**
   * Optional className for customization
   */
  className?: string;
}

export const ProfessionalSection = ({ className = '' }: ProfessionalSectionProps) => {

  return (
    <section className={`${className} w-full`}>
      <ResponsiveContainer>
        {/* Professional Snapshot - Metric Cards */}
        <ProfessionalSnapshot
          className="mb-12"
          data={professionalSnapshotData}
        />

        {/* Summary Copy */}
        <SummaryCopy
          summary={summaryCopyData.summary}
          className="mb-12 text-center"
        />
      </ResponsiveContainer>
    </section>
  );
};