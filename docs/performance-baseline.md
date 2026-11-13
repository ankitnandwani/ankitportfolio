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

| What              | How much                  | In how many files |
| ----------------- | ------------------------- | ----------------- |
| Client JavaScript | 1,965,463 bytes (1.87 MB) | 27                |
| The biggest chunk | 483,541 bytes (472.2 kB)  | 1                 |
| CSS               | 38,760 bytes (37.9 kB)    | 1                 |
| Fonts             | 146,464 bytes (143.0 kB)  | 11                |

The biggest chunk of the build is `437glwaxw489g.js`, and it is the SDK of the
monitoring. It is loaded on its own and it is not part of the first load of a
page.

## The pages

| Page             | JavaScript of the first load           | CSS          | Fonts preloaded  | HTML          | HTML compressed | Pictures |
| ---------------- | -------------------------------------- | ------------ | ---------------- | ------------- | --------------- | -------- |
| `/`              | 1,336,092 bytes (1.27 MB) in 15 files  | 38,760 bytes | 2 (52,396 bytes) | 121,855 bytes | 18,911 bytes    | 0        |
| `/contact`       | 1,294,610 bytes (1.23 MB) in 15 files  | 38,760 bytes | 2 (52,396 bytes) | 26,759 bytes  | 5,648 bytes     | 0        |
| `/design-system` | 1,003,808 bytes (980.3 kB) in 14 files | 38,760 bytes | 2 (52,396 bytes) | 36,277 bytes  | 6,453 bytes     | 0        |
| `/job-fit`       | 1,013,080 bytes (989.3 kB) in 14 files | 38,760 bytes | 2 (52,396 bytes) | 22,935 bytes  | 5,367 bytes     | 0        |
| `/projects`      | 1,303,996 bytes (1.24 MB) in 15 files  | 38,760 bytes | 2 (52,396 bytes) | 61,574 bytes  | 8,778 bytes     | 0        |
| `/resume`        | 1,022,523 bytes (998.6 kB) in 14 files | 38,760 bytes | 2 (52,396 bytes) | 57,399 bytes  | 8,758 bytes     | 0        |

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

**The second thing is the chat and the command palette, which are in the first
load of every page.** `app/layout.tsx` imports `ChatWrapper` and
`CommandPalette` directly, so the chat of the AI and the palette of the
commands are downloaded by every visitor of every page, whether they open them
or not. The task that moves them is **M21.02**.

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

| What                                       | The header today                      | How it is used                                                                         |
| ------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------- |
| The pages                                  | `s-maxage=31536000`                   | The platform keeps them for a year, with nothing that says what to do with an old copy |
| The code and the fonts of `/_next/static/` | `public, max-age=31536000, immutable` | The name of the file holds the sum of its bytes, so it never changes under that name   |
| The files of `public/`                     | `public, max-age=0`                   | The browser asks for them on every visit                                               |
| The icon of the site                       | `public, max-age=0, must-revalidate`  | The browser asks for it on every visit                                                 |
| `POST /api/chat`                           | no header at all                      | The answer is not marked                                                               |
| `POST /api/contact`                        | `no-store`                            | The answer is not kept                                                                 |
| `POST /api/job-fit`                        | `no-store`                            | The answer is not kept                                                                 |
| `POST /api/feedback`                       | no header at all                      | The answer is not marked                                                               |
| `POST /api/analytics`                      | `no-store`                            | The answer is not kept                                                                 |

**The answers of the chat and of the feedback are not marked.** The stream of
the chat and the answers of the form carry `no-store` or `no-cache` on some
paths and carry nothing on the others, and an answer without a header may be
kept by a browser on its own. The task that sets the rule of the cache is
**M21.07**.

## How the numbers are to be read

- **The ceiling of the budget is a limit, not a number.** It is a little above
  the size of today, so that a build that is a little different does not fail
  the pipeline. A size that goes down never fails a rule.
- **A measure that is new is reported and is not a failure.** The budget grows
  on purpose.
- **The numbers of the target of PRD §74 are not in this document.** LCP, CLS
  and INP depend on the device and on the connection of the reader, and they
  are measured with Lighthouse in M21.09 and on a real phone by the owner.
