# M21 – Performance Optimisation

This milestone makes the site fast on a phone of the middle and on a connection of the middle, and it makes the numbers that say so repeatable, so that a change that makes the site slower is seen before a visitor sees it. Nothing in it changes what the site says, who it talks to, or what it keeps. It changes how fast it gets there.

The targets are the ones of PRD §74 and PRD §108:

```
LCP < 2.5 s, CLS < 0.1, INP < 200 ms on reasonable mobile hardware
Performance: 90+, Accessibility: 95+, Best Practices: 95+, SEO: 95+
```

## Execution Order

| Order | Task                                                                          | Depends On                             | Parallel                         |
| ----- | ----------------------------------------------------------------------------- | -------------------------------------- | -------------------------------- |
| 1     | M21.01 – Measure the site and write the performance budgets                   | M20                                    | –                                |
| 2     | M21.04 – Keep one icon library                                                | M21.01                                 | Yes, with M21.05, M21.06, M21.07 |
| 3     | M21.05 – Load only the font family that the page uses                         | M21.01                                 | Yes, with M21.04, M21.06, M21.07 |
| 4     | M21.06 – Give the site the images and the metadata it promises                | M21.01                                 | Yes, with M21.04, M21.05, M21.07 |
| 5     | M21.07 – Cache the pages and the assets the way they are used                 | M21.01                                 | Yes, with M21.04, M21.05, M21.06 |
| 6     | M21.03 – Stop shipping the animation library to the pages that do not animate | M21.01, M21.04                         | –                                |
| 7     | M21.02 – Lazy-load the chat, the palette and the sections below the fold      | M21.01, M21.03                         | –                                |
| 8     | M21.08 – Put the build and the budget in the CI                               | M21.01, M21.04, M21.05, M21.06, M21.07 | –                                |
| 9     | M21.09 – Run Lighthouse against the built site and check the four targets     | M21.02, M21.08                         | –                                |

M21.01 comes first because every other task is judged against the numbers it writes down. M21.04, M21.05, M21.06 and M21.07 touch four different sets of files and may be worked on in parallel once M21.01 is done. M21.03 and M21.02 are listed in order because both of them change how the components of the pages are loaded and would touch the same files if they ran at the same time.

## Traceability Table

| Requirement                                                         | Source                        | Task                   | Status                                                                                                      |
| ------------------------------------------------------------------- | ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Lighthouse is run and the four scores are recorded                  | PRD §130, ROADMAP M21         | M21.01, M21.09         | Covered                                                                                                     |
| The bundle is analysed                                              | PRD §130, ROADMAP M21         | M21.01, M21.04, M21.05 | Covered                                                                                                     |
| The images are optimised                                            | PRD §130                      | M21.06                 | Covered — there are no raster images today; the work is the assets the site promises and the metadata       |
| The fonts are optimised                                             | PRD §130                      | M21.05                 | Covered                                                                                                     |
| The caching is set                                                  | PRD §130                      | M21.07                 | Covered                                                                                                     |
| The heavy things are lazy-loaded                                    | PRD §130, ROADMAP M21         | M21.02, M21.03         | Covered                                                                                                     |
| The dependencies that are not needed are removed                    | PRD §130, ROADMAP M21         | M21.04                 | Covered                                                                                                     |
| Large animation libraries are not shipped unnecessarily             | PRD §74                       | M21.03                 | Covered                                                                                                     |
| The chat UI is lazy-loaded                                          | PRD §74                       | M21.02                 | Covered                                                                                                     |
| The advanced visualizations are lazy-loaded                         | PRD §74                       | M21.02                 | Covered                                                                                                     |
| The heavy project media is lazy-loaded                              | PRD §74                       | M21.02                 | Covered — the site has no raster media today, so the rule is written down for the media that is added later |
| The analytics is lazy-loaded where it is appropriate                | PRD §74                       | M21.02                 | Covered — the analytics of M19 is already loaded on its own and is not part of the first load               |
| LCP < 2.5 s, CLS < 0.1, INP < 200 ms                                | PRD §74, ROADMAP M21 DoD      | M21.09                 | Covered                                                                                                     |
| Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+     | PRD §108                      | M21.09                 | Covered                                                                                                     |
| Accessibility and performance are not sacrificed for visual effects | PRD §108                      | M21.02, M21.03         | Covered                                                                                                     |
| The site stays useful when the JavaScript partly fails              | PRD §75                       | M21.02                 | Covered                                                                                                     |
| The core content stays accessible                                   | PRD §75                       | M21.02, M21.03         | Covered                                                                                                     |
| The reduced motion is honoured                                      | PRD §131                      | M21.02, M21.03         | Covered — the full pass of PRD §131 belongs to M22                                                          |
| The build runs in the CI                                            | TODO (M20.09)                 | M21.08                 | Covered                                                                                                     |
| The slow requests are watched                                       | PRD §129                      | M20.06                 | Satisfied                                                                                                   |
| The failures are watched                                            | PRD §79, §129                 | M20.01–M20.09          | Satisfied                                                                                                   |
| The animation library is the one of the decision                    | DECISIONS (animation library) | M21.03                 | Satisfied — the decision is respected, and the removal of the library is a decision that needs a person     |

