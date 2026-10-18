# M13.12 — End-to-End Testing and Verification

## Objective

Perform end-to-end testing of the AI knowledge base and chat assistant system to verify that factual questions about Ankit's professional profile are answered correctly, all components integrate properly, and the system meets the Definition of Done for Milestone 13.

## Context

After implementing all the components of the AI knowledge base (document ingestion, embeddings, retrieval, LLM generation, guardrails, UI, analytics, etc.), we need to validate that the entire pipeline works together to fulfill the milestone goal: "Factual question retrieves correct professional information." Following PRD §32 (AI Knowledge Architecture) and the Definition of Done from the roadmap, we will test with a variety of questions covering different aspects of Ankit's profile to ensure the system is accurate, safe, and reliable.

## Context
This task involves creating test plans, executing tests, verifying fixes, and confirming that all acceptance criteria from previous tasks are met. We will test the system as a whole, not just individual components.

## Requirements
- Define a set of factual questions covering various aspects of Ankit's professional background:
  - Automation experience (Selenium, Playwright, API automation)
  - Backend technologies (Java, REST APIs, Kafka)
  - Cloud and CI/CD (AWS, Azure, GitHub Actions, Docker)
  - Projects (CCGeek, projects, achievements)
  - Career timeline (roles, companies, dates)
  - Skills and certifications
  - Engineering philosophy
  - Finance/trading lab relevance
- For each question, verify that the AI assistant's response is:
  - Correct: based on the knowledge base and factually accurate.
  - Relevant: directly addresses the question.
  - Grounded: cites or implies information from the knowledge base (though explicit citation not required).
  - Safe: does not reveal PII, confidential information, or go off-topic.
  - Professional: maintains appropriate tone.
- Test edge cases:
  - Off-topic questions should receive redirect responses.
  - Prompt-injection attempts should be handled safely.
  - Questions with no clear answer in knowledge base should trigger appropriate fallback.
  - Rate limiting should function under excessive load.
- Verify that all integrated components function:
  - Document ingestion has processed knowledge sources.
  - Embeddings are generated and stored.
  - Retrieval returns relevant chunks.
  - LLM generation works with appropriate parameters.
  - Guardrails are active.
  - UI components work correctly.
  - Analytics and feedback are collecting data.
- Ensure performance targets are met (latency acceptable for MVP).
- Document any issues found and verify they are resolved before considering the milestone complete.

## Scope
### In scope
- Test plan creation for functional, safety, and performance aspects
- Execution of tests via manual interaction or automated scripts
- Verification of correct answers from knowledge base
- Testing of guardrails and safety features
- Performance testing (response time under normal load)
- Validation of analytics and feedback collection
- Confirmation that rate limiting works
- Final verification that Milestone 13 Definition of Done is met

### Out of scope
- Load testing beyond reasonable MVP expectations
- Security penetration testing (covered in separate milestones)
- Cross-browser compatibility testing beyond Chrome/Firefox/Safari basics
- Accessibility audits beyond basic manual checks (though we should verify)
- Localization or internationalization testing

## Dependencies
- All previous M13 tasks implemented (M13.01 through M13.11)
- Development environment set up (next dev runs)
- Environment variables configured (Supabase, Gemini, etc.)
- Knowledge base ingested with sample data
- Chat UI accessible

## Files / Areas Expected To Change
- `tests/` directory (to be created) - End-to-end test scripts
- `test-plan.md` (to be created) - Detailed test plan
- May update implementation files if bugs are found during testing
- `scripts/verifyKnowledgeBase.ts` (to be created) - Script to verify knowledge base contents
- `scripts/testChatFlow.ts` (to be created) - Automated chat interaction test
- Update `PROJECT_STATE.md` after verification (done outside this task)
- Update `TODO.md` after verification (done outside this task)

