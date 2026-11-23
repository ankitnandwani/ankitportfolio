# M21.05 – Load Only the Font Family That the Page Uses

## Objective

Stop downloading the family of the monospaced letters on every page of the site, when only one page of the site uses it.

## Context

PRD §130 asks for the font optimisation, and ROADMAP M21 asks for it with the bundle analysis.

`app/layout.tsx` loads two families of Next.js:

```tsx
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
```

and puts both in the `class` of the `html`:

```tsx
<html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
```

The variable `--font-geist-mono` is used in **exactly one place** in the whole repository: `app/design-system/page-client.tsx:64`, where the family that a token of the design system holds is printed. `app/globals.css:12` maps `--font-mono` to it.

What that costs, measured on 2026-11-12 on a production build:

- **Ten `woff2` files, about 120 kB in total**, in the build.
- **Two of them are preloaded on every page**: `797e433ab948586e-s.p.0r6juujl39pe6.woff2` and `caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2`. One of them is the family of the monospaced letters, and it is preloaded on every page of the site for the sake of one line of one page.
- All eleven faces of the site use `font-display: swap`, which is right and is not changed here.

The fonts come from `next/font/google`, so they are downloaded at the time of the build and served from the site itself. No request leaves the site at the run time, and no font of a third party is loaded from a page of a third party.

## Requirements

### 1. The family of the monospaced letters is loaded only by the page that uses it

- The family of the monospaced letters is not in the first load of the pages that do not use it.
- The page of the design system shows the family exactly as it shows it today, and the value of the token is printed in the same monospaced letters.
- The variable `--font-geist-mono` keeps its name and its meaning, so that the CSS of the site does not change and a class of Tailwind that asks for it keeps working.

### 2. The family of the site is loaded once and is not loaded twice

- The family of the site is loaded in the layout, the way it is today.
- The pages that need the family of the monospaced letters do not load it a second time by another way.

### 3. The rule of the preloads

- A rule checks that the family of the monospaced letters is not preloaded on a page that does not use it.
- The preload of the family of the site stays, because it is the text of the page.

### 4. The size that is saved is measured

- The size of the first load of the home page before and after is written down, and the number of the preloaded fonts of each page is written down too.
- The rule of M21.01 holds after the change.

## Scope

### In scope

- `app/layout.tsx` (the loading of the two families)
- `app/design-system/page.tsx` and `app/design-system/page-client.tsx` (the page that uses the family)
- `app/globals.css` (the mapping of the variables, if it has to change)
- The rule that checks the preloads of the fonts
- `docs/performance-baseline.md` (the number before and after)

### Out of scope

- The typeface itself. The site keeps Geist for its text and Geist Mono for the monospaced letters.
- The `font-display: swap`, which is already right.
- Any other font, and any addition of a font. A new family is a change of the design and is not part of this milestone.
- The preloading of the family of the site, which is the text of the page and has to stay.

## Dependencies

- M21.01 – the size of the first load is measured before and after.
- Nothing else. The task can be done in parallel with M21.04, M21.06 and M21.07.

## Files / Areas Expected To Change

- `app/layout.tsx`
- `app/design-system/page.tsx`
- `app/design-system/page-client.tsx`
- `app/globals.css`
- `src/lib/performance/` (the rule of the preloads)
- `docs/performance-baseline.md`

## Implementation Guidance

1. **The family of the monospaced letters belongs to the page that uses it.** `next/font/google` puts the variable of a family in the `class` of the element it is given to. The layout gives its variable to the `html`, which is every page. The page of the design system can give its variable to the element that prints the token, and then the family is loaded by that page and by no other.
2. **The variable keeps its name.** The rule of the CSS is `--font-mono: var(--font-geist-mono)`. If the variable of the layout is not there any more, the rule has to point at the variable of the page, or the page has to give its own variable. The class `font-mono` of Tailwind has to keep working on that page.
3. **The page of the design system is a server component that renders a client component.** `app/design-system/page.tsx` is the server part and `app/design-system/page-client.tsx` is the client part. The variable of the family can be given by the server part to the client part, or the client part can hold the family itself. The second is simpler and it keeps the family out of the pages that do not use it.
4. **The check is made on the build.** The HTML of the home page names the fonts it preloads, and the rule reads it. The number of the preloaded fonts of the page of the design system is allowed to be three, and the number of every other page is allowed to be two.
5. **The size of the family is the size of the family.** The monospaced family is about 20 kB of the ten. The saving is that one preloaded font and the bytes of the family on every page, and the number that is written down is the one that the measurement gives.

