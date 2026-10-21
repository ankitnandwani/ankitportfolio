import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkByParagraphsThenOverlay,
  chunkTextWithOverlap,
  estimateTokenCount,
  splitIntoSentences,
} from './chunking.ts';

test('splits text into sentences', () => {
  assert.deepEqual(splitIntoSentences('A. B! C?'), ['A', 'B', 'C']);
});

test('returns no sentences for empty input', () => {
  assert.deepEqual(splitIntoSentences(''), []);
});

test('estimates token count from whitespace separated words', () => {
  assert.equal(estimateTokenCount('one two three'), 3);
  assert.equal(estimateTokenCount('hello world'), 2);
});

test('treats empty text as a single token', () => {
  // Characterisation of the current implementation: '' splits into [''], so an
  // empty string estimates to one token rather than zero.
  assert.equal(estimateTokenCount(''), 1);
});

test('keeps short text as a single chunk', () => {
  assert.deepEqual(chunkTextWithOverlap('hello', { targetTokens: 10 }), ['hello']);
});

test('splits long text into several chunks', () => {
  const text = 'Sentence number one. Sentence number two. '.repeat(40);
  const chunks = chunkTextWithOverlap(text, { targetTokens: 50, overlapPercent: 20 });

  assert.ok(chunks.length > 1, 'expected more than one chunk');
  assert.ok(
    chunks.every((chunk) => chunk.length > 0),
    'expected no empty chunks'
  );
});

test('overlaps consecutive chunks so no context is lost at a boundary', () => {
  const text = 'Alpha bravo charlie delta echo. Foxtrot golf hotel india. '.repeat(20);
  const chunks = chunkTextWithOverlap(text, { targetTokens: 40, overlapPercent: 25 });

  assert.ok(chunks.length > 1, 'expected more than one chunk');

  const tail = chunks[0].slice(-10);
  assert.ok(
    chunks[1].includes(tail),
    'expected the next chunk to repeat the tail of the previous one'
  );
});

test('keeps paragraphs together when the text fits the target size', () => {
  const text = 'First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.';
  const chunks = chunkByParagraphsThenOverlay(text);

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], text);
});

test('returns no chunks for empty input', () => {
  assert.deepEqual(chunkByParagraphsThenOverlay(''), []);
});

test('splits paragraphs across chunks once the target size is exceeded', () => {
  const paragraphs = Array.from(
    { length: 12 },
    (_, i) => `Paragraph number ${i} with a reasonable amount of supporting text.`
  ).join('\n\n');
  const chunks = chunkByParagraphsThenOverlay(paragraphs, {
    targetTokens: 40,
    overlapPercent: 20,
  });

  assert.ok(chunks.length > 1, 'expected the paragraphs to be split');
  assert.ok(
    chunks.every((chunk) => chunk.trim().length > 0),
    'expected no empty chunks'
  );
});
