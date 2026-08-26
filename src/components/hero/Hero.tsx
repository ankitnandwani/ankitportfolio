'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/design/themeContext';
import { siteConfig } from '../../siteConfig';
import { FiLinkedin, FiGithub } from 'react-icons/fi';

interface HeroProps {
  /**
   * Optional className for customization
   */
  className?: string;
}

export const Hero = ({ className = '' }: HeroProps) => {
  const { getThemeTokens } = useTheme();
  const tokens = getThemeTokens();

  // Get text color from tokens (adapts to light/dark mode)
  const textColor = tokens.colors.text;

  return (
    <div className={className}>
      <div className="relative w-full h-full">
        {/* Background layer with subtle grid */}
        <Card
          elevation="none"
          className="absolute inset-0"
          style={{ 
            backgroundColor: tokens.colors.background,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23ffffff'/><path d='M0 40L40 0M20 0L20 40M0 20L40 20' stroke='%23cccccc' stroke-width='1'/></svg>")`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Middle layer with subtle grid */}
        <Card
          elevation="sm"
          className="absolute inset-2"
          style={{ 
            backgroundColor: tokens.colors.surface,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23ffffff'/><path d='M0 40L40 0M20 0L20 40M0 20L40 20' stroke='%23cccccc' stroke-width='1'/></svg>")`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Floating technology tokens */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-10 w-6 h-6 rounded-full" style={{ backgroundColor: tokens.colors.primary, opacity: 0.2 }}></div>
          <div className="absolute top-20 right-10 w-8 h-8 rounded-full" style={{ backgroundColor: tokens.colors.accent, opacity: 0.15 }}></div>
          <div className="absolute bottom-10 left-20 w-7 h-7 rounded-full" style={{ backgroundColor: tokens.colors.primary, opacity: 0.15 }}></div>
          <div className="absolute bottom-20 right-20 w-5 h-5 rounded-full" style={{ backgroundColor: tokens.colors.accent, opacity: 0.1 }}></div>
        </div>
        {/* Foreground layer - main content */}
        <Card
          elevation="md"
          className="relative z-10 inset-0 p-md"
          style={{ 
            backgroundColor: tokens.colors.background,
          }}
        >
          <h1 
            style={{ color: textColor }}
            className="text-5xl font-black leading-tight tracking-tighter mb-lg"
          >
            ANKIT NANDWANI
          </h1>
          <h2 
            style={{ color: textColor }}
            className="text-lg font-semibold mb-md"
          >
            Senior SDET / Automation Engineer
          </h2>
          <div className="space-y-sm mb-lg">
            <p 
              style={{ color: textColor }}
              className="text-base font-medium"
            >
              Quality Engineering.
            </p>
            <p 
              style={{ color: textColor }}
              className="text-base font-medium"
            >
              Backend Automation.
            </p>
            <p 
              style={{ color: textColor }}
              className="text-base font-medium"
            >
              Cloud.
            </p>
            <p 
              style={{ color: textColor }}
              className="text-base font-medium"
            >
              AI.
            </p>
          </div>
          <p 
            style={{ color: textColor }}
            className="text-base font-normal"
          >
            Building reliable software and engineering systems across complex technology stacks.
          </p>
          <div className="mt-lg flex flex-col sm:flex-row gap-x-md gap-y-sm">
            <Link href="/work" prefetch>
              <Button variant="primary" size="lg">
                Explore My Work
              </Button>
            </Link>
            <Link href="/ask-ai" prefetch>
              <Button variant="primary" size="lg">
                Ask My AI
              </Button>
            </Link>
          </div>

          {/* Secondary CTAs */}
          <div className="mt-lg flex flex-col sm:flex-row gap-x-md gap-y-sm">
            {/* Download Resume */}
            <Link href="/resume.pdf" prefetch>
              <Button variant="secondary" size="lg">
                Download Resume
              </Button>
            </Link>
            {/* LinkedIn */}
            <a
              href={siteConfig.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors duration-200"
            >
              <FiLinkedin className="h-4 w-4" />
              LinkedIn
            </a>
            {/* GitHub */}
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors duration-200"
            >
              <FiGithub className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}