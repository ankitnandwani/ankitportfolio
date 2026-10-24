# M13.06 — Create LLMProvider Abstraction and Implement GeminiProvider

## Objective

Create an abstraction layer for Large Language Model (LLM) providers and implement the Google Gemini provider for text generation, enabling the AI assistant to generate responses based on retrieved knowledge base context.

## Context

Following PRD §49 (LLM Provider: Google Gemini API) and the requirement to implement an `LLMProvider` interface, we need to define a contract for LLM operations (text generation, streaming, etc.) and provide a concrete implementation for Gemini. This abstraction allows for future flexibility to switch providers while keeping the core AI logic provider-agnostic.

## Requirements
- Define an `LLMProvider` interface with methods for text generation and streaming.
- Implement `GeminiProvider` that adheres to this interface using the Google Generative AI SDK.
- Support configuration via environment variables (GEMINI_API_KEY, GEMINI_MODEL).
- Handle API parameters: temperature, max tokens, topP, etc.
- Implement error handling with retries for transient failures.
- Support streaming responses for better UX in chat interface.
- Provide token usage tracking if available.
- Ensure the implementation works in server-side contexts (Next.js API routes or server actions).

## Scope
### In scope
- LLMProvider TypeScript interface defining generate() and stream() methods
- GeminiProvider class implementing the interface
- Environment variable validation for Gemini configuration
- Support for common generation parameters (temperature, maxTokens, etc.)
- Streaming implementation using Gemini's streaming capabilities
- Error handling and retry logic
- Basic token counting or usage reporting

### Out of scope
- Implementation of other LLM providers (OpenAI, Anthropic, etc.) – left for future
- Advanced features like function calling or tool use (unless required by PRD)
- Fine-tuning or custom model training
- Embedding generation (separate concern, handled in M13.04)

## Dependencies
- @google/generative-ai package (installed in M13.04)
- Valid GEMINI_API_KEY and GEMINI_MODEL environment variables
- Knowledge base retrieval system (M13.05) for RAG context

## Implementation Notes

Recorded when the task was implemented, so the differences between this
specification and the delivered code are not a surprise later.

- **The successor SDK is used.** `@google/generative-ai` is replaced by
  `@google/genai`, which M13.04 already installed because it is the package
  that can ask for the output dimension the vector column needs. Adding a
  second Google SDK would double the surface area for no gain. The module
  layout, the interface and the behaviour described below are unchanged.
- **The interface has `generate()` and `stream()` only.** PRD §49 sketches
  `embed()` and `moderate()` as well. Embedding is a separate concern that
  M13.04 already solved and moderation belongs to the guardrails of M13.07.
- **The provider is in `src/lib/llm/`, and `src/lib/gemini.ts` stays the
  embedding adapter.** The two share the error helpers, which moved to
  `src/lib/geminiErrors.ts` so that the provider can be imported without the
  environment, and the retry helper, which moved to `src/lib/retry.ts` so
  that the language model layer does not depend on the knowledge base.
- **The timeout is 60 seconds.** The configured model needs between 13 and
  57 seconds for a short question on the free tier, because it thinks before
  it answers. A stream restarts the timeout every time a piece arrives.
- **The live tests are opt in.** The free tier allows twenty generation
  requests a day, so the live tests only run when `LIVE_LLM_TESTS=1` is set.

## Files / Areas Expected To Change
- `src/lib/llm/provider.ts` (to be created) - LLMProvider interface
- `src/lib/llm/geminiProvider.ts` (to be created) - GeminiProvider implementation
- `src/lib/llm/index.ts` (to be created) - Export for easy import
- `src/lib/gemini.ts` (may be refactored to use the new provider structure)
- `package.json` (ensure @google/generative-ai is listed)

## Implementation Guidance
1. Define the LLMProvider interface in src/lib/llm/provider.ts:
   ```typescript
   interface LLMProvider {
     generate(prompt: string, options?: GenerationOptions): Promise<GenerationResult>;
     stream(prompt: string, options?: GenerationOptions): AsyncIterable<GenerationResult>;
   }
   ```
   Where GenerationOptions includes temperature, maxTokens, topP, stopSequences, etc.
   GenerationResult includes text, tokenUsage, finishReason, etc.
2. Create GeminiProvider class:
   - Initialize GoogleGenerativeAI with API key
   - Get generative model using GEMINI_MODEL (e.g., "gemini-1.5-pro" or "gemini-1.5-flash")
   - Implement generate() using model.generateContent()
   - Implement stream() using model.generateContentStream()
   - Map Gemini responses to the interface format
   - Add retry logic with exponential backoff for 5xx errors
   - Validate required environment variables in constructor
3. Create index.ts to export the provider and interface.
4. Consider creating a factory function to get the provider instance based on configuration.
5. Test both generate and stream methods with simple prompts.
6. Ensure streaming works correctly with Next.js (if used in API routes, need to handle readable streams).

## Acceptance Criteria
- LLMProvider interface is defined and exported.
- GeminiProvider successfully implements the interface.
- Environment variables are validated on initialization.
- Text generation works and returns coherent responses.
- Streaming generation works and yields tokens incrementally.
- Error handling provides meaningful messages for API failures.
- Token usage is reported if available from Gemini API.
- Provider can be imported and used without errors in server-side code.

## Testing Requirements
- Test text generation with a simple prompt ("What is 2+2?").
- Verify response contains expected answer.
- Test streaming to ensure chunks are received correctly.
- Test error handling with invalid API key (should throw clear error).
- Test that generation respects parameters like temperature (lower temperature = more deterministic).
- Ensure no memory leaks in streaming implementation.

## Security / Privacy Considerations
- Gemini API key must be kept secret and never exposed to the client.
- Error messages should not reveal the API key or other sensitive information.
- Consider implementing prompt injection detection at the provider level or in the orchestration layer.
- Ensure generated text does not leak confidential information from the model's training data (though this is more of a model-level concern).

## Performance / Accessibility Considerations
- Configure appropriate timeouts for API calls.
- Consider caching frequent responses if appropriate (though not recommended for dynamic context).
- Streaming improves perceived performance by showing incremental results.
- Monitor API usage and costs to stay within free tier limits.

## Definition of Done
- LLMProvider interface is defined in src/lib/llm/provider.ts.
- GeminiProvider class implements the interface in src/lib/llm/geminiProvider.ts.
- Environment variables (GEMINI_API_KEY, GEMINI_MODEL) are validated.
- Text generation works and returns a response.
- Streaming generation works and yields multiple chunks.
- Error handling is implemented for API failures.
- The provider can be used in a server-side Next.js context (e.g., API route).

## Related Requirements
- PRD §49: LLM Provider – Google Gemini API
- PRD §48: LLM Provider Interface (explicitly mentioned)
- PRD §32: AI Knowledge Architecture
- PRD §43: AI Source Grounding
- PRD §44: Unknown Questions
- PRD §45: Conversation Memory
- PRD §46: Chat Analytics
- PRD §47: AI Feedback Loop
- PRD §48: AI Rate Limiting