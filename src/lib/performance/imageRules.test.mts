import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkPictures,
  findNextImageNames,
  findPicturesWithoutSizes,
  findRawPictures,
} from './imageRules.ts';

test('a raw picture fails the rule', () => {
  const failures = checkPictures([
    {
      file: 'src/components/hero/Hero.tsx',
      source: [
        'export function Hero() {',
        '  return <img src="/hero.png" alt="Ankit" />;',
        '}',
      ].join('\n'),
    },
  ]);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].file, 'src/components/hero/Hero.tsx');
  assert.equal(failures[0].line, 2);
});

test('a picture of next/image with its sizes passes the rule', () => {
  const failures = checkPictures([
    {
      file: 'src/components/project/Card.tsx',
      source: [
        "import Image from 'next/image';",
        'export function Card() {',
        '  return <Image src="/project.png" alt="A project" width={800} height={600} />;',
        '}',
      ].join('\n'),
    },
  ]);

  assert.equal(failures.length, 0);
});

test('a picture of next/image that fills its parent passes the rule', () => {
  const failures = checkPictures([
    {
      file: 'src/components/project/Card.tsx',
      source: [
        "import Image from 'next/image';",
        'export function Card() {',
        '  return <Image src="/project.png" alt="A project" fill />;',
        '}',
      ].join('\n'),
    },
  ]);

  assert.equal(failures.length, 0);
});

test('a picture of next/image without its sizes fails the rule', () => {
  const failures = checkPictures([
    {
      file: 'src/components/project/Card.tsx',
      source: [
        "import Image from 'next/image';",
        'export function Card() {',
        '  return <Image src="/project.png" alt="A project" />;',
        '}',
      ].join('\n'),
    },
  ]);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].file, 'src/components/project/Card.tsx');
  assert.equal(failures[0].line, 3);
});

test('the files of the site pass the rule', () => {
  const failures = checkPictures([
    {
      file: 'src/components/hero/Hero.tsx',
      source: [
        "import { FiLinkedin } from 'react-icons/fi';",
        'export function Hero() {',
        '  return <FiLinkedin className="h-4 w-4" aria-hidden="true" />;',
        '}',
      ].join('\n'),
    },
    {
      file: 'src/components/navigation/ThemeToggle.tsx',
      source: [
        'export function ThemeToggle() {',
        '  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18" /></svg>;',
        '}',
      ].join('\n'),
    },
  ]);

  assert.equal(failures.length, 0);
});

test('the name of the picture of next/image is found', () => {
  assert.deepEqual(findNextImageNames("import Image from 'next/image';"), ['Image']);
  assert.deepEqual(findNextImageNames("import NextImage from 'next/image';"), ['NextImage']);
  assert.deepEqual(findNextImageNames("import { motion } from 'next/image';"), []);
  assert.deepEqual(findNextImageNames("import Image from 'react-icons/fi';"), []);
});

test('the raw pictures of a file are found with their line', () => {
  const source = ['const a = 1;', 'const b = 2;', '<img src="/a.png" alt="a" />'].join('\n');

  assert.deepEqual(findRawPictures(source), [{ line: 3 }]);
});

test('a tag of an SVG inside a page is not a raw picture', () => {
  assert.deepEqual(findRawPictures('<svg viewBox="0 0 24 24"><image href="/a.png" /></svg>'), []);
});

test('the pictures without their sizes are found with their line', () => {
  const source = [
    "import Image from 'next/image';",
    'export function Card() {',
    '  return (',
    '    <div>',
    '      <Image src="/a.png" alt="a" />',
    '      <Image src="/b.png" alt="b" width={10} height={10} />',
    '    </div>',
    '  );',
    '}',
  ].join('\n');

  const found = findPicturesWithoutSizes(source);

  assert.equal(found.length, 1);
  assert.equal(found[0].line, 5);
});
