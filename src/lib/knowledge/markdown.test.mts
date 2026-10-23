import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMarkdownDocuments,
  MarkdownParseError,
  parseMarkdownDocument,
} from './markdown.ts';

test('parses frontmatter and body', () => {
  const document = parseMarkdownDocument(
    [
      '---',
      'title: A Public Article',
      'source_type: public_article',
      'classification: PUBLIC',
      'version: 3',
      '---',
      '',
      'The body of the article.',
    ].join('\n')
  );

  assert.equal(document.title, 'A Public Article');
  assert.equal(document.content, 'The body of the article.');
  assert.equal(document.frontmatter.source_type, 'public_article');
  assert.equal(document.frontmatter.classification, 'PUBLIC');
  assert.equal(document.frontmatter.version, '3');
});

test('falls back to the first heading when no title is declared', () => {
  const document = parseMarkdownDocument('# Heading Title\n\nSome body text.');

  assert.equal(document.title, 'Heading Title');
  assert.equal(document.content, '# Heading Title\n\nSome body text.');
});

test('treats a file without frontmatter as a plain body', () => {
  const document = parseMarkdownDocument('Just some text.');

  assert.deepEqual(document.frontmatter, {});
  assert.equal(document.content, 'Just some text.');
});

test('rejects a document with no content', () => {
  assert.throws(() => parseMarkdownDocument('---\ntitle: Empty\n---\n'), MarkdownParseError);
});

test('builds a document that follows the frontmatter', () => {
  const [spec] = buildMarkdownDocuments(
    'knowledge/article.md',
    [
      '---',
      'title: A Public Article',
      'source_type: public_article',
      'classification: PUBLIC',
      'version: 3',
      '---',
      '',
      'Article body.',
    ].join('\n')
  );

  assert.ok(spec);
  assert.equal(spec.title, 'A Public Article');
  assert.equal(spec.source_type, 'public_article');
  assert.equal(spec.classification, 'PUBLIC');
  assert.equal(spec.version, 3);
  assert.equal(spec.source_file, 'knowledge/article.md');
  assert.equal(spec.content, 'Article body.');
});

test('derives the classification from the source type when it is not declared', () => {
  const [spec] = buildMarkdownDocuments(
    'knowledge/social-link.md',
    ['---', 'title: Links', 'source_type: social_link', '---', '', 'Body.'].join('\n')
  );

  assert.ok(spec);
  assert.equal(spec.classification, 'PUBLIC');
  assert.equal(spec.version, 1);
});

test('rejects a classification that PRD 34 does not allow', () => {
  assert.throws(
    () =>
      buildMarkdownDocuments(
        'knowledge/article.md',
        ['---', 'title: A', 'classification: SECRET', '---', '', 'Body.'].join('\n')
      ),
    MarkdownParseError
  );
});

test('redacts phone numbers from the markdown body', () => {
  const [spec] = buildMarkdownDocuments(
    'knowledge/contact.md',
    ['---', 'title: Contact', '---', '', 'Call +1 123 456 7890.'].join('\n')
  );

  assert.ok(spec);
  assert.equal(spec.content, 'Call [REDACTED].');
});
