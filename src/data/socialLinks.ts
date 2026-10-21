// WARNING: This file contains placeholder URLs that MUST be verified against actual accounts before launch.
// Replace all placeholder URLs with real social media links.

/**
 * A single social media profile link.
 */
export interface SocialLink {
  /**
   * Platform identifier (e.g., 'linkedin', 'github'). Used to pick the icon.
   */
  platform: string;

  /**
   * Absolute URL to the profile.
   */
  url: string;

  /**
   * Human-readable label displayed to the user (e.g., 'LinkedIn').
   */
  label: string;

  /**
   * Icon identifier for the platform.
   */
  icon: string;
}

/**
 * Type alias for the social links collection.
 */
export type SocialLinksData = SocialLink[];

export const socialLinks: SocialLinksData = [
  {
    platform: 'linkedin',
    url: 'https://www.linkedin.com/in/TO_BE_VERIFIED',
    label: 'LinkedIn',
    icon: 'linkedin',
  },
  {
    platform: 'github',
    url: 'https://github.com/TO_BE_VERIFIED',
    label: 'GitHub',
    icon: 'github',
  },
  {
    platform: 'twitter',
    url: 'https://x.com/TO_BE_VERIFIED',
    label: 'X (Twitter)',
    icon: 'twitter',
  },
  {
    platform: 'medium',
    url: 'https://medium.com/@TO_BE_VERIFIED',
    label: 'Medium',
    icon: 'medium',
  },
  {
    platform: 'instagram',
    url: 'https://instagram.com/TO_BE_VERIFIED',
    label: 'Instagram',
    icon: 'instagram',
  },
  {
    platform: 'stackoverflow',
    url: 'https://stackoverflow.com/users/TO_BE_VERIFIED',
    label: 'Stack Overflow',
    icon: 'stack-overflow',
  },
  {
    platform: 'telegram',
    url: 'https://t.me/TO_BE_VERIFIED',
    label: 'Telegram',
    icon: 'telegram',
  },
  {
    platform: 'discord',
    url: 'https://discordapp.com/users/TO_BE_VERIFIED',
    label: 'Discord',
    icon: 'discord',
  },
  {
    platform: 'quora',
    url: 'https://www.quora.com/profile/TO_BE_VERIFIED',
    label: 'Quora',
    icon: 'quora',
  },
  {
    platform: 'facebook',
    url: 'https://www.facebook.com/TO_BE_VERIFIED',
    label: 'Facebook',
    icon: 'facebook',
  },
  {
    platform: 'leetcode',
    url: 'https://leetcode.com/TO_BE_VERIFIED',
    label: 'LeetCode',
    icon: 'leetcode',
  },
  {
    platform: 'codewars',
    url: 'https://www.codewars.com/users/TO_BE_VERIFIED',
    label: 'Codewars',
    icon: 'codewars',
  },
  {
    platform: 'resume',
    url: 'https://placeholder.com/resume/TO_BE_VERIFIED.pdf',
    label: 'Resume',
    icon: 'document-text',
  },
];
