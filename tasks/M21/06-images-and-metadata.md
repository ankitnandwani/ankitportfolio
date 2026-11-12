# M21.06 – Give the Site the Images and the Metadata It Promises

## Objective

Make the site deliver what it announces: the picture of the social networks, the picture of the organisation, the CV of the owner, and the address of the site that the pictures are resolved against.

## Context

PRD §130 asks for the image optimisation, and ROADMAP M21 asks for it. The literal reading of that task does not fit this repository, and the plan has to say so rather than invent work.

**There is no raster image in the site.** There is no `<img>`, there is no `next/image`, and the only pictures are the SVG of the icons and of the illustrations of the design system. There is nothing to compress, nothing to resize and nothing to serve in the modern format, because there is nothing. The image work of this milestone is therefore not the compression of pictures: it is that **three things the site promises are not there**, and that the rule for the pictures that are added later is written down.

What is missing, measured on 2026-11-12:

- **`/og-image.png` answers 404.** `src/siteConfig.ts` sets `ogImage` to `${NEXT_PUBLIC_SITE_URL}/og-image.png` and `defaultOgImage` to `/og-image.png`, and `generateBaseMetadata()` puts that picture in the Open Graph tags and in the Twitter card of **every page of the site**. A link of the site shared in a chat shows no picture, and the crawler of a social network reads a picture that is not there.
- **`logo.png` does not exist.** `generateOrganizationSchema()` announces `${siteConfig.url}/logo.png` in the structured data of the organisation, and the file is not in `public/`.
- **`public/resume.pdf` is 0 bytes.** `src/components/hero/Hero.tsx:241` links to it. The download of the CV of the owner gives an empty file to a recruiter. The page `/resume` exists and works.
- **The build warns about it**: `metadataBase property in metadata export is not set for resolving social open graph or twitter images, using "http://localhost:3000"`. The relative pictures of the site are therefore resolved against `localhost` and not against the address of the site.
- **`public/` holds the five files of the scaffold of Next.js** — `file.svg`, `globe.svg`, `next.svg`, `vercel.svg` and `window.svg` — and nothing in the site uses them.

**The decisions that need a person.**

1. **What happens to `public/resume.pdf`.** The owner has a CV and only the owner can put it there. The recommendation is that the link of the hero points at `/resume`, the page that already exists, and that the empty file is removed until the real one is there. The alternative is that the owner puts the real PDF in `public/` and the link stays as it is. **The task must not invent a CV.** Nothing about the content of the CV is written by this task.
2. **How the picture of the social networks is made.** A picture written by the framework at every request costs work on every request; a picture in the repository costs nothing. **The recommendation is a static picture in `public/`**, 1200 × 630, under 150 kB, made of the same colours, of the same typeface and of the same name as the site. The picture must not carry a telephone number, an address of a mailbox, a photo of the owner or anything else that is private; it carries the name, the role and the address of the site.

## Requirements

### 1. The picture of the social networks exists and is right

- `/og-image.png` exists, is 1200 × 630 and is under 150 kB.
- It is made with the colours, the typeface and the name of the design system of the site, and it says what the site says: the name, the role and the address of the site.
- It carries nothing private: no telephone number, no address of a mailbox, no photograph, no address of a machine.
- The Open Graph tags and the Twitter card of every page name it and resolve against the address of the site.

### 2. The metadata has a base

- `metadataBase` is set, from `NEXT_PUBLIC_SITE_URL`, and the warning of the build is gone.
- The relative pictures of the site are resolved against that base.
- A missing or a placeholder `NEXT_PUBLIC_SITE_URL` does not break the build, the same way the site already falls back to the known address in `src/siteConfig.ts`.

### 3. The picture of the organisation exists or is not announced

- Either `logo.png` is in `public/` and it is the picture that the structured data announces, or the structured data stops announcing a picture that is not there.
- The structured data of the organisation stays valid. It is read by the crawler of a search engine.

### 4. The CV of the owner is either there or not announced

- The link of the hero is either to the real `public/resume.pdf` that the owner puts there, or to the page `/resume` that already exists.
- The empty file is removed when the link is not to it.
- Nothing of the content of the CV is invented by this task.

### 5. The files that nothing uses are gone

- The five SVG files of the scaffold of Next.js are removed from `public/`, because nothing in the site uses them and a file of the scaffold is not a file of the site.
- The `README.md` of `public/` is looked at and kept or removed with the same rule.

### 6. The rule of the pictures that are added later

- A rule checks that a picture of a page is either an SVG or a picture of `next/image` with the sizes and the formats that the framework gives, and that a picture is never a raw `<img>` with a file of the source.
- The rule is written now, when there is no picture to complain about, so that the first picture that is added does not become the first complaint.

## Scope

### In scope

