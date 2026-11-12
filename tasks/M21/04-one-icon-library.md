# M21.04 – Keep One Icon Library

## Objective

Leave the site with one library of icons instead of two, and take the forty kilobytes that one icon of one of them costs out of the first load of every page.

## Context

PRD §130 asks for the removal of the dependencies that are not needed, and ROADMAP M21 asks for it in the same words.

The site has two libraries of icons:

| Library        | Files that use it                                                                                                 | Size in the first load                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `react-icons`  | `src/components/hero/Hero.tsx`, `src/components/footer/socialLinks.tsx`, `src/components/socialHub/SocialHub.tsx` | in the chunks of the hero, of the footer and of the social hub           |
| `lucide-react` | `src/components/navigation/ThemeToggle.tsx` — **one file**                                                        | the chunk `2v3vhzx7k47gb.js`, **40 kB**, in the first load of every page |

`lucide-react` is used for the sun and the moon of the button of the theme. Forty kilobytes of the first load of every page of the site is one icon.

**The decision that needs a person.** Which library survives. **The recommendation is to keep `react-icons`** and to remove `lucide-react`: it is the library that is used in three places, it is the one that will still be there when the site grows, and the forty kilobytes are the waste that has to go. The other way is open: the one icon of `lucide-react` can be drawn in SVG by hand and `lucide-react` can stay, and then the site has one library of icons and one hand drawn icon, which is the shape most of the design systems of the world have. What is not open is having both and paying for both.

The icons of the site are SVG and nothing else. There is no picture anywhere, so no icon is a raster and nothing has to be converted.

## Requirements

### 1. One library of icons in the site

- Every icon of the site comes from one library, and the other one is removed from `package.json` and from the lock file.
- The icons keep their look. The stroke, the size, the colour and the accessible name of every icon are the ones of today; the design of the site does not change.
- The icons that are decorative keep `aria-hidden`, and the ones that carry a name keep their accessible name. PRD §71 and §108 are not touched by this task.

### 2. Nothing is imported as a whole library

- The icons are imported one by one, the way `react-icons` already is (`react-icons/ri` and not `react-icons`), so that the bundle holds the icons that are used and not the library.
- A rule checks that no file imports the whole of a library of icons. The rule is a rule on the source, and it fails the build of the CI when a file does it.

### 3. The size that is saved is measured

- The size of the first load of the home page before and after is written down.
- The chunk of the library that is removed is not in the first load any more.
- The rule of M21.01 holds after the change.

## Scope

### In scope

- `src/components/navigation/ThemeToggle.tsx` (the one file of `lucide-react`) or the three files of `react-icons`, according to the decision
- `src/components/hero/Hero.tsx`
- `src/components/footer/socialLinks.tsx`
- `src/components/socialHub/SocialHub.tsx`
- `package.json` and `package-lock.json` (the removal of the library that does not stay)
- The rule that checks that no library is imported as a whole

### Out of scope

- The animation library, which is M21.03 and which has a decision of its own.
- The look of any icon. The icons keep their shape, their size and their colour.
- Any other dependency of the site. `posthog-node` and `resend` are used and are loaded on their own; they are not unnecessary and they are not touched.
- The other libraries of the interface, `@cred/neopop-web` and the primitives of the design system, which are used by the components of the design system and are an accepted decision.

## Dependencies

- M21.01 – the size of the first load is measured before and after.
- Nothing else. The task can be done in parallel with M21.05, M21.06 and M21.07.

## Files / Areas Expected To Change

- `src/components/navigation/ThemeToggle.tsx`
- `src/components/hero/Hero.tsx`
- `src/components/footer/socialLinks.tsx`
- `src/components/socialHub/SocialHub.tsx`
- `package.json`
- `package-lock.json`
- `src/lib/performance/` (the rule of the whole library)

## Implementation Guidance

1. **Ask the owner which library stays, and write the answer in `DECISIONS.md`.** The recommendation is `react-icons`. The answer is a line in the decisions with the reason, the same way the other decisions of the repository are written.
2. **The sun and the moon of the theme are the same shape in both libraries.** The one icon of `lucide-react` is a sun and a moon, and `react-icons` has both. The theme button keeps its look, its size and its accessible name.
3. **The import is one icon at a time.** `import { RiMoonFill } from 'react-icons/ri'` loads one icon. `import { RiMoonFill } from 'react-icons'` loads the whole library of the set, and it is the thing the rule of the task has to catch.
4. **The removal of the dependency is `npm uninstall`.** The lock file goes with it, and `npm ci` in the CI has to keep working with the new lock file.
5. **The size of the chunk is the proof.** The chunk `2v3vhzx7k47gb.js` is 40 kB and it is in the first load of every page. After the change it is either gone or it is much smaller, and the measurement of M21.01 says so.
6. **The icons of the site are drawn by the libraries of SVG.** Nothing of this task touches a picture, and nothing of it touches the accessibility of an icon.

## Acceptance Criteria

- The site has one library of icons, and the other one is not in `package.json` and not in the lock file.
- Every icon of the site looks the same as before, with the same size, the same colour and the same accessible name.
- The decorative icons keep `aria-hidden` and the named icons keep their name.
- No file imports a library of icons as a whole, and the rule says so.
- The chunk of the library that is removed is not in the first load of the home page.
- The size of the first load of the home page is under the ceiling of M21.01, and the number before and after is written down.
- `npm ci` works with the new lock file, and the CI passes.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Testing Requirements

- Unit test: the rule of the whole library fails on a file that imports the library as a whole and passes on a file that imports one icon.
- Manual: every icon of the site was compared with the one before it: the theme button, the hero, the footer and the social hub.
- Manual: the accessible name of the icons of the theme button was read with a screen reader, the way M22 will do it in full.
- The measurement of M21.01 was run before and after, and the two numbers are written down.

## Security / Privacy Considerations

- A library of icons is code of a third party that runs in the page of every visitor. Removing one of the two means that there is one less package in the page and one less thing to keep up to date.
- The removal must not bring a new package in. The icons that stay are the ones that are already there.
- The lock file changes with the removal and it has to be the change of the removal and nothing else. A lock file that changed for another reason is a sign that something else was installed, and it is to be looked at before the commit.

## Performance / Accessibility Considerations

- The saving is the point of the task: forty kilobytes of the first load of every page, and one package less to audit.
- The icons are decorative for most of them, and they must stay that way. An icon that is given a name it did not have makes a screen reader read a picture that says nothing.
- The look of the icons is not to change. A different set of icons changes the design of the site, and the design is not the subject of this milestone.

## Definition of Done

- There is one library of icons in the site, and the other one is removed from `package.json` and from the lock file.
- The icons look the same and are as accessible as they were.
- The rule of the whole library is in place and holds.
- The measurement of M21.01 is under its ceiling, and the number before and after is written down.
- The decision of which library stays is written in `DECISIONS.md`.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Related Requirements

- PRD §130 – remove unnecessary dependencies
- PRD §71 – the accessibility of the controls, which this task does not change
- PRD §108 – the best practices and the accessibility of Lighthouse
- ROADMAP Milestone 21 – the removal of the dependencies that are not needed
- DECISIONS – the animation library and the design system, which are not touched
- M21.01 – the measurement that judges this task
