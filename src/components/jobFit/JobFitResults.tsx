'use client';

import React from 'react';
import { useTheme } from '@/design/themeContext';
import { motion } from 'framer-motion';
import { AlignmentBars } from './AlignmentBars';
import { Card } from '@/src/components/ui/Card';
import { PRIVACY_NOTICE, AI_DISCLAIMER } from './notices';
import type { JobFitAnalysis, FitEvidence } from '@/src/lib/jobFit/types';

interface JobFitResultsProps {
  analysis: JobFitAnalysis;
  evidence: FitEvidence[];
  jobDescription: string;
  onDownloadResume: () => void;
  onConnectLinkedIn: () => void;
  onEmailAnkit: () => void;
}

/**
 * Job fit results component.
 *
 * Presents the six sections of PRD §30 with the qualitative alignment
 * summary of PRD §89 and the call to action of PRD §90.
 * Also shows the sources, privacy notice and disclaimer.
 */
export function JobFitResults({
  analysis,
  evidence,
  jobDescription,
  onDownloadResume,
  onConnectLinkedIn,
  onEmailAnkit,
}: JobFitResultsProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    width: '100%',
    animation: prefersReducedMotion ? 'none' : 'fadeIn 0.4s ease',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: '0 0 16px 0',
    letterSpacing: '-0.02em',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const sectionContentStyle: React.CSSProperties = {
    fontSize: '0.9375rem',
    lineHeight: 1.7,
    color: theme === 'dark' ? '#B0B0B0' : '#424242',
  };

  const listItemStyle: React.CSSProperties = {
    margin: '8px 0',
    paddingLeft: 4,
    lineHeight: 1.7,
  };

  const sourcesStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const sourceItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    borderRadius: 12,
    border: theme === 'dark' ? '1px solid #3D3D3D' : '1px solid #E0E0E0',
    fontSize: '0.875rem',
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const sourceTypeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#90CAF9' : '#0D47A1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: theme === 'dark' ? 'rgba(13, 71, 161, 0.15)' : 'rgba(13, 71, 161, 0.1)',
    padding: '2px 8px',
    borderRadius: 9999,
  };

  const ctaContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 24,
    backgroundColor: theme === 'dark' ? '#1A1A2E' : '#F0F4F8',
    borderRadius: 16,
    border: theme === 'dark' ? '1px solid #2D2D44' : '1px solid #D0D8E0',
  };

  const ctaHeadingStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: '0 0 8px 0',
  };

  const ctaTextStyle: React.CSSProperties = {
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#B0B0B0' : '#424242',
    margin: '0 0 16px 0',
  };

  const ctaButtonsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  };

  const ctaButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: theme === 'dark' ? '#0D47A1' : '#0D47A1',
    border: 'none',
    borderRadius: 9999,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: prefersReducedMotion
      ? 'none'
      : 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: theme === 'dark'
      ? '0 2px 8px rgba(13, 71, 161, 0.4)'
      : '0 2px 8px rgba(13, 71, 161, 0.3)',
  };

  const ctaButtonHoverStyle: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#1565C0' : '#1565C0',
    transform: 'translateY(-2px)',
    boxShadow: theme === 'dark'
      ? '0 4px 12px rgba(13, 71, 161, 0.5)'
      : '0 4px 12px rgba(13, 71, 161, 0.4)',
  };

  const noticeContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#1A1A2E' : '#F8F9FA',
    borderRadius: 12,
    border: theme === 'dark' ? '1px solid #2D2D44' : '1px solid #E0E0E0',
  };

  const noticeStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#9E9E9E' : '#616161',
    margin: 0,
  };

  const jobDescriptionStyle: React.CSSProperties = {
    padding: 16,
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    borderRadius: 12,
    border: theme === 'dark' ? '1px solid #3D3D3D' : '1px solid #E0E0E0',
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#B0B0B0' : '#424242',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 300,
    overflow: 'auto',
  };

  const jobDescriptionLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#90CAF9' : '#0D47A1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  };

  return (
    <motion.div
      style={containerStyle}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      role="region"
      aria-live="polite"
      aria-label="Job fit analysis results"
    >
      {/* Job Description Reference */}
      <Card elevation="sm" bgColor="surface" radius="lg" size="md">
        <div style={jobDescriptionLabelStyle}>Analysed Job Description</div>
        <pre style={jobDescriptionStyle}>{jobDescription}</pre>
      </Card>

      {/* Alignment Summary */}
      <section aria-labelledby="alignment-heading">
        <h2 id="alignment-heading" style={headingStyle}>
          HOW ANKIT MAPS TO THIS ROLE
        </h2>
        <AlignmentBars bands={analysis.alignmentBands} />
      </section>

      {/* Six Sections of PRD §30 */}
      <div style={sectionStyle}>
        {/* Overall Positioning */}
        <section aria-labelledby="overall-positioning-heading">
          <h3 id="overall-positioning-heading" style={sectionTitleStyle}>
            Overall Positioning
          </h3>
          <p style={sectionContentStyle}>{analysis.overallPositioning}</p>
        </section>

        {/* Strong Matches */}
        {analysis.strongMatches.length > 0 && (
          <section aria-labelledby="strong-matches-heading">
            <h3 id="strong-matches-heading" style={sectionTitleStyle}>
              Strong Matches
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {analysis.strongMatches.map((point, index) => (
                <li key={index} style={listItemStyle}>
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Transferable Experience */}
        {analysis.transferableExperience.length > 0 && (
          <section aria-labelledby="transferable-experience-heading">
            <h3 id="transferable-experience-heading" style={sectionTitleStyle}>
              Transferable Experience
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {analysis.transferableExperience.map((point, index) => (
                <li key={index} style={listItemStyle}>
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Learning Agility */}
        <section aria-labelledby="learning-agility-heading">
          <h3 id="learning-agility-heading" style={sectionTitleStyle}>
            Learning Agility
          </h3>
          <p style={sectionContentStyle}>{analysis.learningAgility}</p>
        </section>

        {/* Interview Talking Points */}
        {analysis.interviewTalkingPoints.length > 0 && (
          <section aria-labelledby="interview-talking-points-heading">
            <h3 id="interview-talking-points-heading" style={sectionTitleStyle}>
              Interview Talking Points
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {analysis.interviewTalkingPoints.map((point, index) => (
                <li key={index} style={listItemStyle}>
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recommended Positioning */}
        <section aria-labelledby="recommended-positioning-heading">
          <h3 id="recommended-positioning-heading" style={sectionTitleStyle}>
            Recommended Positioning
          </h3>
          <p style={sectionContentStyle}>{analysis.recommendedPositioning}</p>
        </section>
      </div>

      {/* Sources */}
      {evidence.length > 0 && (
        <section aria-labelledby="sources-heading">
          <h3 id="sources-heading" style={sectionTitleStyle}>
            Based On
          </h3>
          <div style={sourcesStyle}>
            {evidence.map((source, index) => (
              <div key={index} style={sourceItemStyle}>
                <span style={sourceTypeStyle}>{source.sourceType}</span>
                <span>{source.sourceTitle}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action - PRD §90 */}
      <section aria-labelledby="cta-heading">
        <div style={ctaContainerStyle}>
          <h3 id="cta-heading" style={ctaHeadingStyle}>
            Want to talk to Ankit?
          </h3>
          <p style={ctaTextStyle}>
            Download the resume, connect on LinkedIn, or send an email to continue the conversation.
          </p>
          <div style={ctaButtonsStyle}>
            <a
              href="/resume"
              onClick={onDownloadResume}
              style={ctaButtonStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, ctaButtonHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, ctaButtonStyle)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Resume
            </a>
            <a
              href="https://linkedin.com/in/ankitnandwani"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onConnectLinkedIn}
              style={ctaButtonStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, ctaButtonHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, ctaButtonStyle)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Connect on LinkedIn
            </a>
            <a
              href="mailto:contact@ankitnandwani.com"
              onClick={onEmailAnkit}
              style={ctaButtonStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, ctaButtonHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, ctaButtonStyle)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Email Ankit
            </a>
          </div>
        </div>
      </section>

      {/* Privacy Notice and Disclaimer - PRD §99, §100 */}
      <section aria-labelledby="notices-heading">
        <h3 id="notices-heading" style={{ ...sectionTitleStyle, marginTop: 24 }}>
          Notes
        </h3>
        <div style={noticeContainerStyle}>
          <p style={noticeStyle}>{PRIVACY_NOTICE}</p>
          <p style={noticeStyle}>{AI_DISCLAIMER}</p>
        </div>
      </section>
    </motion.div>
  );
}