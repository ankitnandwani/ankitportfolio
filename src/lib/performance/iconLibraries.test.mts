import assert from 'node:assert/strict';
import test from 'node:test';

import { ICON_LIBRARIES, findWholeLibraryImports, isWholeLibraryImport } from './iconLibraries.ts';

test('a file that imports a library of icons as a whole fails the rule', () => {
  const found = findWholeLibraryImports([
    {
      file: 'src/components/navigation/ThemeToggle.tsx',
      source: "import { Moon } from 'lucide-react';",
    },
  ]);

  assert.equal(found.length, 1);
  assert.equal(found[0].file, 'src/components/navigation/ThemeToggle.tsx');
  assert.equal(found[0].library, 'lucide-react');
});

test('a file that imports one icon of a library passes the rule', () => {
  const found = findWholeLibraryImports([
    {
      file: 'src/components/footer/socialLinks.tsx',
      source: [
        "import { FiLinkedin, FiGithub } from 'react-icons/fi';",
        "import { SiMedium } from 'react-icons/si';",
      ].join('\n'),
    },
  ]);

  assert.equal(found.length, 0);
});

test('a file that imports nothing of the libraries passes the rule', () => {
  const found = findWholeLibraryImports([
    { file: 'app/page.tsx', source: "import { Hero } from '@/src/components/hero';" },
  ]);

  assert.equal(found.length, 0);
});

test('the name of a library as a whole is told apart from the name of a set', () => {
  assert.equal(isWholeLibraryImport('react-icons'), true);
  assert.equal(isWholeLibraryImport('lucide-react'), true);
  assert.equal(isWholeLibraryImport('react-icons/fi'), false);
  assert.equal(isWholeLibraryImport('react-icons/si'), false);
  assert.equal(isWholeLibraryImport('framer-motion'), false);
});

test('the libraries of icons of the site are the ones that are known', () => {
  assert.ok(ICON_LIBRARIES.includes('react-icons'));
  assert.ok(ICON_LIBRARIES.includes('lucide-react'));
});
