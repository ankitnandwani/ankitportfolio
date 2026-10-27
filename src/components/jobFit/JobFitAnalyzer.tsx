'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/design/themeContext';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { TypingIndicator } from '@/src/components/aiChat/TypingIndicator';
import { JobFitResults } from './JobFitResults';
import {
  MAX_JOB_DESCRIPTION_LENGTH,
  MIN_JOB_DESCRIPTION_LENGTH,
} from '@/src/lib/jobFit/limits';
import type { JobFitResponse } from '@/src/lib/jobFit/types';

type AnalyzerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; result: JobFitResponse };

/**
 * Job fit analyzer component.
 *
 * Main client component that holds the state, renders the input field,
 * calls the API, and presents the results.
 */
export function JobFitAnalyzer() {
  const { theme } = useTheme();
  const prefersReducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [jobDescription, setJobDescription] = useState('');
  const [state, setState] = useState<AnalyzerState>({ status: 'idle' });
  const [textareaHeight, setTextareaHeight] = useState(120);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = jobDescription.length;
  const isWithinLimits = charCount >= MIN_JOB_DESCRIPTION_LENGTH && charCount <= MAX_JOB_DESCRIPTION_LENGTH;
  const isLoading = state.status === 'loading';
  const canSubmit = isWithinLimits && !isLoading;

  const maxHeight = 400;

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      setTextareaHeight(newHeight);
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [jobDescription, adjustHeight]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      if (newValue.length <= MAX_JOB_DESCRIPTION_LENGTH) {
        setJobDescription(newValue);
      }
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (isLoading || !isWithinLimits) return;

    setState({ status: 'loading' });

    try {
      const response = await fetch('/api/job-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        // The route returns an error message in data.error
        setState({ status: 'error', message: data.error ?? 'Analysis failed. Please try again.' });
        return;
      }

      // Validate the response shape
      if (!data.analysis || !data.evidence || !data.metadata) {
        setState({ status: 'error', message: 'Received an unexpected response. Please try again.' });
        return;
      }

      setState({ status: 'done', result: data });
    } catch {
      setState({ status: 'error', message: 'Network error. Please check your connection and try again.' });
    }
  }, [jobDescription, isLoading, isWithinLimits]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (canSubmit) {
          handleAnalyze();
        }
      }
    },
    [canSubmit, handleAnalyze]
  );

  const handleRetry = useCallback(() => {
    handleAnalyze();
  }, [handleAnalyze]);

  const handleDismiss = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const handleDownloadResume = useCallback(() => {
    // The link handles navigation; this is for analytics in M17.08
    console.log('[job-fit] CTA: Download Resume clicked');
  }, []);

  const handleConnectLinkedIn = useCallback(() => {
    console.log('[job-fit] CTA: Connect on LinkedIn clicked');
  }, []);

  const handleEmailAnkit = useCallback(() => {
    console.log('[job-fit] CTA: Email Ankit clicked');
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 16px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 700,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: 0,
    letterSpacing: '-0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#9E9E9E' : '#616161',
    margin: 0,
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const inputCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 24,
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    margin: 0,
  };

  const textareaWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'relative',
  };

  const textareaStyle: React.CSSProperties = {
    minHeight: 120,
    maxHeight,
    height: textareaHeight,
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    border: theme === 'dark' ? '1px solid #3D3D3D' : '1px solid #E0E0E0',
    borderRadius: 12,
    color: theme === 'dark' ? '#E0E0E0' : '#212121',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    transition: prefersReducedMotion
      ? 'none'
      : 'border-color 0.2s ease, box-shadow 0.2s ease, height 0.1s ease',
    boxShadow: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const charCountStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: isWithinLimits
      ? (theme === 'dark' ? '#757575' : '#9E9E9E')
      : (theme === 'dark' ? '#EF5350' : '#C62828'),
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const limitTextStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: theme === 'dark' ? '#757575' : '#9E9E9E',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 8,
  };

  const analyzeButtonStyle: React.CSSProperties = {
    minWidth: 200,
    padding: '14px 32px',
    fontSize: '1rem',
    fontWeight: 600,
  };

  const loadingContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '32px 24px',
    textAlign: 'center',
  };

  const loadingTextStyle: React.CSSProperties = {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#B0B0B0' : '#424242',
    maxWidth: 500,
    margin: 0,
  };

  const errorCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 24,
    textAlign: 'center',
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    color: theme === 'dark' ? '#FFAB40' : '#C62828',
    margin: 0,
  };

  const errorButtonsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
  };

  const doneCardStyle: React.CSSProperties = {
    width: '100%',
  };

  return (
    <div style={containerStyle} role="main">
      <header style={headerStyle}>
        <h1 style={titleStyle}>Job Description Analyzer</h1>
        <p style={subtitleStyle}>
          Paste a job description to see how Ankit&apos;s experience maps to the role.
          The analysis is based on Ankit&apos;s approved professional information and
          follows a qualitative, evidence-based approach.
        </p>
      </header>

      {state.status === 'idle' && (
        <Card elevation="md" bgColor="surface" radius="xl" size="md" style={inputCardStyle}>
          <label htmlFor="job-description" style={fieldLabelStyle}>
            Job Description
          </label>
          <div style={textareaWrapperStyle}>
            <textarea
              ref={textareaRef}
              id="job-description"
              value={jobDescription}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onClick={adjustHeight}
              placeholder="Paste the full job description here. Include responsibilities, requirements, qualifications, and any other relevant details."
              disabled={isLoading}
              style={textareaStyle}
              aria-describedby="char-count job-desc-hint"
              rows={4}
              spellCheck={false}
            />
            <div id="char-count" style={charCountStyle} aria-live="polite">
              <span>{charCount}/{MAX_JOB_DESCRIPTION_LENGTH}</span>
              <span id="job-desc-hint" style={limitTextStyle}>
                Minimum {MIN_JOB_DESCRIPTION_LENGTH} characters
              </span>
            </div>
          </div>
          <div style={buttonContainerStyle}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              disabled={!canSubmit}
              style={analyzeButtonStyle}
              aria-disabled={!canSubmit}
            >
              Analyze Fit
            </Button>
          </div>
        </Card>
      )}

      {state.status === 'loading' && (
        <Card elevation="md" bgColor="surface" radius="xl" size="md" style={loadingContainerStyle}>
          <TypingIndicator theme={theme} />
          <p style={loadingTextStyle}>
            Reading the job description and comparing it against Ankit&apos;s professional profile.
            This takes a moment because we retrieve relevant evidence and analyze each requirement.
          </p>
        </Card>
      )}

      {state.status === 'error' && (
        <Card elevation="md" bgColor="surface" radius="xl" size="md" style={errorCardStyle} role="alert" aria-live="assertive">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto', color: theme === 'dark' ? '#EF5350' : '#C62828' }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={errorTextStyle}>{state.message}</p>
          <div style={errorButtonsStyle}>
            <Button variant="primary" size="md" onClick={handleRetry}>
              Retry
            </Button>
            <Button variant="secondary" size="md" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {state.status === 'done' && (
        <div style={doneCardStyle}>
          <JobFitResults
            analysis={state.result.analysis}
            evidence={state.result.evidence}
            jobDescription={jobDescription}
            onDownloadResume={handleDownloadResume}
            onConnectLinkedIn={handleConnectLinkedIn}
            onEmailAnkit={handleEmailAnkit}
          />
        </div>
      )}
    </div>
  );
}