- `public/og-image.png` (new)
- `public/logo.png` (new) or the structured data, according to the decision
- `public/resume.pdf` (the owner's own file) or the removal of it and the change of the link
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` (the removal)
- `app/layout.tsx` (the `metadataBase`)
- `src/seo/metadata.ts` and `src/siteConfig.ts`
- `src/components/hero/Hero.tsx` (the link of the CV)
- The rule of the pictures

### Out of scope

- The compression and the conversion of pictures. There are none to compress.
- The look of the site. The picture of the social networks is the only thing that is made, and it looks like the site.
- The content of the CV, which is the owner's.
- The SEO of the pages, which is the subject of the pages of the site and not of this milestone, apart from what the base of the metadata fixes.
- The cache of the files of `public/`, which is M21.07.

## Dependencies

- M21.01 – the sizes of the assets are part of the measurement.
- Nothing else. The task can be done in parallel with M21.04, M21.05 and M21.07.

## Files / Areas Expected To Change

- `public/og-image.png` (new)
- `public/logo.png` (new)
- `public/resume.pdf` (the owner's file, or its removal)
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` (removed)
- `app/layout.tsx`
- `src/seo/metadata.ts`
- `src/siteConfig.ts`
- `src/components/hero/Hero.tsx`
- `src/lib/performance/` (the rule of the pictures)

## Implementation Guidance

1. **The picture of the social networks is made once and is in the repository.** It is a PNG of 1200 × 630, and the rule of the task says under 150 kB. The colours and the typeface are the ones of `design/tokens.ts` and of `design/themes/`, so that the picture and the site look like the same thing. A picture made by the framework at every request is not needed for a site with low traffic, and it would be a request that the crawler of a social network makes on every share.
2. **`metadataBase` goes in the metadata of the layout.** `export const metadata: Metadata = { metadataBase: new URL(siteConfig.url), ...generateBaseMetadata() }` is the shape. `siteConfig.url` already falls back to the known address of the site when the environment cannot be read, so a missing variable does not break the build.
3. **The picture of the organisation is either made or not announced.** The logo of the site is the mark of the site; if there is no mark, the structured data does not announce one. The structured data that announces a picture that is not there is worse than the structured data that announces no picture.
4. **The link of the CV goes to the page of the resume.** `src/components/hero/Hero.tsx:241` links to `/resume.pdf`. The site has a page `/resume` with the whole CV of the owner, made by the design system, and a recruiter can read it without downloading anything. The link of the download is a nice thing to have and it is the owner's call: the task asks, and it does what the answer says.
5. **The files of the scaffold are removed with `mavis-trash`.** The rule of the repository is that a deletion goes through it and not through `rm`.
6. **The rule of the pictures is written as a rule on the source.** It reads the files of `app/` and of `src/` and looks for `<img` and for `next/image`. It fails when a raw picture is used, and it says which file and which line.

## Acceptance Criteria

- `/og-image.png` answers 200, is 1200 × 630 and is under 150 kB.
- The picture carries the name, the role and the address of the site, and nothing private.
- The build does not warn about `metadataBase` any more, and the relative pictures resolve against the address of the site.
- `logo.png` exists and is the picture that the structured data announces, or the structured data announces no picture.
- The link of the CV of the hero either gives the real PDF of the owner or opens the page `/resume`. The empty file is not linked and is not in the repository.
- The five SVG files of the scaffold are not in the repository, and nothing in the site asks for them.
- The rule of the pictures holds and fails on a raw `<img>`.
- The measurement of M21.01 holds, and the size of the new files is in the baseline.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds without the warning.

## Testing Requirements

- Unit test: the rule of the pictures fails on a file with a raw `<img>` and passes on the files of the site.
- Unit test: the base of the metadata is the address of the site, and a placeholder of the environment does not break it.
- Manual: the picture of the social networks was opened and its size and its look were checked; the Open Graph tags of a page were read and they name a picture that answers 200.
- Manual: the link of the CV of the hero was followed and it gives the CV of the owner.
- The measurement of M21.01 was run, and the size of the new files is written down.

## Security / Privacy Considerations

- **The picture of the social networks is a picture that is sent to other people every time the site is shared.** It must carry nothing private: no telephone number, no address of a mailbox, no photograph, no address of a machine, no name of a project that is not public.
- **The picture of the organisation is read by the crawler of a search engine.** It is a public picture and it says the name of the site and nothing else.
- **The CV is the private document of the owner.** The task does not write one, does not copy one and does not put one in the repository without the owner. A CV in the repository is a CV that is in the history of the repository forever, and the decision of the owner has to be an explicit one.
- The removal of the files of the scaffold does not remove anything that the site needs, and the build says so if it does.

## Performance / Accessibility Considerations

- The picture of the social networks is downloaded by the crawler of a social network and not by a visitor of the page. It is not part of the first load of the site, and the rule of the first load of M21.01 is not affected by it.
- The picture is under 150 kB, so that a share is not a slow share.
- The rule of the pictures is what keeps the next picture out of the first load: `next/image` gives the sizes, the formats and the lazy loading of a picture that a raw file does not.

## Definition of Done

- Everything the site announces exists, and everything it does not use is gone.
- The build has no warning about the metadata.
- The CV of the owner is reachable and is not an empty file.
- The rule of the pictures is in place and holds.
- The decision of the CV and of the picture is written in `DECISIONS.md`.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds without a warning.

## Related Requirements

- PRD §130 – image optimisation
- ROADMAP Milestone 21 – image and font optimisation
- PRD §74 – the lazy loading of the heavy project media, which the rule of the pictures prepares for
- PRD §108 – the SEO of Lighthouse, which the base of the metadata and the structured data serve
- PRD §36, §78 – nothing private is published
- M21.01 – the measurement that judges this task
