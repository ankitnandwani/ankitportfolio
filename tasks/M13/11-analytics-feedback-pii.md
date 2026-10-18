# M13.11 — Add Analytics, Feedback Loop, and Phone Number Redaction

## Objective

Implement analytics for tracking AI chat usage (privacy-compliant), a feedback loop for users to rate responses, and ensure phone number redaction throughout the knowledge base ingestion pipeline to protect sensitive information as mandated by PRD §37.

## Context

Following PRD §46 (Chat Analytics), PRD §47 (AI Feedback Loop), and PRD §37 (Resume Phone Number Protection), we need to add telemetry to understand how the AI assistant is being used while preserving user privacy, implement a mechanism for users to provide feedback on response quality, and double-check that phone numbers are properly redacted during knowledge base ingestion to prevent any leakage into the AI's knowledge base. This task combines analytics, user feedback, and a final verification of PII protection.

## Requirements
- Implement privacy-conscious analytics for AI chat interactions:
  - Track session ID (anonymous, not tied to personal data)
  - Timestamp
  - Question category (topic classification result)
  - Response latency
  - Retrieval success (whether relevant chunks were found)
  - Answer confidence (if available from LLM or heuristics)
  - Feedback rating (if provided)
  - CTA clicked (if any, e.g., links to resume or projects)
  - Ensure no PII is collected (IP address may be hashed if used for sessioning)
- Implement feedback UI:
  - Thumbs up/down buttons after each AI response
  - Optional text feedback for negative ratings
  - Submit feedback to analytics endpoint
  - Visual feedback on selection
- Ensure phone number redaction is applied during knowledge base ingestion:
  - Verify that the ingestion pipeline (M13.03) properly detects and redacts phone numbers.
  - Add additional safeguards to catch any phone number formats that might have been missed.
  - Log any redactions performed for monitoring.
  - Consider running a validation scan on existing knowledge base to confirm no phone numbers remain.
- Integrate analytics and feedback with the chat API route and UI.
- Ensure analytics endpoints are secure and do not expose sensitive data.
- Respect user privacy: do not track personal information beyond what's necessary for service improvement.

## Scope
### In scope
- Analytics data structure and collection points
- Anonymous session ID generation (e.g., random UUID per session or hashed IP + user agent)
- Event tracking for: message sent, response received, feedback given
- Feedback UI components: thumbs up/down, optional comment field
- Feedback submission endpoint
- Phone number redaction verification in ingestion pipeline
- Potential knowledge base scan for remaining PII
- Logging of redactions during ingestion
- Configuration of what to track (feature flags)
- Secure analytics endpoints (if custom) or integration with PostHog