## What the implementation changed

The task was carried out on 2026-11-17.

**The family of the monospaced letters is loaded by the two pages that use it, and by no other page.** `app/layout.tsx` loads `Geist` and nothing else. The family of the monospaced letters enters the site through `src/lib/fonts.ts`, and the two pages that use it import that module: the page of the design system, that prints the value of a token of the design system in it, and the page of the analyzer of a job, that shows the description of the job in it.

**The plan said one page, and the measurement found two.** The plan named `app/design-system/page-client.tsx:64` as the only place of the whole repository that uses the family. The `<pre>` of `src/components/jobFit/JobFitResults.tsx:257` shows the description of the job that is analysed, and the preflight of Tailwind gives the monospaced letters of a `<pre>` the family of the theme, so that page uses the family as well. **It keeps it**, and the letters of the description of a job look exactly as they looked.

**The family of the site is loaded once, in the layout, and it is preloaded as it was.** The variable `--font-geist-sans` and the file `caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2` are on every page of the site, and no page loads the family of the monospaced letters by another way.

**The variable keeps its name and its meaning.** `--font-geist-mono` is still the variable of the family of the monospaced letters, the class `font-mono` of Tailwind still works, and the rule of the CSS that points at the variable is still `--font-mono`. The mapping gained a fallback, `ui-monospace, monospace`, so that a page that asks for the monospaced letters without loading the family still shows monospaced letters.

**The letters that ask for the monospaced family take the family of the page.** The preflight of Tailwind reads the family of the monospaced letters at the root of the document, where the variable of the family is not there any more, and the family of a page that does not load it was the family of the system. A rule in `app/globals.css`, in the layer of the base, gives `code`, `kbd`, `samp` and `pre` the variable of the page, and a class of Tailwind that asks for another family still wins.

**The rule of the preloads is in place.** `src/lib/performance/fontPreloads.ts` reads the CSS of the build and the HTML of every page, and `npm run perf:budget` fails the run when

- a page preloads a family that neither the shell of the page nor its content uses;
- the shell of a page — the `html` and the `body` of the layout — holds more than one family of fonts, which is the way the family of the monospaced letters came back into every page;
- the family of the site is not preloaded by a page.

The rule has its own tests: eleven of them.

**The size that was saved is written down.**

| Page             | The fonts before | The fonts after  | The CSS before | The CSS after | What the first load saved |
| ---------------- | ---------------- | ---------------- | -------------- | ------------- | ------------------------- |
| `/`              | 2 — 52,396 bytes | 1 — 29,288 bytes | 40,699 bytes   | 38,846 bytes  | **24,961 bytes**          |
| `/contact`       | 2 — 52,396 bytes | 1 — 29,288 bytes | 39,828 bytes   | 37,975 bytes  | **24,961 bytes**          |
| `/design-system` | 2 — 52,396 bytes | 2 — 52,396 bytes | 39,828 bytes   | 40,021 bytes  | —                         |
| `/job-fit`       | 2 — 52,396 bytes | 2 — 52,396 bytes | 40,699 bytes   | 40,892 bytes  | —                         |
| `/projects`      | 2 — 52,396 bytes | 1 — 29,288 bytes | 40,699 bytes   | 38,846 bytes  | **24,961 bytes**          |
| `/resume`        | 2 — 52,396 bytes | 1 — 29,288 bytes | 39,828 bytes   | 37,975 bytes  | **24,961 bytes**          |

