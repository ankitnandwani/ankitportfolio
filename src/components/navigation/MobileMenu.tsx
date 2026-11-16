'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
  links: Array<{ href: string; label: string }>;
}

/**
 * The menu of the phone.
 *
 * The motion of the menu is CSS and not the library of the animation: the
 * navigation is in the first load of every page of the site, and the runtime
 * of the library is 134 kB that a page that does not animate has no use for.
 * The rules of the CSS are in `app/globals.css`.
 */
export const MobileMenu = ({ links }: MobileMenuProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2"
        aria-label="Toggle mobile menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <Menu className="h-6 w-6" />
        ) : (
          <Hamburger className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <div
          className="mobile-menu md:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-background border border-border rounded-md shadow-md z-50"
        >
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  block px-3 py-2 rounded-md text-sm font-medium
                  ${pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'}
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

// Simple hamburger icon
const Hamburger = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// Simple menu icon (X)
const Menu = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);