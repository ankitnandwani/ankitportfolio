'use client';

import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';

interface CompanyCardProps {
  entry: {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    domain: string;
    responsibilities: string[];
    technologies: string[];
    notableProjects: string[];
  };
  index: number;
}

export const CompanyCard = ({ entry }: CompanyCardProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  const textColor = tokens.colors.text;
  const mutedTextColor = tokens.colors.text; // Could adjust opacity

  // Format dates
  const startDate = new Date(entry.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
  const endDate = entry.endDate 
    ? new Date(entry.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : 'Present';

  return (
    <Card
      elevation="md"
      className="w-full max-w-xl p-6"
      style={{ 
        backgroundColor: tokens.colors.background,
        borderLeft: `4px solid ${tokens.colors.primary}`,
      }}
    >
      <div className="mb-4">
        <h3 
          style={{ color: textColor }}
          className="text-xl font-bold"
        >
          {entry.role}
        </h3>
        <p 
          style={{ color: mutedTextColor }}
          className="text-sm"
        >
          {entry.company} · {entry.domain}
        </p>
        <p 
          style={{ color: mutedTextColor }}
          className="text-xs mt-1"
        >
          {startDate} – {endDate}
        </p>
      </div>
      
      {/* Responsibilities */}
      {entry.responsibilities.length > 0 && (
        <div className="mb-4">
          <h4 
            style={{ color: textColor }}
            className="text-lg font-medium mb-2"
          >
            Responsibilities
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {entry.responsibilities.map((resp, i) => (
              <li key={i} style={{ color: textColor }} className="text-sm">
                {resp}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Technologies */}
      {entry.technologies.length > 0 && (
        <div className="mb-4">
          <h4 
            style={{ color: textColor }}
            className="text-lg font-medium mb-2"
          >
            Technologies
          </h4>
          <div className="flex flex-wrap gap-2">
            {entry.technologies.map((tech, i) => (
              <span 
                key={i} 
                style={{ 
                  backgroundColor: tokens.colors.surface,
                  color: textColor,
                }}
                className="px-3 py-1 text-xs rounded font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Notable Projects */}
      {entry.notableProjects.length > 0 && (
        <div className="mb-4">
          <h4 
            style={{ color: textColor }}
            className="text-lg font-medium mb-2"
          >
            Notable Projects
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {entry.notableProjects.map((proj, i) => (
              <li key={i} style={{ color: textColor }} className="text-sm">
                {proj}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};