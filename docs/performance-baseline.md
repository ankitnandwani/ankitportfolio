# The baseline of the performance

The numbers of the site, read on a production build of this repository, with the
command that reads them and the reading of them.

The date of the measurement: **2026-11-12**.

The command:

```bash
npm run build
npm run perf:budget
```

The script reads the output of the build, starts the production server on the
port 3111, asks it for the HTML of every page and for the headers of the files
of `public/`, and compares what it found with the ceilings of
`src/lib/performance/budgets.ts`. It exits with a non-zero code when a measure
is over its ceiling. Nothing of it is imported by the site.

## The build

| What | How much | In how many files |
| Client JavaScript | 1,993,243 bytes (1.90 MB) | 31 |
| The biggest chunk | 483,541 bytes (472.2 kB) | 1 |
| CSS | 40,892 bytes (39.9 kB) | 3 |
| Fonts | 146,464 bytes (143.0 kB) | 11 |

The biggest chunk of the build is `429_hlqxh59b_.js`, and it is the SDK of the
monitoring. It is loaded on its own and it is not part of the first load of a
page.

## The pages

| Page             | JavaScript of the first load          | CSS          | Fonts preloaded  | HTML          | HTML compressed | Pictures |
| ---------------- | ------------------------------------- | ------------ | ---------------- | ------------- | --------------- | -------- |
| `/`              | 1,313,834 bytes (1.25 MB) in 15 files | 38,846 bytes | 1 (29,288 bytes) | 120,694 bytes | 18,906 bytes    | 0        |
| `/contact`       | 1,273,376 bytes (1.21 MB) in 15 files | 37,975 bytes | 1 (29,288 bytes) | 25,168 bytes  | 5,552 bytes     | 0        |
| `/design-system` | 978,548 bytes (955.6 kB) in 14 files  | 40,021 bytes | 2 (52,396 bytes) | 35,335 bytes  | 6,405 bytes     | 0        |
| `/job-fit`       | 854,376 bytes (834.4 kB) in 13 files  | 40,892 bytes | 2 (52,396 bytes) | 22,082 bytes  | 5,365 bytes     | 0        |
| `/projects`      | 1,142,973 bytes (1.09 MB) in 14 files | 38,846 bytes | 1 (29,288 bytes) | 60,038 bytes  | 8,668 bytes     | 0        |
| `/resume`        | 996,809 bytes (973.4 kB) in 14 files  | 37,975 bytes | 1 (29,288 bytes) | 55,821 bytes  | 8,632 bytes     | 0        |

The numbers of this table are the ones of **2026-11-17**, after M21.05. The chat and the
command palette are loaded on demand, the first load of every page is **20,490 bytes
lighter** than it was on 2026-11-12, and **four pages of the site do not download the family
of the monospaced letters any more**.

`/projects/[slug]` is not in the table. The page is made on every request and it
needs a name that only the owner knows, so the script says that it did not
measure it instead of guessing.

## What the animation library cost, and what it costs now

The runtime of the library is the chunk `3w5-_4vl8rau8.js`, **134,285 bytes**. It
was in the first load of **every** page of the site, because `app/layout.tsx`
and the first section of the home page imported the library directly.

**M21.03 moved it out of the pages that do not animate.** The library now enters
the site through one module, `src/components/motion/`, the motion of the layout
is CSS, and the motion of the components that do not need the library is CSS.
The pages that animate keep their animation exactly as it was.

The two states were measured the same way, on the same machine, with the same
command:

| Page             | The first load before | The first load after | What it saved |
| ---------------- | --------------------- | -------------------- | ------------- |
| `/`              | 1,316,402 bytes       | 1,314,634 bytes      | 1,768 bytes   |
| `/contact`       | 1,274,920 bytes       | 1,274,176 bytes      | 744 bytes     |
| `/design-system` | 984,118 bytes         | 978,894 bytes        | 5,224 bytes   |
| `/job-fit`       | 994,609 bytes         | **854,715 bytes**    | 139,894 bytes |
| `/projects`      | 1,284,306 bytes       | **1,143,773 bytes**  | 140,533 bytes |
| `/resume`        | 1,002,833 bytes       | 997,609 bytes        | 5,224 bytes   |

`/projects/[slug]` is not in the table. Its source was measured: it does not
animate either, and the runtime is not in its first load.

