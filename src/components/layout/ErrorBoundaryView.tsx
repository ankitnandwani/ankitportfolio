'use client';

import { useEffect, useRef } from 'react';
import { tokens } from '@/design/tokens';

/**
 * The page that a boundary of the site shows to a visitor.
 *
 * It is a page of the site and not a message of the framework: the same
 * colours, the same radius, the same spacing and the same typography as the
 * rest of the site. It is used by both boundaries, so the two look the same.
 *
 * The component holds no dependency on the theme of the site, because the
 * boundary of the root replaces the layout of the site and with it the
 * provider of the theme. The colours are the ones of the design system, and
 * they follow the theme of the machine when the site has none.
 *
 * The message is announced, and the way to try again is a real button that
 * the focus is moved to, so a visitor who cannot see the page can still use
 * it with a keyboard (PRD §71).
 */

interface ErrorBoundaryViewProps {
  /** The heading of the page. */
  title: string;
  /** The message the visitor reads. */
  message: string;
  /** What the button does. */
  onRetry: () => void;
  /**
   * Whether the page fills the whole window.
   *
   * The boundary of the root replaces the whole document, and the boundary of
   * the routes sits between the navigation and the footer of the site.
   */
  fullPage?: boolean;
}

/**
 * The colours of the page, in the light theme and in the dark one.
 *
 * They are the colours of the design system. The dark ones are the ones of
 * the dark theme of the site, with a muted that keeps enough contrast on the
 * dark surface.
 */
const LIGHT_COLOURS = {
  background: tokens.colors.background,
  surface: tokens.colors.surface,
  text: tokens.colors.text,
  primary: tokens.colors.primary,
  accent: tokens.colors.accent,
  border: '#E0E0E0',
  onPrimary: '#FFFFFF',
};

const DARK_COLOURS = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  primary: '#90CAF9',
  accent: '#FFAB40',
  border: '#333333',
  onPrimary: '#121212',
};

/**
 * The rules of the page.
 *
 * The colours are variables, so the same rules serve both themes. The rule of
 * the dark class of the site comes after the rule of the machine, and it is
 * the more specific one, so the theme the visitor chose is the one that is
 * used.
 */
const BOUNDARY_CSS = `
  .neopop-boundary {
    --neopop-boundary-background: ${LIGHT_COLOURS.background};
    --neopop-boundary-surface: ${LIGHT_COLOURS.surface};
    --neopop-boundary-text: ${LIGHT_COLOURS.text};
    --neopop-boundary-primary: ${LIGHT_COLOURS.primary};
    --neopop-boundary-accent: ${LIGHT_COLOURS.accent};
    --neopop-boundary-border: ${LIGHT_COLOURS.border};
    --neopop-boundary-on-primary: ${LIGHT_COLOURS.onPrimary};
  }

  @media (prefers-color-scheme: dark) {
    .neopop-boundary {
      --neopop-boundary-background: ${DARK_COLOURS.background};
      --neopop-boundary-surface: ${DARK_COLOURS.surface};
      --neopop-boundary-text: ${DARK_COLOURS.text};
      --neopop-boundary-primary: ${DARK_COLOURS.primary};
      --neopop-boundary-accent: ${DARK_COLOURS.accent};
      --neopop-boundary-border: ${DARK_COLOURS.border};
      --neopop-boundary-on-primary: ${DARK_COLOURS.onPrimary};
    }
  }

  .dark .neopop-boundary {
    --neopop-boundary-background: ${DARK_COLOURS.background};
    --neopop-boundary-surface: ${DARK_COLOURS.surface};
    --neopop-boundary-text: ${DARK_COLOURS.text};
    --neopop-boundary-primary: ${DARK_COLOURS.primary};
    --neopop-boundary-accent: ${DARK_COLOURS.accent};
    --neopop-boundary-border: ${DARK_COLOURS.border};
    --neopop-boundary-on-primary: ${DARK_COLOURS.onPrimary};
  }

  .neopop-boundary button:focus {
    outline: 2px solid var(--neopop-boundary-text);
    outline-offset: 2px;
  }
`;

/**
 * The page that a boundary of the site shows to a visitor.
 *
 * @param props The title, the message and the way to try again.
 * @returns The page.
 */
export function ErrorBoundaryView({
  title,
  message,
  onRetry,
  fullPage = false,
}: ErrorBoundaryViewProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // The focus is moved to the way to try again, so a visitor who cannot see
    // the page is taken to it with the keyboard.
    buttonRef.current?.focus();
  }, []);

  return (
    <div
      className="neopop-boundary"
      style={{
        minHeight: fullPage ? '100vh' : '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.lg,
        backgroundColor: 'var(--neopop-boundary-background)',
        color: 'var(--neopop-boundary-text)',
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      <style>{BOUNDARY_CSS}</style>

      <div
        role="alert"
        aria-live="assertive"
        style={{
          maxWidth: 560,
          width: '100%',
          boxSizing: 'border-box',
          padding: tokens.spacing.xl,
          textAlign: 'center',
          backgroundColor: 'var(--neopop-boundary-surface)',
          border: `1px solid var(--neopop-boundary-border)`,
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.elevation.md,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: tokens.radius.pill,
            backgroundColor: 'var(--neopop-boundary-background)',
            color: 'var(--neopop-boundary-accent)',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>

        <h1
          style={{
            margin: `${tokens.spacing.md}px 0 0`,
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.bold,
            lineHeight: tokens.typography.lineHeight.tight,
            color: 'var(--neopop-boundary-text)',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: `${tokens.spacing.sm}px 0 0`,
            fontSize: tokens.typography.fontSize.sm,
            lineHeight: tokens.typography.lineHeight.relaxed,
            color: 'var(--neopop-boundary-text)',
          }}
        >
          {message}
        </p>

        <button
          ref={buttonRef}
          type="button"
          onClick={onRetry}
          style={{
            marginTop: tokens.spacing.lg,
            padding: `${tokens.spacing.sm + 4}px ${tokens.spacing.lg}px`,
            fontFamily: 'inherit',
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semiBold,
            color: 'var(--neopop-boundary-on-primary)',
            backgroundColor: 'var(--neopop-boundary-primary)',
            border: 'none',
            borderRadius: tokens.radius.md,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
