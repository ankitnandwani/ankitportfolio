'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { motion } from 'framer-motion';
import { socialLinks } from '@/src/data/socialLinks';

// Import icons from react-icons
import {
  FiLinkedin,
  FiGithub,
  FiTwitter,
  FiInstagram,
  FiFacebook,
  FiFileText,
} from 'react-icons/fi';
import {
  SiMedium,
  SiStackoverflow,
  SiTelegram,
  SiDiscord,
  SiQuora,
  SiLeetcode,
  SiCodewars,
} from 'react-icons/si';

// Icon mapping
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  linkedin: FiLinkedin,
  github: FiGithub,
  twitter: FiTwitter,
  medium: SiMedium,
  instagram: FiInstagram,
  stackoverflow: SiStackoverflow,
  telegram: SiTelegram,
  discord: SiDiscord,
  quora: SiQuora,
  facebook: FiFacebook,
  leetcode: SiLeetcode,
  codewars: SiCodewars,
  resume: FiFileText,
};

interface SocialHubProps {
  className?: string;
}

export const SocialHub = ({ className = '' }: SocialHubProps) => {
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

  // Animation variants
  const hoverVariant = {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.98 },
  };

  const focusVariant = {
    whileFocus: { scale: 1.03 },
  };

  // Entrance animation variants
  const entranceVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className={`${className} grid gap-6`}>
      {/* Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop, 4 on large desktop */}
      <div className="sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {socialLinks.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <p>Social links coming soon.</p>
          </div>
        ) : (
          <>
            {socialLinks.map((link) => {
              const Icon = iconMap[link.platform] || FiLinkedin; // fallback
              const motionProps = prefersReducedMotion
                ? {}
                : {
                    whileHover: hoverVariant.whileHover,
                    whileTap: hoverVariant.whileTap,
                    whileFocus: focusVariant.whileFocus,
                  };
              return (
                <motion.a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit Ankit's ${link.label} profile`}
                  initial={prefersReducedMotion ? undefined : entranceVariant.hidden}
                  animate={prefersReducedMotion ? undefined : entranceVariant.show}
                  {...motionProps}
                  className="
                    flex flex-col items-center justify-center p-4 bg-background
                    rounded-md
                    border border-border/20
                    transition-transform duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary
                    hover:shadow-md
                  "
                >
                  <Card
                    elevation="sm"
                    className="flex flex-col items-center justify-center w-full h-full"
                  >
                    <div className="mb-3 flex-shrink-0">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="text-center text-sm font-medium flex-grow">
                      {link.label}
                    </div>
                  </Card>
                </motion.a>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
};

export default SocialHub;