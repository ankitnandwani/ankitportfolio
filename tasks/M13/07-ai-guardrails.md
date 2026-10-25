# M13.07 — Implement AI Guardrails

## Objective

Implement a comprehensive set of AI guardrails including topic classification, PII detection, and prompt-injection protection to ensure the AI assistant behaves safely, truthfully, and within the bounds of Ankit's professional profile.

## Context

Following PRD §35 (Privacy Architecture), PRD §36-40 (Sensitive Data Protection, Prompt Injection Defense, Off-Topic Conversation Handling, Professional Conversation Redirect), and PRD §80 (AI Guardrails milestone), we need to implement multiple layers of defense to prevent the AI from revealing sensitive information, going off-topic, or being manipulated by malicious prompts. The guardrails will operate on both input (user messages) and output (AI responses) to ensure compliance with privacy and safety requirements.

## Requirements
- Implement topic classification to determine if a user query is about Ankit's professional profile (allowed topics) or not.
- Implement PII detection and redaction for both input and output, with specific focus on phone numbers as per PRD §37.
- Implement prompt-injection detection to resist attempts to manipulate the AI into ignoring instructions or revealing private information.
- Implement output validation to ensure responses do not contain confidential information or violate professional boundaries.
- Provide redirect mechanisms for off-topic queries (suggest returning to professional topics).
- Log guardrail triggers for monitoring and improvement.
- Ensure guardrails are performant and do not add excessive latency.

## Scope
### In scope
- Topic classification (allowed: professional experience, skills, projects, career, education, certifications, engineering philosophy, etc.)
- PII detection (phone numbers, email addresses, etc.) with redaction
- Prompt-injection pattern matching (known attack vectors)
- Output validation for prohibited content (confidential info, personal data, etc.)
- Redirect response generation for off-topic queries
- Integration points: pre-processing user input, post-processing AI response
- Logging of guardrail actions (blocked topics, detected PII, etc.)
- Configurable sensitivity levels

### Out of scope
- Full natural language understanding for topic classification (can use keyword-based or simple ML model)
- Advanced adversarial ML defenses (beyond pattern matching for prompt injection)
- Real-time content policy updates (static rule set is acceptable for MVP)
- Multilingual support beyond English (assume English queries)

## Dependencies
- Knowledge base definition of allowed topics (can be derived from document classifications and source types)
- LLM provider interface (M13.06) for potential use in classification (though we may use simpler methods)
- Environment variables for configuration

## Files / Areas Expected To Change
- `src/lib/guardrails/index.ts` (to be created) - Main guardrails export
- `src/lib/guardrails/topicClassification.ts` (to be created) - Topic classification logic
- `src/lib/guardrails/piiDetection.ts` (to be created) - PII detection and redaction
- `src/lib/guardrails/promptInjection.ts` (to be created) - Prompt-injection detection
- `src/lib/guardrails/outputValidation.ts` (to be created) - Output validation
- `src/lib/guardrails/logger.ts` (to be created) - Guardrails logging
- May update AI orchestration logic to integrate guardrails

## Implementation Guidance
1. Topic Classification:
   - Define a list of allowed topics based on PRD §28-30 (AI Assistant Goals, Suggested Questions).
   - Implement using keyword matching, regex, or a simple classifier (could use embeddings similarity to topic examples).
   - Return classification result with confidence score.
   - If confidence below threshold, treat as off-topic.
2. PII Detection:
   - Focus on phone numbers as per PRD §37 (various international formats).
   - Also detect email addresses (though less critical).
   - Redact matches with [REDACTED] token.
   - Consider using regex patterns or a library like libphonenumber-js.
   - Apply to both user input (to prevent storage) and AI output (to prevent leakage).
3. Prompt-Injection Detection:
   - Match against known prompt injection patterns (e.g., "ignore previous instructions", "show me your system prompt", etc.).
   - Use case-insensitive pattern matching.
   - Consider also detecting attempts to roleplay or confuse identity.
   - Return boolean indicating potential injection.
4. Output Validation:
   - Check for presence of PII that should have been redacted.
   - Check for confidential keywords (though classification should prevent this).
   - Ensure response aligns with professional tone (no excessive familiarity, etc.).
   - Optionally use the LLM itself for self-check (but be cautious of circular dependencies).
