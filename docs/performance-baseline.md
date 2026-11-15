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
| Client JavaScript | 1,965,463 bytes (1.87 MB) | 27 |
| The biggest chunk | 483,541 bytes (472.2 kB) | 1 |
| CSS | 38,760 bytes (37.9 kB) | 1 |
| Fonts | 146,464 bytes (143.0 kB) | 11 |

The biggest chunk of the build is `437glwaxw489g.js`, and it is the SDK of the
monitoring. It is loaded on its own and it is not part of the first load of a
page.

## The pages

| Page             | JavaScript of the first load           | CSS          | Fonts preloaded  | HTML          | HTML compressed | Pictures |
| ---------------- | -------------------------------------- | ------------ | ---------------- | ------------- | --------------- | -------- |
| `/`              | 1,316,402 bytes (1.26 MB) in 15 files  | 38,795 bytes | 2 (52,396 bytes) | 121,322 bytes | 18,908 bytes    | 0        |
| `/contact`       | 1,274,920 bytes (1.22 MB) in 15 files  | 38,795 bytes | 2 (52,396 bytes) | 26,171 bytes  | 5,639 bytes     | 0        |
| `/design-system` | 984,118 bytes (961.1 kB) in 14 files   | 38,795 bytes | 2 (52,396 bytes) | 35,689 bytes  | 6,415 bytes     | 0        |
| `/job-fit`       | 994,609 bytes (971.3 kB) in 14 files   | 38,795 bytes | 2 (52,396 bytes) | 22,347 bytes  | 5,351 bytes     | 0        |
| `/projects`      | 1,284,306 bytes (1.22 MB) in 15 files  | 38,795 bytes | 2 (52,396 bytes) | 61,028 bytes  | 8,764 bytes     | 0        |
| `/resume`        | 1,002,833 bytes (979.3 kB) in 14 files | 38,795 bytes | 2 (52,396 bytes) | 56,811 bytes  | 8,741 bytes     | 0        |

The numbers of this table are the ones of **2026-11-15**, after M21.02. The chat and the
command palette are loaded on demand, and the first load of every page is **19,690 bytes
lighter** than it was on 2026-11-12.

`/projects/[slug]` is not in the table. The page is made on every request and it
needs a name that only the owner knows, so the script says that it did not
measure it instead of guessing.

## The three heaviest things

**The first thing is the runtime of the animation library: 136 kB in the first
load of every page.** The chunk `244v73qzck607.js` holds the marker of Framer
Motion, and it is in the first load of every page of the site, because
`app/layout.tsx` and the first section of the home page import the library
directly. The library is used in thirty-four files and it is the one of the
decision of the site, so the dependency stays and the task that moves it is
**M21.03**.

**The second thing was the chat and the command palette, which were in the
first load of every page.** `app/layout.tsx` imports `ChatWrapper` and
`CommandPalette` directly, so the chat of the AI and the palette of the
commands were downloaded by every visitor of every page, whether they open them
or not. **M21.02 moved them**: the launcher of the chat and the key of the
palette are still in the first load, and the panel of the chat and the body of
the palette are fetched when they are opened. They render nothing when they are
closed, so no content of the site was lost by loading them late.

**The third thing is one icon: 40 kB.** `lucide-react` is used in exactly one
file, `src/components/navigation/ThemeToggle.tsx`, and its chunk
`2v3vhzx7k47gb.js` is 40 kB of the first load of every page. The site has two
libraries of icons, and the task that leaves one of them is **M21.04**.

The fonts come next: two families are loaded on every page, of which the
family of the monospaced letters is used in one place in the whole repository,
`app/design-system/page-client.tsx:64`. The task that moves it is **M21.05**.

The planning expected the three heaviest things to be the subjects of M21.03,
M21.04 and M21.05. The measurement showed that the chat and the palette are
heavier than the fonts, so the three heaviest things are the subjects of
M21.02, M21.03 and M21.04, and the fonts come next with M21.05.

## What the site sends to a visitor

- **There is no picture in the site.** No `<img>`, no `next/image`, only the SVG
  of the icons. The picture of the social networks that every page announces
  (`/og-image.png`) answers 404 today.
- **The chat is the first-party feature of the site** and it is in the first
  load of every page.
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
