import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyTopic } from './topicClassification.ts';

/**
 * The questions PRD §29 suggests showing at the start.
 *
 * Every one of them has to reach the knowledge base, so a change to the
 * keyword lists that stops one of them is caught here.
 */
const SUGGESTED_QUESTIONS = [
  'What does Ankit specialize in?',
  'Tell me about his automation experience.',
  'What backend technologies has he worked with?',
  'Has he worked with CI/CD?',
  'What kind of projects has he built?',
  'Would he be a good fit for a Staff SDET role?',
  'How does his experience translate to financial services?',
  'What are his strongest technical areas?',
];

const PROFESSIONAL_QUESTIONS = [
  ...SUGGESTED_QUESTIONS,
  'What is his educational background?',
  'Which certifications does he hold?',
  'What is his career path?',
  'Where can I find his projects on GitHub?',
  'How does he approach code review?',
  'Tell me about his achievements at the network pricing API.',
  'What domains does he have experience in?',
  'Can you compare his experience with our backend SDET role?',
];

const OFF_TOPIC_QUESTIONS = [
  "What's your favorite movie?",
  'Tell me a joke.',
  'What is the weather today?',
  'Who won the football match?',
  'Recommend me a recipe for pasta.',
  'Can you write me a poem?',
  'What do you think about politics?',
  'What is your name?',
  'Do you like pizza?',
  'Play me some music.',
  'What is the capital of France?',
  'Give me the lottery numbers.',
];

test('allows the questions about the professional profile', () => {
  for (const question of PROFESSIONAL_QUESTIONS) {
    const result = classifyTopic(question);

    assert.equal(
      result.isAllowed,
      true,
      `expected "${question}" to be allowed, but it was not`
    );
    assert.notEqual(result.topic, 'off_topic');
    assert.ok(result.confidence >= 0.5, `expected a confidence of 0.5 or more`);
  }
});

test('treats the questions about something else as off topic', () => {
  for (const question of OFF_TOPIC_QUESTIONS) {
    const result = classifyTopic(question);

    assert.equal(
      result.isAllowed,
      false,
      `expected "${question}" to be off topic, but it was allowed`
    );
    assert.equal(result.topic, 'off_topic');
  }
});

test('names the subject of the question', () => {
  assert.equal(classifyTopic('What kind of projects has he built?').topic, 'projects');
  assert.equal(
    classifyTopic('Which certifications does he hold?').topic,
    'certifications'
  );
  assert.equal(
    classifyTopic('What is his educational background?').topic,
    'education'
  );
  assert.equal(
    classifyTopic('Would he be a good fit for a Staff SDET role?').topic,
    'job_fit'
  );
});

test('reports the words that were matched', () => {
  const result = classifyTopic('What backend technologies has he worked with?');

  assert.ok(result.matches?.includes('technologies'));
  assert.ok(result.matches?.includes('backend'));
  assert.match(result.reason ?? '', /professional signal/);
});

test('gives a higher confidence to a question with more signals', () => {
  const single = classifyTopic('What does Ankit specialize in?');
  const several = classifyTopic(
    'What backend technologies has he worked with, and what projects did he build?'
  );

  assert.ok(single.confidence < several.confidence);
  assert.ok(several.confidence >= 0.9);
});

test('blocks a question with one signal in the strict profile', () => {
  const question = 'What does Ankit specialize in?';

  assert.equal(classifyTopic(question).isAllowed, true);
  assert.equal(
    classifyTopic(question, { sensitivity: 'strict' }).isAllowed,
    false
  );
  assert.equal(
    classifyTopic(question, { sensitivity: 'relaxed' }).isAllowed,
    true
  );
});

test('allows a question that only mentions Ankit in the relaxed profile', () => {
  const question = 'Is Ankit available?';

  assert.equal(classifyTopic(question).isAllowed, false);
  assert.equal(
    classifyTopic(question, { sensitivity: 'relaxed' }).isAllowed,
    true
  );
});

test('does not treat a short number as a professional signal', () => {
  const result = classifyTopic('What is 2+2?');

  assert.equal(result.isAllowed, false);
  assert.equal(result.confidence, 0);
});

test('does not let the word "the" count as a signal', () => {
  const result = classifyTopic('Is the weather nice in the city?');

  assert.equal(result.isAllowed, false);
});
