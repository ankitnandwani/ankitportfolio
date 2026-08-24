# Plan Next Milestone

You are working on an existing multi-session software project.

Your job is to plan the next milestone for implementation.

IMPORTANT:
- This is a PLANNING task.
- Do NOT implement application code.
- Do NOT install dependencies.
- Do NOT modify application architecture.
- Do NOT start implementing any tasks.
- Do NOT mark the milestone as complete.
- Do not modify PRD.md or AGENTS.md.
- Do not silently change approved architectural decisions.

The goal is to create detailed, executable task specifications for the next
milestone while taking the ACTUAL current repository state into account.

--------------------------------------------------
1. READ PROJECT DOCUMENTATION
--------------------------------------------------

Before doing anything, read:

- AGENTS.md
- PRD.md
- ROADMAP.md
- PROJECT_STATE.md
- DECISIONS.md
- CHANGELOG.md
- TODO.md
- prompts/IMPLEMENT_NEXT_TASK.md
- the previous milestone's task specifications where relevant

Also inspect the existing repository and Git history.

--------------------------------------------------
2. DETERMINE THE NEXT MILESTONE
--------------------------------------------------

Determine the next unfinished milestone from ROADMAP.md and PROJECT_STATE.md.

Verify that the previous milestone is actually complete.

Do not rely solely on PROJECT_STATE.md.

Check:
- implementation
- tests
- lint
- typecheck
- build
- CI
- milestone acceptance criteria

If the previous milestone is not actually complete:

STOP.

Do not plan the next milestone. Report what remains to be fixed.

--------------------------------------------------
3. UNDERSTAND THE CURRENT IMPLEMENTATION
--------------------------------------------------

Before creating tasks, inspect the existing implementation relevant to the
next milestone.

Understand:
- current architecture
- existing components
- existing dependencies
- existing database structure
- existing APIs
- existing configuration
- existing design system
- existing tests
- existing CI/CD setup

Do not design the next milestone as if the project were starting from zero.

Build on what already exists.

--------------------------------------------------
4. REVIEW THE ROADMAP
--------------------------------------------------

Read the next milestone's requirements from ROADMAP.md.

Identify:
- milestone objectives
- required features
- dependencies
- acceptance criteria
- technical constraints

Compare the roadmap with the actual implementation.

If the roadmap contains assumptions that are no longer valid because of work
completed in previous milestones, identify them.

Do NOT silently change ROADMAP.md.

--------------------------------------------------
5. REVIEW THE PRD
--------------------------------------------------

Trace every requirement for the next milestone back to PRD.md.

Ensure the task breakdown does not omit requirements.

At the same time:

Do not blindly implement requirements that have already been satisfied by
earlier milestones.

Avoid duplicate functionality.

--------------------------------------------------
6. REVIEW ARCHITECTURAL DECISIONS
--------------------------------------------------

Read DECISIONS.md carefully.

The task plan must respect existing accepted decisions.

If the next milestone appears to require changing an accepted architectural
decision:

DO NOT make the change automatically.

Instead document it as a decision requiring review.

--------------------------------------------------
7. CREATE TASK SPECIFICATIONS
--------------------------------------------------

Create:

tasks/M##/

where ## is the next milestone number.

Create:

tasks/M##/README.md

and individual task specifications:

tasks/M##/01-<short-name>.md
tasks/M##/02-<short-name>.md
tasks/M##/03-<short-name>.md
...

Use the same task specification format established for previous milestones.

Each task should contain:

# M##.<task-number> — <Task Name>

## Objective

## Context

## Requirements

## Scope

### In scope

### Out of scope

## Dependencies

## Files / Areas Expected To Change

## Implementation Guidance

## Acceptance Criteria

## Testing Requirements

## Security / Privacy Considerations

## Performance / Accessibility Considerations

## Definition of Done

## Related Requirements

--------------------------------------------------
8. TASK GRANULARITY
--------------------------------------------------

Tasks must be:

- independently understandable
- independently testable
- reasonably small
- meaningful engineering units
- executable by an AI coding agent in one focused session where practical

Avoid tasks that are too broad.

Bad:

"Implement the entire design system."

