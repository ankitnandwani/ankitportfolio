# M13.09 — Integrate Retrieval and Generation (RAG Pipeline)

## Objective

Integrate the knowledge base retrieval system with the LLM generator to create a Retrieval-Augmented Generation (RAG) pipeline that answers user queries based on Ankit's professional knowledge base, implementing prompt augmentation with retrieved context and ensuring proper grounding.

## Context

The core of the AI assistant is the RAG pipeline: take a user query, retrieve relevant knowledge chunks, augment the LLM prompt with this context, and generate a response that is grounded in the provided information. Following PRD §32 (AI Knowledge Architecture), PRD §43 (AI Source Grounding), and PRD §42 (AI Answer Quality), we need to orchestrate the retrieval, prompt construction, and generation steps while applying guardrails and handling edge cases like insufficient context.

## Requirements
- Implement an orchestration function that takes a user message and returns an AI response.
- Apply input guardrails (topic classification, prompt-injection detection, PII redaction) to the user message.
- If input is off-topic, return a redirect response without invoking retrieval/generation.
- If prompt injection is detected, respond safely or warn the user.
- For valid input, generate query embedding and retrieve top-k relevant knowledge chunks.
- Construct a prompt that includes:
  - System message defining the AI's role (Ankit's AI professional assistant).
  - Retrieved context chunks with clear attribution.
  - The user's original query.
  - Instructions to answer based only on the provided context and to be concise, professional, etc.
- Handle cases where no relevant chunks are found (fallback to general knowledge or redirect).
- Pass the constructed prompt to the LLM provider (Gemini) for generation.
- Apply output guardrails (PII detection, output validation) to the generated response.
- Optionally, apply response validation to ensure it doesn't contradict the context or hallucinate excessively.
- Return the final response to the user.
- Log key metrics: retrieval time, generation time, token usage, etc.
- Support streaming responses for better UX.

## Scope
### In scope
- Orchestration service/tie-between for the RAG pipeline
- Input guardrail integration (using M13.07 components)
- Retrieval invocation (using M13.05)
- Prompt templating with context insertion
- LLM generation invocation (using M13.06)
- Output guardrail integration (using M13.07 components)
- Error handling for each stage (retrieval failure, API errors, etc.)
- Logging of pipeline metrics
- Support for streaming generation
- Fallback behavior for low-confidence or no-retrieval scenarios
- Integration with chat UI (via API route or server action)

### Out of scope
- Training or fine-tuning of the LLM
- Complex reasoning chains or tool use (beyond retrieval)
- Advanced attribution or citation display (though we can mention "based on Ankit's professional profile")
- Real-time learning from user interactions
- Multilingual support

## Dependencies
- Input guardrails implemented (M13.07)
- Retrieval system with vector search (M13.05)
- LLM provider abstraction and GeminiProvider (M13.06)
- Output guardrails (part of M13.07)
- Knowledge base with embedded chunks (M13.04)
- Chat UI components (M13.08) or at least an API endpoint to connect to

## Files / Areas Expected To Change
- `src/lib/ai/orchestration.ts` (to be created) - Main RAG pipeline orchestration
- `src/lib/ai/promptTemplates.ts` (to be created) - Prompt construction templates
- `src/lib/ai/types.ts` (to be created) - Types for AI request/response
- May update `src/lib/guardrails/index.ts` to export orchestration-friendly functions
- May create an API route: `app/api/chat/route.ts` (Next.js app router) or `src/pages/api/chat.ts`
- May update chat UI to connect to the backend endpoint

## Implementation Guidance
1. Create the main orchestration function:
   ```typescript
   async function processChatMessage(message: string, options?: ChatOptions): Promise<ChatResponse> {
     // 1. Input guardrails
     // 2. If off-topic -> return redirect
     // 3. If prompt injection -> return safe response
     // 4. PII redact input (optional, but good practice)
     // 5. Retrieve context chunks
     // 6. Construct prompt
     // 7. Generate response via LLM
     // 8. Output guardrails
     // 9. Return final response
   }
   ```
2. Prompt Templating:
   - System message: "You are Ankit's AI professional assistant. You answer questions based only on the provided professional knowledge base. You are professional, concise, and truthful. If you don't know something from the knowledge base, say so and redirect to topics you can help with."
   - Context section: Include retrieved chunks with headers like "Relevant Information:" and maybe source hints.
   - User query: Clearly marked.
   - Instructions: "Answer based only on the context above. Be helpful and professional."
   - Consider adding a reminder about identity: "You are not Ankit; you are his AI assistant."