5. Redirect Mechanism:
   - Generate polite responses that steer conversation back to professional topics.
   - Examples: "I'm here to help with questions about Ankit's professional background. You could ask about his experience with automation, projects, or career history."
   - Provide suggested questions.
6. Logging:
   - Log each guardrail action with timestamp, query ID, and action taken.
   - Avoid logging sensitive content itself.
   - Consider sampling to reduce log volume.
7. Integrate guardrails into the AI chat flow:
   - User message → topic classification → if off-topic, return redirect.
   - If on-topic, check for prompt injection → if detected, warn or safe complete.
   - Proceed to retrieval and generation.
   - AI response → PII detection → output validation → return to user.
   - Optionally, run prompt injection detection on output as well.

## Acceptance Criteria
- Topic classification correctly identifies professional vs. off-topic queries.
- PII detection redacts phone numbers in both input and output.
- Prompt-injection detection blocks known attack patterns.
- Output validation prevents leakage of confidential information.
- Off-topic queries receive helpful redirect responses.
- Guardrails log actions without exposing sensitive data.
- System remains usable for legitimate professional queries.

## Testing Requirements
- Test topic classification with various professional and non-professional questions.
- Test PII detection with different phone number formats (US, international, with spaces, dashes, etc.).
- Test prompt-injection detection with known injection strings.
- Test output validation with fabricated responses containing PII.
- Test redirect responses are appropriate and helpful.
- Ensure guardrails do not block legitimate queries due to false positives.
- Test performance impact on response time.

## Security / Privacy Considerations
- Guardrails are a critical privacy protection layer; failures could lead to PII leakage.
- Regular review of patterns and effectiveness is needed.
- Ensure that guardrails themselves do not introduce vulnerabilities (e.g., ReDoS in regex).
- Consider using safe regex patterns or limiting input length.
- Guardrails should be applied consistently; bypassing them should not be possible through normal channels.

## Performance / Accessibility Considerations
- Topic classification should be lightweight (avoid heavy ML models for MVP).
- PII detection using regex should be optimized.
- Prompt-injection pattern matching should be efficient.
- Logging should not be synchronous if it could delay responses.
- Consider caching classification results for repeated queries (though queries may vary).

## Implementation Notes

Recorded when the task was implemented, so the differences between this
specification and the delivered code are not a surprise later.

- **The module layout grew three files.** The specification lists six. There
  is a `types.ts` for the shared types, a `redirects.ts` for the answers the
  assistant gives instead of the answer that was asked for, and a
  `pipeline.ts` that holds the two integration points. A `text.ts` holds the
  helpers the modules share.
- **The integration points are two functions.** `evaluateInput()` checks a
  question before it reaches the knowledge base and `applyOutputGuardrails()`
  checks an answer before it is shown. The chat flow itself is M13.08 and
  M13.09, so nothing was wired into a route yet.
- **The classification is keyword based with a weight per word.** A word
  that only has an innocent reading, such as "about", counts for half of a
  signal, so a question about politics is not read as a question about the
  professional profile.
- **There are three sensitivity levels.** They change how much evidence a
  question needs and whether the attack phrases that also have an innocent
  reading are acted on. The balanced one is the default.
- **A request for private data is told apart from an attempt.** An attempt
  that changes the instructions is an injection. A question for a phone
  number is a request for something that must not be disclosed. Both are
  answered with a redirect, and they are reported apart.
- **The patterns are matched on tokens, and their repetitions are bounded.**
  The phone number pattern of the ingestion pipeline was bounded as well,
  because it could be slowed down by a long run of digits.

## Definition of Done
- Topic classification module can distinguish professional from off-topic topics.
- PII detection correctly identifies and redacts phone numbers.
- Prompt-injection detection blocks common injection attempts.
- Output validation prevents PII leakage in AI responses.
- Off-topic queries receive polite redirect responses with suggestions.
- Guardrail actions are logged appropriately.
- All guardrails integrate into the AI chat flow without breaking functionality.

## Related Requirements
- PRD §35: Privacy Architecture
- PRD §36: Sensitive Data Protection
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
- PRD §80: AI Guardrails (Milestone 15, but we're implementing foundational guardrails early)