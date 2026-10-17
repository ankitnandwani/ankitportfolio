'use client';

import React from 'react';
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
  return (
    <section className={`${className} grid gap-6 md:grid-cols-2 lg:grid-cols-3`}>
      {socialLinks.map((link) => {
        const Icon = iconMap[link.platform] || FiLinkedin; // fallback
        return (
          <motion.a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card
              elevation="sm"
              radius="md"
              className="flex flex-col items-center justify-center p-4 bg-background"
            >
              <div className="mb-3">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="text-center text-sm font-medium">
                {link.label}
              </div>
            </Card>
          </motion.a>
        );
      })}
    </section>
  );
};

export default SocialHub;