3. Retrieval:
   - Call retrieval function with the user message (after PII redaction maybe).
   - Request top-k chunks (e.g., 5).
   - Ensure metadata filtering is applied in retrieval.
4. Generation:
   - Use GeminiProvider with appropriate parameters (temperature 0.3-0.5 for balance of creativity and consistency).
   - If streaming is desired, return a stream; otherwise, wait for full response.
5. Output Guardrails:
   - Run PII detection on response.
   - Run output validation for professional tone and confidentiality.
   - If issues found, consider regenerating with stricter prompts or returning a safe fallback.
6. Error Handling:
   - Catch errors at each stage and return appropriate user-friendly messages.
   - Log errors for monitoring.
7. Streaming Support:
   - If using streaming, the orchestration function should return an async iterable.
   - Apply guardrails to each chunk or to the accumulated response (latter is simpler).
   - Consider buffering to avoid too many small updates.
8. Logging:
   - Log timings for retrieval and generation.
   - Log token usage from Gemini if available.
   - Log guardrail actions.
   - Log whether context was found.
9. Integration:
   - Create a Next.js API route (app/api/chat/route.ts) that receives POST requests with message and returns AI response.
   - The route will call the orchestration function.
   - Ensure proper error handling and status codes.
   - Protect the route with rate limiting if needed (see M13.10).
10. Connect Chat UI:
    - The chat UI's useChatAPI hook should call this API route.

## Acceptance Criteria
- Orchestration function successfully processes a user message through all stages.
- Input guardrails correctly handle off-topic and prompt-injection cases.
- Retrieval returns relevant chunks for professional queries.
- Prompt augmentation includes context and instructions properly.
- LLM generation produces a response based on the provided context.
- Output guardrails prevent PII leakage and maintain professional tone.
- Final response is returned to the user.
- Streaming works if implemented.
- Error handling provides meaningful fallback messages.
- API route responds correctly to chat requests.

## Testing Requirements
- Test orchestration with a simple professional question and verify response is grounded.
- Test off-topic query returns redirect without calling LLM.
- Test prompt-injection detection returns safe response.
- Test that PII in input is redacted (if applied).
- Test that response does not contain PII when it shouldn't.
- Test error handling for retrieval failures (e.g., DB down).
- Test streaming output if implemented.
- Verify API route returns correct JSON structure.
- Ensure no sensitive data leaks in error messages.

## Security / Privacy Considerations
- The RAG pipeline must never allow retrieval to bypass classification filtering (ensured in M13.05).
- Prompt construction should not include any confidential information (guarded by retrieval filtering).
- Output guardrails are critical to catch any potential leakage.
- Error messages should not reveal internal details like stack traces or API keys.
- Consider adding timeout guards to prevent hanging requests.
- Ensure the orchestration function does not leak the user's original PII in logs (if logging, redact first).

## Performance / Accessibility Considerations
- Retrieve only necessary chunks (limit k) to reduce context size.
- Construct prompts efficiently to avoid excessive string concatenation.
- Consider caching frequent queries if appropriate (though context may vary).
- Monitor token usage to manage costs and latency.
- Streaming improves perceived performance.
- Accessibility of the final response depends on UI, but the response itself should be plain text.

## Definition of Done
- Orchestration function integrates retrieval, generation, and guardrails.
- Input guardrails prevent processing of off-topic and maliciously prompted queries.
- Retrieval provides relevant context for professional questions.
- Prompt augmentation properly combines system instructions, context, and user query.
- LLM generation produces a coherent response based on the context.
- Output guardrails ensure response is safe and professional.
- Pipeline handles errors gracefully with user-friendly messages.
- API route exposes the orchestration function for the chat UI.
- Streaming option works if implemented.

## Related Requirements
- PRD §32: AI Knowledge Architecture
- PRD §34: Knowledge Classification
- PRD §37: Resume Phone Number Protection
- PRD §38: Prompt Injection Defense
- PRD §39: Off-Topic Conversation Handling
- PRD §40: Professional Conversation Redirect
- PRD §41: AI Tone
- PRD §42: AI Answer Quality
- PRD §43: AI Source Grounding
- PRD §44: Unknown Questions
- PRD §45: Conversation Memory
- PRD §46: Chat Analytics
- PRD §47: AI Feedback Loop
- PRD §48: AI Rate Limiting
- PRD §49: LLM Provider – Google Gemini API
- PRD §51: Backend / data store – Supabase PostgreSQL with pgvector
- PRD §52: Vector Search – pgvector recommended