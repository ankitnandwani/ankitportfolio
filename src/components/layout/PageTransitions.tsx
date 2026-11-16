'use client';

import { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionsProps extends PropsWithChildren {
  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * The transition of the change of the page.
 *
 * It was the animation of the library, and it was in the first load of every
 * page of the site for a fade of 0.3 s. It is a CSS animation now, the same
 * fade, and the runtime of the library is not in the first load of every page
 * any more.
 *
 * The rule of the reduced motion of PRD §131 is in the CSS: a visitor who
 * asked for no motion gets no motion.
 */
export const PageTransitions = ({ children, className = '' }: PageTransitionsProps) => {
  /**
   * The path of the page. It is the key of the container, so that the
   * container is made again when the route changes and the fade runs again.
   */
  const pathname = usePathname();

  return (
    <div key={pathname} className={`${className} page-fade-in`}>
      {children}
    </div>
  );
};
