'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

const links = [
  { href: '/', label: 'HOME' },
  { href: '/work', label: 'WORK' },
  { href: '/projects', label: 'PROJECTS' },
  { href: '/experience', label: 'EXPERIENCE' },
  { href: '/engineering', label: 'ENGINEERING' },
  { href: '/resume', label: 'RESUME' },
  { href: '/ask-ai', label: 'ASK AI' },
  { href: '/contact', label: 'CONTACT' },
];

export const NavigationBar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-background/80 backdrop-blur-support border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-4">
          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium
                  ${pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'}
                `}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile menu and theme toggle */}
          <div className="flex md:hidden flex-1 items-center justify-end">
            <MobileMenu links={links} />
            <ThemeToggle className="ml-4" />
          </div>
        </div>
      </div>
    </nav>
  );
};