The saving of the first load is the font that is not preloaded any more (23,108 bytes) and the CSS of the family that is not in the file that every page loads (1,853 bytes). The JavaScript of the whole build went from 1,992,328 to 1,993,243 bytes, and the CSS of the build went from 40,699 bytes in two files to 40,892 bytes in three files: the rules of the family of the monospaced letters are in the file of the CSS of the two pages that use it and not in the file that every page loads. The ceiling of the CSS did not move.

**The pages were opened and the text was looked at.** The page of the design system shows the value of the token in the family of the monospaced letters, in the same place and with the same size. The home page, the page of the resume and the page of the projects look as they looked. The browser was asked for the fonts of every page: the home page asks for one font and the page of the design system and the page of the analyzer ask for two.

**The value of the task is the one that is left.** Four pages of the site do not download a family they never draw, a rule says that a family belongs to the pages that use it, and the text of the site is the same as it was.

## Acceptance Criteria

- The family of the monospaced letters is not preloaded and not downloaded on the pages that do not use it. **Met**: `/`, `/contact`, `/projects` and `/resume` preload one font and ask the browser for one font. The two pages that use the family preload two.
- The page of the design system shows the family of the monospaced letters, and the value of the token is printed in it. **Met**: the page was opened on 2026-11-17 and the value of the token is printed in the family of the monospaced letters, in the same place and with the same size.
- The variable `--font-geist-mono` keeps its name and the class `font-mono` keeps working. **Met**: the variable is still `--font-geist-mono`, the rule of the CSS is still `--font-mono`, and the class of Tailwind still gives the family to the value of the token.
- The family of the site is loaded once, in the layout, and is preloaded as it is today. **Met**: `app/layout.tsx` loads `Geist` and nothing else, and every page preloads `caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2`.
- The rule of the preloads holds and fails when a page preloads a family it does not use. **Met**: the rule is in `src/lib/performance/fontPreloads.ts`, it has eleven tests, and the measurement fails the run when a page breaks it.
- The size of the first load of the home page is under the ceiling of M21.01, and the number before and after is written down. **Met**: the first load of the home page is 24,961 bytes lighter and the number of the preloaded fonts of every page is written down in `docs/performance-baseline.md`.
- The text of the site looks the same as it did, on every page. **Met**: the home page, the page of the resume and the page of the projects were opened, and the `<pre>` of the description of a job was checked in the browser: it asks for the file of the family of the monospaced letters, so the letters are the same as they were.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds. **Met**: 794 tests with 788 pass, 0 fail and 6 skipped; lint clean with 0 errors and the same 58 warnings; typecheck clean; the build succeeds.

## Testing Requirements

- Unit test: the rule of the preloads fails when the family of the monospaced letters is in the preloads of the home page, and passes when it is not.
- Manual: the page of the design system was opened and the family of the monospaced letters is there, in the same place and with the same size.
- Manual: the home page, the page of the resume and the page of the projects were opened and the text of the site looks the same as before.
- The measurement of M21.01 was run before and after, and the two numbers are written down.

## Security / Privacy Considerations

- Nothing changes in the data of the site. The fonts are served by the site itself and no request leaves it.
- The fonts are downloaded at the time of the build from the source of Next.js, and the result is written in the build. Nothing of a visitor is sent to the source of the typeface.
- The build is reproducible: the same lock file gives the same fonts.

## Performance / Accessibility Considerations

- The saving is one preloaded font and the bytes of the family on every page of the site.
- `font-display: swap` is the setting that keeps the text readable while the font arrives, and it stays. A font that is loaded late must never hide the text of the page.
- The monospaced letters of the page of the design system are a technical detail of that page, and they are the only place where the family is used.

## Definition of Done

- The family of the monospaced letters is loaded by the page of the design system and by no other page.
- The text of the site is the same as it was, and the page of the design system shows the family.
- The rule of the preloads is in place and holds.
- The measurement of M21.01 is under its ceiling, and the number before and after is written down.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Related Requirements

- PRD §130 – font optimisation
- ROADMAP Milestone 21 – image and font optimisation
- PRD §108 – the performance and the accessibility of Lighthouse, which the swap keeps
- M21.01 – the measurement that judges this task
