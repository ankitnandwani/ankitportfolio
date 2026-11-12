# M21.03 – Stop Shipping the Animation Library to the Pages That Do Not Animate

## Objective

Keep the animation library that the site uses, and stop sending its 136 kilobytes to the pages that do not need it.

## Context

PRD §74 says:

```
Avoid shipping large animation libraries unnecessarily.
```

`DECISIONS.md` names **Framer Motion / Motion** as the library of the animation, and that decision is accepted. The two statements are not in conflict: the library is used and it is approved, and the point of PRD §74 is that a page which does not animate should not download the code of the animation.

What the repository holds today:

- The library is used in **thirty-four files**: the hero, the footer, the testimonials, the achievements, the contact form, the analyzer, the palette, the chat, the page of the resume, the page of the design system, the mobile menu, the cards of the projects, the timeline of the career and the cards of the companies.
- The runtime of the library is the chunk `244v73qzck607.js`, **136 kB**, and it is in the **first load of every page** of the site, because the layout and the first section of the home page import it directly.
- The whole of the library in the build is several times that: the chunks that hold `AnimatePresence` and the variants of the components add 36 kB, 40 kB and 60 kB more.

**The decision that needs a person.** The removal of the dependency. It is used in thirty-four files and it is the approved one, and the milestone can get the same result on the pages that do not animate without removing it. **The recommendation is not to remove it.** If the owner wants the dependency gone, that is a change of an accepted decision: it has to be written in `DECISIONS.md` with its reason, and the thirty-four files have to be changed. This task does not do that and does not prepare it silently.

## Requirements

### 1. The library is not in the first load of a page that does not animate

- The pages and the sections that do not animate do not download the runtime of the library.
- The sections that do animate keep their animation exactly as it is: the same variants, the same timing, the same shape of the motion.
- The library stays a dependency of the repository and is not removed from `package.json`.

### 2. The way the library is loaded is one place and not thirty-four

- The library is imported through **one module of the site**, `src/components/motion/`, which holds the parts of the library that the site uses (`motion`, `AnimatePresence`, and the few helpers). Every component of the site imports the animation from there.
- The module offers the same API as the library for the parts the site uses, so that a component does not have to know how the loading is done.
- The loading is lazy where it can be, and the site can be built without the library being in the first load of a page that does not animate.

### 3. The animation is a decoration, not a requirement

- PRD §75: the site must remain useful when the animation fails. A page whose animation does not run still shows its content and still works.
- The rule of the reduced motion of PRD §131 is honoured where the site already honours it: an animation is not run when the visitor asked for no motion. The full pass of PRD §131 belongs to M22 and is not extended here.
- The animation of the first paint of a page is the one that is kept the earliest, because it is the one that a visitor sees at once.

### 4. The size that is saved is measured

- The size of the first load of the home page before and after is written down, and the runtime of the library is either out of the first load or its size has gone down.
- The rule of M21.01 holds after the change.

## Scope

### In scope

- `src/components/motion/` (new) — the one place where the library is imported
- The components that import the library directly, so that they import the module of the site instead
- The sections of the home page that are made late, where the loading of the library follows the loading of the section
- `src/components/layout/PageTransitions.tsx`, which is in the layout of the site and therefore in the first load of every page
- The rule of the first load that checks that the runtime of the library is not in the first load of a page that does not animate

### Out of scope

- **The removal of the dependency.** That is a change of an accepted decision and it needs the owner.
- The way the animations look. The variants, the timing and the shape of the motion are not changed here.
- The lazy loading of the sections, which is M21.02 and comes after this task.
- The size of the other libraries, which is M21.04.
- The complete pass of the reduced motion, which is M22.

## Dependencies

- M21.01 – the size of the first load is measured before and after.
- M21.04 – the icons are dealt with first, because the two tasks touch the same chunks of the first load and it is easier to tell what each of them saved.

## Files / Areas Expected To Change

- `src/components/motion/index.ts` (new)
- `src/components/motion/index.test.mts` (new) — if a test can be written about it
- The thirty-four files that import `framer-motion` today, so that they import the module of the site instead
- `src/components/layout/PageTransitions.tsx`
- `src/lib/performance/` (the rule of the first load)

