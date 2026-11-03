# M20.08 – Set Up the Sentry Project, the Alerts and the Verification Script

## Objective

Give the monitoring a project to report to, make sure somebody is told when something breaks, and write the script that checks the whole thing the way M19 checked the analytics.

## Context

The DoD of the milestone is "Errors are captured and alertable". Two things are still missing after M20.07:

- **A project.** Sentry is a service with a free tier and a project of its own. The project holds the issues, the DSN and the alert rules. It is an account action, not code.
- **Somebody has to be told.** An alert that nobody reads is the same as no alert. The email alerts of Sentry are free and need nothing else, and they are the recommendation. A chat channel would need another service, which the rule of the milestone against unnecessary infrastructure argues against.

The repository already holds the pattern for the second half of this task. M19.05 wrote `scripts/verifyAnalytics.mts` and `src/lib/analytics/fixtures/analyticsFixtures.ts`:

- The script runs the cases of the catalogue against the running site and writes a report with the result of every rule.
- The event that a request is expected to produce is built by the tracking function of the site and caught before it is sent, so the rules are checked against the very payload the service would receive and not against a copy of it.
- The live part is indirect: the request is made and the answer is checked, and the event the server really counted is read from the file of the server when `SERVER_LOG` is given.
- The script exits with a non-zero code when a rule fails.

The same shape is the right one here, and `npm run verify:analytics` is the model for `npm run verify:monitoring`.

**The decision that needs a person.** The local machine reports to the same project as the live site, or to a project of its own. The same reasoning as the analytics of M19: a project of its own keeps the numbers of the site clean and keeps the failures of a development machine out of the alerts. The recommendation is a project of its own for the machine, with the DSN in `.env.local` and the live DSN in the environment of the deployment. This needs an account action either way.

## Requirements

### 1. The project is set up

- A Sentry project for the site, on the free tier, with the environment of the project set to `development` for the machine and `production` for the deployment. The name of the environment is reported with every issue, so the two can be told apart.
- The DSN of the project goes into `.env.local`, which is not tracked. **The DSN is never written into a tracked file.** `.env.example` keeps the placeholder, the way it does for the other optional credentials.
- The sample rate of the traces is 0. The performance of M20.06 is a deliberate threshold and does not need the tracing of the SDK.

### 2. The alerts are configured

- The alert rules of the project are set so that a new issue and a failure that happens often both reach the owner by email.
- The alert of an issue that was already seen is not sent again for every occurrence, so a storm of the same failure does not become a storm of emails. The rules of Sentry make that choice.
- The address that receives the alerts is the address of the owner of the site. The address is a configuration of the project, not a variable of the code, and it is not written into a tracked file.
- The rules are described in `DECISIONS.md` and in `TODO.md`, because they live in the interface of Sentry and not in the repository, and a project that is recreated would lose them.

### 3. The verification script is written

Create `scripts/verifyMonitoring.mts` and the cases in `src/lib/monitoring/fixtures/monitoringFixtures.ts`, following the shape of M19.05:

- The cases cover:
  - the failure of the chat, of the analyzer, of the contact form and of the feedback,
  - the failure of the language model, of each kind,
  - the failure of the GitHub service and of the database,
  - a slow request,
  - the failure of the browser, which cannot be reached over http and is therefore checked in the browser by hand,
  - the edges: the monitoring being off, a report that fails, a route that refuses.
- The payload of a report is built by the capture function of the site and caught before it is sent, so the rules are checked against the very payload the service would receive.
- The live part is indirect: the request is made against the running site and the answer is checked. The answer must hold the safe message of today and never the reason of the failure.
- The report that the server really sent is read from the file of the server when `SERVER_LOG` is given, the way `verifyAnalytics.mts` does.
- One real report is sent to the real project, marked with `verification: true`, when the credentials are configured. It is skipped when there are none.
- The script never writes a secret to its own output. A DSN, a key or a token in the report of the script is a failure of the script.
- The script exits with a non-zero code when a rule fails.
- `package.json` gets `verify:monitoring`, beside `verify:analytics`.

### 4. The privacy rules are part of the script

The rules that the script checks on every payload are the ones of PRD §79:

