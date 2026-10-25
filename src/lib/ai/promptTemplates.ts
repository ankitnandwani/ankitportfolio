/**
 * Prompt templates for the RAG orchestration.
 *
 * These templates construct the prompt sent to the LLM by combining the
 * system instruction, retrieved context, conversation history, and the
 * user's current message.
 */

import type { RetrievedChunk } from '@/src/lib/knowledge/types';
import type { PromptContext } from './types';

/**
 * The system instruction that defines the AI's role and behavior.
 */
export const SYSTEM_INSTRUCTION = `You are "Ask Ankit's AI", a helpful assistant that answers questions about Ankit Nandwani's professional background.

Your knowledge comes from a structured knowledge base covering his:
- Career experience and roles
- Technical skills and technologies
- Projects (professional, personal, engineering lab)
- Achievements and impact
- Education and certifications
- Professional philosophy and approach

Guidelines:
- Answer truthfully based only on the provided context
- If the context doesn't contain the answer, say you don't have that information
- Be concise but thorough
- Use a professional, helpful tone
- Don't speculate or hallucinate
- If asked about topics outside Ankit's professional profile, politely redirect
- Never share private contact information (phone, personal email)
- Format responses with clear structure when appropriate
- You are not Ankit; you are his AI assistant.`;

/**
 * The instruction appended when no relevant context is found.
 */
export const NO_CONTEXT_INSTRUCTION = `No relevant information was found in the knowledge base for this question. Politely explain that you don't have this information and suggest topics you can help with (e.g., experience, skills, projects, achievements, education).`;

/**
 * The instruction appended when context is found but may be incomplete.
 */
export const CONTEXT_INSTRUCTION = `Answer based only on the context above. If the context is incomplete, acknowledge what you know and what you don't.`;

/**
 * Formats retrieved chunks into a context string for the prompt.
 *
 * @param chunks The retrieved chunks.
 * @returns A formatted context string.
 */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  return chunks
    .map((chunk, index) => {
      const source = chunk.sourceFile ? ` (source: ${chunk.sourceFile})` : '';
      return `[Context ${index + 1}]${source}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Formats conversation history into a string for the prompt.
 *
 * @param history The conversation history.
 * @param maxMessages The maximum number of messages to include. Defaults to 6.
 * @returns A formatted history string.
 */
export function formatHistory(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxMessages = 6
): string {
  if (history.length === 0) {
    return '';
  }

  const recent = history.slice(-maxMessages);
  return recent
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}

/**
 * Builds the complete prompt context for the LLM.
 *
 * @param userMessage The user's current message.
 * @param chunks The retrieved knowledge chunks.
 * @param history The conversation history.
 * @returns The prompt context with all parts assembled.
 */
export function buildPromptContext(
  userMessage: string,
  chunks: RetrievedChunk[],
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): PromptContext {
  const context = formatContext(chunks);
  const historyText = formatHistory(history);
  const contextInstruction = chunks.length > 0 ? CONTEXT_INSTRUCTION : NO_CONTEXT_INSTRUCTION;

  const parts = [
    SYSTEM_INSTRUCTION,
    '',
    context ? `Relevant Information:\n${context}\n` : '',
    contextInstruction,
    '',
    historyText ? `Recent Conversation:\n${historyText}\n` : '',
    `User: ${userMessage}`,
    '',
    'Assistant:',
  ];

  const fullPrompt = parts.filter(Boolean).join('\n');

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    context,
    history: historyText,
    userMessage,
    fullPrompt,
  };
}

/**
 * Builds a redirect response for off-topic or blocked queries.
 *
 * @param redirectMessage The redirect message.
 * @param suggestions Optional suggested questions.
 * @returns A prompt context that will produce a redirect response.
 */
export function buildRedirectPromptContext(
  redirectMessage: string,
  suggestions: string[] = []
): PromptContext {
  const suggestionText =
    suggestions.length > 0
      ? `\n\nYou can ask me about:\n${suggestions.map((s) => `- ${s}`).join('\n')}`
      : '';

  const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n${redirectMessage}${suggestionText}\n\nAssistant:`;

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    context: '',
    history: '',
    userMessage: '',
    fullPrompt,
  };
}

/**
 * Creates a prompt for the case where retrieval failed.
 *
 * @param userMessage The user's message.
 * @param history The conversation history.
 * @param errorMessage The error message to include.
 * @returns A prompt context for the error case.
 */
export function buildErrorPromptContext(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  errorMessage = 'I encountered an issue retrieving the relevant information.'
): PromptContext {
  const historyText = formatHistory(history);

  const fullPrompt = [
    SYSTEM_INSTRUCTION,
    '',
    errorMessage,
    '',
    historyText ? `Recent Conversation:\n${historyText}\n` : '',
    `User: ${userMessage}`,
    '',
    'Assistant:',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    context: '',
    history: historyText,
    userMessage,
    fullPrompt,
  };
}