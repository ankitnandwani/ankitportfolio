# M01.01 — Initialize Repository

## Objective

Create a clean Git repository for the project and commit the initial documentation files.

## Context

The first step of Milestone 1 (Architecture) in the ROADMAP requires establishing version control before any code is added. This aligns with the PRD’s emphasis on a maintainable source of truth and the AGENTS.md rule to “Do not rewrite working code unnecessarily.”

## Requirements

- Run `git init` in the project root.
- Add a standard `.gitignore` for a Node/Next.js project (including `node_modules/`, `.next/`, `dist/`, `.env*`, etc.).
- Ensure an initial `README.md` is present (the existing one already describes the project).
- Create an initial commit that includes the `.gitignore` and the existing documentation files (`README.md`, `PRD.md`, `ROADMAP.md`, `AGENTS.md`, `DECISIONS.md`).
- Tag the commit with `v0.0.1‑init` (optional but useful for traceability).

## Scope

### In scope
- Repository initialization.
- Adding `.gitignore` and committing existing documentation.

### Out of scope
- Pushing to a remote origin.
- Setting up branch protection rules or CI pipelines (handled in later tasks).

## Dependencies

None.

## Files / Areas Expected To Change

- `.gitignore`
- Initial Git commit (no new source files besides `.gitignore`).

## Implementation Guidance

Use the canonical Node `.gitignore` template from https://github.com/github/gitignore/blob/main/Node.gitignore and add any Next.js‑specific entries (`.next/`). Keep the file UTF‑8 encoded without BOM.

## Acceptance Criteria

- [ ] A Git repository is initialized in the project root.
- [ ] A `.gitignore` file exists with appropriate entries.
- [ ] An initial commit exists containing the `.gitignore` and all existing documentation files.
- [ ] `git status` reports a clean working tree.

## Testing Requirements

Run `git log --oneline` and verify that the first commit includes the documentation files. Run `git status` to ensure no untracked files remain.

## Security / Privacy Considerations

No private data should be added at this stage; the `.gitignore` must include any files that could contain secrets (e.g., `.env*`).

## Performance / Accessibility Considerations

N/A.

## Definition of Done

- Implementation is complete.
- All acceptance criteria are satisfied.
- Lint passes (no lint rules apply to these files).
- Type‑check passes (no TypeScript files affected).
- Documentation (`README.md`) is updated if needed.
- No unrelated changes were introduced.

## Related Requirements

- **PRD** – Section 52 (Recommended Technical Architecture) – outlines the need for a source‑controlled repository.
- **ROADMAP** – Milestone 1 (Architecture).
- **AGENTS.md** – Rules: “Maintain TypeScript strict mode,” “Run lint and typecheck before completing a milestone.”
