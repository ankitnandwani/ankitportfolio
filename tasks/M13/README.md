# Milestone M13 – AI Knowledge Base

## Execution Order

The tasks should be implemented in the following order due to dependencies:

```
M13.01
   ↓
M13.02
   ↓
M13.03
   ↓
M13.04
   ↓
M13.05
   ↓
M13.06
   ↓
M13.07
   ↓
M13.08
   ↓
M13.09
   ↓
M13.10
   ↓
M13.11
   ↓
M13.12
```

Some tasks can be worked on in parallel after their dependencies are met:
- M13.08 (Chat UI) can proceed in parallel with M13.04-M13.07 once M13.02 and M13.03 are done.
- M13.11 (Analytics/Feedback) can start after M13.09 is partially done.
- M13.12 (Testing) should be last, after all other tasks are complete.

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| Define document format (title, source_type, classification, content, version) | PRD §54, ROADMAP M13 | M13.01 | Covered |
| Implement chunking, embeddings, pgvector storage | PRD §32, ROADMAP M13 | M13.03, M13.04, M13.05 | Covered |
| Metadata filtering for retrieval | PRD §32, ROADMAP M13 | M13.05 | Covered |
| Factual question retrieves correct professional information | ROADMAP M13 Definition of Done | M13.12 | Covered |
| LLMProvider interface with Gemini implementation | PRD §48, §49 | M13.06 | Covered |
| Topic classification, PII detection, prompt-injection protection | PRD §35-40 | M13.07 | Covered |
| AI chat UI components (launcher, message bubbles, streaming) | PRD §16, §30 | M13.08 | Covered |
| RAG pipeline integration (retrieval + generation) | PRD §32, §43 | M13.09 | Covered |
| Response validation and rate limiting | PRD §42, §48 | M13.10 | Covered |
| Analytics, feedback loop, phone number redaction | PRD §37, §46, §47 | M13.11 | Covered |
| End-to-end testing and verification | Milestone completion criteria | M13.12 | Covered |
| Single Source of Truth (website content and chatbot knowledge) | PRD §57 | M13.01, M13.03 | Covered |
| Privacy Architecture (defense in depth) | PRD §35 | M13.07, M13.10, M13.11 | Covered |
| Phone number redaction in knowledge base | PRD §37 | M13.03, M13.11 | Covered |
| Free-tier focus (supabase, gemini, vercel) | PRD §83 | M13.02, M13.04, M13.06, M13.09, M13.10 | Covered |
| Accessibility target WCAG 2.2 AA | PRD §71 | M13.08 | Covered |
| Performance targets (LCP < 2.5s, CLS < 0.1, INP < 200ms) | PRD §74 | M13.08, M13.12 | Covered |
| NeoPOP-inspired design system | PRD §58-62 | M13.08 | Covered |
| AI Tone: professional, concise, confident | PRD §41 | M13.06, M13.09, M13.10 | Covered |
| AI Answer Quality: direct answer, evidence, transferable skills | PRD §42 | M13.09, M13.10 | Covered |
| Unknown Questions handling | PRD §44 | M13.09 | Covered |
| Conversation Memory (session-based) | PRD §45 | M13.09 | Covered |
| Chat Analytics (session_id, timestamp, question category, etc.) | PRD §46 | M13.11 | Covered |
| AI Feedback Loop (thumbs up/down, optional comment) | PRD §47 | M13.11 | Covered |
| AI Rate Limiting (20 messages/30min, 100 messages/day) | PRD §48 | M13.10 | Covered |
| LLM Provider: Google Gemini API | PRD §49 | M13.06 | Covered |
| Vector Search: pgvector recommended | PRD §52 | M13.04, M13.05 | Covered |
| No Public Admin CMS (content via version-controlled JSON/Markdown) | PRD §55 | M13.03 | Covered |
| Content Architecture (content/ directory structure) | PRD §56 | M13.03 | Covered |
| Design System: Custom NeoPOP-inspired | PRD §58-62 | M13.08 | Covered |
| Visual Language: Premium, Bold, Minimal, Dimensional | PRD §61 | M13.08 | Covered |
| Typography: strong display, readable body, mono/technical font | PRD §62 | M13.08 | Covered |
