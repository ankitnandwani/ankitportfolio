/**
 * Document ingestion pipeline for the AI knowledge base.
 *
 * Processes knowledge source files from src/data/ into documents and chunks
 * for storage in the Supabase knowledge base.
 *
 * The pipeline is idempotent: a document is identified by its source type and
 * title, so re-running it updates only the documents whose content changed
 * and leaves the rest untouched. Updated documents get a new version and
 * their chunks are replaced, which is how incremental updates are tracked.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { chunkByParagraphsThenOverlay } from './chunking.ts';
import { buildMarkdownDocuments } from './markdown.ts';
import { extractMetadata } from './metadata.ts';
import { redactPII } from './pii.ts';
import type {
  KnowledgeDocumentInsert,
  KnowledgeChunkInsert,
} from './schema.ts';

import { projectsData } from '../../data/projects.ts';
import { achievementsData } from '../../data/achievements.ts';
import { summaryCopyData } from '../../data/summaryCopyData.ts';
import { educationData } from '../../data/education.ts';
import { certificationsData } from '../../data/certifications.ts';
import { skillsData } from '../../data/skills.ts';
import { careerTimelineData } from '../../data/careerTimeline.ts';
import { professionalSnapshotData } from '../../data/professionalSnapshot.ts';
import { testimonials } from '../../data/testimonials.ts';
import { capabilityAreasData } from '../../data/capabilityAreasData.ts';
import { socialLinks } from '../../data/socialLinks.ts';

/**
 * Classification levels allowed by the knowledge base (PRD §34).
 */
export type KnowledgeClassification =
  | 'PUBLIC'
  | 'PROFESSIONAL'
  | 'CONFIDENTIAL'
  | 'PRIVATE';

/**
 * Target chunk size and overlap used for every knowledge document.
 */
const CHUNK_TARGET_TOKENS = 150;
const CHUNK_OVERLAP_PERCENT = 20;

/**
 * A document that is ready to be stored, before it is chunked.
 */
export interface DocumentSpec {
  /**
   * Display title. Together with the source type it identifies the document
   * within the knowledge base.
   */
  title: string;

  /**
   * The kind of source the document came from (e.g. 'project', 'resume_summary').
   */
  source_type: string;

  /**
   * How the document may be used (PRD §34).
   */
  classification: KnowledgeClassification;

  /**
   * The document body, already redacted of phone numbers.
   */
  content: string;

  /**
   * Version of the source data the document was built from.
   */
  version: number;

  /**
   * Path of the source file, recorded on every chunk.
   */
  source_file: string;

  /**
   * Additional metadata merged into every chunk of the document.
   */
  chunk_metadata?: Record<string, unknown>;
}

/**
 * Statistics collected while ingesting a set of sources.
 */
export interface IngestionStats {
  documentsCreated: number;
  documentsUpdated: number;
  documentsUnchanged: number;
  chunksCreated: number;
  errors: Array<{ source: string; error: string }>;
}

/**
 * A document as it is stored in the knowledge base.
 */
interface StoredDocument {
  id: string;
  title: string;
  source_type: string;
  classification: KnowledgeClassification;
  content: string;
  version: number;
}

/**
 * Turns an error into a message without leaking any raw content.
 */
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Finds the document previously stored for a source type and title.
 */
async function findExistingDocument(
  store: SupabaseClient,
  sourceType: string,
  title: string
): Promise<StoredDocument | null> {
  const { data, error } = await store
    .from('knowledge_documents')
    .select('id, title, source_type, classification, content, version')
    .eq('source_type', sourceType)
    .eq('title', title)
    .limit(1);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as StoredDocument[];
  return rows[0] ?? null;
}

/**
 * Stores a document and its chunks, updating an existing document in place
 * when the source content changed.
 *
 * @returns whether the document was created, updated or left untouched, and
 *          how many chunks were written.
 */
