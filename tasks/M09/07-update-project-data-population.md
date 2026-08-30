# M09.07 — Update project data population (optional)

## Objective

Validate and, if necessary, correct the `githubUrl` fields in the existing project data to ensure they point to the correct GitHub repositories. This ensures that the GitHub integration service can fetch accurate data for each project.

## Context

The project data (`src/data/projects.ts`) includes a `githubUrl` field for each project. This field is used by the GitHub integration service to fetch live repository metadata. We need to verify that these URLs are correct and point to the intended repositories. If any are missing or incorrect, we should correct them based on verified information (without inventing data).

## Requirements

- Review the `githubUrl` field for each project in `src/data/projects.ts`.
- Ensure that each URL is a valid GitHub repository URL (e.g., starts with `https://github.com/` or `git@github.com:` and ends with `.git` or without `.git`).
- If a URL is missing or incorrect, and we have the correct information from verified sources (e.g., resume, project documentation), update it.
- If we do not have the correct information, leave the field as is (or set to `null` if appropriate) and do not invent data.
- Ensure that the data is still exported correctly and that the project data model remains unchanged (we are only updating values, not the structure).
- Optionally, add a comment or TODO for any projects where the URL is uncertain.

## Scope

### In scope
- Reading and validating the `githubUrl` field in `src/data/projects.ts`.
- Correcting any incorrect or missing URLs based on verified knowledge.
- Ensuring the data exports correctly.

### Out of scope
- Adding new projects or removing existing ones.
- Changing the project data model (e.g., adding new fields).
- Inventing repository URLs without verification.

## Dependencies
- None (this task uses the existing project data model).

## Files / Areas Expected To Change
- `src/data/projects.ts` – update the `githubUrl` values for projects where necessary.

## Implementation Guidance
1. Open `src/data/projects.ts`.
2. For each project entry, examine the `githubUrl` field.
3. If the URL is present, verify that it matches the pattern of a GitHub repository.
   - Acceptable formats: `https://github.com/owner/repo`, `https://github.com/owner/repo.git`, `git@github.com:owner/repo.git`.
   - We can normalize to `https://github.com/owner/repo` for consistency.
4. If the URL is missing or clearly wrong (e.g., points to a user profile instead of a repo, or to a different site), and we know the correct repository from verified sources, update it.
5. If we are unsure, leave the field as is and optionally add a comment like `// TODO: verify githubUrl`.
6. Do not change any other fields.
7. Save the file and run lint to ensure no formatting issues.

## Acceptance Criteria
- [ ] All `githubUrl` fields in `src/data/projects.ts` are either valid GitHub repository URLs or intentionally left blank/null based on lack of verified information.
- [ ] No invented URLs are added.
- [ ] The data exports correctly and passes typecheck.
- [ ] Lint passes (no new errors).

## Testing Requirements
- [ ] We can manually inspect the file to verify the changes.
- [ ] We can also run a simple validation script (optional) to check URL patterns.

## Security / Privacy Considerations
- None.

## Performance / Accessibility Considerations
- None.

## Definition of Done
- The project data's `githubUrl` fields are validated and corrected where necessary without inventing data.
- The task is ready for the next tasks to use the project data in the GitHub integration.

## Related Requirements
- PRD §16: Project data model (includes `githubUrl` field).
- PRD §117: Milestone 8 — Projects (includes GitHub links).