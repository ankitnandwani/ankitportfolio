'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCommandPalette } from '@/src/hooks/useCommandPalette';

/**
 * The body of the palette is the heavy part of it: the list of the commands,
 * the search and the animation of the library.
 *
 * It is loaded when the palette is opened for the first time. The key that
 * opens it stays in the first load of every page, so the palette opens on the
 * first press of the key.
 */
const CommandPaletteDialog = dynamic(
  () => import('./CommandPaletteDialog').then((module) => module.CommandPaletteDialog),
  { ssr: false }
);

/**
 * How long the site waits before it fetches the code of the palette while
 * nothing else is happening.
 *
 * The code is not needed before the visitor opens the palette, and the
 * browser has nothing better to do after the page is there.
 */
const PALETTE_PREFETCH_DELAY_MS = 2000;

/**
 * Fetches the code of the palette before the visitor asks for it.
 */
function prefetchPalette(): void {
  void import('./CommandPaletteDialog');
}

interface CommandPaletteProps {
  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * The command palette of the site.
 *
 * The key that opens it is listened to here, in the first load of every page,
 * and the palette itself is loaded when it is opened.
 */
export const CommandPalette = ({ className = '' }: CommandPaletteProps) => {
  const { open, closePalette } = useCommandPalette();

  // The code of the palette is fetched when the browser has nothing better to
  // do, so that the palette opens at once when the visitor asks for it and
  // the code never competes with the content of the page.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      prefetchPalette();
    }, PALETTE_PREFETCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {open && <CommandPaletteDialog className={className} onClose={closePalette} />}
    </>
  );
};
