/**
 * Document ingestion pipeline for the AI knowledge base.
 * 
 * Processes knowledge source files from src/data/ into documents and chunks
 * for storage in the Supabase knowledge base.
 */

import { supabaseServiceRole } from '@/src/lib/supabase';
import {
  KnowledgeDocumentInsert,
  KnowledgeChunkInsert,
} from '@/src/lib/knowledge/schema';
import { chunkByParagraphsThenOverlay } from '@/src/lib/knowledge/chunking';
import { extractMetadata } from '@/src/lib/knowledge/metadata';
import { redactPII } from '@/src/lib/knowledge/pii';

// Import all knowledge source data files
import { projectsData, type Project } from '@/src/data/projects';
import { achievementsData, type Achievement } from '@/src/data/achievements';
import { summaryCopyData, type SummaryCopyData } from '@/src/data/summaryCopyData';
import { educationData, type EducationEntry } from '@/src/data/education';
import { certificationsData, type CertificationEntry } from '@/src/data/certifications';
import { skillsData, type SkillsData } from '@/src/data/skills';
import { careerTimelineData, type CareerTimelineEntry } from '@/src/data/careerTimeline';
import { professionalSnapshotData, type ProfessionalSnapshotData } from '@/src/data/professionalSnapshot';
import { testimonials, type Testimonial } from '@/src/data/testimonials';
import { capabilityAreasData, type CapabilityAreasData } from '@/src/data/capabilityAreasData';
import { socialLinks, type SocialLink } from '@/src/data/socialLinks';
// Note: github.ts only contains types, no actual data to ingest

/**
 * Keys of the optional categorized skill groups defined by {@link SkillsData}.
 */
type SkillCategoryKey = keyof NonNullable<SkillsData['categorizedSkills']>;

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
 * @returns Object with ingestion statistics
 */