## Implementation Guidance
1. Create a test plan document:
   - List of test cases with ID, description, expected outcome, pass/fail criteria.
   - Categories: Functional correctness, Safety/guardrails, Edge cases, Performance, Integration.
   - Example test cases:
     - FC001: Question "What automation tools has Ankit worked with?" should mention Selenium, Playwright, API automation frameworks.
     - FC002: Question "Tell me about his experience with AWS and Azure." should reference cloud platforms.
     - SC001: Query containing "ignore previous instructions" should not result in ignoring instructions.
     - SC002: Query asking for phone number should be redirected or safe completed.
     - EC001: Empty query should return helpful prompt.
     - EC002: Very long query should be handled gracefully.
     - PC001: Response time should be under 5 seconds for 90% of tests (adjust based on expectations).
     - IA001: Analytics should increment session count.
     - IA002: Feedback buttons should be submitable.
2. Execute tests manually:
   - Start the development server: `npm run dev`
   - Open the homepage and interact with the AI chat.
   - Run through each test case, marking pass/fail.
   - For automated tests, consider using playwright or similar, but manual is acceptable for MVP.
3. If any test fails:
   - Document the issue.
   - Fix the root cause in the relevant implementation file.
   - Retest the specific test case.
   - Ensure fix doesn't break other tests.
4. Verify knowledge base integrity:
   - Run a script to check that documents and chunks exist with proper metadata.
   - Verify that embeddings are present for chunks.
   - Check that classification is set correctly.
   - Confirm that no PII remains in chunk content.
5. Test performance:
   - Measure time from sending message to receiving response.
   - Test under normal load (not thousands of requests).
   - Ensure latency is acceptable for MVP (aim for <3-5 seconds).
6. Test rate limiting:
   - Send requests rapidly to verify limit is enforced.
   - Verify that after waiting, requests work again.
7. Test analytics:
   - Check that session ID is generated.
   - Verify that message and response events are logged.
   - Test feedback submission.
8. After all tests pass, consider the milestone complete.

## Acceptance Criteria
- All functional test cases pass: AI answers factual questions correctly based on knowledge base.
- All safety test cases pass: Guardrails handle off-topic, prompt-injection, and PII requests appropriately.
- All edge case test cases pass: System handles malformed or unusual inputs gracefully.
- Performance is acceptable: average response time under target threshold (to be defined based on testing).
- Analytics and feedback systems are functioning and collecting data.
- Rate limiting works as configured.
- Knowledge base is properly populated with embedded chunks.
- No critical bugs remain that would affect core functionality.
- Milestone 13 Definition of Done is satisfied: "Factual question retrieves correct professional information."

## Testing Requirements
- Functional testing with at least 10 diverse questions covering different knowledge areas.
- Safety testing with at least 5 off-topic queries and 5 prompt-injection attempts.
- Edge case testing with empty input, very long input, gibberish, etc.
- Performance testing with at least 20 requests to measure average latency.
- Analytics verification: check that tracking works.
- Feedback verification: test submission.
- Rate limiting verification: test limits are enforced.
- Knowledge base verification: sample check of documents, chunks, embeddings, classifications.

## Security / Privacy Considerations
- Testing should not expose any sensitive information; use only publicly known professional information.
- When testing PII detection, use fake phone numbers (e.g., 555-123-4567) not real ones.
- Ensure that test data does not contain actual PII from Ankit's profile.
- Do not store test conversations that could contain PII if testers accidentally input real information.
- Clear logs after testing if they contain any sensitive input.

## Performance / Accessibility Considerations
- Performance testing should be done on a deployed instance or local dev server with production-like data.
- Consider testing both desktop and mobile modes.
- Verify that the chat UI remains accessible during testing (keyboard navigation, screen reader friendly if possible).
- Ensure that performance optimizations (like indexing) are in place.

## Definition of Done
- All test cases in the test plan pass.
- The AI assistant correctly answers factual questions about Ankit's professional profile.
- Guardrails prevent inappropriate responses and protect privacy.
- The system integrates all components smoothly.
- Performance meets acceptable thresholds for MVP.
- Analytics and feedback are operational.
- Rate limiting functions to prevent abuse.
- No critical defects remain.
- Milestone 13 is ready for review and potential completion.

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
- PRD §54: Database Schema
- PRD §55: No Public Admin CMS
- PRD §57: Single Source of Truth
- PRD §61: Visual Language
- PRD §62: Typography
- PRD §71: Accessibility target – WCAG 2.2 AA
- PRD §74: Performance targets
- PRD §80: AI Guardrails
- PRD §82: Hosting and UI implementation details