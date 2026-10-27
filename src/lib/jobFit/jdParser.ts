/**
 * The deterministic parser for a job description.
 *
 * This module turns a raw job description into a typed list of
 * requirements. It makes no model calls, reads no files and touches no
 * network. It is a pure function of its input string.
 */

import type {
  JobRequirement,
  RequirementKind,
  ParsedJobDescription,
} from './types.ts';
import {
  MAX_JOB_DESCRIPTION_LENGTH,
  MIN_JOB_DESCRIPTION_LENGTH,
  MAX_ANALYSED_REQUIREMENTS,
} from './limits.ts';

/**
 * Normalises line endings and trims trailing spaces.
 */
export function splitLines(raw: string): string[] {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map((line) => line.trimEnd()).filter((line) => line.length > 0);
}

/**
 * Removes a leading bullet, number or checkbox from a line.
 *
 * @returns The text without the marker and a flag describing what was found.
 */
export function stripBullet(line: string): { text: string; marker: 'bullet' | 'number' | 'checkbox' | 'none' } {
  const trimmed = line.trimStart();

  // Checkbox: [ ], [x], [X]
  if (trimmed.startsWith('[') && trimmed.length >= 3) {
    const third = trimmed[2];
    if ((trimmed[1] === ' ' || trimmed[1] === 'x' || trimmed[1] === 'X') && third === ']') {
      return { text: trimmed.slice(3).trimStart(), marker: 'checkbox' };
    }
  }

  // Bullet: -, *, •, –, —
  if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•') || trimmed.startsWith('–') || trimmed.startsWith('—')) {
    return { text: trimmed.slice(1).trimStart(), marker: 'bullet' };
  }

  // Numbered: 1., 2), 3 -, 10., etc. (with optional spaces around separator)
  const numberMatch = trimmed.match(/^(\d+)\s*[.)\-]\s*/);
  if (numberMatch) {
    return { text: trimmed.slice(numberMatch[0].length).trimStart(), marker: 'number' };
  }

  return { text: trimmed, marker: 'none' };
}

/**
 * Classifies a line as a section heading.
 *
 * Headings are recognised by known phrases, matched on tokens
 * (case-insensitive, order-insensitive).
 */
export function classifyHeading(line: string): RequirementKind | null {
  const lower = line.toLowerCase();

  // Tokenise: split on non-alphanumeric, keep words
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);

  // Helper: does the line contain all the words of a phrase?
  function hasPhrase(phrase: string): boolean {
    const phraseTokens = phrase.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return phraseTokens.every((t) => tokens.includes(t));
  }

  // responsibility
  if (
    hasPhrase('responsibilities') ||
    hasPhrase('what you will do') ||
    hasPhrase('what youll do') ||
    hasPhrase('the role') ||
    hasPhrase('your impact') ||
    hasPhrase('key responsibilities') ||
    hasPhrase('duties')
  ) {
    return 'responsibility';
  }

  // requirement
  if (
    hasPhrase('requirements') ||
    hasPhrase('required') ||
    hasPhrase('must have') ||
    hasPhrase('you have') ||
    hasPhrase('we are looking for') ||
    hasPhrase('essential') ||
    hasPhrase('mandatory')
  ) {
    return 'requirement';
  }

  // qualification
  if (
    hasPhrase('qualifications') ||
    hasPhrase('who you are') ||
    hasPhrase('about you') ||
    hasPhrase('candidate profile') ||
    hasPhrase('profile')
  ) {
    return 'qualification';
  }

  // nice_to_have
  if (
    hasPhrase('nice to have') ||
    hasPhrase('preferred') ||
    hasPhrase('bonus') ||
    hasPhrase('plus') ||
    hasPhrase('good to have') ||
    hasPhrase('desirable') ||
    hasPhrase('optional')
  ) {
    return 'nice_to_have';
  }

  return null;
}

/**
 * Checks if a line is noise (not a requirement).
 *
 * Noise is matched on phrases at the START of the line.
 */
export function isNoise(line: string): boolean {
  const lower = line.toLowerCase().trimStart();

  // Salary / compensation
  if (lower.match(/^[\$\£\€]\s*\d/)) return true;
  if (lower.match(/^\d+\s*[kK]\s*[-–]\s*\d+\s*[kK]/)) return true;
  if (lower.includes('salary') || lower.includes('compensation') || lower.includes('pay range')) return true;

  // Equal opportunity / diversity
  if (lower.startsWith('equal opportunity')) return true;
  if (lower.startsWith('we are an equal')) return true;
  if (lower.startsWith('diversity')) return true;
  if (lower.startsWith('accommodation')) return true;
  if (lower.startsWith('eeo')) return true;

  // Application instructions
  if (lower.startsWith('how to apply')) return true;
  if (lower.startsWith('apply now')) return true;
  if (lower.startsWith('submit your')) return true;
  if (lower.startsWith('application')) return true;
  if (lower.startsWith('to apply')) return true;

  // Benefits / perks
  if (lower.startsWith('our benefits')) return true;
  if (lower.startsWith('what we offer')) return true;
  if (lower.startsWith('perks')) return true;
  if (lower.startsWith('benefits include')) return true;

  // About company
  if (lower.startsWith('about the company')) return true;
  if (lower.startsWith('about us')) return true;
  if (lower.startsWith('our company')) return true;
  if (lower.startsWith('company overview')) return true;

  // Contact / URLs
  if (lower.startsWith('contact us')) return true;
  if (lower.startsWith('reach out')) return true;
  if (lower.startsWith('our website')) return true;
  if (lower.startsWith('http://')) return true;
  if (lower.startsWith('https://')) return true;
  if (lower.startsWith('www.')) return true;

  // Only email or only phone
  if (lower.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i)) return true;
  if (lower.match(/^[\+]?[\d\s\-\(\)]{7,}$/) && !lower.match(/[a-z]/i)) return true;

  return false;
}

