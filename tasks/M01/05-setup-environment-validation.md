# M01.05 — Set up Environment Validation

## Objective

Provide a typed, fail‑fast validation layer for required environment variables using a schema library.

## Context

Milestone 1’s “Configure … environment validation” ensures the application fails early if critical configuration is missing. This aligns with the PRD’s privacy and security requirements (Section 36 – Privacy Architecture) and the AGENTS.md rule to avoid exposing secrets.

## Requirements

1. Create a file `src/lib/env.ts` that:
   - Imports `z` from `zod` (add `zod` as a dev dependency).
   - Defines a schema covering all variables listed in the PRD’s “Environment variable templates” (see TODO.md for the list, reproduced below):
     - `NEXT_PUBLIC_SITE_URL`
     - `GEMINI_API_KEY`
     - `GEMINI_MODEL`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `GITHUB_TOKEN`
     - `POSTHOG_KEY`
     - `POSTHOG_HOST`
     - `SENTRY_DSN`
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - Parses `process.env` against the schema and exports a typed `env` object.
   - Throws a clear error message mentioning the missing or invalid variable(s).
2. Add a `.env.example` file at the repository root containing placeholder entries for the variables above.
3. Ensure `.env*` is listed in `.gitignore` (already covered by the `.gitignore` from M01.01).
4. Update `package.json` to include a script `env:check` that runs `node -e "require('./src/lib/env')"` to validate the environment.
5. Commit the new files.

## Scope

### In scope

- Adding `zod` as a dependency.
- Creating `src/lib/env.ts` and `.env.example`.
- Adding the `env:check` npm script.

### Out of scope

- Loading values from external secret stores (e.g., Vault). That will be addressed in later milestones.
- Providing actual secret values.

## Dependencies

- **M01.02** – Project scaffold must exist.
- **M01.03** – TypeScript must be configured (the `env.ts` file is TypeScript).

## Files / Areas Expected To Change

- `src/lib/env.ts`
- `.env.example`
- `package.json`

## Implementation Guidance

- Install `zod` as a regular dependency (`npm install zod`).
- Keep the schema flat; use `z.string().nonempty()` for each variable.
- The exported `env` constant should be typed (`typeof schema._output`).
- The `env:check` script should exit with a non‑zero code on validation failure.

## Acceptance Criteria

- [ ] `src/lib/env.ts` exists and exports a validated `env` object.
- [ ] `.env.example` contains all required keys with placeholder values.
- [ ] `npm run env:check` exits with code 0 when the environment variables are set (you can test by sourcing the example file).
- [ ] Missing or invalid variables produce a clear error message.
- [ ] The changes are committed.

## Testing Requirements

1. Copy `.env.example` to `.env.local` and set dummy values.
2. Run `npm run env:check` – should succeed.
3. Remove one variable from `.env.local` and re‑run – should fail with an informative error.

## Security / Privacy Considerations

- Ensure that the real `.env` is never committed; `.gitignore` must protect it.
- Validation errors must not leak secret values; only list missing variable names.

## Performance / Accessibility Considerations

- Validation runs only at startup; negligible performance impact.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- No unrelated files were changed.

## Related Requirements

- **PRD** – Section 36 (Privacy Architecture) – environment validation safeguards PII.
- **ROADMAP** – Milestone 1 (Architecture) – “Configure … environment validation”.
- **AGENTS.md** – Rules: “Do not expose private information”, “Run lint and typecheck before completing a milestone.”
