'use client';

import React from 'react';
import { motion } from 'framer-motion';
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

export const SocialLinks = ({ className }: SocialLinksProps) => {
  return (
    <div className={className}>
      {socialLinks.map((link) => {
        const Icon = iconMap[link.platform] || FiLinkedin; // fallback to linkedin
        return (
          <motion.a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Icon className="h-4 w-4" />
          </motion.a>
        );
      })}
    </div>
  );
};