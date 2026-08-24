# Decisions

## Architectural & Technology Decisions (already made)

- **Frontend framework:** Next.js (React) with TypeScript – defined in PRD section _Recommended Technical Architecture_.
- **Design system:** Custom NeoPOP‑inspired design system, built on top of NeoPOP components.
- **Styling:** Tailwind CSS with custom design tokens.
- **Animation library:** Framer Motion / Motion as specified in PRD.
- **Backend / data store:** Supabase PostgreSQL with pgvector for vector search (PRD §51). No Pinecone initially.
- **LLM provider:** Google Gemini API (PRD §49). Wrapped behind an `LLMProvider` abstraction.
- **Authentication (admin‑only):** Clerk **or** Supabase Auth – decision pending (see _Open Decisions_).
- **Hosting:** Vercel for the Next.js app, Cloudflare for DNS and edge caching (PRD §82).
- **Version control:** GitHub repository (PRD §102).
- **CI/CD:** GitHub Actions (PRD §104 – unit, integration, e2e tests).
- **Analytics:** PostHog (free tier) for event tracking (PRD §78).
- **Monitoring:** Sentry (optional, free tier) for error tracking (PRD §79).
- **Caching / rate limiting:** Upstash Redis **optional** – not required for MVP (PRD §53 – optional).
- **No CMS:** Content managed via version‑controlled JSON/Markdown files (PRD §55).
- **No Kubernetes / microservices:** Avoided per PRD _Non‑Goals_ and _Simplification Rule_.
- **Free‑tier focus:** All services chosen to stay within free tier limits (PRD §83).
- **Privacy & security:** Phone number redaction, PII detection, prompt‑injection guardrails, output validation (PRD §§36‑40, §80).
- **Accessibility target:** WCAG 2.2 AA (PRD §71).
- **Performance targets:** LCP < 2.5 s, CLS < 0.1, INP < 200 ms (PRD §74).

## Open Decisions (awaiting clarification)

1. **Authentication provider** – Clerk vs Supabase Auth for admin‑only functionality.
2. **Analytics platform** – PostHog is preferred; confirm if an alternative (e.g., Plausible) is acceptable.
3. **Exact numeric values** for the Professional Snapshot metrics (e.g., years of experience, number of domains) – need verification against the latest resume.
4. **Rate‑limit thresholds** for AI chat and site requests – values not concretely defined in PRD.
5. **Design token palette** – base colors and typography scales are outlined but final values (hex codes, font sizes) need sign‑off.
6. **Upstash Redis usage** – optional for caching; decide if it should be provisioned now or later.
7. **Domain DNS configuration details** – Cloudflare zone settings and any required sub‑domains need confirmation.

---

_All decisions listed are derived directly from the PRD; no new decisions have been invented._
