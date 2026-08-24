# Architecture Overview

## High‑Level Diagram (textual)

```
Client (Browser)
│
├─ Next.js (React, TypeScript)
│   ├─ UI Layer (NeoPOP components, Tailwind CSS)
│   ├─ Server‑Side Routes (API routes, Server Actions)
│   └─ Edge Middleware (rate‑limiting, security headers)
│
├─ Supabase (PostgreSQL + pgvector)
│   ├─ Knowledge Documents & Chunks
│   └─ Application data (profile, experience, projects)
│
├─ Gemini LLM (via LLMProvider abstraction)
│   └─ Streams responses for the AI assistant
│
├─ GitHub API (read‑only)
│   └─ Curated repository metadata (caching layer)
│
├─ PostHog (analytics) – optional
│
├─ Sentry (monitoring) – optional
│
└─ Vercel (deployment) ← Cloudflare (DNS, CDN, edge security)
```

## Data Flow

1. **Static Content** – Markdown/JSON files under `content/` are compiled at build time and serve as the single source of truth for the website.
2. **Dynamic Knowledge Base** – Professional knowledge is stored in Supabase, chunked, embedded, and queried by Gemini for AI answers.
3. **AI Interaction** – The front‑end sends a user query to the `/api/ai` route, which:
   - Classifies the intent.
   - Retrieves relevant chunks via pgvector similarity search.
   - Calls Gemini with retrieved context.
   - Applies guardrails (PII detection, prompt‑injection protection) before returning the response.
4. **GitHub Integration** – A nightly job (future milestone) pulls public repository data, updates a curated cache in Supabase, and the front‑end reads from the cache.
5. **Analytics & Monitoring** – UI events fire to PostHog; errors are reported to Sentry.

## Key Principles Reflected from PRD

- **Single Source of Truth** – Content and knowledge live in version‑controlled files or Supabase, never duplicated.
- **Free‑Tier Friendly** – Only essential services are used; no Pinecone, no Kubernetes, no custom backend servers.
- **Privacy‑First** – Phone number redaction, PII detection, and guardrails are baked into the AI pipeline.
- **Performance & Accessibility** – Tailwind, lazy‑loading, and WCAG 2.2 AA compliance are built in from the start.

---

_This document supplements the roadmap and decisions, providing a quick reference for contributors and AI agents._
