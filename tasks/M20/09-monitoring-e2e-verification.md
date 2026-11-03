# M20.09 – Test and Verify the Monitoring End to end

## Objective

Check the whole milestone the way M19.06 checked the analytics: the script against the running site, the real project in the browser, the privacy audit of what was really sent, and the state of the repository.

## Context

This task changes no code. It is the last task of the milestone and it answers one question: **does the site tell its owner when it breaks, without telling anybody else what a visitor wrote?**

M19.06 is the model. It:

- ran the verification script against the running site and wrote the result of every rule,
- ran the whole suite again,
- fired every event of the catalogue for real against the real PostHog project,
- read the payload on the wire with a small forwarding server that passed it on to the real project, so the exact bytes could be checked,
- opened the project in the browser and read the activity log,
- audited the private data of the real payloads,
- confirmed that the sessions join up the way they should,
- deleted the file that held the key at once,
- and left three findings alone, because they were changes of their own and the task only checks.

The same applies here, with the difference that the monitoring carries the failures of the site rather than the visits of a visitor. The privacy question is the same and it is sharper: a failure of the chat holds the question of a recruiter, and the failure of the contact form holds the form.

## Requirements

### 1. The script is run against the running site

- `npm run verify:monitoring` runs against the running site and passes every rule.
- The script is also run with a rule broken on purpose, and it answers with the exit code that is not 0 and names the rule. The case is put back afterwards and is byte for byte the file of the repository.
- The script is run with the server stopped, and it answers with the exit code that is not 0.

### 2. The real project is checked

- Every kind of report is fired for real against the real project, the way M19.06 fired the events.
- The payload on the wire is read with a small forwarding server that writes the body down and passes it on to the real project, so the project receives every report and the exact bytes can be checked at the same time.
- The file that holds the key is deleted at once.
- The project is opened in the browser and the list of the issues is read: every kind of report is there, with the right grouping and the right environment.

### 3. The privacy audit is made on what was really sent

- No address of a mailbox, no number of a phone in the written form, no run of ten digits on its own, no address of a computer, no question, no answer, no description of a job, no form, no address of the visitor, no key, no token and no DSN in any of the kinds of report.
- The reports of the failure of the model hold the kind and the status and nothing else.
- The reports of the external services hold the name of the service and the kind and nothing private.

### 4. The state of the repository is checked

- `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` all pass.
- The build is run with the server stopped, because the two contend over the same directory and the build hangs when they run at the same time.
- No secret is in a tracked file. Every value that looks like a credential in the repository is a fixture.

### 5. The documentation is brought up to date

- `PROJECT_STATE.md` says that the milestone is complete and what the next milestone is.
- `TODO.md` holds the findings that were left alone and the next action.
- `CHANGELOG.md` has the entry of the milestone.
- `tasks/M20/README.md` has the traceability table filled in and a note about what was found.
- `test-plan.md` has the section of the milestone with the cases and the result of the run.

## Scope

### In scope

- The running of the script, of the suite, of the lint, of the typecheck and of the build
- The firing of the reports against the real project and the reading of them in the browser
- The audit of the private data of the real reports
- `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md`, `tasks/M20/README.md`, `test-plan.md`

### Out of scope

- Any change of the code of the application. A finding that comes out of this task is written down and fixed in a change of its own, the way M19.06 left its three findings alone.
- The setup of the project and of the alerts, which is M20.08
- The next milestone

## Dependencies

- M20.08 – the project, the alerts and the script have to be in place.

## Files / Areas Expected To Change

- `PROJECT_STATE.md`
- `TODO.md`
- `CHANGELOG.md`
- `tasks/M20/README.md`
- `test-plan.md`

## Implementation Guidance

1. **Start the server on its own.** `npm run dev` in the background, and give it the time it needs before the first request. The server of the verification run writes a log of its own, and that log is read with `SERVER_LOG`.
2. **The forwarding server is the pattern of M19.06.** A small server on a free port, the address of the monitoring service pointed at it for the run, and the body written down and passed on. The file that holds the key is deleted at once with `mavis-trash`.
3. **The audit is made on the real payloads.** The rules of the script are the rules of the code; the audit is made on what the service really received, which is a stronger statement.
4. **The build runs with the server stopped.** `npm run build` and `npm run dev` contend over `.next` and the build hangs when they run at the same time.
5. **A finding is written down, not fixed.** This task checks. The fix of a finding is a change of its own with its own tests, and AGENTS.md asks for that.

## Acceptance Criteria

- `npm run verify:monitoring` passes every rule against the running site, with the exit code 0.
- The script exits with a non-zero code when a rule fails and when the server is not running.
- Every kind of report was seen in the real project, with the right grouping and the right environment.
- The audit of the private data found nothing private in any kind of report.
- `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` all pass.
- No secret is in a tracked file.
- The four documents are up to date and say that the milestone is complete.

## Testing Requirements

- The run of the script against the running site, with the result of every rule written down.
- The run with the server stopped.
- The run with a rule broken on purpose.
- The firing of every kind of report against the real project, and the reading of the list of the issues in the browser.
- The audit of the private data of the real payloads.
- The suite, the lint, the typecheck and the build.

## Security / Privacy Considerations

- The forwarding server holds the key of the project for the length of the run. The file is deleted at once and it is not in the repository.
- The reports that are read are the ones of the site, and they must hold nothing that a visitor wrote. The audit is the proof of that.
- The key of the project is never written into a tracked file and never printed by the script.

## Performance / Accessibility Considerations

- The verification run makes a handful of requests. The live tests of the language model stay opt in.
- The boundaries of M20.07 are checked in a browser, the way they were designed, because there is no test framework for the React components in this repository.

## Definition of Done

- The monitoring is verified end to end and the milestone is complete.
- The documentation says so, and the findings that were left alone are written down.
- All the tests pass, the lint is clean, the typecheck is clean, the build succeeds.

## Related Requirements

- ROADMAP Milestone 20 – Definition of Done: Errors are captured and alertable
- PRD §79 – Monitoring
- M19.06 – the model of this task, which checked the analytics the same way
