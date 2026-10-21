/**
 * Metadata extraction utilities for knowledge base documents.
 * 
 * Extracts source_type, classification, and version from knowledge source files.
 */

/**
 * Determines the source type based on the file path or data structure.
 * 
 * @param filePath Path to the source file (e.g., 'src/data/projects.ts')
 * @returns Source type string (e.g., 'project', 'achievement', 'resume')
 */
export function getSourceTypeFromFilePath(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  
  if (fileName.includes('projects')) {
    return 'project';
  }
  if (fileName.includes('achievements')) {
    return 'achievement';
  }
  if (fileName.includes('summaryCopy') || fileName.includes('summary')) {
    return 'resume_summary';
  }
  if (fileName.includes('education')) {
    return 'education';
  }
  if (fileName.includes('certifications')) {
    return 'certification';
  }
  if (fileName.includes('skills')) {
    return 'skill';
  }
  if (fileName.includes('careerTimeline')) {
    return 'career_timeline';
  }
  if (fileName.includes('professionalSnapshot')) {
    return 'professional_snapshot';
  }
  if (fileName.includes('testimonials')) {
    return 'testimonial';
  }
  if (fileName.includes('capabilityAreas')) {
    return 'capability_area';
  }
  
  // Default fallback
  return 'unknown';
}

/**
 * Determines the classification level for a source type.
 * 
 * Most professional content is classified as PROFESSIONAL.
 * Public bio/social links might be PUBLIC.
 * Confidential/internal data should be marked accordingly.
 * 
 * @param sourceType The source type string
 * @returns Classification level
 */
export function getClassificationForSourceType(sourceType: string): 'PUBLIC' | 'PROFESSIONAL' | 'CONFIDENTIAL' | 'PRIVATE' {
  // Most professional resume/project data is PROFESSIONAL
  const professionalTypes = [
    'project',
    'achievement',
    'resume_summary',
    'education',
    'certification',
    'skill',
    'career_timeline',
    'professional_snapshot',
    'capability_area'
  ];
  
  if (professionalTypes.includes(sourceType)) {
    return 'PROFESSIONAL';
  }
  
  // Social links and public bio could be PUBLIC
  const publicTypes = [
    'social_link',
    'public_bio'
  ];
  
  if (publicTypes.includes(sourceType)) {
    return 'PUBLIC';
  }
  
  // Default to PROFESSIONAL for safety
  return 'PROFESSIONAL';
}

/**
 * Extracts or generates a version number for a document.
 * 
 * In a real implementation, this might come from git history or a version field.
 * For now, we'll start with version 1 and rely on manual updates.
 * 
 * @param sourceData The source data object (optional)
 * @returns Version number (starting at 1)
 */
export function getDocumentVersion(sourceData?: unknown): number {
  // If source data has a version field, use it
  if (sourceData && typeof sourceData === 'object' && 'version' in sourceData) {
    const version = sourceData.version;
    if (typeof version === 'number' && version > 0) {
      return version;
    }
  }
  
  // Default to version 1
  return 1;
}

/**
 * Extracts metadata from a source file and its data.
 * 
 * @param filePath Path to the source file
 * @param sourceData The parsed data from the source file
 * @returns Metadata object with source_type, classification, and version
 */
export function extractMetadata(
  filePath: string,
  sourceData?: unknown
): {
  source_type: string;
  classification: 'PUBLIC' | 'PROFESSIONAL' | 'CONFIDENTIAL' | 'PRIVATE';
  version: number;
} {
  const sourceType = getSourceTypeFromFilePath(filePath);
  const classification = getClassificationForSourceType(sourceType);
  const version = getDocumentVersion(sourceData);
  
  return {
    source_type: sourceType,
    classification,
    version
  };
}
