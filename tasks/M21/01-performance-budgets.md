# M21.01 – Measure the Site and Write the Performance Budgets

## Objective

Write down what the site sends to a visitor, so that the rest of the milestone can be judged by numbers instead of by feeling, and so that a change that makes the site heavier is caught by the pipeline instead of by a visitor.

## Context

ROADMAP M21 asks for the bundle analysis. PRD §130 asks for Lighthouse and for the bundle analysis. PRD §74 gives the targets of the site:

```
LCP < 2.5 s, CLS < 0.1, INP < 200 ms
```

None of those three numbers can be read from the source code. They are the result of what the browser receives, what it parses and what it runs. So the first task of the milestone is not a change of the site: it is the measurement that the other eight tasks are judged against.

The site has never been measured. What was read on 2026-11-12, on a production build of this repository:

- The home page sends **fifteen JavaScript files and 1,304.8 kB** in its first load. The largest are 277.2 kB, 230.4 kB and 192.6 kB.
- The whole of `.next/static/chunks` is **17 MB in twenty-seven files**, 1,965,463 bytes in total. Most of it never reaches the home page.
- The runtime of the animation library is a **136 kB** chunk of the first load of every page.
- A **40 kB** chunk holds the one icon of `lucide-react`.
- The CSS of the site is one file of 38 kB.
- There are ten `woff2` files of about 120 kB, of which **two are preloaded on every page**.
- The HTML of the home page is 121,855 bytes, and **18,911 bytes** compressed.
- There is **no raster image** in the site at all.

Those numbers are the baseline. The budget is the ceiling that the other tasks bring them under.

**The decision that needs a person.** How Lighthouse is run. `@lhci/cli` in the repository makes the check part of the pipeline, and it is a heavy dependency that brings Chrome with it. `npx lighthouse` runs it on demand and adds nothing to `package.json`. **The recommendation is `npx lighthouse` on demand**, and only the size budget in the CI, so that the pipeline stays fast. The decision is carried by M21.08 and M21.09; this task builds the part that does not need it.

## Requirements

### 1. A script that measures the built site

Create `scripts/measurePerformance.mts` and the command `npm run perf:budget`:

- It reads the output of a build (`.next/`), not the source. The measurement has to see what a visitor receives.
- It measures, per route of the application:
  - the JavaScript of the first load, taken from the scripts that the HTML of the route names, so that the chunks that are loaded late are not counted;
  - the CSS of the route;
  - the fonts that the route preloads;
  - the number and the size of the pictures the route sends (there are none today, and the script has to say so rather than fail);
  - the size of the HTML, compressed and not compressed.
- It measures, for the whole build:
  - the total size of the client JavaScript and the size of the largest chunk, with the name of the chunk;
  - the total size of the CSS;
  - the total size and the number of the font files.
- It reads the `Cache-Control` of the routes and of the files of `public/` and says which ones are not cached the way they are used.
- It never fails because a file is missing. It says what it did not find, because a missing file is a finding, not a crash.

### 2. The budgets are written down and are checked

- The budgets live in one file of the repository, with a number for every measure and a comment that says what the number came from.
- The script compares what it measured with the budget and **exits with a non-zero code** when a measure is over its ceiling, printing the name of the rule, the number that was measured and the number that was allowed. It prints the value it found, never a secret: the measurement holds no secret and no body of a visitor.
- A measure that is not in the budget is reported and not failed. The budget grows when the site grows, and it grows on purpose.
- The script works when the build is missing and says so with a clear message and a non-zero code, rather than a stack of a script.

### 3. The baseline is written down for a person to read

- A short document, `docs/performance-baseline.md`, holds the numbers of the build that was measured, the date, the way the numbers were taken, and the reading of them: what is heavy and why.
- It names the three things that are the largest, and it says that they are the subjects of M21.03, M21.04 and M21.05.

### 4. The measurement costs nothing at the run time of the site

- The script is a script of the machine. Nothing of it is imported by the site, and no part of it is in the bundle of the browser.
- It reads the build from the disk and it makes no request to the network.

## Scope

### In scope

- `scripts/measurePerformance.mts` (new)
- `src/lib/performance/budgets.ts` (new) — the numbers of the ceilings
- `src/lib/performance/budgets.test.mts` (new)
- `src/lib/performance/index.ts` (the exports)
- `docs/performance-baseline.md` (new)
- `package.json` (the command `perf:budget`)

### Out of scope