**The CSS went up by 1,904 bytes** and the JavaScript of the build went **down**
by 12,195 bytes. The motion of the site moved from the library to the
stylesheet, and the 1,904 bytes of CSS were traded for the 134,285 bytes of
JavaScript that the pages that do not animate no longer download. The ceiling
of the CSS went from 40,000 to 41,000 bytes, with the reason in the note of the
rule of `src/lib/performance/budgets.ts`.

**The rule that holds it in place** is in `npm run perf:budget`. It reads the
source of the site, finds out which pages use the library, and fails when the
library is imported without the module, when the files that are in every page
use the library, or when a page that does not animate carries the runtime.

## What the families of the fonts cost, and what they cost now

Two families are loaded by `next/font/google`: **Geist**, the family of the text of the
site, and **Geist Mono**, the family of the monospaced letters. The build holds **eleven
files of fonts, 146,464 bytes**, and the browser downloads **one file of each family**,
because the other ten files are for the alphabets that the site does not use and the
browser asks for a file only when a letter of it is on the page.

The layout of the site gave the variable of the family of the monospaced letters to the
`html`, and the `html` is every page, so **every page of the site preloaded the family of
the monospaced letters** for the sake of the value of a token of the design system and of
the description of a job.

**M21.05 moved the family to the pages that use it.** The layout loads `Geist` and nothing
else, and the family of the monospaced letters enters the site through `src/lib/fonts.ts`,
which the page of the design system and the page of the analyzer of a job import.

| Page             | The fonts before | The fonts after  | The CSS before | The CSS after | What the first load saved |
| ---------------- | ---------------- | ---------------- | -------------- | ------------- | ------------------------- |
| `/`              | 2 — 52,396 bytes | 1 — 29,288 bytes | 40,699 bytes   | 38,846 bytes  | **24,961 bytes**          |
| `/contact`       | 2 — 52,396 bytes | 1 — 29,288 bytes | 39,828 bytes   | 37,975 bytes  | **24,961 bytes**          |
| `/design-system` | 2 — 52,396 bytes | 2 — 52,396 bytes | 39,828 bytes   | 40,021 bytes  | —                         |
| `/job-fit`       | 2 — 52,396 bytes | 2 — 52,396 bytes | 40,699 bytes   | 40,892 bytes  | —                         |
| `/projects`      | 2 — 52,396 bytes | 1 — 29,288 bytes | 40,699 bytes   | 38,846 bytes  | **24,961 bytes**          |
| `/resume`        | 2 — 52,396 bytes | 1 — 29,288 bytes | 39,828 bytes   | 37,975 bytes  | **24,961 bytes**          |

The saving is the file of the family of the monospaced letters (23,108 bytes) and the rules
of the family in the file of the CSS that every page loads (1,853 bytes). The two pages that
use the family got 193 bytes of CSS heavier, because the rules of the family are in the
file of the CSS of those two pages now.

**The rule that holds it in place** is in `npm run perf:budget`. It reads the CSS of the
build and the HTML of every page, and it fails the run when a page preloads a family that
it does not use, when the shell of a page — the `html` and the `body` of the layout — holds
more than one family of fonts, or when the family of the site is not preloaded by a page.
The rule is in `src/lib/performance/fontPreloads.ts`.

## The three heaviest things

**The first thing is the runtime of the animation library: 134 kB.** The chunk
`3w5-_4vl8rau8.js` holds the marker of Framer Motion. It was in the first load
of every page of the site, and **M21.03 took it out of the pages that do not
animate**: it is in the first load of `/`, `/contact`, `/design-system` and
`/resume`, and it is not in the first load of `/job-fit`, `/projects` and
`/projects/[slug]`. The library is used in twenty-three files and it is the one
of the decision of the site, so the dependency stays.

**The second thing was the chat and the command palette, which were in the
first load of every page.** `app/layout.tsx` imports `ChatWrapper` and
`CommandPalette` directly, so the chat of the AI and the palette of the
commands were downloaded by every visitor of every page, whether they open them
or not. **M21.02 moved them**: the launcher of the chat and the key of the
palette are still in the first load, and the panel of the chat and the body of
the palette are fetched when they are opened. They render nothing when they are
closed, so no content of the site was lost by loading them late.

**The third thing was one icon: 40 kB. It was not one icon, and the
measurement said so.** The baseline of 2026-11-12 named the chunk
`2v3vhzx7k47gb.js` as the chunk of `lucide-react`, which is used in exactly one
file, `src/components/navigation/ThemeToggle.tsx`. **M21.04 read the chunk and
found that it was not the library of icons**: it is the chunk of the layout of
the site, and it holds

