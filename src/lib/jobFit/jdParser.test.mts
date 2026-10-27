/**
 * Tests for the job description parser.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseJobDescription,
  splitLines,
  stripBullet,
  classifyHeading,
  isNoise,
  extractTitle,
  extractCompany,
} from './jdParser.ts';
import {
  MAX_JOB_DESCRIPTION_LENGTH,
  MIN_JOB_DESCRIPTION_LENGTH,
  MAX_ANALYSED_REQUIREMENTS,
} from './limits.ts';

// ============================================================
// splitLines
// ============================================================

test('splitLines normalises CRLF', () => {
  const lines = splitLines('a\r\nb\nc\r');
  assert.deepEqual(lines, ['a', 'b', 'c']);
});

test('splitLines trims trailing spaces', () => {
  const lines = splitLines('a  \nb  ');
  assert.deepEqual(lines, ['a', 'b']);
});

test('splitLines filters trailing empty lines', () => {
  const lines = splitLines('a\nb\n');
  assert.deepEqual(lines, ['a', 'b']);
});

// ============================================================
// stripBullet
// ============================================================

test('stripBullet recognises dash bullet', () => {
  const result = stripBullet('- Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'bullet' });
});

test('stripBullet recognises asterisk bullet', () => {
  const result = stripBullet('* Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'bullet' });
});

test('stripBullet recognises unicode bullet', () => {
  const result = stripBullet('• Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'bullet' });
});

test('stripBullet recognises en dash bullet', () => {
  const result = stripBullet('– Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'bullet' });
});

test('stripBullet recognises em dash bullet', () => {
  const result = stripBullet('— Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'bullet' });
});

test('stripBullet recognises numbered list with dot', () => {
  const result = stripBullet('1. Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'number' });
});

test('stripBullet recognises numbered list with parenthesis', () => {
  const result = stripBullet('2) Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'number' });
});

test('stripBullet recognises numbered list with dash and spaces', () => {
  const result = stripBullet('3 - Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'number' });
});

test('stripBullet recognises checkbox unchecked', () => {
  const result = stripBullet('[ ] Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'checkbox' });
});

test('stripBullet recognises checkbox checked lowercase', () => {
  const result = stripBullet('[x] Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'checkbox' });
});

test('stripBullet recognises checkbox checked uppercase', () => {
  const result = stripBullet('[X] Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'checkbox' });
});

test('stripBullet returns none for plain line', () => {
  const result = stripBullet('Plain line');
  assert.deepEqual(result, { text: 'Plain line', marker: 'none' });
});

test('stripBullet handles leading spaces', () => {
  const result = stripBullet('  - Requirement text');
  assert.deepEqual(result, { text: 'Requirement text', marker: 'bullet' });
});

// ============================================================
// classifyHeading
// ============================================================

test('classifyHeading recognises Responsibilities', () => {
  assert.equal(classifyHeading('Responsibilities'), 'responsibility');
});

test('classifyHeading recognises What you will do', () => {
  assert.equal(classifyHeading('What you will do'), 'responsibility');
});

test('classifyHeading recognises What youll do (no apostrophe)', () => {
  assert.equal(classifyHeading('What youll do'), 'responsibility');
});

test('classifyHeading recognises The role', () => {
  assert.equal(classifyHeading('The role'), 'responsibility');
});

test('classifyHeading recognises Your impact', () => {
  assert.equal(classifyHeading('Your impact'), 'responsibility');
});

test('classifyHeading recognises Key responsibilities', () => {
  assert.equal(classifyHeading('Key responsibilities'), 'responsibility');
});

test('classifyHeading recognises Duties', () => {
  assert.equal(classifyHeading('Duties'), 'responsibility');
});

test('classifyHeading recognises Requirements', () => {
  assert.equal(classifyHeading('Requirements'), 'requirement');
});

test('classifyHeading recognises Required', () => {
  assert.equal(classifyHeading('Required'), 'requirement');
});

test('classifyHeading recognises Must have', () => {
  assert.equal(classifyHeading('Must have'), 'requirement');
});

test('classifyHeading recognises You have', () => {
  assert.equal(classifyHeading('You have'), 'requirement');
});

test('classifyHeading recognises We are looking for', () => {
  assert.equal(classifyHeading('We are looking for'), 'requirement');
});

test('classifyHeading recognises Essential', () => {
  assert.equal(classifyHeading('Essential'), 'requirement');
});

test('classifyHeading recognises Mandatory', () => {
  assert.equal(classifyHeading('Mandatory'), 'requirement');
});

test('classifyHeading recognises Qualifications', () => {
  assert.equal(classifyHeading('Qualifications'), 'qualification');
});

test('classifyHeading recognises Who you are', () => {
  assert.equal(classifyHeading('Who you are'), 'qualification');
});

test('classifyHeading recognises About you', () => {
  assert.equal(classifyHeading('About you'), 'qualification');
});

test('classifyHeading recognises Candidate profile', () => {
  assert.equal(classifyHeading('Candidate profile'), 'qualification');
});

test('classifyHeading recognises Profile', () => {
  assert.equal(classifyHeading('Profile'), 'qualification');
});

test('classifyHeading recognises Nice to have', () => {
  assert.equal(classifyHeading('Nice to have'), 'nice_to_have');
});

test('classifyHeading recognises Preferred', () => {
  assert.equal(classifyHeading('Preferred'), 'nice_to_have');
});

test('classifyHeading recognises Bonus', () => {
  assert.equal(classifyHeading('Bonus'), 'nice_to_have');
});

test('classifyHeading recognises Plus', () => {
  assert.equal(classifyHeading('Plus'), 'nice_to_have');
});

test('classifyHeading recognises Good to have', () => {
  assert.equal(classifyHeading('Good to have'), 'nice_to_have');
});

test('classifyHeading recognises Desirable', () => {
  assert.equal(classifyHeading('Desirable'), 'nice_to_have');
});

test('classifyHeading recognises Optional', () => {
  assert.equal(classifyHeading('Optional'), 'nice_to_have');
});

test('classifyHeading is case insensitive', () => {
  assert.equal(classifyHeading('REQUIREMENTS'), 'requirement');
  assert.equal(classifyHeading('requirements'), 'requirement');
  assert.equal(classifyHeading('Requirements'), 'requirement');
});

test('classifyHeading returns null for non-heading', () => {
  assert.equal(classifyHeading('This is a requirement line'), null);
  assert.equal(classifyHeading('Some random text'), null);
});

// ============================================================
// isNoise
// ============================================================

test('isNoise detects salary line with dollar sign', () => {
  assert(isNoise('$120,000 - $150,000'));
  assert(isNoise('$120k - $150k'));
});

test('isNoise detects equal opportunity', () => {
  assert(isNoise('Equal opportunity employer'));
  assert(isNoise('We are an equal opportunity employer'));
});

test('isNoise detects diversity', () => {
  assert(isNoise('Diversity and inclusion'));
});

test('isNoise detects accommodation', () => {
  assert(isNoise('Accommodation requests'));
});

test('isNoise detects how to apply', () => {
  assert(isNoise('How to apply'));
  assert(isNoise('To apply, send your resume'));
});

test('isNoise detects apply now', () => {
  assert(isNoise('Apply now'));
});

test('isNoise detects submit your', () => {
  assert(isNoise('Submit your application'));
});

test('isNoise detects benefits', () => {
  assert(isNoise('Our benefits include'));
  assert(isNoise('What we offer'));
  assert(isNoise('Perks'));
});

test('isNoise detects about company', () => {
  assert(isNoise('About the company'));
  assert(isNoise('About us'));
  assert(isNoise('Company overview'));
});

test('isNoise detects contact', () => {
  assert(isNoise('Contact us'));
  assert(isNoise('Reach out'));
  assert(isNoise('Our website'));
});

test('isNoise detects URLs', () => {
  assert(isNoise('http://example.com'));
  assert(isNoise('https://example.com'));
  assert(isNoise('www.example.com'));
});

test('isNoise detects email only', () => {
  assert(isNoise('jobs@example.com'));
});

test('isNoise detects phone only', () => {
  assert(isNoise('+1 555 123 4567'));
});

test('isNoise does not flag requirement containing noise word', () => {
  // "apply" in the middle of a requirement should not make it noise
  assert(!isNoise('Must have experience with apply() method'));
  assert(!isNoise('Required: knowledge of application architecture'));
  assert(!isNoise('Bonus: familiarity with our benefits system'));
});

// ============================================================
// extractTitle
// ============================================================

test('extractTitle finds labelled Role', () => {
  const lines = ['Role: Senior Software Engineer', 'Requirements', '- Java'];
  assert.equal(extractTitle(lines), 'Senior Software Engineer');
});

test('extractTitle finds labelled Position', () => {
  const lines = ['Position: Frontend Developer', 'Requirements', '- React'];
  assert.equal(extractTitle(lines), 'Frontend Developer');
});

test('extractTitle finds labelled Job title', () => {
  const lines = ['Job title: Backend Engineer', 'Requirements', '- Go'];
  assert.equal(extractTitle(lines), 'Backend Engineer');
});

test('extractTitle finds labelled Title', () => {
  const lines = ['Title: DevOps Engineer', 'Requirements', '- AWS'];
  assert.equal(extractTitle(lines), 'DevOps Engineer');
});

test('extractTitle finds "X at Y" pattern', () => {
  const lines = ['Senior Software Engineer at Acme Corp', 'Requirements', '- Java'];
  assert.equal(extractTitle(lines), 'Senior Software Engineer');
});

test('extractTitle finds first short non-heading line', () => {
  const lines = ['Senior Software Engineer', 'Requirements', '- Java'];
  assert.equal(extractTitle(lines), 'Senior Software Engineer');
});

test('extractTitle returns null when no title', () => {
  const lines = ['Requirements', '- Java', '- Spring'];
  assert.equal(extractTitle(lines), null);
});

test('extractTitle ignores headings', () => {
  const lines = ['Requirements', '- Java'];
  assert.equal(extractTitle(lines), null);
});

test('extractTitle ignores bullet lines', () => {
  const lines = ['- Java', '- Spring'];
  assert.equal(extractTitle(lines), null);
});

test('extractTitle ignores noise lines and headings', () => {
  const lines = ['$150k', 'Requirements', '- Java'];
  // $150k is noise, Requirements is heading, so no title found
  assert.equal(extractTitle(lines), null);
});

// ============================================================
// extractCompany
// ============================================================

test('extractCompany finds labelled Company', () => {
  const lines = ['Company: Acme Corp', 'Requirements', '- Java'];
  assert.equal(extractCompany(lines), 'Acme Corp');
});

test('extractCompany finds labelled Organisation', () => {
  const lines = ['Organisation: Acme Ltd', 'Requirements', '- Java'];
  assert.equal(extractCompany(lines), 'Acme Ltd');
});

test('extractCompany finds labelled Organization', () => {
  const lines = ['Organization: Acme Inc', 'Requirements', '- Java'];
  assert.equal(extractCompany(lines), 'Acme Inc');
});

test('extractCompany finds labelled Employer', () => {
  const lines = ['Employer: Acme LLC', 'Requirements', '- Java'];
  assert.equal(extractCompany(lines), 'Acme LLC');
});

test('extractCompany finds "X at Y" pattern', () => {
  const lines = ['Senior Engineer at Acme Corp', 'Requirements', '- Java'];
  assert.equal(extractCompany(lines), 'Acme Corp');
});

test('extractCompany truncates at suffix', () => {
  const lines = ['Engineer at Acme Corp | Remote', 'Requirements', '- Java'];
  assert.equal(extractCompany(lines), 'Acme Corp');
});

test('extractCompany returns null when no company', () => {
  const lines = ['Requirements', '- Java'];
  assert.equal(extractCompany(lines), null);
});

// ============================================================
// parseJobDescription - main parser
// ============================================================

test('parseJobDescription parses bullet points under Requirements and Nice to have', () => {
  const jd = `Requirements
- 5 years Java experience
- Spring Boot framework
Nice to have
- Kubernetes orchestration
- GraphQL API design`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 4);
    assert.deepEqual(result.requirements[0], { id: 'r1', text: '5 years Java experience', kind: 'requirement', required: true });
    assert.deepEqual(result.requirements[1], { id: 'r2', text: 'Spring Boot framework', kind: 'requirement', required: true });
    assert.deepEqual(result.requirements[2], { id: 'r3', text: 'Kubernetes orchestration', kind: 'nice_to_have', required: false });
    assert.deepEqual(result.requirements[3], { id: 'r4', text: 'GraphQL API design', kind: 'nice_to_have', required: false });
  }
});

test('parseJobDescription nice to have is not required', () => {
  const jd = `Nice to have
- 10 years of experience required for this role
- Strong communication skills essential`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements[0].required, false);
    assert.equal(result.requirements[0].kind, 'nice_to_have');
  }
});

test('parseJobDescription parses numbered list', () => {
  const jd = `Requirements
1. Java programming language
2. Spring framework
3. SQL database skills`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 3);
    assert.equal(result.requirements[0].id, 'r1');
    assert.equal(result.requirements[1].id, 'r2');
    assert.equal(result.requirements[2].id, 'r3');
    assert.equal(result.requirements[0].kind, 'requirement');
  }
});

test('parseJobDescription parses checkbox items', () => {
  const jd = `Requirements
[ ] Java programming language
[x] Spring framework experience
[ ] SQL database skills`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 3);
    assert.equal(result.requirements[0].kind, 'requirement');
  }
});

test('parseJobDescription keeps requirement before any heading as other', () => {
  const jd = `- 5 years Java experience required for this role
Requirements
- Spring framework knowledge needed`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
    assert.equal(result.requirements[0].kind, 'other');
    assert.equal(result.requirements[1].kind, 'requirement');
  }
});

test('parseJobDescription drops salary line', () => {
  const jd = `Requirements
- Java programming language required
$150,000 - $200,000 per year
- Spring framework knowledge`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
    assert.equal(result.requirements[0].text, 'Java programming language required');
    assert.equal(result.requirements[1].text, 'Spring framework knowledge');
  }
});

test('parseJobDescription drops benefits block', () => {
  const jd = `Requirements
- Java programming language
Our benefits include health insurance
- Spring framework`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
  }
});

test('parseJobDescription drops equal opportunity', () => {
  const jd = `Requirements
- Java programming language
Equal opportunity employer
- Spring framework`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
  }
});

test('parseJobDescription drops application instructions', () => {
  const jd = `Requirements
- Java programming language
How to apply: send resume
- Spring framework`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
  }
});

test('parseJobDescription preserves original wording', () => {
  const jd = `Requirements
- 5+ years of Java (including Java 17+) experience
- Strong knowledge of Spring Boot 3.x`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements[0].text, '5+ years of Java (including Java 17+) experience');
    assert.equal(result.requirements[1].text, 'Strong knowledge of Spring Boot 3.x');
  }
});

test('parseJobDescription identifiers are sequential', () => {
  const jd = `Requirements
- First requirement here
- Second requirement here
Nice to have
- Third requirement here`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements[0].id, 'r1');
    assert.equal(result.requirements[1].id, 'r2');
    assert.equal(result.requirements[2].id, 'r3');
  }
});

test('parseJobDescription extracts title and company', () => {
  const jd = `Senior Java Engineer at Acme Corp
Company: Acme Corp
Requirements
- Java programming`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.title, 'Senior Java Engineer');
    assert.equal(result.company, 'Acme Corp');
  }
});

test('parseJobDescription returns null title and company when absent', () => {
  const jd = `Requirements
- Java programming language required
- Spring framework experience needed`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.title, null);
    assert.equal(result.company, null);
  }
});

test('parseJobDescription rejects too short', () => {
  const jd = 'Short';
  const result = parseJobDescription(jd);
  assert(!result.ok);
  if (!result.ok) {
    assert.equal(result.reason, 'too_short');
  }
});

test('parseJobDescription rejects too long', () => {
  const jd = 'x'.repeat(MAX_JOB_DESCRIPTION_LENGTH + 1);
  const result = parseJobDescription(jd);
  assert(!result.ok);
  if (!result.ok) {
    assert.equal(result.reason, 'too_long');
  }
});

test('parseJobDescription accepts exactly at max length', () => {
  const jd = 'x'.repeat(MAX_JOB_DESCRIPTION_LENGTH);
  const result = parseJobDescription(jd);
  // Should not be rejected for length (may be rejected for no_requirements)
  assert(result.ok || (!result.ok && result.reason !== 'too_long'));
});

test('parseJobDescription accepts exactly at min length', () => {
  const jd = 'x'.repeat(MIN_JOB_DESCRIPTION_LENGTH);
  const result = parseJobDescription(jd);
  // Should not be rejected for length
  assert(result.ok || (!result.ok && result.reason !== 'too_short'));
});

test('parseJobDescription rejects no requirements', () => {
  const jd = `About us
We are a great company.
Our benefits include health insurance.
Contact us at jobs@example.com`;

  const result = parseJobDescription(jd);
  assert(!result.ok);
  if (!result.ok) {
    assert.equal(result.reason, 'no_requirements');
  }
});

test('parseJobDescription keeps required first when over limit', () => {
  // Create a JD with more than MAX_ANALYSED_REQUIREMENTS requirements
  let jd = 'Requirements\n';
  for (let i = 0; i < MAX_ANALYSED_REQUIREMENTS + 5; i++) {
    jd += `- Required requirement number ${i}\n`;
  }
  jd += 'Nice to have\n';
  for (let i = 0; i < 5; i++) {
    jd += `- Optional requirement number ${i}\n`;
  }

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, MAX_ANALYSED_REQUIREMENTS);
    // All should be required
    for (const req of result.requirements) {
      assert(req.required);
    }
    assert.equal(result.omittedRequirements, 10); // 5 required + 5 optional omitted
  }
});

test('parseJobDescription keeps required and some optional when required < limit', () => {
  let jd = 'Requirements\n';
  for (let i = 0; i < 10; i++) {
    jd += `- Required requirement number ${i}\n`;
  }
  jd += 'Nice to have\n';
  for (let i = 0; i < 50; i++) {
    jd += `- Optional requirement number ${i}\n`;
  }

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, MAX_ANALYSED_REQUIREMENTS);
    const requiredCount = result.requirements.filter((r: { required: boolean }) => r.required).length;
    assert.equal(requiredCount, 10);
    const optionalCount = result.requirements.filter((r: { required: boolean }) => !r.required).length;
    assert.equal(optionalCount, MAX_ANALYSED_REQUIREMENTS - 10);
  }
});

test('parseJobDescription is fast on large document', () => {
  // Create a document near but under the max length (12000)
  const line = '- Requirement number for testing purposes\n';
  const jd = 'Requirements\n' + line.repeat(280); // ~11.8k chars
  const start = Date.now();
  const result = parseJobDescription(jd);
  const elapsed = Date.now() - start;

  assert(result.ok);
  // Should be well under 1 second (generous bound)
  assert(elapsed < 1000);
});

test('parseJobDescription handles mixed markers', () => {
  const jd = `Requirements
- Bullet one requirement
2) Numbered two requirement
[ ] Checkbox three requirement
* Bullet four requirement`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 4);
  }
});

test('parseJobDescription handles responsibility heading', () => {
  const jd = `Responsibilities
- Design systems architecture for scale
- Write production quality code daily`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
    assert.equal(result.requirements[0].kind, 'responsibility');
    assert.equal(result.requirements[1].kind, 'responsibility');
  }
});

test('parseJobDescription handles qualification heading', () => {
  const jd = `Qualifications
- BS Computer Science degree required
- 5 years experience in software engineering`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
    assert.equal(result.requirements[0].kind, 'qualification');
    assert.equal(result.requirements[0].required, true);
  }
});

test('parseJobDescription ignores short lines after marker', () => {
  const jd = `Requirements
- Java programming language required
- 
- Spring framework experience needed`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    // The empty bullet should be skipped
    assert.equal(result.requirements.length, 2);
  }
});

test('parseJobDescription handles case insensitive headings', () => {
  const jd = `requirements
- Java programming language
NICE TO HAVE
- Kubernetes orchestration skills`;

  const result = parseJobDescription(jd);
  assert(result.ok);
  if (result.ok) {
    assert.equal(result.requirements.length, 2);
    assert.equal(result.requirements[0].kind, 'requirement');
    assert.equal(result.requirements[0].required, true);
    assert.equal(result.requirements[1].kind, 'nice_to_have');
    assert.equal(result.requirements[1].required, false);
  }
});