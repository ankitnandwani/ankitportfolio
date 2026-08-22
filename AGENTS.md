# AI Agent Instructions

## Project

Ankit Nandwani professional portfolio and AI recruiter assistant.

## Before doing anything

1. Read AGENTS.md
2. Read PROJECT_STATE.md
3. Read ROADMAP.md
4. Read relevant sections of PRD.md
5. Inspect the existing implementation
6. Run relevant tests

## Rules

- Do not invent professional information.
- Do not expose private information.
- Never expose Ankit's phone number.
- Do not implement features outside the current milestone without approval.
- Do not rewrite working code unnecessarily.
- Prefer existing components over creating duplicates.
- Maintain TypeScript strict mode.
- Run tests after implementation.
- Run lint and typecheck before completing a milestone.
- Update PROJECT_STATE.md after meaningful progress.
- Update CHANGELOG.md after completed milestones.
- Record architectural decisions in DECISIONS.md.

## Completion

Before stopping:

1. Update PROJECT_STATE.md
2. Update TODO.md
3. Update CHANGELOG.md
4. Run tests
5. Report exactly what was completed
6. Report remaining work
7. Report known issues

## Task Execution Rules

AI agents must work on one task at a time.

Before starting a task:
1. Read the task specification.
2. Verify all dependencies are complete.
3. Inspect the current implementation.
4. Verify the repository is healthy.

During implementation:
- Do not implement future tasks.
- Do not modify unrelated functionality.
- Do not introduce architectural changes without recording them in DECISIONS.md.
- Do not mark a task complete without satisfying its acceptance criteria.

After implementation:
- Run tests.
- Run lint.
- Run typecheck/build where applicable.
- Review git diff.
- Update project state.
- Update changelog.
- Commit the task.

If the repository is broken before starting the task:
- Stop.
- Diagnose the problem.
- Do not proceed with new functionality until the prerequisite issue is resolved.

## Repository & Change Safety

### Existing Repository

This is an existing project repository. Do not assume it is an empty directory.

Before making structural or architectural changes:

1. Inspect the existing repository structure.
2. Inspect `git status`.
3. Inspect recent commits where relevant.
4. Understand existing files and configuration.
5. Preserve existing project documentation and configuration unless the
   current task explicitly requires changing them.

### Project Initialization

Before running scaffolding or initialization commands such as
`create-next-app`, inspect the repository and determine whether the command
is safe to run in the current directory.

Do not create a second application/project directory as a workaround for a
repository initialization conflict without first understanding the existing
repository structure.

Do not duplicate the application into a temporary directory unless the task
explicitly requires it.

If a scaffolding command reports conflicts:

1. Stop and inspect the conflicting files.
2. Determine whether those files are intentional project files.
3. Find a safe initialization approach that preserves them.
4. Do not overwrite or delete project files merely to satisfy the scaffolding
   command.

Never use destructive commands such as deleting, overwriting, or resetting
existing project files unless explicitly required by the task and safe to do.

### Partial Work From Previous Sessions

A task may have been partially implemented by a previous AI agent.

Never assume the current task is untouched.

Before continuing:

- inspect `git status`
- inspect `git diff`
- inspect recent commits
- inspect newly created files
- inspect temporary directories
- inspect generated files
- inspect configuration changes

Determine what was successfully completed before making further changes.

If useful partial work exists:
- preserve it
- continue from it
- do not duplicate it

If previous work is incorrect:
- understand why before replacing it
- make the smallest safe correction

Do not discard previous work without understanding its purpose.

### Temporary Files and Directories

Do not leave temporary project copies, generated scaffolding, build artifacts,
or experimental directories in the repository.

Before completing a task, inspect for unnecessary artifacts and remove them
only when it is clear they are not required.

### Unrelated Changes

Do not modify unrelated files or functionality.

If an unrelated change is discovered:
- do not silently overwrite it
- preserve it unless it is clearly an accidental artifact created by the
  current task
- report it when completing the task

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