| What is in the chunk                                         | Bytes  |
| ------------------------------------------------------------ | ------ |
| The colours of the theme and the tokens of the design system | 19,010 |
| The navigation bar and its links                             | 8,147  |
| The theme button and the icons of the two libraries          | 3,681  |
| The footer, the palette, the chat and the rest of the layout | 2,353  |

The code of `lucide-react` in it was **2,300 bytes**, and removing the library
saved **800 bytes** on every page and not forty kilobytes. The site has one
library of icons now, and the biggest thing in the first load of every page is
the theme of the design system, which is an item of `TODO.md` for a later task
of the milestone.

The fonts came next, and **M21.05 moved them**: the family of the monospaced letters is
loaded by the two pages that use it and by no other page, and the four pages that do not
use it are 24,961 bytes lighter. The family of the text of the site is still loaded in the
layout and still preloaded on every page.

The planning expected the three heaviest things to be the subjects of M21.03,
M21.04 and M21.05. The measurement showed that the chat and the palette are
heavier than the fonts, so the three heaviest things are the subjects of
M21.02, M21.03 and M21.04, and the fonts come next with M21.05. The third of
them turned out to be smaller than the planning said, and the theme of the
design system took its place.

## What the site sends to a visitor

- **There is no picture in the site.** No `<img>`, no `next/image`, only the SVG
  of the icons. The picture of the social networks that every page announces
  (`/og-image.png`) answers 404 today.
- **The chat is the first-party feature of the site.** The button that opens it
  is in the first load of every page, and the panel itself is fetched when the
  chat is opened (M21.02).
- **The analytics of M19 is already loaded on its own** and is not part of the
  first load. The part of PRD §74 that asks for it is satisfied.

## The cache

| What | The header today | How it is used |
| The pages | `s-maxage=31536000` | The platform keeps them for a year, with nothing that says what to do with an old copy |
| The code and the fonts of `/_next/static/` | `public, max-age=31536000, immutable` | The name of the file holds the sum of its bytes, so it never changes under that name |
| The files of `public/` | `public, max-age=0` | The browser asks for them on every visit |
| The icon of the site | `public, max-age=0, must-revalidate` | The browser asks for it on every visit |
| `POST /api/chat` | no header at all | The answer is not marked |
| `POST /api/contact` | `no-store` | The answer is not kept |
| `POST /api/job-fit` | `no-store` | The answer is not kept |
| `POST /api/feedback` | no header at all | The answer is not marked |
| `POST /api/analytics` | `no-store` | The answer is not kept |

**The answers of the chat and of the feedback are not marked.** The stream of
the chat and the answers of the form carry `no-store` or `no-cache` on some
paths and carry nothing on the others, and an answer without a header may be
kept by a browser on its own. The task that sets the rule of the cache is
**M21.07**.

## What the lazy loading of the sections costs and what it gives

The sections of the home page were measured in both ways on 2026-11-15.

| What was done                                                        | The first load of the home page | The HTML of the home page |
| -------------------------------------------------------------------- | ------------------------------- | ------------------------- |
| Nothing (the state of 2026-11-12)                                    | 1,336,092 bytes                 | 121,855 bytes             |
| `next/dynamic` with the server rendering on                          | 1,340,000 bytes                 | 121,855 bytes             |
| `next/dynamic` with the server rendering off, behind a viewport gate | 1,007,500 bytes                 | 15,156 bytes              |

The second row is the one the plan of M21.02 assumed: the chunks are split, the
browser downloads all of them anyway, and the site got three kilobytes heavier.

The third row is the one that saves 319 kB: the content of the seven sections
of the page is not in the HTML any more. A visitor without JavaScript sees an
empty page, and a crawler sees a page with no work and no experience in it.
PRD §75 asks that the site stays useful when the JavaScript partly fails, and
that the core content stays accessible.

**The two cannot both be had in the App Router.** A client component that the
server writes in the HTML has to be hydrated, and the browser has to download
its code to do it. The only way to have the content in the HTML and no code in
the first load is to write the sections as server components and to leave the
animation to CSS, which is a change of the design and a decision of the owner.

## How the numbers are to be read

- **The ceiling of the budget is a limit, not a number.** It is a little above
  the size of today, so that a build that is a little different does not fail
  the pipeline. A size that goes down never fails a rule.
- **A measure that is new is reported and is not a failure.** The budget grows
  on purpose.
- **The numbers of the target of PRD §74 are not in this document.** LCP, CLS
  and INP depend on the device and on the connection of the reader, and they
  are measured with Lighthouse in M21.09 and on a real phone by the owner.
