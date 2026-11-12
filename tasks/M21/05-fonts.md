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

## Acceptance Criteria

- The family of the monospaced letters is not preloaded and not downloaded on the pages that do not use it.
- The page of the design system shows the family of the monospaced letters, and the value of the token is printed in it.
- The variable `--font-geist-mono` keeps its name and the class `font-mono` keeps working.
- The family of the site is loaded once, in the layout, and is preloaded as it is today.
- The rule of the preloads holds and fails when a page preloads a family it does not use.
- The size of the first load of the home page is under the ceiling of M21.01, and the number before and after is written down.
- The text of the site looks the same as it did, on every page.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

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