async function storeDocument(
  store: SupabaseClient,
  spec: DocumentSpec
): Promise<{ outcome: 'created' | 'updated' | 'unchanged'; chunksCreated: number }> {
  const existing = await findExistingDocument(store, spec.source_type, spec.title);

  // Nothing changed, so there is no work to do.
  if (existing && existing.content === spec.content && existing.version >= spec.version) {
    return { outcome: 'unchanged', chunksCreated: 0 };
  }

  // A changed document moves on to the next version, unless the source data
  // declares an explicit higher version.
  const version = existing
    ? Math.max(spec.version, existing.version + 1)
    : spec.version;

  let documentId: string;

  if (existing) {
    const { error } = await store
      .from('knowledge_documents')
      .update({
        title: spec.title,
        source_type: spec.source_type,
        classification: spec.classification,
        content: spec.content,
        version,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw new Error(error.message);
    documentId = existing.id;

    // Replace the chunks so they match the new content.
    const { error: deleteError } = await store
      .from('knowledge_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) throw new Error(deleteError.message);
  } else {
    const document: KnowledgeDocumentInsert = {
      title: spec.title,
      source_type: spec.source_type,
      classification: spec.classification,
      content: spec.content,
      version,
    };

    const { data, error } = await store
      .from('knowledge_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const inserted = data as { id: string };
    documentId = inserted.id;
  }

  const chunks = chunkByParagraphsThenOverlay(spec.content, {
    targetTokens: CHUNK_TARGET_TOKENS,
    overlapPercent: CHUNK_OVERLAP_PERCENT,
  });

  let chunksCreated = 0;

  for (let index = 0; index < chunks.length; index++) {
    const chunk: KnowledgeChunkInsert = {
      document_id: documentId,
      chunk_index: index,
      content: redactPII(chunks[index]),
      embedding: [], // Will be filled in M13.04
      classification: spec.classification,
      metadata: {
        source_file: spec.source_file,
        ...spec.chunk_metadata,
        original_length: spec.content.length,
      },
    };

    const { error } = await store.from('knowledge_chunks').insert(chunk);
    if (error) throw new Error(error.message);

    chunksCreated++;
  }

  return { outcome: existing ? 'updated' : 'created', chunksCreated };
}

/**
 * Stores a set of documents, collecting failures instead of aborting the run.
 */
async function storeDocuments(
  store: SupabaseClient,
  sourceLabel: string,
  specs: DocumentSpec[]
): Promise<IngestionStats> {
  const stats: IngestionStats = {
    documentsCreated: 0,
    documentsUpdated: 0,
    documentsUnchanged: 0,
    chunksCreated: 0,
    errors: [],
  };

  for (const spec of specs) {
    try {
      const result = await storeDocument(store, spec);

      if (result.outcome === 'created') stats.documentsCreated++;
      else if (result.outcome === 'updated') stats.documentsUpdated++;
      else stats.documentsUnchanged++;

      stats.chunksCreated += result.chunksCreated;
    } catch (error) {
      stats.errors.push({
        source: `${sourceLabel}:${spec.title}`,
        error: describeError(error),
      });
    }
  }

  return stats;
}

/**
 * Merges the result of one source into the overall statistics.
 */
function mergeStats(target: IngestionStats, source: IngestionStats): void {
  target.documentsCreated += source.documentsCreated;
  target.documentsUpdated += source.documentsUpdated;
  target.documentsUnchanged += source.documentsUnchanged;
  target.chunksCreated += source.chunksCreated;
  target.errors.push(...source.errors);
}

/**
 * Builds the documents for a single source file.
 *
 * Titles are unique within a source type, which is what identifies a document
 * across runs. Two entries that share a title are disambiguated with a
 * numeric suffix so neither is lost.
 */
function buildDocuments(
  sourceFile: string,
  entries: Array<{
    title: string;
    content: string;
    sourceData?: unknown;
    chunkMetadata?: Record<string, unknown>;
  }>
): DocumentSpec[] {
  const usedTitles = new Set<string>();

  return entries.map((entry) => {
    const metadata = extractMetadata(sourceFile, entry.sourceData);

    let title = entry.title;
    let suffix = 2;
    while (usedTitles.has(title)) {
      title = `${entry.title} (${suffix})`;
      suffix++;
    }
    usedTitles.add(title);

    return {
      title,
      source_type: metadata.source_type,
      classification: metadata.classification,
      content: redactPII(entry.content),
      version: metadata.version,
      source_file: sourceFile,
      chunk_metadata: entry.chunkMetadata,
    };
  });
}

/**
 * Builds the documents for the project sources.
 */
function buildProjectDocuments(): DocumentSpec[] {
  return buildDocuments(
    'src/data/projects.ts',
    projectsData.map((project) => ({
      title: project.name,
      content: `
        Project: ${project.name}
        Value Proposition: ${project.valueProposition}
        Category: ${project.category}
        Technologies: ${project.technologies.join(', ')}
        Why Built: ${project.whyBuilt}
        What Learned: ${project.whatLearned}
        Architecture: ${project.architecture}
        GitHub URL: ${project.githubUrl || 'Not available'}
        Demo URL: ${project.demoUrl || 'Not available'}
      `.trim(),
      sourceData: project,
      chunkMetadata: { project_id: project.id },
    }))
  );
}

/**
 * Builds the documents for the achievement sources.
 */
function buildAchievementDocuments(): DocumentSpec[] {
  return buildDocuments(
    'src/data/achievements.ts',
    achievementsData.map((achievement) => ({
      title: achievement.title,
      content: `
        Achievement: ${achievement.title}
        Domain: ${achievement.domain}
        Company: ${achievement.company}
        Problem: ${achievement.problem}
        Responsibility: ${achievement.responsibility}
        Approach: ${achievement.approach}
        Technologies: ${achievement.technologies.join(', ')}
        Outcome: ${achievement.outcome}
      `.trim(),
      sourceData: achievement,
      chunkMetadata: { achievement_id: achievement.id },
    }))
  );
}

/**
 * Builds the document for the professional summary.
 */
function buildResumeSummaryDocuments(): DocumentSpec[] {
  return buildDocuments('src/data/summaryCopyData.ts', [
    {
      title: 'Professional Summary',
      content: `Professional Summary: ${summaryCopyData.summary}`,
      sourceData: summaryCopyData,
    },
  ]);
}

/**
 * Builds the documents for the education sources.
 */
function buildEducationDocuments(): DocumentSpec[] {
  return buildDocuments(
    'src/data/education.ts',
    educationData.map((entry) => ({
      title: `${entry.degree || ''} - ${entry.institution || ''}`,
      content: `
        Education: ${entry.degree || ''} in ${entry.fieldOfStudy || ''}
        Institution: ${entry.institution || ''}
        Location: ${entry.location || ''}
        Dates: ${entry.startDate || ''} - ${entry.endDate || ''}
        Description: ${entry.description || ''}
      `.trim(),
      sourceData: entry,
    }))
  );
}

/**
 * Builds the documents for the certification sources.
 */
function buildCertificationDocuments(): DocumentSpec[] {
  return buildDocuments(
    'src/data/certifications.ts',
    certificationsData.map((certification) => ({
      title: certification.name || 'Certification',
      content: `
        Certification: ${certification.name || ''}
        Issuing Organization: ${certification.issuer || ''}
        Date Issued: ${certification.date || ''}
        Verification URL: ${certification.verificationUrl || ''}
        Description: ${certification.description || ''}
      `.trim(),
      sourceData: certification,
    }))
  );
}

/**
 * Builds the documents for the skills sources.
 */
function buildSkillDocuments(): DocumentSpec[] {
  const entries: Array<{
    title: string;
    content: string;
    sourceData?: unknown;
    chunkMetadata?: Record<string, unknown>;
  }> = [];

  if (skillsData.technicalSkills && skillsData.technicalSkills.length > 0) {
    entries.push({
      title: 'Technical Skills',
      content: `Technical Skills: ${skillsData.technicalSkills.join(', ')}`,
      sourceData: skillsData,
      chunkMetadata: {
        skill_type: 'technical',
        skill_count: skillsData.technicalSkills.length,
      },
    });
  }

  const categorized = skillsData.categorizedSkills;

  if (categorized) {
    const categories = [
      'qualityEngineering',
      'backendApi',
      'ciCd',
      'cloudData',
      'aiModernEngineering',
    ] as const;

    for (const category of categories) {
      const skillArray = categorized[category];
      if (!skillArray || skillArray.length === 0) continue;

      const label = category
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (character) => character.toUpperCase());

      entries.push({
        title: `${label} Skills`,
        content: `${label}: ${skillArray.join(', ')}`,
        sourceData: { category, skillArray },
        chunkMetadata: {
          skill_type: category,
          skill_count: skillArray.length,
        },
      });
    }
  }

  return buildDocuments('src/data/skills.ts', entries);
}

/**
 * Builds the documents for the career timeline sources.
 */
function buildCareerTimelineDocuments(): DocumentSpec[] {
  return buildDocuments(
    'src/data/careerTimeline.ts',
    careerTimelineData.map((role) => ({
      title: `${role.role || ''} at ${role.company || ''}`,
      content: `
        Role: ${role.role || ''}
        Company: ${role.company || ''}
        Domain: ${role.domain || ''}
        Dates: ${role.startDate || ''} - ${role.endDate || ''}
        Responsibilities: ${role.responsibilities?.join('\n') || ''}
        Technologies: ${role.technologies?.join(', ') || ''}
        Notable Projects: ${role.notableProjects?.join('\n') || ''}
      `.trim(),
      sourceData: role,
    }))
  );
}

/**
 * Builds the document for the professional snapshot.
 */
function buildProfessionalSnapshotDocuments(): DocumentSpec[] {
  return buildDocuments('src/data/professionalSnapshot.ts', [
    {
      title: 'Professional Snapshot',
      content: `
        Years of Experience: ${professionalSnapshotData.yearsExperience || ''}
        Domains: ${professionalSnapshotData.domains?.join(', ') || ''}
        Automation Experience: ${professionalSnapshotData.automationExperience || ''}
        Cloud and CI/CD Practices: ${professionalSnapshotData.cloudCIDPractices || ''}
      `.trim(),
      sourceData: professionalSnapshotData,
    },
  ]);
}

/**
 * Builds the documents for the testimonial sources.
 */
function buildTestimonialDocuments(): DocumentSpec[] {
  return buildDocuments(
    'src/data/testimonials.ts',
    testimonials.map((testimonial) => ({
      title: `Testimonial - ${testimonial.name || ''}`,
      content: `
        Quote: ${testimonial.quote || ''}
        Author: ${testimonial.name || ''}
        Role: ${testimonial.role || ''}
        Company: ${testimonial.company || ''}
        Profile URL: ${testimonial.profileUrl || ''}
      `.trim(),
      sourceData: testimonial,
      chunkMetadata: { testimonial_id: testimonial.id },
    }))
  );
}

/**
 * Builds the document for the capability areas.
 */
function buildCapabilityAreaDocuments(): DocumentSpec[] {
  return buildDocuments('src/data/capabilityAreasData.ts', [
    {
      title: 'Capability Areas',
      content: `Capability Areas: ${capabilityAreasData.capabilities.join(', ')}`,
      sourceData: capabilityAreasData,
      chunkMetadata: { capability_count: capabilityAreasData.capabilities.length },
    },
  ]);
}

/**
 * Builds one document per social media platform.
 */
function buildSocialLinkDocuments(): DocumentSpec[] {
  const linksByPlatform = new Map<string, typeof socialLinks>();

  for (const link of socialLinks) {
    const platform = link.platform || 'Other';
    const existing = linksByPlatform.get(platform);
    if (existing) {
      existing.push(link);
    } else {
      linksByPlatform.set(platform, [link]);
    }
  }

  return buildDocuments(
    'src/data/socialLinks.ts',
    Array.from(linksByPlatform.entries()).map(([platform, links]) => ({
      title: `Social Links - ${platform}`,
      content: `
        Platform: ${platform}
        Links: ${links.map((link) => `${link.label || ''}: ${link.url || ''}`).join('\n')}
      `.trim(),
      sourceData: { platform, links },
      chunkMetadata: { platform, link_count: links.length },
    }))
  );
}

/**
 * A markdown file offered to the pipeline.
 */
export interface MarkdownSource {
  /**
   * Path of the file, recorded on every chunk.
   */
  path: string;

  /**
   * The raw file contents.
   */
  content: string;
}

/**
 * Ingests all knowledge source data into the knowledge base.
 *
 * This function:
 * 1. Processes each knowledge source type
 * 2. Converts each item to a document
 * 3. Applies PII redaction
 * 4. Splits into chunks
 * 5. Extracts metadata
 * 6. Stores documents and chunks in Supabase
 *
 * @param store The store to write to. Defaults to the Supabase service role
 *              client, which is created on demand so that importing this
 *              module does not require environment variables.
 * @param markdownSources Markdown documents to ingest, such as public
 *              articles and approved interview talking points (PRD §33).
 * @returns Object with ingestion statistics
 */
export async function ingestKnowledgeSources(
  store?: SupabaseClient,
  markdownSources: MarkdownSource[] = []
): Promise<IngestionStats> {
  const stats: IngestionStats = {
    documentsCreated: 0,
    documentsUpdated: 0,
    documentsUnchanged: 0,
    chunksCreated: 0,
    errors: [],
  };

  try {
    const target =
      store ?? (await import('../supabase.ts')).supabaseServiceRole;

    const sources: Array<[string, DocumentSpec[]]> = [
      ['project', buildProjectDocuments()],
      ['achievement', buildAchievementDocuments()],
      ['resume_summary', buildResumeSummaryDocuments()],
      ['education', buildEducationDocuments()],
      ['certification', buildCertificationDocuments()],
      ['skill', buildSkillDocuments()],
      ['career_timeline', buildCareerTimelineDocuments()],
      ['professional_snapshot', buildProfessionalSnapshotDocuments()],
      ['testimonial', buildTestimonialDocuments()],
      ['capability_area', buildCapabilityAreaDocuments()],
      ['social_link', buildSocialLinkDocuments()],
    ];

    for (const [label, specs] of sources) {
      mergeStats(stats, await storeDocuments(target, label, specs));
    }

    // Markdown sources are ingested last so a malformed file never blocks the
    // structured sources.
    for (const source of markdownSources) {
      try {
        const specs = buildMarkdownDocuments(source.path, source.content);
        mergeStats(stats, await storeDocuments(target, 'markdown', specs));
      } catch (error) {
        stats.errors.push({
          source: `markdown:${source.path}`,
          error: describeError(error),
        });
      }
    }
  } catch (error) {
    stats.errors.push({ source: 'general', error: describeError(error) });
  }

  return stats;
}

/**
 * Logs a summary of an ingestion run.
 */
export function logIngestionStats(stats: IngestionStats): void {
  console.log(
    `[ingestion] created=${stats.documentsCreated} updated=${stats.documentsUpdated} ` +
      `unchanged=${stats.documentsUnchanged} chunks=${stats.chunksCreated} ` +
      `errors=${stats.errors.length}`
  );

  for (const failure of stats.errors) {
    console.error(`[ingestion] ${failure.source}: ${failure.error}`);
  }
}
