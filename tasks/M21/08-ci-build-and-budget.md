# M21.08 – Put the Build and the Budget in the CI

## Objective

Let the pipeline build the site and check its size, so that a change that breaks the build or that makes the site heavier is caught before it is published.

## Context

`.github/workflows/ci.yml` runs three steps:

```yaml
- name: Lint
  run: npm run lint
- name: Typecheck
  run: npm run typecheck
- name: Tests
  run: npm test
```

There is **no `npm run build`**. A configuration that breaks the build — a `next.config.ts` that does not compile, a component that does not render on the server, an import that only the bundler finds — passes the whole pipeline and fails on the deployment.

This was found by the verification of M20.09 and it is written down in `TODO.md`. M21 is the milestone that has the budget of the build of M21.01, and the build is what the budget reads. So the build and the budget belong in the pipeline together, and this task is where they go in.

**The decision that needs a person.** How Lighthouse is run in the pipeline.

- `@lhci/cli` as a dependency of the repository would make the check of the four scores part of the pipeline. It is a heavy dependency, it brings Chrome with it, and the numbers it gives in the pipeline are the numbers of the machine of the pipeline and not the numbers of a phone.
- `npx lighthouse` runs it on demand and adds nothing to `package.json`. It needs Chrome on the machine, which the developer has and the CI runner of GitHub does not have by default.
- **The recommendation is `npx lighthouse` on demand**, run by the owner and by M21.09, and only the **budget of the size of the build** in the pipeline. The pipeline stays fast, the repository stays small, and the check that has to run on every push — the size of what is sent — is in the pipeline.

## Requirements

### 1. The CI builds the site

- The workflow gains a step that runs `npm run build`.
- The step runs after the tests and before the budget, because the budget reads the build.
- The step is not allowed to be optional. A pipeline that does not build is a pipeline that does not know whether the site works.

### 2. The CI checks the budget of the size

- The workflow gains a step that runs `npm run perf:budget`, which exits with a non-zero code when a measure is over its ceiling.
- The budget that the pipeline checks is the one of M21.01 and is the same one the developer checks on the machine.

### 3. The pipeline stays quick and free

- No new dependency is added to the repository for the pipeline.
- The pipeline does not run Lighthouse, and no Chrome is installed on the runner.
- The cache of the dependencies of npm is kept, the way it is today, so that the pipeline is not slower than it was.

### 4. The pipeline still catches what it caught

- The lint, the typecheck and the tests keep running exactly as they run today, in the same order, and they still fail the pipeline when they fail.
- The order of the steps is: install, lint, typecheck, tests, build, budget. The cheap things fail first.

## Scope

### In scope

- `.github/workflows/ci.yml`
- `package.json` (the command `perf:budget`, if it is not there already)
- The documentation of the pipeline, if there is one that says what the pipeline runs

### Out of scope

- The running of the site in the pipeline, a preview that the owner can click, or any deployment that the pipeline makes. The deployment is the platform and the owner's.
- Lighthouse in the pipeline, which is the decision above.
- Any other step of the pipeline, such as the audit of the dependencies, which is the subject of M23.
- The configuration of the deployment on Vercel.

## Dependencies

- M21.01 – the budget that the pipeline checks.
- M21.04, M21.05, M21.06, M21.07 – the tasks that change the size, so that the budget of the pipeline is the budget of the site as it is after them.

## Files / Areas Expected To Change

- `.github/workflows/ci.yml`
- `package.json`

## Implementation Guidance

1. **The step of the build is three lines.** `run: npm run build` with the step named `Build`. It is the step that was missing, and it is the reason the configuration of M20.01 and of M21.07 could have broken without the pipeline saying anything.
2. **The budget comes after the build.** The script of M21.01 reads `.next/`, so it needs the build that has just been made. When the build fails, the step of the budget does not run, and the pipeline stops on the build.
3. **The budget is the same on the machine and in the pipeline.** One file of numbers, one script, one command. A budget that is written in the workflow is a budget that is different from the one the developer checks, and the developer is the one who breaks it.
4. **The free tier is respected.** The runner of GitHub Actions is free for the repositories of a person, and the minutes of it are limited. The build of a Next.js site takes about a minute. The budget adds seconds. Lighthouse would add minutes and a Chrome, and that is the reason the recommendation leaves it out.
5. **The step of the build catches what the tests cannot.** The test runner cannot load a route of the framework, because the routes import their modules with the `@/` alias. A route that does not compile is caught by the build and by nothing else. This is the same reason the verification scripts of M19 and M20 exist.

## Acceptance Criteria

- The pipeline runs the build, and the pipeline fails when the build fails.
- The pipeline runs the budget, and the pipeline fails when a measure is over its ceiling.
- The lint, the typecheck and the tests keep running, in the same order, and they still fail the pipeline.
- No dependency was added for the pipeline, and no Chrome is installed on the runner.
- The order of the steps is install, lint, typecheck, tests, build, budget.
- The budget that the pipeline checks is the budget of M21.01 and is in the same file as the one the developer checks.
- The workflow is valid YAML and the steps are named the way the others are named.

## Testing Requirements

- Manual: the workflow was read line by line and every step was checked against the commands of `package.json`.
- Manual: the pipeline was run on a branch and it passed with the build and the budget in it.
- Manual: the budget was broken on purpose in a branch, the pipeline failed with the name of the rule, and the file was put back and the sum of its bytes was checked.
- Manual: a change that breaks the build was made in a branch, the pipeline failed at the build, and the change was undone.

## Security / Privacy Considerations

- The pipeline holds the same secrets as it holds today, and the task adds none. No token, no key and no DSN is put in the workflow.
- The build of the pipeline sends the source maps to Sentry only when the token of the build is in the environment of the deployment, and that is the configuration of the owner. The task does not put a token in the workflow.
- The budget prints numbers and the names of the chunks. It prints nothing that is private.

## Performance / Accessibility Considerations

- The pipeline is a little longer and it is still under the minutes that the free tier gives.
- The budget that runs on every push is the check that keeps the site fast, and it is much cheaper than the check of the scores of Lighthouse.

## Definition of Done

- The pipeline builds the site and checks the budget.
- The pipeline still runs the lint, the typecheck and the tests, and it still fails when they fail.
- No dependency was added and no browser is installed on the runner.
- The workflow is valid and was run on a branch.
- The decision about Lighthouse is written in `DECISIONS.md`.

## Related Requirements

- ROADMAP Milestone 21 – the measurement of the performance
- PRD §130 – Lighthouse and the bundle analysis
- TODO (M20.09) – the CI does not build the site
- DECISIONS – the free tier and the minimal infrastructure
- M21.01 – the budget that the pipeline checks
