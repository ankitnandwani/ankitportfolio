# Project State

## Current Phase
- M01 – Architecture

## Completed
- Project documentation
- Roadmap
- M01 task specification
- M01.01 – Initialize Repository
- M01.02 – Set up Next.js framework

## Next Step
- Begin implementation of M01.03 – Configure TypeScript

## Important Technical Information
- **Preferred stack (from PRD):**
  - Frontend: Next.js, React, TypeScript.
  - Design system: NeoPOP‑inspired custom design system.
  - Backend / data: Supabase PostgreSQL with pgvector for vector search.
  - LLM provider: Google Gemini (via `LLMProvider` abstraction).
  - Hosting / CDN: Vercel for the frontend, Cloudflare for DNS and edge caching.
  - Analytics: PostHog (free tier).
  - Monitoring: Sentry (optional, free tier).

- **Free‑tier constraint:** Aim to stay within free limits of all services.
- **Privacy rules:** Phone number must never be exposed on the site or via the AI assistant; PII must be redacted.
- **Security rules (from AGENTS.md):** Do not expose private information, follow guardrails, and keep all data handling compliant with the PRD.

---

*This file will be updated after each milestone as required.*