- Every change to the size of the bundle. M21.02 to M21.07 make the site smaller; this task only measures it and writes the ceiling.
- Lighthouse itself, which is M21.08 and M21.09.
- Any change to the build, to the configuration of Next.js or to the code of the site.
- Any new dependency. The script reads the build with the tools of Node.

## Dependencies

- M20 – the site that is measured is the site of M20.
- Nothing else. This is the first task of the milestone.

## Files / Areas Expected To Change

- `scripts/measurePerformance.mts` (new)
- `src/lib/performance/budgets.ts` (new)
- `src/lib/performance/budgets.test.mts` (new)
- `src/lib/performance/index.ts` (new)
- `docs/performance-baseline.md` (new)
- `package.json` (the script `perf:budget`)

## Implementation Guidance

1. **The measurement is the model of the other scripts of the repository.** `scripts/verifyAnalytics.mts` and `scripts/verifyMonitoring.mts` read the site and print what they found and exit with a non-zero code when a rule fails. This script reads the build and does the same: the name of the rule, what was found, the number that was allowed, and the exit code.
2. **The first load is read from the HTML of the route, not from the manifest.** The HTML of a prerendered route holds the `src` of every script of the first load, and that is exactly what the browser downloads first. The manifest of the build holds more, because it holds the chunks that are loaded later.
3. **The route is asked for its HTML.** The script starts the production server the way `npm start` does, asks for each route of `prerender-manifest.json` and for `/`, and reads the scripts out of the answer. When the server cannot be started it says so and exits with a non-zero code, and the numbers of the build are still printed.
4. **The budget is a map of numbers with a name.** Each measure has a name that says what it is (`first-load-js-home`), a number and a comment that says where the number came from and when. The script never guesses a name.
5. **The size of the first load of the home page is the measure that matters most.** It is the page a visitor lands on, and it is the one that has to fall under the ceiling of M21.02 and M21.03.
6. **The rules of the privacy of M20 apply here too.** The script reads a build and a local server; it never asks a visitor anything and it prints no body, no cookie and no address of a visitor.

## Acceptance Criteria

- `npm run perf:budget` prints the JavaScript, the CSS, the fonts, the pictures and the HTML of every route, and the totals of the build.
- The first load of the home page is measured from the scripts of its HTML and not from the whole of the build.
- The command exits with a non-zero code when a measure is over its ceiling and prints the name of the rule, the value and the ceiling.
- The command exits with a non-zero code and a clear message when the build is missing.
- The command exits with 0 when every measure is under its ceiling.
- The ceilings live in one file, with a comment that says where each number came from.
- The document of the baseline holds the numbers, the date and the reading of them.
- Nothing of the measurement is imported by the site, and the bundle of the site is unchanged by this task.
- No dependency was added.
- The existing tests pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: a measure that is over its ceiling is a failure and the failure names the rule, the value and the ceiling.
- Unit test: a measure that is under its ceiling is not a failure.
- Unit test: a measure that is not in the budget is reported and is not a failure.
- Unit test: the script exits with a non-zero code when the build is missing.
- Manual: the script was run against the build of the repository and the numbers of the baseline were written down from its output.

## Security / Privacy Considerations

- The script reads a build and a server of the machine. It makes no request to a third party and it writes nothing outside the repository.
- The output of the script holds sizes, names of chunks and names of routes. It holds no body, no cookie, no address of a visitor and no credential.
- The budget file is a tracked file. It must hold nothing but numbers and comments.

## Performance / Accessibility Considerations

- The script is a script of the machine and is not part of the site. It has to be quick enough to be run before every commit of the CI, which means it must not start a server of its own for every measure and it must read the build once.
- The measurement of the first load is the one that matters. A budget on the total size of the build would be a budget on the seventeen megabytes that nobody downloads, and it would not move at all when the site changes.

## Definition of Done

- The site is measured and the numbers are written down.
- The ceilings are in one file and the script holds them.
- The command is `npm run perf:budget`, it prints what it found and it fails with a non-zero code when a measure is over its ceiling.
- The document of the baseline exists and names the three heaviest things.
- No dependency was added and no code of the site was changed.

## Related Requirements

- ROADMAP Milestone 21 – Performance Optimisation (the bundle analysis)
- PRD §130 – Lighthouse, bundle analysis
- PRD §74 – the targets the measurement is judged against
- PRD §108 – the targets of Lighthouse
- TODO (M20.09) – the CI does not build the site