/**
 * Extracts the role title from the lines.
 *
 * The title is the first short line that is not a heading and not a bullet,
 * or a line that starts with a label.
 */
export function extractTitle(lines: string[]): string | null {
  // First, look for labelled lines
  for (const line of lines) {
    const trimmed = line.trimStart();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith('role:') || lower.startsWith('position:') || lower.startsWith('job title:') || lower.startsWith('title:')) {
      const after = trimmed.slice(trimmed.indexOf(':') + 1).trim();
      if (after.length > 0 && after.length < 100) {
        return after;
      }
    }
  }

  // Then, look for a "X at Y" pattern in a short line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 120) continue;

    const { marker } = stripBullet(trimmed);
    if (marker !== 'none') continue;

    const heading = classifyHeading(trimmed);
    if (heading !== null) continue;

    if (isNoise(trimmed)) continue;

    // Check for "Senior X at Y" pattern
    const atIndex = trimmed.toLowerCase().indexOf(' at ');
    if (atIndex > 0 && atIndex < trimmed.length - 4) {
      const beforeAt = trimmed.slice(0, atIndex).trim();
      if (beforeAt.length > 0 && beforeAt.length < 80) {
        return beforeAt;
      }
    }

    // First short non-heading, non-bullet line
    if (trimmed.length >= 3 && trimmed.length <= 80) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Extracts the company from the lines.
 */
export function extractCompany(lines: string[]): string | null {
  // Look for labelled lines
  for (const line of lines) {
    const trimmed = line.trimStart();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith('company:') || lower.startsWith('organisation:') || lower.startsWith('organization:') || lower.startsWith('employer:')) {
      const after = trimmed.slice(trimmed.indexOf(':') + 1).trim();
      if (after.length > 0 && after.length < 100) {
        return after;
      }
    }
  }

  // Look for "X at Y" pattern
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 120) continue;

    const atIndex = trimmed.toLowerCase().indexOf(' at ');
    if (atIndex > 0 && atIndex < trimmed.length - 4) {
      const afterAt = trimmed.slice(atIndex + 4).trim();
      if (afterAt.length > 0 && afterAt.length < 80) {
        // Stop at common suffixes
        const suffixes = [',', '|', '-', '–', '—', '(', '['];
        let end = afterAt.length;
        for (const s of suffixes) {
          const idx = afterAt.indexOf(s);
          if (idx > 0 && idx < end) end = idx;
        }
        return afterAt.slice(0, end).trim();
      }
    }
  }

  return null;
}

/**
 * Parses a job description into requirements.
 *
 * @param raw The raw job description text.
 * @returns A discriminated union with the parsed result or a failure reason.
 */
export function parseJobDescription(raw: string): ParsedJobDescription {
  // Length checks first (constant time)
  if (raw.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }
  if (raw.trim().length < MIN_JOB_DESCRIPTION_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }

  const lines = splitLines(raw);
  const title = extractTitle(lines);
  const company = extractCompany(lines);

  const requirements: JobRequirement[] = [];
  let currentKind: RequirementKind = 'other';
  let requirementIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const trimmed = originalLine.trimStart();

    if (trimmed.length === 0) continue;

    // Check for noise first (on the raw trimmed line)
    if (isNoise(trimmed)) continue;

    // Check for bullet / number / checkbox
    const { text, marker } = stripBullet(trimmed);

    // If there's a marker, this is a candidate requirement line
    // Check for heading ONLY on lines without markers
    if (marker === 'none') {
      const headingKind = classifyHeading(text);
      if (headingKind !== null) {
        currentKind = headingKind;
        continue;
      }
    }

    // Skip lines that are too short to be a requirement (after marker removal)
    if (marker !== 'none' && text.length < 10) continue;

    // If no marker, only treat as requirement if we're under a heading
    // and the line is long enough
    if (marker === 'none') {
      if (currentKind === 'other') continue;
      if (text.length < 15) continue; // Higher threshold for non-marked lines
    }

    // This is a requirement
    // Lines with markers before any heading get kind 'other'
    const requirementKind = marker !== 'none' && currentKind === 'other' ? 'other' : currentKind;
    const requirementRequired = requirementKind !== 'nice_to_have';

    requirementIndex++;
    requirements.push({
      id: `r${requirementIndex}`,
      text,
      kind: requirementKind,
      required: requirementRequired,
    });
  }

  // No requirements found
  if (requirements.length === 0) {
    return { ok: false, reason: 'no_requirements' };
  }

  // Apply the limit: keep required ones first, then optional
  let omitted = 0;
  if (requirements.length > MAX_ANALYSED_REQUIREMENTS) {
    const required = requirements.filter((r) => r.required);
    const optional = requirements.filter((r) => !r.required);

    const keepRequired = required.slice(0, MAX_ANALYSED_REQUIREMENTS);
    const remainingSlots = MAX_ANALYSED_REQUIREMENTS - keepRequired.length;
    const keepOptional = optional.slice(0, remainingSlots);

    omitted = requirements.length - (keepRequired.length + keepOptional.length);
    return {
      ok: true,
      title,
      company,
      requirements: [...keepRequired, ...keepOptional],
      omittedRequirements: omitted,
    };
  }

  return {
    ok: true,
    title,
    company,
    requirements,
    omittedRequirements: 0,
  };
}