Better:

- establish design tokens
- configure typography
- create core button component
- create card component
- create navigation component
- implement responsive behavior
- add accessibility states
- add component tests

Do not create microscopic tasks for trivial changes.

--------------------------------------------------
9. DEPENDENCIES AND EXECUTION ORDER
--------------------------------------------------

Clearly define dependencies between tasks.

Example:

M02.01
   ↓
M02.02
   ↓
M02.03

If tasks can safely be executed independently, state that.

In tasks/M##/README.md include:

## Execution Order

List the recommended implementation order.

Also identify tasks that can safely be worked on in parallel.

--------------------------------------------------
10. TRACEABILITY
--------------------------------------------------

In tasks/M##/README.md create a traceability table:

| Requirement | Source | Task | Status |
|---|---|---|---|
| ... | PRD.md | M##.01 | Covered |
| ... | ROADMAP.md | M##.02 | Covered |

Every major requirement of the milestone must map to at least one task.

Also identify requirements that are already satisfied by earlier milestones.

--------------------------------------------------
11. DO NOT OVER-ENGINEER
--------------------------------------------------

This is a personal professional portfolio with relatively low expected
traffic.

Prefer:

- simplicity
- maintainability
- free-tier compatibility
- minimal infrastructure
- good developer experience
- strong UX
- strong security
- good performance

Do not introduce infrastructure merely because it is technically possible.

Do not introduce unnecessary:
- microservices
- queues
- databases
- caching layers
- third-party APIs
- authentication systems
- AI services

unless required by the PRD or an approved architectural decision.

--------------------------------------------------
12. AI-SPECIFIC CONSIDERATIONS
--------------------------------------------------

If this milestone involves AI functionality:

Clearly separate:

- user-facing behavior
- knowledge/data requirements
- model requirements
- retrieval requirements
- security/privacy requirements
- prompt/guardrail requirements
- evaluation requirements
- observability requirements

Do not assume a particular LLM implementation unless it has already been
approved.

If a technical choice needs to be made, identify it as a decision rather
than silently making it.

--------------------------------------------------
13. SECURITY AND PRIVACY
--------------------------------------------------

For every milestone involving user data, AI, APIs, authentication, or
external integrations, explicitly consider:

- secrets
- API keys
- PII
- private/confidential information
- prompt injection
- data leakage
- authorization
- rate limiting
- abuse prevention
- logging
- error messages

The implementation must never expose private or confidential information.

--------------------------------------------------
14. UPDATE PROJECT STATE
--------------------------------------------------

After creating the task specifications:

Update PROJECT_STATE.md to reflect:

Current phase:
Planning

Current milestone:
M##

Status:
Task specification created / awaiting implementation

Next task:
M##.01

Do NOT mark the milestone as complete.

Do not mark individual implementation tasks as complete.

--------------------------------------------------
15. UPDATE TODO
--------------------------------------------------

Update TODO.md so the immediate next action is:

"Begin implementation of M##.01."

Do not add unnecessary future tasks to TODO.md.

The detailed task specifications belong in tasks/M##/.

--------------------------------------------------
16. CHANGELOG
--------------------------------------------------

Add a concise changelog entry describing that the next milestone's task
specifications were created.

Do not claim implementation was completed.

--------------------------------------------------
17. FINAL VALIDATION
--------------------------------------------------

Before finishing:

Verify:

- every major roadmap requirement is represented
- every relevant PRD requirement is represented
- task dependencies are logical
- tasks are appropriately sized
- acceptance criteria are objectively testable
- existing architecture is respected
- existing decisions are respected
- no unnecessary technologies were introduced
- no application code was changed
- no dependencies were installed
- no unrelated files were modified

--------------------------------------------------
FINAL REPORT
--------------------------------------------------

Report:

1. Milestone planned
2. Number of tasks created
3. List of tasks
4. Recommended execution order
5. Task dependencies
6. Requirements traceability summary
7. Architectural decisions involved
8. Decisions requiring human approval
9. Risks or ambiguities discovered
10. Confirmation that no application code was implemented
11. Exact next task to implement

STOP after planning.

Do not implement anything.