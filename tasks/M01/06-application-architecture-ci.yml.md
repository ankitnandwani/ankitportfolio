# M01.06 — Application Architecture & CI Workflow

## Objective

Establish a clear folder hierarchy for the codebase and add a GitHub Actions CI pipeline that enforces linting, type‑checking, and testing on every push.

## Context

Milestone 1 requires “Create initial application architecture (folders, CI workflow).” A well‑structured directory layout facilitates maintainability (PRD §56 – Content Architecture) and the CI pipeline provides early feedback, satisfying the quality goals in the PRD and AGENTS rules.

## Requirements

1. **Folder structure** – Create the following top‑level directories (add a short `README.md` in each with a brief description):
   - `src/` – Primary source code (components, pages, lib, etc.).
   - `src/components/` – Re‑usable UI components.
   - `src/lib/` – Utility functions, API clients, helpers (e.g., the `env.ts` from M01.05).
   - `src/pages/` (or `src/app/` if using the App Router) – Next.js route files.
   - `public/` – Static assets.
   - `tests/` – Unit and integration tests.
   - `design/` – Design‑system scaffolding (will be populated in M01.07).
2. Add a placeholder `README.md` in each directory explaining its purpose.
3. **CI workflow** – Create `.github/workflows/ci.yml` that runs on `push` and `pull_request` for the `main` branch (or all branches). The workflow must perform:
   - Checkout the repository.
   - Set up Node (use `actions/setup-node@v4` with the latest LTS version).
   - Install dependencies (`npm ci`).
   - Run lint (`npm run lint`).
   - Run type‑check (`npm run typecheck`).
   - Run tests (`npm test` – the test script will be added later; for now ensure the command exists and exits 0).
   - Cache `node_modules` to speed up subsequent runs.
4. Commit the new directories, README files, and workflow definition.

## Scope

### In scope
- Creating the folder hierarchy and placeholder README files.
- Implementing the GitHub Actions workflow.
- Adding the CI script to the repository.

### Out of scope
- Populating the directories with actual application code (that will happen in later milestones).
- Implementing test suites (the test script can be a no‑op placeholder).

## Dependencies

- **M01.02** – The Next.js scaffold must exist.
- **M01.03** – TypeScript configuration (required for `npm run typecheck`).
- **M01.04** – Linting script must be available.
- **M01.05** – `src/lib/` already exists for the environment validation file.

## Files / Areas Expected To Change

- New directories: `src/`, `src/components/`, `src/lib/`, `src/pages/`, `public/`, `tests/`, `design/`.
- README files in each new directory.
- `.github/workflows/ci.yml`.

## Implementation Guidance

- Use the standard Node cache key `{{ runner.os }}-node-${{ hashFiles('package-lock.json') }}`.
- The CI script should exit with a non‑zero status if any step fails.
- For the test step, use `npm test` which can be defined as `echo "No tests yet" && exit 0` for now.
- Ensure the workflow file is valid YAML (you can lint it with an online validator before committing).

## Acceptance Criteria

- [ ] All required directories exist with a `README.md` inside each.
- [ ] `.github/workflows/ci.yml` runs successfully on a push (you can trigger a manual run via the GitHub UI).
- [ ] The CI pipeline executes lint, type‑check, and test steps without errors on the scaffolded code.
- [ ] The CI configuration is committed to the repository.

## Testing Requirements

- Trigger the workflow locally using `act` (optional) or push a commit to verify the CI runs.
- Verify that a failing lint (e.g., introduce a lint error) causes the workflow to fail.

## Security / Privacy Considerations

- The CI workflow must not expose secrets; rely on GitHub‑provided secrets for any future steps.
- Ensure the workflow does not print environment variable values.

## Performance / Accessibility Considerations

- Caching `node_modules` speeds up CI runs and reduces resource usage.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes.
- No unrelated files were altered.

## Related Requirements

- **PRD** – Section 56 (Content Architecture) – defines top‑level content directories.
- **ROADMAP** – Milestone 1 (Architecture) – “Create initial application architecture (folders, CI workflow)”.
- **AGENTS.md** – Rules: “Run lint and typecheck before completing a milestone.”
