/**
 * Chunking utilities for splitting text into overlapping chunks.
 * 
 * This module provides functions to split text into semantically meaningful chunks
 * with configurable overlap for use in embedding generation and vector storage.
 */

/**
 * Splits text into sentences using a simple regex.
 * Handles basic English punctuation.
 */
function splitIntoSentences(text: string): string[] {
  // Split by sentence-ending punctuation followed by whitespace or end of string
  const sentenceRegex = /[.!?]+[\s\n]+|[.!?]+$/g;
  const sentences = text.trim().split(sentenceRegex);
  // Filter out empty strings
  return sentences.filter(s => s.length > 0);
}

/**
 * Estimates the number of tokens in a text string.
 * Rough approximation: 1 token ≈ 0.75 words for English text.
 * 
 * @param text The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Simple approximation: split by whitespace and punctuation
  const words = text.trim().split(/\s+/);
  // Adjust for punctuation and special characters
  return Math.ceil(words.length * 0.75);
}

/**
 * Splits text into chunks with overlap.
 * 
 * @param text The text to chunk
 * @param options Configuration options
 * @returns Array of text chunks
 */
export function chunkTextWithOverlap(
  text: string,
  options: {
    targetTokens?: number;
    overlapPercent?: number;
  } = {}
): string[] {
  const targetTokens = options.targetTokens ?? 150;
  const overlapPercent = options.overlapPercent ?? 20;
  
  // Convert target tokens to approximate character count
  // Assuming average 4 characters per token (rough estimate)
  const targetChars = Math.floor(targetTokens * 4);
  const overlapChars = Math.floor(targetChars * (overlapPercent / 100));
  
  if (text.length <= targetChars) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + targetChars;
    
    // If we're not at the end of text, try to break at a sentence boundary
    if (end < text.length) {
      // Look for the last sentence ending within the target range
      const lastPeriod = text.lastIndexOf('.', end);
      const lastExclamation = text.lastIndexOf('!', end);
      const lastQuestion = text.lastIndexOf('?', end);
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastSentenceEnd > start) {
        end = lastSentenceEnd + 1; // Include the period
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // Move start forward, accounting for overlap
    start = end - overlapChars;
    
    // Ensure we make progress
    const lastChunkLength = chunks.length > 0 ? chunks[chunks.length - 1].length : 0;
    if (start <= lastChunkLength) {
      start = end;
    }
  }
  
  return chunks;
}

/**
 * Chunks text by splitting on paragraphs first, then applying overlap chunking.
 * This preserves paragraph-level semantics.
 * 
 * @param text The text to chunk
 * @param options Configuration options
 * @returns Array of text chunks
 */
export function chunkByParagraphsThenOverlay(
  text: string,
  options: {
    targetTokens?: number;
    overlapPercent?: number;
  } = {}
): string[] {
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokenEstimate = 0;
  
  const targetTokens = options.targetTokens ?? 150;
  const overlapPercent = options.overlapPercent ?? 20;
  
  for (const paragraph of paragraphs) {
    const paraTokenEstimate = estimateTokenCount(paragraph);
    
    // If adding this paragraph would exceed target, finalize current chunk
    if (currentTokenEstimate + paraTokenEstimate > targetTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous chunk
      const overlapChars = Math.floor(
        estimateTokenCount(currentChunk) * 4 * (overlapPercent / 100)
      );
      const overlapText = currentChunk.slice(-overlapChars);
      currentChunk = overlapText + ' ' + paragraph;
      currentTokenEstimate = estimateTokenCount(currentChunk);
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
      currentTokenEstimate += paraTokenEstimate;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}