## What the repository holds today

The planning was written against the state of the repository on 2026-11-12. Every number below was measured on a production build of this repository, not estimated.

- **The home page ships 1,304.8 kB of JavaScript on the first load, in fifteen files.** The largest is 277.2 kB, and the three largest are 277.2, 230.4 and 192.6 kB. The whole of `.next/static/chunks` is 17 MB and holds twenty-seven files of 1,965,463 bytes in total, so roughly two thirds of the client code of the site never reaches the home page.
- **The runtime of the animation library is 136 kB of that first load.** The chunk `244v73qzck607.js` holds the `framerAppearId` marker of Framer Motion, and it is in the first load of every page, because `app/layout.tsx` and the first section of the home page import it directly.
- **A whole chunk of forty kilobytes holds one icon.** `lucide-react` is used in exactly one file, `src/components/navigation/ThemeToggle.tsx`, and its chunk `2v3vhzx7k47gb.js` is 40 kB of the first load.
- **Two families of fonts are loaded on every page and one of them is used on one page.** `app/layout.tsx` loads `Geist` and `Geist_Mono` and puts both in the `class` of the `html`. The variable `--font-geist-mono` is used in exactly one place, `app/design-system/page-client.tsx:64`. The two `woff2` files are preloaded on every page: `797e433ab948586e-s.p.0r6juujl39pe6.woff2` and `caa3a2e1cccd8315-s.p.0wgildi0cnwt9.woff2`. All eleven faces use `font-display: swap`, which is right.
- **There is no raster image anywhere in the site.** There is no `<img>`, there is no `next/image`, and the only pictures are the SVG of the icons. `public/` holds the five files of the scaffold of Next.js (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`), which nothing uses, and `public/README.md`.
- **Three things the site promises are not there.**
  - `public/resume.pdf` is **0 bytes**, and `src/components/hero/Hero.tsx:241` links to `/resume.pdf`. The download of the CV of the owner gives an empty file.
  - `siteConfig.ogImage` points at `/og-image.png`, and **that file answers 404**. Every page of the site announces an Open Graph picture that does not exist, and the same file is the `defaultOgImage`.
  - `generateOrganizationSchema()` announces `logo.png`, which is not in `public/` either.
  - The build warns about it as well: `metadataBase property in metadata export is not set for resolving social open graph or twitter images, using "http://localhost:3000"`. The pictures are therefore resolved against `localhost` and not against the address of the site.
- **The cache of the assets of `public/` is not set.** `next.config.ts` has no `headers()` at all. The home page is served with `Cache-Control: s-maxage=31536000`, which is the page cache of the platform, and the files of `public/` are served with `Cache-Control: public, max-age=0, must-revalidate`, which means that the browser asks for the favicon and the resume on every visit.
- **The chat and the command palette are in the layout of the site.** `app/layout.tsx` imports `ChatWrapper` and `CommandPalette` directly, so the chat of the AI and the palette of the commands are in the first load of every page, whether the visitor ever opens them.
- **Nothing on the site is lazy-loaded.** `next/dynamic` is not used anywhere in the repository, and the nine sections of the home page are nine client components that are all rendered at once.
- **The CI does not build the site.** `.github/workflows/ci.yml` runs the lint, the typecheck and the tests, and no `npm run build`, so a configuration that breaks the build is not caught by the pipeline. This was found by M20.09 and is written down in `TODO.md`.
- **The HTML of the home page is 121,855 bytes and 18,911 bytes compressed.** The page is small enough that the network is not the problem; the problem is the thirteen hundred kilobytes of JavaScript that come with it.

## What the milestone does not do

- **It does not remove the animation library.** `DECISIONS.md` names Framer Motion / Motion as the library of the animation, and PRD §74 says not to ship large animation libraries _unnecessarily_. The two are not in conflict: the library stays, and the milestone makes sure that a page that does not animate does not download it. The removal of the dependency is a change of an accepted decision and it is written down below as a decision that needs a person.
- **It does not add a service.** No cache of its own, no queue, no database, no third party. The cache that the platform gives is used as it is, and the assets that are cached are the ones the site already serves.
- **It does not change the content, the design, the accessibility of the pages or the behaviour of the chat.** A page that is faster looks the same and says the same.
- **It does not promise a Lighthouse score that was not measured.** The scores are measured in M21.09 and written down, with the build they were measured on.

## Decisions that this milestone takes

They are recorded in `DECISIONS.md` as the milestone is carried out.

- **The budget is a limit, not a number.** The first-load JavaScript of a page has a ceiling and a ceiling that is too low is a ceiling that stops the site from growing. The budget is written down with the number it has today and the number it may not pass.
- **The budget is read from the build, not from the source.** The measurement looks at what was built, the same way a visitor receives it, so a change that puts a library into the first load is seen in the budget and not only in the browser.
- **The measurement has no dependency of its own.** The script reads the output of the build with the tools of Node, the way the scripts of M19 and M20 read the site. Lighthouse is run on demand and is not a dependency of the repository.
- **The lazy loading keeps the content in the page.** A section that is loaded late is still written by the server in the HTML, so the content is in the document before the JavaScript arrives and the crawler and the reader without JavaScript both see it.
- **The cache of the files of `public/` follows what the files are.** A file that never changes is cached for a year, a file that the owner replaces is cached for a short time and revalidated.

## Decisions that need a person

These are not settled by the planning and are marked in the task that carries them.

1. **Which icon library survives.** `react-icons` is used in three files (`src/components/hero/Hero.tsx`, `src/components/footer/socialLinks.tsx`, `src/components/socialHub/SocialHub.tsx`) and `lucide-react` in one (`src/components/navigation/ThemeToggle.tsx`). Both end up in the first load. **The recommendation is to keep `react-icons`** and to remove `lucide-react`, because the library that is used in three places is the one that will stay, and forty kilobytes for one icon is the larger waste. The opposite is possible: one icon of `react-icons` can be drawn in SVG by hand and `lucide-react` can stay, but then every icon of the site is in two styles. Carried by M21.04.
2. **Whether the animation library is removed entirely.** The decision of the animation names Framer Motion / Motion, and PRD §74 asks not to ship large animation libraries unnecessarily. The 136 kB of the runtime is the largest single piece that can still be taken out. **The recommendation is not to remove it**: the library is used in thirty-four files and it is the approved one, and the milestone gets the same result on the pages that do not animate by not loading it there. If the owner wants the dependency gone, that is a change of an accepted decision and it has to be written in `DECISIONS.md` with its reason. Carried by M21.03.
3. **How Lighthouse is run.** `@lhci/cli` as a dependency of the repository would make the check part of the pipeline, and it is a heavy dependency that pulls Chrome into the machine of the CI. `npx lighthouse` runs it without anything being added to `package.json`, and it is run by hand. **The recommendation is `npx lighthouse` on demand**, and only the budget of the build in the CI, so that the pipeline stays fast and the repository stays small. Carried by M21.08 and M21.09.
4. **What happens to `public/resume.pdf`.** The file is empty and the hero links to it. The owner has a CV, and only the owner can put it there. **The recommendation is that the link of the hero points at `/resume`, the page of the resume that already exists**, and that the empty file is removed until the real one is there. The alternative is that the owner puts the real PDF in `public/` and the link stays as it is. Carried by M21.06.
5. **How the picture of the social networks is made.** A picture of 1200 × 630 that is written by the framework at every request costs work on every request, and a picture that is in the repository costs nothing. **The recommendation is a static picture in `public/`**, the same way the rest of the assets of the site are static, and a rule that says that it is 1200 × 630 and under 150 kB. Carried by M21.06.

## Risks and ambiguities

- **The sections of the home page are the content of the site.** Making them late is the cheapest way to make the page fast, and it is also the way to lose the content for a crawler and to move the largest contentful element down the page, which is the opposite of what LCP wants. The plan keeps the server rendering on (`ssr` stays on) so that the HTML holds the content, and M21.02 checks that the largest element of the page is still the one of the hero. If the check fails, the section that holds it is not made late.
- **The numbers of the budget come from one machine and one build.** The limit has to be a limit that the machine of the owner and the machine of the CI both keep. A budget that is written too tight makes the pipeline fail for a reason that has nothing to do with the site.
- **The three targets of PRD §74 cannot be guaranteed by a script.** LCP, CLS and INP depend on the device and on the connection of the reader, not only on the size of the bundle. What the script can do is to hold the size of what is sent, and M21.09 records what Lighthouse measured with the settings it used. The truth of the targets is read on a real phone, and the steps are in `TODO.md`.
- **The chat is a first-party feature and the visitors expect it to open at once.** Lazy loading it makes the first click wait for a chunk. M21.02 has to keep the launcher on the page and the panel behind it, so the click still opens the chat and only the heavy part waits.
- **The animation library is used in thirty-four files, and the animation is part of the design of the site.** A page that stops animating is a page that changed. The rule of PRD §75 says the site must stay useful when the animation fails, and the reduced motion is the same rule. M21.03 keeps the animation and makes the loading of it later, and it does not touch the way the animation looks.
- **The cache of the pages is the cache of the platform.** `s-maxage=31536000` is what the platform already sends. Changing it by hand can make the site stale for a year after a change, and M21.07 has to be careful with it.
- **The account of Sentry is still not set up**, so the numbers of the real site are not known and the budgets are written against a local build. This does not block the milestone; the steps of the account are in `TODO.md`.
