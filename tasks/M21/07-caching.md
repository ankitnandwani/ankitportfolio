# M21.07 – Cache the Pages and the Assets the Way They Are Used

## Objective

Let the browser keep what never changes and ask again only for what does, and let the platform keep the pages without serving a stale site for a year after a change.

## Context

PRD §130 asks for the caching, and ROADMAP M21 asks for it.

What the site sends today, read from the running production server on 2026-11-12:

| Address                       | `Cache-Control`                       | What it is                                         |
| ----------------------------- | ------------------------------------- | -------------------------------------------------- |
| `/`                           | `s-maxage=31536000`                   | the home page, a static page                       |
| `/_next/static/chunks/*.js`   | `public, max-age=31536000, immutable` | the code, whose name holds the sum of its bytes    |
| `/_next/static/media/*.woff2` | `public, max-age=31536000, immutable` | the fonts, whose name holds the sum of their bytes |
| `/resume.pdf`                 | `public, max-age=0`                   | the empty file of M21.06                           |
| `/favicon.ico`                | `public, max-age=0, must-revalidate`  | the icon of the site                               |

`next.config.ts` has **no `headers()` at all**. The two long caches come from the framework and the platform, which is right: a file whose name holds the sum of its bytes never changes under that name.

The two short ones are the problem. The favicon and the file of `public/` are asked for again on **every visit**, because nothing says that they do not change. The site has one favicon and one picture of the social networks and one CV, and they change a few times a year at most.

The page itself is cached by the platform for a year, with nothing that says what to do with a copy that is old. `s-maxage=31536000` without `stale-while-revalidate` means that a visitor can be served a page from the cache of the platform an hour after a change, and that the first visitor after the change waits for the page to be made again.

**The decision that needs a person.** How long the pages are kept. The recommendation is to keep the long cache of the platform and to add `stale-while-revalidate` to it, so that a visitor is served a page that is at most a little old while the platform makes the new one in the background. The page of the site changes when the owner publishes something, and a visitor that arrives in that window sees the new one after the first refresh.

## Requirements

### 1. The files of `public/` are cached the way they are used

- `next.config.ts` gains a `headers()` that sets the cache of the files of `public/`.
- A file that carries the sum of its bytes in its name, which is the case of everything under `/_next/static/`, keeps the cache of the platform and is not touched.
- A file of `public/` that never changes, which is the favicon and the picture of the social networks, is cached for a long time by the browser. The recommendation is a year, the same as the code.
- A file of `public/` that the owner replaces, which is the CV, is cached for a short time and revalidated. The recommendation is an hour with `must-revalidate`, so that the new CV is seen the same day and the file is not asked for on every visit.

### 2. The pages are served with a rule that says what to do with an old copy

- The pages keep the long cache of the platform and gain `stale-while-revalidate`, so that a visitor is never the first one to wait for the page.
- The rule is written in the same place as the rest of the configuration, and it is written down in `DECISIONS.md`.

### 3. The rules of the site are not touched

- The answers of the API routes are not cached. `/api/chat`, `/api/contact`, `/api/job-fit` and `/api/feedback` answer with `no-store` today, and PRD §36 and §78 say that what a visitor wrote is not kept and not repeated to somebody else.
- The route of the analytics keeps its own rules.
- The pages that are made on every request, `/projects/[slug]`, are not cached longer than they are today.

### 4. The rule is checked

- The script of M21.01 reads the `Cache-Control` of the routes and of the files of `public/` and says which ones are not cached the way they are used.
- A rule of the budget fails when a file of `public/` that never changes is served with a cache of zero, and when a route of the API is served with a cache that keeps an answer.

## Scope

### In scope

- `next.config.ts` (the `headers()`)
- `src/lib/performance/` (the rules of the cache)
- `docs/performance-baseline.md` (the table of the cache)

### Out of scope

- The cache of the platform. `s-maxage` is what the platform sends and the task does not build a cache of its own.
- A cache of its own, a service of its own, a worker, a queue or a database. PRD §11 and the decision of the free tier say that the site stays small.
- The cache of the answers of the API routes, which must not exist.
- The headers of the security. They are the subject of M23, the security audit, and are not touched here.
- The time of the cache of the pages in the deployment, which is the configuration of the platform and the owner's.

