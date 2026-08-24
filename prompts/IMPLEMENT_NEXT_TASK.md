## Recovery / Existing Work

The task may have been partially implemented by a previous AI session.

Never assume the task is untouched.

Inspect:

- git status
- git diff
- recent commits
- existing files
- temporary directories
- generated files
- configuration changes

Determine whether partial implementation exists.

If partial implementation exists:

- preserve useful work
- continue from the existing state
- do not duplicate implementation
- remove only clearly unnecessary artifacts
- do not discard work without understanding it

If the previous implementation is fundamentally incorrect, explain why and
correct it using the smallest safe change.

Continue the project with the next unfinished task in the current milestone.

First read:

- AGENTS.md
- PROJECT_STATE.md
- ROADMAP.md
- DECISIONS.md
- CHANGELOG.md
- TODO.md
- The current milestone's tasks/README.md
- The next unfinished task specification

Verify the current repository state and confirm that the previous task is actually complete before proceeding.

Implement ONLY the next unfinished task.

Do not start subsequent tasks or future milestones.

Follow the task specification and its acceptance criteria exactly.

Before making changes:

- inspect the existing implementation
- check git status
- understand the architecture already established
- reuse existing code/components where appropriate
- do not unnecessarily rewrite working code
- do not introduce new technologies or dependencies unless required

During implementation:

- follow AGENTS.md
- follow the approved PRD and roadmap
- preserve existing functionality
- keep the implementation simple and maintainable
- consider security, privacy, accessibility, responsiveness, and performance where relevant

After implementation:

1. Run all relevant tests.
2. Run lint.
3. Run typecheck/build where applicable.
4. Verify every acceptance criterion from the task.
5. Fix any failures.
6. Check git diff for unintended changes.
7. Update PROJECT_STATE.md.
8. Update TODO.md.
9. Update CHANGELOG.md.
10. Update the task status if the project's task convention requires it.
11. Commit the completed task with a meaningful commit message.

Do NOT mark the task complete unless its acceptance criteria are satisfied.

When finished, STOP and report:

- Task completed
- Summary of implementation
- Files changed
- Tests/checks run and results
- Acceptance criteria status
- Current milestone progress
- Next unfinished task
- Any issues, decisions, or blockers

Do not implement the next task automatically.
