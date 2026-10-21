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

## Decisions (M13 – AI Knowledge Base)

- **Testing framework:** Node's built-in test runner (`node --test`) with `node:assert`. No test framework dependency is added. Node 24+ (the CI runner's `lts/*`) strips TypeScript types natively, so `.ts` sources run as-is. Test files use the `.test.mts` extension so they are always ESM, and `npm test` passes `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` to keep the output clean without adding `"type": "module"` to `package.json` (which would break the CommonJS `src/lib/env.js` used by `npm run env:check`). Playwright remains the choice for end-to-end tests per PRD §104.
- **Test placement and isolation:** Unit tests sit next to the module they cover and are picked up by the runner's default discovery glob. Modules that must be free of side effects to be testable are kept import-free — `src/lib/knowledge/chunking.ts`, `pii.ts` and `metadata.ts` have no imports at all, and `parseGitHubUrl` was moved into its own `src/lib/githubUrl.ts` for the same reason.
- **Environment validation during tests:** `src/lib/env.ts` validates every server-side variable at module evaluation time and throws when one is missing. Tests that import a module depending on it set placeholder values before a dynamic import, so the CI runner needs no `.env` file and production validation stays strict.
- **Typed Supabase insert payloads:** Writes use `KnowledgeDocumentInsert` / `KnowledgeChunkInsert` (the row types minus the database-generated `id`, `created_at` and `updated_at` columns) instead of casting partial objects to the full row type. The pipeline previously inserted a fixed all-zeros UUID as the chunk `id`; because `id` is the primary key, the second chunk of the first document would have collided. Letting the database generate `id` and `created_at` is both correct and type-safe.
- **Ingestion functions are typed against the source data models:** Every `process*` function accepts the exported interface from its `src/data/*` module (e.g. `Project`, `CertificationEntry`) rather than `any`. Field-name drift between the pipeline and a data model now fails at compile time instead of silently producing empty content in the knowledge base.
- **GitHub profile ingestion deferred:** `src/data/github.ts` contains repository types only — there is no GitHub *profile* data source to ingest. The unreachable placeholder processor was removed rather than inventing a profile data model. Live repository metadata is already surfaced by the M09 GitHub service on the project cards.
- **ESLint flat config owns ignore patterns:** `.eslintignore` was removed and its entries moved into `globalIgnores()` in `eslint.config.mjs`. ESLint 9 no longer supports `.eslintignore` and warns on every lint run.

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
