# M21.09 – Run Lighthouse Against the Built Site and Check the Four Targets

## Objective

Measure the site with the tool that everybody uses to measure a site, write the four scores and the three numbers down, and say plainly which targets are met and which are not.

## Context

PRD §108 gives the targets:

```
Performance: 90+
Accessibility: 95+
Best Practices: 95+
SEO: 95+
```

and PRD §74 gives the three numbers:

```
LCP < 2.5 s, CLS < 0.1, INP < 200 ms
```

ROADMAP M21 has the same three numbers as its definition of done.

Nothing has been measured yet. The measurements of M21.01 are the size of what is sent; the numbers of Lighthouse are what the browser does with it. The two are not the same thing, and the second is the one that the definition of done of the milestone names.

**The decision that needs a person.** How Lighthouse is run.

- **The recommendation is `npx lighthouse` on demand.** Nothing is added to `package.json`; the tool is fetched when it is needed and it is not part of the repository. It needs Chrome on the machine, which the developer has.
- `@lhci/cli` as a dependency would make the check part of the pipeline. It is heavy, it brings Chrome with it, and the numbers it gives in the pipeline are the numbers of the machine of the pipeline. The decision is carried by M21.08 and it is the same decision.
- The real numbers of PRD §74 come from a real phone on a real connection. Lighthouse on a laptop is a measurement of a machine that is not a phone of the middle. **Both numbers are written down, and the truth of the targets is read on a phone.** The steps of the phone are in `TODO.md`.

## Requirements

### 1. The site is measured with the same tool, the same way, every time

- A script or a written procedure measures the **production build** of the site, the way `npm start` serves it, and not the development server.
- The measurement is made against the local production server, with the command line and the settings written down, so that the numbers can be taken again and compared.
- The routes that are measured are the home page, the page of the projects, the page of the resume and the page of the contact. They are the four a visitor lands on.
- The measurement is made twice for the home page, so that the numbers of a cold cache and of a warm one are both known.

### 2. The four scores and the three numbers are written down

- The document of the results holds the four scores of Lighthouse for every route that was measured, the three numbers of PRD §74 for the home page, the date, the version of the tool, the version of the browser and the settings.
- The document says which targets are met and which are not. A target that is not met is written down as a target that is not met, with the number that was measured and the reason that is known.
- The document holds the size of what was sent as well, so that the numbers of Lighthouse and the numbers of M21.01 can be read together.

### 3. The targets are checked, and the ones that are not met are not hidden

- The rule of the budget of M21.01 holds: the size did not go up.
- The scores of the accessibility, of the best practices and of the SEO are **not allowed to go down** because of a change of the performance. PRD §108 says it in as many words, and the milestone is allowed to trade the picture of the site against nothing.
- A score of the accessibility under 95 is a finding for M22, the milestone of the accessibility, and it is written down in `TODO.md` with the number and the page.
- A score of the SEO under 95 is a finding for this milestone, because the SEO of the site is part of the definition of done, and it is fixed by the tasks of M21.

### 4. The result is repeatable

- The procedure is written down so that a person can take the measurement again in a month and compare the numbers.
- The measurement is not part of the pipeline, and the pipeline keeps the budget of M21.08.

## Scope

### In scope

- `scripts/measureLighthouse.mts` (new) or a written procedure in `docs/`
- `docs/performance-results.md` (new)
- `docs/performance-baseline.md` (the numbers of the result added to it)
- `TODO.md` (the findings that belong to another milestone)

### Out of scope

- Every change to the site. A score that is not met is a finding, and the fix of a finding is a change of its own.
- The pass of the accessibility of PRD §131, which is M22. M21.09 writes down what it found and hands it over.
- The security audit of PRD §132, which is M23.
- The measurement on a real phone, which is the owner's and is written down in `TODO.md`.
- The pipeline, which keeps the budget of M21.08 and does not run Lighthouse.

## Dependencies

- M21.02 – the lazy loading, which is the change the numbers are about.
- M21.08 – the build and the budget in the CI, which has to be in place before the last measurement.

