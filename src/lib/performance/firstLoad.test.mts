import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FIRST_LOAD_RULES,
  MOTION_RUNTIME_MARKERS,
  evaluateFirstLoadRules,
  evaluateMotionRuntimeRule,
  findMotionRuntimeChunks,
  getFirstLoadRulesForRoute,
  type FirstLoadChunk,
} from './firstLoad.ts';

/**
 * The files of a first load that holds a part of the site.
 *
 * @param markers The words of the parts of the site that are in the files.
 * @returns The files.
 */
function chunksWith(...markers: string[]): FirstLoadChunk[] {
  return markers.map((marker) => ({ name: 'chunk.js', content: `/* ${marker} */` }));
}

test('a part of the site that is expected in the first load and is there passes', () => {
  const evaluation = evaluateFirstLoadRules(chunksWith('chat-panel'), [
    {
      name: 'chat-launcher',
      marker: 'chat-panel',
      expectation: 'inFirstLoad',
      scope: 'every',
      note: 'the button of the chat',
    },
  ]);

  assert.equal(evaluation.failures.length, 0);
  assert.equal(evaluation.checked, 1);
});

test('a part of the site that is expected in the first load and is not there fails', () => {
  const evaluation = evaluateFirstLoadRules(chunksWith('something else'), [
    {
      name: 'chat-launcher',
      marker: 'chat-panel',
      expectation: 'inFirstLoad',
      scope: 'every',
      note: 'the button of the chat',
    },
  ]);

  assert.equal(evaluation.failures.length, 1);
  assert.equal(evaluation.failures[0].name, 'chat-launcher');
  assert.equal(evaluation.failures[0].expectation, 'inFirstLoad');
  assert.equal(evaluation.failures[0].found, 'outOfFirstLoad');
});

test('a part of the site that is expected out of the first load and is there fails', () => {
  const evaluation = evaluateFirstLoadRules(chunksWith('Chat message input'), [
    {
      name: 'chat-panel',
      marker: 'Chat message input',
      expectation: 'outOfFirstLoad',
      scope: 'every',
      note: 'the panel of the chat',
    },
  ]);

  assert.equal(evaluation.failures.length, 1);
  assert.equal(evaluation.failures[0].name, 'chat-panel');
  assert.equal(evaluation.failures[0].found, 'inFirstLoad');
});

test('a part of the site that is expected out of the first load and is not there passes', () => {
  const evaluation = evaluateFirstLoadRules(chunksWith('something else'), [
    {
      name: 'chat-panel',
      marker: 'Chat message input',
      expectation: 'outOfFirstLoad',
      scope: 'every',
      note: 'the panel of the chat',
    },
  ]);

  assert.equal(evaluation.failures.length, 0);
});

test('the rules of the site hold the four parts of the first load', () => {
  const names = FIRST_LOAD_RULES.map((rule) => rule.name);

  assert.ok(names.includes('hero'));
  assert.ok(names.includes('chat-launcher'));
  assert.ok(names.includes('chat-panel'));
  assert.ok(names.includes('command-palette-body'));

  for (const rule of FIRST_LOAD_RULES) {
    assert.ok(rule.marker.length > 0, `the rule ${rule.name} has no marker`);
    assert.ok(rule.note.length > 10, `the rule ${rule.name} has no note`);
  }
});

test('the hero is checked on the home page and the rest on every page', () => {
  const home = getFirstLoadRulesForRoute('/');
  const contact = getFirstLoadRulesForRoute('/contact');

  assert.equal(home.length, FIRST_LOAD_RULES.length);
  assert.ok(contact.length < home.length);
  assert.ok(contact.every((rule) => rule.scope === 'every'));
  assert.ok(!contact.some((rule) => rule.name === 'hero'));
});

test('a page that does not animate and carries the runtime of the library fails', () => {
  const evaluation = evaluateMotionRuntimeRule([
    {
      route: '/projects',
      animates: false,
      chunks: [{ name: 'runtime.js', content: '/* framerAppearId */' }],
    },
  ]);

  assert.equal(evaluation.checked, 1);
  assert.equal(evaluation.failures.length, 1);
  assert.equal(evaluation.failures[0].route, '/projects');
  assert.equal(evaluation.failures[0].chunk, 'runtime.js');
});

test('a page that does not animate and does not carry the runtime passes', () => {
  const evaluation = evaluateMotionRuntimeRule([
    {
      route: '/projects',
      animates: false,
      chunks: [{ name: 'page.js', content: '/* the page */' }],
    },
  ]);

  assert.equal(evaluation.checked, 1);
  assert.equal(evaluation.failures.length, 0);
});

test('a page that animates carries the runtime of the library without failing', () => {
  const evaluation = evaluateMotionRuntimeRule([
    {
      route: '/',
      animates: true,
      chunks: [{ name: 'runtime.js', content: '/* framerAppearId */' }],
    },
  ]);

  assert.equal(evaluation.failures.length, 0);
  assert.deepEqual(evaluation.animating, ['/']);
});

test('the runtime of the library is found in the files of a first load', () => {
  const runtime = findMotionRuntimeChunks([
    { name: 'page.js', content: '/* the page */' },
    { name: 'runtime.js', content: '/* framerAppearId */' },
  ]);

  assert.equal(runtime.length, 1);
  assert.equal(runtime[0].name, 'runtime.js');
});

test('the words of the runtime of the library are the ones of the library', () => {
  assert.ok(MOTION_RUNTIME_MARKERS.length > 0);
  for (const marker of MOTION_RUNTIME_MARKERS) {
    assert.ok(marker.length > 0, 'a word of the runtime is empty');
  }
});
