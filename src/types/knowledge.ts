export interface KnowledgeDocument {
  id: string;
  title: string;
  source_type: string;
  classification: 'PUBLIC' | 'PROFESSIONAL' | 'CONFIDENTIAL' | 'PRIVATE';
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[]; // Vector of numbers, length 768 for Gemini
  classification: 'PUBLIC' | 'PROFESSIONAL' | 'CONFIDENTIAL' | 'PRIVATE';
  metadata: Record<string, unknown>;
  created_at: string;
}