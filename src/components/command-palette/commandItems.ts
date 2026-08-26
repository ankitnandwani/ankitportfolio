import { CommandItem } from './types';

export const COMMAND_ITEMS: CommandItem[] = [
  // Navigation destinations
  { label: 'HOME', href: '/', icon: 'home' },
  { label: 'WORK', href: '/work', icon: 'briefcase' },
  { label: 'PROJECTS', href: '/projects', icon: 'folder' },
  { label: 'EXPERIENCE', href: '/experience', icon: 'building' },
  { label: 'ENGINEERING', href: '/engineering', icon: 'code' },
  { label: 'RESUME', href: '/resume', icon: 'document-text' },
  { label: 'ASK AI', href: '/ask-ai', icon: 'bot' },
  { label: 'CONTACT', href: '/contact', icon: 'phone' },
  
  // Actions (these would execute functions rather than navigate)
  { label: 'Toggle theme', action: 'toggleTheme', icon: 'moon' },
  { label: 'View resume', action: 'viewResume', icon: 'eye' },
  { label: 'Ask AI', action: 'askAI', icon: 'bot' },
];