## Files / Areas Expected To Change

- `scripts/measureLighthouse.mts` (new)
- `docs/performance-results.md` (new)
- `docs/performance-baseline.md`
- `TODO.md`
- `package.json` (the command, if there is one)

## Implementation Guidance

1. **The measurement is against the production build.** `npm run build` and then `npm start`, and the tool is run against `http://localhost:3000`. The development server is much slower and its numbers say nothing about the site.
2. **The tool is run on demand.** `npx lighthouse` fetches the tool when it is needed. Nothing is added to `package.json`, and the repository stays the same size. The command that was used is written down, with the flags, so that the next person takes the same measurement.
3. **The flags are the same every time.** The form of the phone, the throttling of the connection and the number of runs are written down in the document of the results. A number that was taken with a different setting is not comparable with a number that was taken with another one.
4. **The four routes are measured.** The home page is the one that the definition of done of the milestone names, and the three others are the pages a visitor lands on from it.
5. **The script is a script of the machine.** It runs the tool, it reads its answer, it prints the numbers and it writes them in the document. It never fails the pipeline, because the pipeline does not run it.
6. **A target that is not met is written down as a target that is not met.** The document of the results is a report and not a certificate. The rule of the repository is the same as the one of M20.09: the script prints the name of the rule that failed and never prints a value that is private. The numbers of a Lighthouse run are not private at all.

## Acceptance Criteria

- The four routes are measured against the production build, with the command and the settings written down.
- The four scores and the three numbers of PRD §74 are written down, with the date, the version of the tool and the version of the browser.
- The document says which targets are met and which are not, with the number that was measured.
- The scores of the accessibility, of the best practices and of the SEO are written down for every route that was measured.
- A score of the accessibility under 95 and a score of the SEO under 95 are written down in `TODO.md` with the page and the number.
- The rule of the budget of M21.01 holds after the whole milestone.
- The procedure is written down so that the measurement can be taken again and compared.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Testing Requirements

- Manual: the measurement was taken against the production build, with the home page measured twice.
- Manual: the four routes and the four scores were read in the output of the tool.
- Manual: the numbers of the results were compared with the numbers of the baseline of M21.01, and the difference is written down.
- Manual: the numbers were taken again on the same build and they are the same to within the noise of the machine.
- The whole suite, the lint, the typecheck and the build were run after the milestone and they pass.

## Security / Privacy Considerations

- The measurement is made against the local server of the machine. Nothing is sent to a third party except the request that the tool makes to the site it measures.
- The tool writes its report into a file of the machine and then into a document of the repository. The document holds numbers and the names of the pages. It holds no body, no cookie, no address of a visitor and no credential.
- The measurement of the real site, on the deployment of the owner, is the same, and the tool may be run against the address of the site with the same care.
- Nothing of the output of the tool is copied into a chat or into a ticket.

## Performance / Accessibility Considerations

- This is the task that holds the milestone to its definition of done. PRD §74 and PRD §108 are the numbers, and they are written down as they were measured.
- The three numbers of PRD §74 are the hardest part. A laptop with a fast connection and a fast processor is not a phone of the middle, and the difference between the two is often a factor of three. The numbers of Lighthouse are therefore written down with the settings, and the truth of the targets is read on a phone, whose steps are in `TODO.md`.
- The scores of the accessibility and of the SEO are not allowed to go down. A site that is faster and that cannot be used is not faster.

## Definition of Done

- The four scores and the three numbers are written down, with the way they were taken.
- The targets that are met and the targets that are not met are written down.
- The findings that belong to another milestone are in `TODO.md`.
- The procedure can be taken again by somebody else.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Related Requirements

- PRD §74 – LCP < 2.5 s, CLS < 0.1, INP < 200 ms
- PRD §108 – Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+
- ROADMAP Milestone 21 – the definition of done of the milestone
- PRD §131, §132 – the accessibility and the security, which M22 and M23 own
- M21.01 – the measurement of the size, which the numbers are read together with
- M21.08 – the budget in the pipeline