export async function ingestKnowledgeSources(): Promise<{
  documentsProcessed: number;
  chunksCreated: number;
  errors: Array<{ source: string; error: string }>;
}> {
  const stats = {
    documentsProcessed: 0,
    chunksCreated: 0,
    errors: [] as Array<{ source: string; error: string }>
  };
  
  try {
    // Process projects
    const projectsResult = await processProjects(projectsData, 'src/data/projects.ts');
    stats.documentsProcessed += projectsResult.documentsProcessed;
    stats.chunksCreated += projectsResult.chunksCreated;
    stats.errors.push(...projectsResult.errors);
    
    // Process achievements
    const achievementsResult = await processAchievements(achievementsData, 'src/data/achievements.ts');
    stats.documentsProcessed += achievementsResult.documentsProcessed;
    stats.chunksCreated += achievementsResult.chunksCreated;
    stats.errors.push(...achievementsResult.errors);
    
    // Process resume summary
    const summaryResult = await processResumeSummary(summaryCopyData, 'src/data/summaryCopyData.ts');
    stats.documentsProcessed += summaryResult.documentsProcessed;
    stats.chunksCreated += summaryResult.chunksCreated;
    stats.errors.push(...summaryResult.errors);
    
    // Process education
    const educationResult = await processEducation(educationData, 'src/data/education.ts');
    stats.documentsProcessed += educationResult.documentsProcessed;
    stats.chunksCreated += educationResult.chunksCreated;
    stats.errors.push(...educationResult.errors);
    
    // Process certifications
    const certificationsResult = await processCertifications(certificationsData, 'src/data/certifications.ts');
    stats.documentsProcessed += certificationsResult.documentsProcessed;
    stats.chunksCreated += certificationsResult.chunksCreated;
    stats.errors.push(...certificationsResult.errors);
    
    // Process skills
    const skillsResult = await processSkills(skillsData, 'src/data/skills.ts');
    stats.documentsProcessed += skillsResult.documentsProcessed;
    stats.chunksCreated += skillsResult.chunksCreated;
    stats.errors.push(...skillsResult.errors);
    
    // Process career timeline
    const careerTimelineResult = await processCareerTimeline(careerTimelineData, 'src/data/careerTimeline.ts');
    stats.documentsProcessed += careerTimelineResult.documentsProcessed;
    stats.chunksCreated += careerTimelineResult.chunksCreated;
    stats.errors.push(...careerTimelineResult.errors);
    
    // Process professional snapshot
    const professionalSnapshotResult = await processProfessionalSnapshot(professionalSnapshotData, 'src/data/professionalSnapshot.ts');
    stats.documentsProcessed += professionalSnapshotResult.documentsProcessed;
    stats.chunksCreated += professionalSnapshotResult.chunksCreated;
    stats.errors.push(...professionalSnapshotResult.errors);
    
    // Process testimonials
    const testimonialsResult = await processTestimonials(testimonials, 'src/data/testimonials.ts');
    stats.documentsProcessed += testimonialsResult.documentsProcessed;
    stats.chunksCreated += testimonialsResult.chunksCreated;
    stats.errors.push(...testimonialsResult.errors);
    
    // Process capability areas
    const capabilityAreasResult = await processCapabilityAreas(capabilityAreasData, 'src/data/capabilityAreasData.ts');
    stats.documentsProcessed += capabilityAreasResult.documentsProcessed;
    stats.chunksCreated += capabilityAreasResult.chunksCreated;
    stats.errors.push(...capabilityAreasResult.errors);
    
    // Process social links
    const socialLinksResult = await processSocialLinks(socialLinks, 'src/data/socialLinks.ts');
    stats.documentsProcessed += socialLinksResult.documentsProcessed;
    stats.chunksCreated += socialLinksResult.chunksCreated;
    stats.errors.push(...socialLinksResult.errors);
    
  } catch (error) {
    stats.errors.push({
      source: 'general',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return stats;
}

/**
 * Processes project data into documents and chunks.
 */
async function processProjects(projects: Project[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  for (const project of projects) {
    try {
      // Create document content from project fields
      const content = `
        Project: ${project.name}
        Value Proposition: ${project.valueProposition}
        Category: ${project.category}
        Technologies: ${project.technologies.join(', ')}
        Why Built: ${project.whyBuilt}
        What Learned: ${project.whatLearned}
        Architecture: ${project.architecture}
        GitHub URL: ${project.githubUrl || 'Not available'}
        Demo URL: ${project.demoUrl || 'Not available'}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, project);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: project.name,
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]); // Double-check
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            project_id: project.id,
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
          
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `project:${project.id || 'unknown'}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}

/**
 * Processes achievement data into documents and chunks.
 */
async function processAchievements(achievements: Achievement[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  for (const achievement of achievements) {
    try {
      // Create document content from achievement fields
      const content = `
        Achievement: ${achievement.title}
        Domain: ${achievement.domain}
        Company: ${achievement.company}
        Problem: ${achievement.problem}
        Responsibility: ${achievement.responsibility}
        Approach: ${achievement.approach}
        Technologies: ${achievement.technologies.join(', ')}
        Outcome: ${achievement.outcome}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, achievement);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: achievement.title,
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content (achievements are usually concise, but still chunk)
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            achievement_id: achievement.id,
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
          
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `achievement:${achievement.id || 'unknown'}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}

/**
 * Processes resume summary data.
 */
async function processResumeSummary(summaryData: SummaryCopyData, filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  try {
    const content = `Professional Summary: ${summaryData.summary}`;
    
    // Redact PII
    const cleanContent = redactPII(content);
    
    // Extract metadata
    const metadata = extractMetadata(filePath, summaryData);
    
    // Create document
    const document: KnowledgeDocumentInsert = {
      title: 'Professional Summary',
      source_type: metadata.source_type,
      classification: metadata.classification,
      content: cleanContent,
      version: metadata.version
    };
    
    // Insert document
    const { data: docData, error: docError } = await supabaseServiceRole
      .from('knowledge_documents')
      .insert(document)
      .select()
      .single();
    
    if (docError) throw docError;
    
    // Chunk the content
    const chunks = chunkByParagraphsThenOverlay(cleanContent, {
      targetTokens: 150,
      overlapPercent: 20
    });
    
    // Insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = redactPII(chunks[i]);
      
      const chunk: KnowledgeChunkInsert = {
        document_id: docData.id,
        chunk_index: i,
        content: chunkContent,
        embedding: [], // Will be filled in M13.04
        classification: metadata.classification,
        metadata: {
          source_file: filePath,
          original_length: content.length
        }
      };
      
      const { error: chunkError } = await supabaseServiceRole
        .from('knowledge_chunks')
        .insert(chunk);
        
      if (chunkError) throw chunkError;
      
      stats.chunksCreated++;
    }
    
    stats.documentsProcessed = 1;
  } catch (error) {
    stats.errors.push({
      source: 'resume_summary',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return stats;
}

/**
 * Processes education data.
 */
async function processEducation(educationData: EducationEntry[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  for (const [index, edu] of educationData.entries()) {
    try {
      const content = `
        Education: ${edu.degree || ''} in ${edu.fieldOfStudy || ''}
        Institution: ${edu.institution || ''}
        Location: ${edu.location || ''}
        Dates: ${edu.startDate || ''} - ${edu.endDate || ''}
        Description: ${edu.description || ''}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, edu);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: `${edu.degree || ''} - ${edu.institution || ''}`,
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            education_id: index.toString(),
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
          
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `education:${index}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}

/**
 * Processes certifications data.
 */
async function processCertifications(certificationsData: CertificationEntry[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  for (const [index, cert] of certificationsData.entries()) {
    try {
      const content = `
        Certification: ${cert.name || ''}
        Issuing Organization: ${cert.issuer || ''}
        Date Issued: ${cert.date || ''}
        Verification URL: ${cert.verificationUrl || ''}
        Description: ${cert.description || ''}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, cert);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: cert.name || 'Certification',
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            certification_id: index.toString(),
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
        
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `certification:${index}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}

/**
 * Processes skills data.
 */
async function processSkills(skillsData: SkillsData, filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  try {
    // Process technical skills array
    if (skillsData.technicalSkills && skillsData.technicalSkills.length > 0) {
      const content = `
        Technical Skills: ${skillsData.technicalSkills.join(', ')}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, skillsData);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: 'Technical Skills',
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            skill_type: 'technical',
            skill_count: skillsData.technicalSkills.length,
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
        
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    }
    
    // Process categorized skills
    if (skillsData.categorizedSkills) {
      const categories: SkillCategoryKey[] = ['qualityEngineering', 'backendApi', 'ciCd', 'cloudData', 'aiModernEngineering'];
      for (const category of categories) {
        const skillArray = skillsData.categorizedSkills[category];
        if (skillArray && skillArray.length > 0) {
          const content = `
            ${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${skillArray.join(', ')}
          `.trim();
          
          // Redact PII
          const cleanContent = redactPII(content);
          
          // Extract metadata
          const metadata = extractMetadata(filePath, { category, skillArray });
          
          // Create document
          const document: KnowledgeDocumentInsert = {
            title: `${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Skills`,
            source_type: metadata.source_type,
            classification: metadata.classification,
            content: cleanContent,
            version: metadata.version
          };
          
          // Insert document
          const { data: docData, error: docError } = await supabaseServiceRole
            .from('knowledge_documents')
            .insert(document)
            .select()
            .single();
          
          if (docError) throw docError;
          
          // Chunk the content
          const chunks = chunkByParagraphsThenOverlay(cleanContent, {
            targetTokens: 150,
            overlapPercent: 20
          });
          
          // Insert chunks
          for (let i = 0; i < chunks.length; i++) {
            const chunkContent = redactPII(chunks[i]);
            
            const chunk: KnowledgeChunkInsert = {
              document_id: docData.id,
              chunk_index: i,
              content: chunkContent,
              embedding: [], // Will be filled in M13.04
              classification: metadata.classification,
              metadata: {
                source_file: filePath,
                skill_type: category,
                skill_count: skillArray.length,
                original_length: content.length
              }
            };
            
            const { error: chunkError } = await supabaseServiceRole
              .from('knowledge_chunks')
              .insert(chunk);
            
            if (chunkError) throw chunkError;
            
            stats.chunksCreated++;
          }
          
          stats.documentsProcessed++;
        }
      }
    }
  } catch (error) {
    stats.errors.push({
      source: 'skills',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return stats;
}

/**
 * Processes career timeline data.
 */
async function processCareerTimeline(careerTimelineData: CareerTimelineEntry[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  for (const [index, role] of careerTimelineData.entries()) {
    try {
      const content = `
        Role: ${role.role || ''}
        Company: ${role.company || ''}
        Domain: ${role.domain || ''}
        Dates: ${role.startDate || ''} - ${role.endDate || ''}
        Responsibilities: ${role.responsibilities?.join('\n') || ''}
        Technologies: ${role.technologies?.join(', ') || ''}
        Notable Projects: ${role.notableProjects?.join('\n') || ''}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, role);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: `${role.role || ''} at ${role.company || ''}`,
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            role_id: index.toString(),
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
        
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `career_timeline:${index}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}

/**
 * Processes professional snapshot data.
 */
async function processProfessionalSnapshot(snapshotData: ProfessionalSnapshotData, filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  try {
    const content = `
      Years of Experience: ${snapshotData.yearsExperience || ''}
      Domains: ${snapshotData.domains?.join(', ') || ''}
      Automation Experience: ${snapshotData.automationExperience || ''}
      Cloud and CI/CD Practices: ${snapshotData.cloudCIDPractices || ''}
    `.trim();
    
    // Redact PII
    const cleanContent = redactPII(content);
    
    // Extract metadata
    const metadata = extractMetadata(filePath, snapshotData);
    
    // Create document
    const document: KnowledgeDocumentInsert = {
      title: 'Professional Snapshot',
      source_type: metadata.source_type,
      classification: metadata.classification,
      content: cleanContent,
      version: metadata.version
    };
    
    // Insert document
    const { data: docData, error: docError } = await supabaseServiceRole
      .from('knowledge_documents')
      .insert(document)
      .select()
      .single();
    
    if (docError) throw docError;
    
    // Chunk the content
    const chunks = chunkByParagraphsThenOverlay(cleanContent, {
      targetTokens: 150,
      overlapPercent: 20
    });
    
    // Insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = redactPII(chunks[i]);
      
      const chunk: KnowledgeChunkInsert = {
        document_id: docData.id,
        chunk_index: i,
        content: chunkContent,
        embedding: [], // Will be filled in M13.04
        classification: metadata.classification,
        metadata: {
          source_file: filePath,
          original_length: content.length
        }
      };
      
      const { error: chunkError } = await supabaseServiceRole
        .from('knowledge_chunks')
        .insert(chunk);
      
      if (chunkError) throw chunkError;
      
      stats.chunksCreated++;
    }
    
    stats.documentsProcessed = 1;
  } catch (error) {
    stats.errors.push({
      source: 'professional_snapshot',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return stats;
}

/**
 * Processes testimonials data.
 */
async function processTestimonials(testimonialsData: Testimonial[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  for (const testimonial of testimonialsData) {
    try {
      const content = `
        Quote: ${testimonial.quote || ''}
        Author: ${testimonial.name || ''}
        Role: ${testimonial.role || ''}
        Company: ${testimonial.company || ''}
        Profile URL: ${testimonial.profileUrl || ''}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, testimonial);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: `Testimonial - ${testimonial.name || ''}`,
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            testimonial_id: testimonial.id || i.toString(),
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
        
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `testimonial:${testimonial.id || 'unknown'}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}

/**
 * Processes capability areas data.
 */
async function processCapabilityAreas(capabilityAreasData: CapabilityAreasData, filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  try {
    // Process capabilities array
    if (capabilityAreasData.capabilities && capabilityAreasData.capabilities.length > 0) {
      const content = `
        Capability Areas: ${capabilityAreasData.capabilities.join(', ')}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, capabilityAreasData);
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: 'Capability Areas',
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            capability_count: capabilityAreasData.capabilities.length,
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
        
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    }
  } catch (error) {
    stats.errors.push({
      source: 'capability_areas',
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return stats;
}

/**
 * Processes social links data.
 */
async function processSocialLinks(socialLinksData: SocialLink[], filePath: string) {
  const stats = { documentsProcessed: 0, chunksCreated: 0, errors: [] as Array<{ source: string; error: string }> };
  
  // Group social links by platform for better organization
  const linksByPlatform: Record<string, SocialLink[]> = {};
  
  for (const link of socialLinksData) {
    const platform = link.platform || 'Other';
    if (!linksByPlatform[platform]) {
      linksByPlatform[platform] = [];
    }
    linksByPlatform[platform].push(link);
  }
  
  // Create a document for each platform
  for (const [platform, links] of Object.entries(linksByPlatform)) {
    try {
      const content = `
        Platform: ${platform}
        Links: ${links.map(l => `${l.label || ''}: ${l.url || ''}`).join('\n')}
      `.trim();
      
      // Redact PII
      const cleanContent = redactPII(content);
      
      // Extract metadata
      const metadata = extractMetadata(filePath, { platform, links });
      
      // Create document
      const document: KnowledgeDocumentInsert = {
        title: `Social Links - ${platform}`,
        source_type: metadata.source_type,
        classification: metadata.classification,
        content: cleanContent,
        version: metadata.version
      };
      
      // Insert document
      const { data: docData, error: docError } = await supabaseServiceRole
        .from('knowledge_documents')
        .insert(document)
        .select()
        .single();
      
      if (docError) throw docError;
      
      // Chunk the content
      const chunks = chunkByParagraphsThenOverlay(cleanContent, {
        targetTokens: 150,
        overlapPercent: 20
      });
      
      // Insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = redactPII(chunks[i]);
        
        const chunk: KnowledgeChunkInsert = {
          document_id: docData.id,
          chunk_index: i,
          content: chunkContent,
          embedding: [], // Will be filled in M13.04
          classification: metadata.classification,
          metadata: {
            source_file: filePath,
            platform,
            link_count: links.length,
            original_length: content.length
          }
        };
        
        const { error: chunkError } = await supabaseServiceRole
          .from('knowledge_chunks')
          .insert(chunk);
        
        if (chunkError) throw chunkError;
        
        stats.chunksCreated++;
      }
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({
        source: `social_links_platform:${platform}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return stats;
}
