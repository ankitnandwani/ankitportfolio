'use client';

import React from 'react';
import { FiLinkedin, FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi';
import { SiMedium } from 'react-icons/si';

import { socialLinks } from '@/src/data/socialLinks';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  linkedin: FiLinkedin,
  github: FiGithub,
  twitter: FiTwitter,
  instagram: FiInstagram,
  medium: SiMedium,
};

interface SocialLinksProps {
  className?: string;
}

/**
 * The links of the social networks.
 *
 * The motion of the links is CSS and not the library of the animation: the
 * footer is in the first load of every page of the site, and the runtime of
 * the library is 134 kB that a page that does not animate has no use for.
 * The rules of the CSS are in `app/globals.css`.
 */
export const SocialLinks = ({ className }: SocialLinksProps) => {
  return (
    <div className={className}>
      {socialLinks.map((link) => {
        const Icon = iconMap[link.platform] || FiLinkedin; // fallback to linkedin
        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="social-link flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
};