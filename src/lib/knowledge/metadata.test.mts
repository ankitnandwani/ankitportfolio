import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMetadata,
  getClassificationForSourceType,
  getDocumentVersion,
  getSourceTypeFromFilePath,
} from './metadata.ts';

test('maps each knowledge source file to its source type', () => {
  const expected: Record<string, string> = {
    'src/data/projects.ts': 'project',
    'src/data/achievements.ts': 'achievement',
    'src/data/summaryCopyData.ts': 'resume_summary',
    'src/data/education.ts': 'education',
    'src/data/certifications.ts': 'certification',
    'src/data/skills.ts': 'skill',
    'src/data/careerTimeline.ts': 'career_timeline',
    'src/data/professionalSnapshot.ts': 'professional_snapshot',
    'src/data/testimonials.ts': 'testimonial',
    'src/data/capabilityAreasData.ts': 'capability_area',
  };

  for (const [filePath, sourceType] of Object.entries(expected)) {
    assert.equal(getSourceTypeFromFilePath(filePath), sourceType, `for ${filePath}`);
  }
});

test('falls back to unknown for unmapped files', () => {
  assert.equal(getSourceTypeFromFilePath('src/data/unknown.ts'), 'unknown');
});

test('classifies professional content as PROFESSIONAL', () => {
  assert.equal(getClassificationForSourceType('project'), 'PROFESSIONAL');
  assert.equal(getClassificationForSourceType('career_timeline'), 'PROFESSIONAL');
});

test('classifies public content as PUBLIC', () => {
  assert.equal(getClassificationForSourceType('social_link'), 'PUBLIC');
  assert.equal(getClassificationForSourceType('public_bio'), 'PUBLIC');
});

test('defaults an unrecognised source type to PROFESSIONAL', () => {
  assert.equal(getClassificationForSourceType('whatever'), 'PROFESSIONAL');
  assert.equal(getClassificationForSourceType('unknown'), 'PROFESSIONAL');
});

test('defaults to version 1 when the source data carries no version', () => {
  assert.equal(getDocumentVersion(), 1);
  assert.equal(getDocumentVersion({}), 1);
});

test('uses the version carried by the source data', () => {
  assert.equal(getDocumentVersion({ version: 5 }), 5);
});

test('ignores a non numeric or non positive version', () => {
  assert.equal(getDocumentVersion({ version: 0 }), 1);
  assert.equal(getDocumentVersion({ version: 'x' }), 1);
});

test('extracts source type, classification and version together', () => {
  assert.deepEqual(extractMetadata('src/data/projects.ts', { version: 2 }), {
    source_type: 'project',
    classification: 'PROFESSIONAL',
    version: 2,
  });
});

test.todo(
  'classifies social links as PUBLIC: getSourceTypeFromFilePath returns "unknown" for src/data/socialLinks.ts, so social link documents are currently stored as PROFESSIONAL instead of PUBLIC'
);