## Dependencies

- M21.01 – the cache is part of the measurement.
- Nothing else. The task can be done in parallel with M21.04, M21.05 and M21.06.

## Files / Areas Expected To Change

- `next.config.ts`
- `src/lib/performance/budgets.ts` (the rules of the cache)
- `src/lib/performance/budgets.test.mts`
- `docs/performance-baseline.md`

## Implementation Guidance

1. **`headers()` is the shape of Next.js.** The configuration of the site holds a list of the routes with the headers they get. The rule of the platform that is already there is not touched; the task only adds what is missing.
2. **The rule is written by the use and not by the name.** A file of `public/` that the owner replaces and one that he does not cannot be told apart by their name. The recommendation is to write the rules for the files one by one, which is a short list: the favicon, the picture of the social networks and the CV. A rule for everything of `public/` would cache the CV of the owner for a year after he replaces it, and the owner would not know why the recruiter sees the old one.
3. **The API routes are not to be touched.** A rule of the cache that catches `/api/` by accident would keep the answer of the chat, and the answer of the chat is the answer of the model to what a visitor asked. That is not a cache, that is a leak. The rule of the budget checks it and fails if it happens.
4. **The page is checked with the running server.** The script of M21.01 asks the production server for the headers of the routes, the same way a browser does, and writes them in the baseline.
5. **The configuration of the platform is the owner's.** The `s-maxage` of the pages comes from the deployment on Vercel. The rule of this task is the `headers()` of the repository, and it does not reach the configuration of the deployment.

## Acceptance Criteria

- The files of `public/` that never change are served with a long cache by the browser.
- The CV is served with a short cache and is revalidated, so that a new CV is seen the same day.
- The pages are served with the long cache of the platform and with `stale-while-revalidate`.
- The four API routes are served with `no-store`, and the rule of the budget fails when one of them is not.
- The code and the fonts of `/_next/static/` keep the cache of the platform, and the task does not touch them.
- The rule of the budget checks the cache of the routes and of the files of `public/`, and it holds.
- The table of the cache is in the baseline document.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Testing Requirements

- Unit test: the rule of the cache fails when a file of `public/` that never changes is served with a cache of zero.
- Unit test: the rule of the cache fails when a route of the API is served with a cache that keeps an answer.
- Unit test: the rule of the cache passes on the configuration that the repository holds.
- Manual: the headers of `/`, of `/favicon.ico`, of `/og-image.png`, of `/resume.pdf`, of `/_next/static/chunks/…` and of the four API routes were read from the running production server and written down.
- Manual: the site was loaded twice and the favicon and the picture of the social networks were not asked for the second time.

## Security / Privacy Considerations

- **The cache is a place where what a visitor wrote could be kept.** The four API routes answer with `no-store` today and they must keep answering with it. The rule of the budget is the check, because a rule of the cache that is written for `/` and that catches `/api/` by accident is a rule that serves the answer of the chat to the next visitor of that address.
- The cache of the platform is shared between the visitors. A page that is cached is a page that is the same for everybody, and the site has no page that is different for one visitor. The chat is not a page, it is a component that asks an API route, and the API route is not cached.
- The headers of the security are the subject of M23 and are not touched here. This task does not add and does not remove a header of the security.

## Performance / Accessibility Considerations

- The saving is small and real: the favicon and the picture of the social networks are not asked for on every visit.
- The page is served faster for the visitor who arrives while the platform is making the new one, because the old copy is served and the new one is made in the background.
- A cache that is too long is a site that looks broken to the owner: a change is published and the site does not change. The rule of the CV is the one that has to be short.

## Definition of Done

- The cache of the files, of the pages and of the API routes is the way this task describes it.
- The rules of the budget check the cache and they hold.
- The table of the cache is written down in the baseline.
- The API routes are never cached.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Related Requirements

- PRD §130 – caching
- ROADMAP Milestone 21 – caching
- PRD §36, §78 – what a visitor wrote is not kept and not repeated
- PRD §11 – the site stays small and on the free tier
- DECISIONS – the free tier and the minimal infrastructure, which this task respects
- M21.01 – the measurement that judges this task