### Out of scope
- Persistent user profiles or cross-session tracking
- Detailed demographic information
- Real-time dashboards (relying on PostHog's built-in analytics)
- A/B testing or experimentation framework
- Complex segmentation beyond basic event filtering
- Phone number detection in real-time chat (handled by guardrails, but we focus on knowledge base here)

## Dependencies
- PostHog configured (if using) or decision to use custom analytics
- Knowledge base ingestion pipeline (M13.03)
- Guardrails for PII detection (M13.07)
- Chat API route and UI (M13.09, M13.08)
- Environment variables for PostHog keys

## Files / Areas Expected To Change
- `src/lib/analytics.ts` (to be created or updated) - Analytics tracking functions
- `src/lib/analytics/eventTypes.ts` (to be created) - Definitions of tracked events
- `src/components/aiChat/FeedbackButton.tsx` (to be created) - Thumbs up/down with optional comment
- `src/lib/knowledge/pii.ts` (may be updated from M13.07 to enhance phone number detection)
- `src/lib/knowledge/ingestion.ts` (may be updated to ensure phone number redaction)
- `scripts/scanKnowledgeBase.ts` (to be created) - Optional script to scan for PII in knowledge base
- `app/api/feedback/route.ts` (to be created) - Endpoint for submitting feedback
- `app/api/analytics/route.ts` (to be created) - If custom analytics endpoint needed
- Updates to chat UI to include feedback buttons after AI messages
- Updates to orchestration or API route to call analytics tracking

## Implementation Guidance
1. Analytics:
   - Decide whether to use PostHog (configured via environment variables) or a custom simple logging solution.
   - If using PostHog, initialize with POSTHOG_KEY and POSTHOG_HOST from env.
   - Create wrapper functions: trackChatSessionStart, trackMessageSent, trackResponseReceived, trackFeedbackGiven.
   - Ensure all properties are privacy-safe: no raw IP, no user identifiers, no PII.
   - Example session ID: generate a random UUID on first message and store in client-side session (or derive from hashed IP + user agent with salt).
   - Track question category from topic classification (output of guardrails).
   - Track retrieval success: boolean if chunks were found above a threshold similarity.
   - Track latency: time from message send to response receipt.
   - Track answer confidence: could be from LLM logprobs or heuristic (e.g., based on retrieval similarity scores).
   - Track feedback: thumbs up/down and optional comment.
   - Ensure PostHog is configured not to collect IP addresses or to hash them.
2. Feedback UI:
   - Create a component that appears below each AI message.
   - Show thumbs up and down buttons.
   - On selection, highlight chosen button and optionally show a text area for comments.
   - On submit, send feedback to analytics endpoint and disable further feedback for that message.
   - Use optimistic UI updates for responsiveness.
3. Phone Number Redaction Verification:
   - Review the PII detection function in src/lib/knowledge/pii.ts (or create it if not exists).
   - Ensure it covers various international phone number formats (E.164, national formats with spaces/dashes).
   - Add unit tests for different formats.
   - In ingestion pipeline, apply this redaction to all content before chunking and storing.
   - After ingestion, optionally run a scan script that queries the knowledge base for any patterns resembling phone numbers and logs warnings.
   - Consider adding a database constraint or trigger to prevent phone numbers from being inserted (though application-level check is primary).
4. Integration:
   - In the chat API route, after receiving user message, call analytics to track message sent (with session ID, category, etc.).
   - After receiving AI response, track response received (latency, retrieval success, etc.).
   - When feedback is submitted via UI, call feedback endpoint to track feedback given.
   - Ensure analytics calls are fire-and-forget and do not delay response significantly.
5. Environment:
   - Ensure POSTHOG_KEY and POSTHOG_HOST are validated if using PostHog.
   - Consider making analytics optional if keys are not provided.

## Acceptance Criteria
- Analytics tracking initializes successfully with PostHog (if configured) or logs to console.
- Session ID is generated and maintained per user session.
- Message sent and response received events are tracked with appropriate privacy-safe properties.
- Feedback UI appears after AI messages and allows submitting thumbs up/down.
- Feedback submission works and is recorded.
- Phone number redaction is applied during knowledge base ingestion.
- No phone numbers are found in stored knowledge chunks (verified via scan or manual inspection).
- Redactions are logged during ingestion for monitoring.
- Analytics does not collect PII or personal identifiers beyond anonymous session ID.

## Testing Requirements
- Test analytics initialization and event tracking.
- Verify session ID generation is consistent during a session.
- Test feedback UI interaction and submission.
- Test phone number redaction with various formats (US, UK, India, etc.).
- Ensure redaction does not affect non-phone-number numbers (e.g., years, counts).
- Run a scan of knowledge base chunks and confirm no phone number patterns remain.
- Check that analytics events do not contain raw IP addresses or other PII.
- If using PostHog, verify that events appear in PostHog dashboard (test mode).
- Ensure analytics errors do not break the chat functionality (should be caught and logged).

## Security / Privacy Considerations
- Analytics must not collect personal data: no names, emails, phone numbers, etc.
- Session ID should not be reversible to personal information.
- IP address, if used, should be hashed with a secret salt before storage (or not used at all).
- Feedback comments should be monitored for PII (users might type phone numbers in feedback); consider applying PII redaction to feedback comments as well.
- Ensure that analytics endpoints are not vulnerable to injection or abuse.
- Do not track sensitive information like the exact query text if it could contain PII (though we redact in knowledge base, the query itself might have PII; we should consider redacting PII in queries before analytics or not storing query text at all).
- For simplicity, we can track only the category of the question, not the exact text.

## Performance / Accessibility Considerations
- Analytics tracking should be asynchronous and non-blocking.
- Feedback UI should be accessible: button labels, aria-pressed states, keyboard navigable.
- Phone number redaction during ingestion should not significantly slow down the pipeline.
- Scan script can be run periodically or during deployment.

## Definition of Done
- Analytics system is tracking chat sessions with privacy-safe properties.
- Feedback UI is present after AI messages and allows users to rate responses.
- Feedback submission works and is recorded.
- Phone number redaction is applied during knowledge base ingestion.
- Verification shows no phone numbers remain in stored knowledge chunks.
- Redactions are logged during ingestion for monitoring.
- Analytics does not collect PII or personal identifiers.
- System remains responsive and usable.

## Related Requirements
- PRD §37: Resume Phone Number Protection
- PRD §46: Chat Analytics
- PRD §47: AI Feedback Loop
- PRD §65: No Public Admin CMS (analytics uses simple tracking)
- PRD §83: Free‑tier focus (PostHog free tier)