## Implementation Guidance

1. **One module, one import.** `src/components/motion/index.ts` re-exports `motion`, `AnimatePresence` and the helpers the site uses. A component that imports `framer-motion` today imports `motion` from the module of the site instead. The change is mechanical, it is in thirty-four files, and it is the shape that keeps the loading in one place.
2. **The heavy part of the library is what has to move.** The runtime of the library is the 136 kB chunk. The components that use `motion.div` and `AnimatePresence` need the runtime, and the components that do not animate do not. A page that only uses CSS transitions and CSS animations does not need the runtime at all.
3. **The transitions of the pages are the hard part.** `PageTransitions` is in the layout of the site, so it is in the first load of every page, and it is the animation of the change of the route. Two ways are open: the transition becomes a CSS animation, which is what a change of route needs anyway and costs nothing, or the component is loaded late, which would make the first change of route arrive without a transition. **The CSS way is the recommendation**, because the transition of a page is one of the cases where the runtime of the library is the most expensive and the least necessary.
4. **`React.lazy` and `next/dynamic` are the tools for the components that do animate.** A component that is loaded late takes its animation with it, because the animation lives in the code of the component. The animation of the first paint has to be either in the first load or in CSS.
5. **The rule that catches the regression.** A rule reads the HTML of the pages and checks that the chunk of the runtime of the library is not in the first load of a page that does not animate. Without it, the next component that imports the library directly puts it back.
6. **Nothing of the library is removed from `package.json`.** The dependency stays. The decision of the owner is a separate step and it is written down in `DECISIONS.md` when it is taken.

## Acceptance Criteria

- The runtime of the library is not in the first load of a page that does not animate, and the rule checks it.
- Every component of the site imports the animation from the one module of the site, and no file imports `framer-motion` directly any more.
- The library stays in `package.json`. The dependency is not removed by this task.
- The animation of every component that animates looks the same as it did and happens at the same time.
- A page whose animation does not run still shows its content and still works.
- The size of the first load of the home page is under the ceiling of M21.01, and the number before and after is written down.
- The rule of the first load of M21.02 holds.
- The existing tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Testing Requirements

- Unit test: the module of the site exports what the components of the site use.
- Unit test: the rule of the first load fails when a chunk of the runtime of the library is in the first load of a page that does not animate, and passes when it is not.
- Manual: the animations of the hero, of the sections, of the palette, of the chat and of the change of route were compared with the ones before, one by one.
- Manual: the page was read with the motion of the machine turned off and the content is there.
- The measurement of M21.01 was run before and after, and the two numbers are written down.

## Security / Privacy Considerations

- Nothing changes in the data of the site. The task moves the code of the animation and touches nothing of the requests.
- The bundle of the browser is smaller, so there is less code from a third party in the page of a visitor. The library is a dependency that is already accepted and audited.
- The rule of the first load reads the HTML of the build. It holds no body, no cookie and no address of a visitor.

## Performance / Accessibility Considerations

- The saving is the point of the task: 136 kB of the runtime of the library, and more where the variants of the library travel with it.
- The animation must not become the thing that the visitor waits for. The animation of the first paint is the one that is kept early.
- PRD §75 asks that the site stays useful when the animation fails. A component whose animation throws is a component whose content is still there, and it has to be so.

## Definition of Done

- The runtime of the animation library is out of the first load of the pages that do not animate.
- The library is imported through one module of the site, and the dependency is not removed.
- The animations look the same and the site works without them.
- The measurement of M21.01 is under its ceiling, and the number before and after is written down.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Related Requirements

- PRD §74 – avoid shipping large animation libraries unnecessarily
- PRD §75 – the site stays useful when the animation fails
- PRD §131 – the reduced motion, which M22 checks in full
- DECISIONS – the animation library, which is respected and is not changed by this task
- ROADMAP Milestone 21 – the removal of the dependencies that are not needed, which needs the owner
- M21.01 – the measurement, M21.04 – the icons, M21.02 – the lazy loading of the sections