- no address of a mailbox,
- no number of a phone, in the written form and as a run of digits on its own,
- no question, no answer, no description of a job and no form,
- no key, no token and no DSN,
- no address of the visitor.

## Scope

### In scope

- The Sentry project and its alert rules (an action in the interface of Sentry)
- `.env.local` (the DSN, which is not tracked)
- `scripts/verifyMonitoring.mts` (new)
- `src/lib/monitoring/fixtures/monitoringFixtures.ts` (new)
- `package.json` (the `verify:monitoring` script)
- `DECISIONS.md` and `TODO.md` (the rules that live outside the repository)

### Out of scope

- The implementation of the capture, which is M20.03 to M20.07
- The end-to-end verification of the milestone, which is M20.09
- A second service for the alerts
- The tracing of the SDK

## Dependencies

- M20.01 – the SDK and the configuration.
- M20.03, M20.04, M20.05, M20.06, M20.07 – the paths the script has to be able to trigger.

## Files / Areas Expected To Change

- `scripts/verifyMonitoring.mts` (new)
- `src/lib/monitoring/fixtures/monitoringFixtures.ts` (new)
- `package.json`
- `DECISIONS.md`
- `TODO.md`
- `.env.local` (not tracked)

## Implementation Guidance

1. **Copy the shape of `scripts/verifyAnalytics.mts`.** It already solves the problem of building the payload with the production function and catching it, and it solves the problem of reading the file of the server. Read it before writing anything.
2. **The script needs the server to be running.** `npm run verify:monitoring` is told the same way as `npm run verify:analytics`, through `LIVE_SERVER_URL`, and the file of the server through `SERVER_LOG`.
3. **The failures are triggered on purpose.** The way to make the chat fail on the running site is to send a request that the model cannot answer, for example by pointing the model of the environment at a name that does not exist, or by using a body that the route cannot read. The script has to put the site back the way it was afterwards.
4. **The script must never leak.** A rule that fails prints what it found, so the printing has to be careful: it prints the name of the rule and a short description, and never the value it found when that value could be private. The rules of M19 already had to solve this.
5. **The verification event carries a marker.** The one real report is marked with `verification: true`, so it can be found in the project and told apart from a real failure.

## Acceptance Criteria

- The project of Sentry is set up, with the environments named, and the DSN is in `.env.local` only.
- The alert rules reach the owner by email, for a new issue and for a failure that repeats, without a mail for every occurrence of the same issue.
- `npm run verify:monitoring` runs the cases against the running site, writes a report with the result of every rule, and exits with a non-zero code when a rule fails.
- The script exits with a non-zero code when the server is not running.
- No secret is written to the output of the script.
- The script sends one real report marked with `verification: true` when the credentials are configured, and skips it when there are none.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the rules of the script that can be checked on their own, the way `analyticsFixtures.ts` holds them.
- Manual: `npm run verify:monitoring` against the running site, with the exit code 0.
- Manual: `npm run verify:monitoring` with the server stopped, with the exit code that is not 0.
- Manual: the script with a rule broken on purpose, with the exit code that is not 0 and the name of the rule in the output.
- Manual: the real project holds the report that is marked with `verification: true`.
- Manual: a real failure of the site reaches the project and the alert arrives by email.

## Security / Privacy Considerations

- The DSN is not a key that has to be hidden the way a key is, but it is still not written into a tracked file. The project of the site holds it and the deploy holds it.
- The script is a program that writes to the terminal of the person who runs it. It must never print a value that could hold a secret or something private, not even in the output of a failure.
- The alert rules live in the interface of Sentry. They are written down in `DECISIONS.md` so that they can be restored.

## Performance / Accessibility Considerations

- The script makes a handful of requests and is not part of `npm test`. The live tests of the language model stay opt in with `LIVE_LLM_TESTS=1`.
- Nothing in this task changes what a visitor sees.

## Definition of Done

- The project and the alerts are set up, and the rules are written down.
- The script runs, passes and fails when it should.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- ROADMAP Milestone 20 – Definition of Done: Errors are captured and alertable
- PRD §79 – Monitoring
- M19.05 – the verification script and the test plan, which are the model
- DECISIONS.md – the analytics project on the EU cloud, which is the model for a project of its own
