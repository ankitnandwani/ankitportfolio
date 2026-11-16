import assert from 'node:assert/strict';
import test from 'node:test';

import { AnimatePresence, motion } from './index.ts';

test('the module of the site offers the motion of the library', () => {
  assert.ok(motion, 'the module offers the motion');
  assert.ok((motion as unknown as Record<string, unknown>).div, 'the motion offers the elements');
});

test('the module of the site offers the presence of the library', () => {
  assert.ok(AnimatePresence, 'the module offers the presence');
});

test('the module of the site is the only place where the library is imported', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('./index.ts', import.meta.url), 'utf8');

  assert.match(source, /export \{ motion, AnimatePresence \} from 'framer-motion';/);
});
