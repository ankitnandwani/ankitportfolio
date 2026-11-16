'use client';

/**
 * The one place where the animation library of the site is imported.
 *
 * The library is the one of the decision of the animation of the site, and it
 * is used in thirty-two files. Every one of them imports it from here, so
 * that the place where the library enters the site is one place and not
 * thirty-two, and so that the size of the library in the first load of the
 * pages can be read in one place.
 *
 * The module offers the same API as the library for the parts that the site
 * uses, so that a component does not have to know how the loading is done.
 *
 * The rules of the first load are in `src/lib/performance/firstLoad.ts`, and
 * the measurement of the size is in `scripts/measurePerformance.mts`.
 */

// The parts of the library that the site uses.
export { motion, AnimatePresence } from 'framer-motion';
export type { HTMLMotionProps } from 'framer-motion';
