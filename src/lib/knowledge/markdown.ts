/**
 * Markdown document support for the knowledge base.
 *
 * PRD §33 lists knowledge sources that are not structured data, such as
 * public articles and approved interview talking points. Those live as
 * markdown files with a small frontmatter block.
 *
 * Only files that are explicitly placed in the knowledge directory are read,
 * so the pipeline never ingests arbitrary files on disk (PRD §33).
 */

import {
  extractMetadata,
  getClassificationForSourceType,
  getSourceTypeFromFilePath,
} from './metadata.ts';
import { redactPII } from './pii.ts';
import type { DocumentSpec, KnowledgeClassification } from './ingestion.ts';

/**
 * The classification levels allowed by PRD §34.
 */
const ALLOWED_CLASSIFICATIONS: KnowledgeClassification[] = [
  'PUBLIC',
  'PROFESSIONAL',
  'CONFIDENTIAL',
  'PRIVATE',
];

/**
 * A markdown document with its frontmatter parsed.
 */
export interface MarkdownDocument {
  /**
   * Title from the frontmatter, or the first heading of the body.
   */
  title: string;

  /**
   * The document body with the frontmatter removed.
   */
  content: string;

  /**
   * The frontmatter values, as raw strings.
   */
  frontmatter: Record<string, string>;
}

/**
 * Raised when a markdown file cannot be parsed.
 */
export class MarkdownParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarkdownParseError';
  }
}

/**
 * Splits a markdown file into its frontmatter and body.
 *
 * The frontmatter is a block of `key: value` lines between two `---` markers
 * at the very start of the file.
 */
function splitFrontmatter(source: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const normalized = source.replace(/^﻿/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(normalized);

  if (!match) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const frontmatter: Record<string, string> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key) {
      frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  return { frontmatter, body: normalized.slice(match[0].length).trim() };
}

/**
 * Reads the document title from the frontmatter or the first heading.
 */
function resolveTitle(
  frontmatter: Record<string, string>,
  body: string
): string {
  const declared = frontmatter.title?.trim();
  if (declared) return declared;

  const heading = /^#\s+(.+)$/m.exec(body);
  if (heading) return heading[1].trim();

  return 'Untitled';
}

/**
 * Parses a markdown file into a document with its frontmatter.
 *
 * @throws MarkdownParseError when the file declares a classification that is
 *         not allowed by PRD §34.
 */
export function parseMarkdownDocument(source: string): MarkdownDocument {
  const { frontmatter, body } = splitFrontmatter(source);

  if (!body) {
    throw new MarkdownParseError('the document has no content');
  }

  return {
    title: resolveTitle(frontmatter, body),
    content: body,
    frontmatter,
  };
}

/**
 * Builds the knowledge documents for a markdown file.
 *
 * The frontmatter may declare `title`, `source_type`, `classification` and
 * `version`. Anything it leaves out is derived from the file path.
 *
 * @param sourceFile Path of the file, recorded on every chunk.
 * @param source The raw file contents.
 * @throws MarkdownParseError when the document is empty or declares a
 *         classification that is not allowed by PRD §34.
 */
export function buildMarkdownDocuments(
  sourceFile: string,
  source: string
): DocumentSpec[] {
  const document = parseMarkdownDocument(source);

  const sourceType =
    document.frontmatter.source_type?.trim() ||
    getSourceTypeFromFilePath(sourceFile);

  const declaredClassification = document.frontmatter.classification?.trim();

  if (declaredClassification) {
    if (!ALLOWED_CLASSIFICATIONS.includes(declaredClassification as KnowledgeClassification)) {
      throw new MarkdownParseError(
        `unknown classification "${declaredClassification}"`
      );
    }
  }

  const classification = declaredClassification
    ? (declaredClassification as KnowledgeClassification)
    : getClassificationForSourceType(sourceType);

  const declaredVersion = Number(document.frontmatter.version);
  const version =
    Number.isInteger(declaredVersion) && declaredVersion > 0
      ? declaredVersion
      : extractMetadata(sourceFile).version;

  return [
    {
      title: document.title,
      source_type: sourceType,
      classification,
      content: redactPII(document.content),
      version,
      source_file: sourceFile,
      chunk_metadata: { source_format: 'markdown' },
    },
  ];
}
