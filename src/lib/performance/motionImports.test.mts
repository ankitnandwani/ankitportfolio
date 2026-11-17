import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveModulePath,
  findModuleFile,
  findAnimationImports,
  isMotionModule,
  MOTION_MODULE,
  MOTION_LIBRARY,
  type SourceTree,
} from './motionImports.ts';
import { findModuleSpecifiers } from './moduleImports.ts';

/**
 * A tree of files that is held in the memory.
 *
 * @param files The files, by their path from the root of the repository.
 * @returns The tree.
 */
function treeOf(files: Record<string, string>): SourceTree {
  return {
    read(file: string): string | null {
      return files[file] ?? null;
    },
  };
}

test('the imports of a file are read, and the imports of the types are left out', () => {
  const specifiers = findModuleSpecifiers(
    [
      "import { motion } from '@/src/components/motion';",
      "import type { ReactNode } from 'react';",
      "import { Card } from '@/src/components/ui/Card';",
      "import './side-effect.css';",
      "export { ProjectList } from './ProjectList';",
      "export type { Project } from '@/src/data/projects';",
      "const Lazy = dynamic(() => import('./Lazy'));",
    ].join('\n')
  );

  assert.deepEqual(specifiers.static.sort(), [
    './ProjectList',
    './side-effect.css',
    '@/src/components/motion',
    '@/src/components/ui/Card',
  ]);
  assert.deepEqual(specifiers.lazy, ['./Lazy']);
});

test('the name of a module of the site is turned into a path', () => {
  assert.equal(
    resolveModulePath('@/src/components/motion', 'app/page.tsx'),
    'src/components/motion'
  );
  assert.equal(
    resolveModulePath('./Card', 'src/components/ui/Button.tsx'),
    'src/components/ui/Card'
  );
  assert.equal(
    resolveModulePath('../motion', 'src/components/ui/Card.tsx'),
    'src/components/motion'
  );
});

test('the name of a package is not turned into a path', () => {
  assert.equal(resolveModulePath('framer-motion', 'src/components/motion/index.ts'), null);
  assert.equal(resolveModulePath('react', 'app/page.tsx'), null);
});

test('the file of a module is found, with or without its name', () => {
  const tree = treeOf({
    'src/components/motion/index.ts': 'export { motion } from "framer-motion";',
    'src/components/ui/Card.tsx': 'export const Card = () => null;',
  });

  assert.equal(findModuleFile('src/components/motion', tree), 'src/components/motion/index.ts');
  assert.equal(findModuleFile('src/components/ui/Card', tree), 'src/components/ui/Card.tsx');
  assert.equal(findModuleFile('src/components/nothing', tree), null);
});

test('the module of the site of the animation is told apart from the other files', () => {
  assert.equal(isMotionModule('src/components/motion/index.ts'), true);
  assert.equal(isMotionModule('src/components/motion/other.ts'), true);
  assert.equal(isMotionModule('src/components/motion/motion.css'), false);
  assert.equal(isMotionModule('src/components/motionless.ts'), false);
});

test('a tree that imports the module of the site of the animation uses the animation', () => {
  const tree = treeOf({
    'app/page.tsx': "import { Hero } from '@/src/components/hero';",
    'src/components/hero/index.ts': "export { Hero } from './Hero';",
    'src/components/hero/Hero.tsx': "import { motion } from '@/src/components/motion';",
    'src/components/motion/index.ts': 'export { motion } from "framer-motion";',
  });

  const report = findAnimationImports('app/page.tsx', tree);

  assert.equal(report.usesAnimation, true);
  assert.deepEqual(report.motionModuleImports, ['src/components/hero/Hero.tsx']);
  assert.deepEqual(report.directLibraryImports, []);
});

test('a tree that imports the library without the module of the site is told apart', () => {
  const tree = treeOf({
    'app/page.tsx': "import { Hero } from '@/src/components/hero';",
    'src/components/hero/index.ts': "export { Hero } from './Hero';",
    'src/components/hero/Hero.tsx': "import { motion } from 'framer-motion';",
  });

  const report = findAnimationImports('app/page.tsx', tree);

  assert.equal(report.usesAnimation, true);
  assert.deepEqual(report.directLibraryImports, ['src/components/hero/Hero.tsx']);
  assert.deepEqual(report.motionModuleImports, []);
});

test('a tree that does not animate does not use the animation', () => {
  const tree = treeOf({
    'app/projects/page.tsx': "import ProjectsClient from './projects-client';",
    'app/projects/projects-client.tsx': "import { ProjectList } from '@/src/components/projects';",
    'src/components/projects/index.ts': "export { ProjectList } from './ProjectList';",
    'src/components/projects/ProjectList.tsx': "import { ProjectCard } from './ProjectCard';",
    'src/components/projects/ProjectCard.tsx': 'export const ProjectCard = () => null;',
  });

  const report = findAnimationImports('app/projects/page.tsx', tree);

  assert.equal(report.usesAnimation, false);
  assert.deepEqual(report.motionModuleImports, []);
});

test('a component that is loaded later is not in the first load of the page', () => {
  const tree = treeOf({
    'app/layout.tsx': "import { CommandPalette } from '@/src/components/command-palette';",
    'src/components/command-palette/index.ts': "export { CommandPalette } from './CommandPalette';",
    'src/components/command-palette/CommandPalette.tsx':
      "const CommandPaletteDialog = dynamic(() => import('./CommandPaletteDialog'));",
    'src/components/command-palette/CommandPaletteDialog.tsx':
      "import { AnimatePresence } from '@/src/components/motion';",
    'src/components/motion/index.ts': 'export { AnimatePresence } from "framer-motion";',
  });

  const report = findAnimationImports('app/layout.tsx', tree);

  assert.equal(report.usesAnimation, false);
  assert.deepEqual(report.lazyAnimationImports, [
    'src/components/command-palette/CommandPaletteDialog.tsx',
  ]);
});

test('the names of the module and of the library are the ones of the site', () => {
  assert.equal(MOTION_MODULE, 'src/components/motion');
  assert.equal(MOTION_LIBRARY, 'framer-motion');
});
