# M21.02 – Lazy-Load the Chat, the Palette and the Sections Below the Fold

## Objective

Let the visitor receive the page first and the heavy parts of it a moment later, without losing a single word of the content and without making the visitor wait for the chat to open.

## Context

PRD §74 asks for the lazy loading of:

```
- heavy project media
- advanced visualizations
- chat UI
- analytics where appropriate
```

and ROADMAP M21 asks for the lazy loading of the heavy assets. PRD §75 says the site must remain useful if the JavaScript partly fails, and PRD §108 says the accessibility and the performance are not to be sacrificed for the visual effects.

What the site does today, measured on 2026-11-12:

- `app/layout.tsx` imports `ChatWrapper` and `CommandPalette` directly. Both are client components, both use the animation library, and both are in the first load of **every** page of the site, whether the visitor opens them or not. The chat is the AI recruiter assistant, with its panel, its launcher, its prompts, its feedback button and its typing indicator; the palette holds the list of the commands.
- `next/dynamic` is **not used anywhere** in the repository.
- The home page is a list of nine sections that are all client components, all rendered at once: the hero, the professional section, the achievements, the career timeline, the capability areas, the three featured projects, the social hub and the testimonials, and the two call to action blocks.
- The analytics of M19 is already loaded on its own and is not part of the first load. That part of PRD §74 is already satisfied and is not touched here.

**The risk that has to be managed.** The sections of the home page _are_ the content of the site. A crawler and a reader without JavaScript both have to find them. So the lazy loading here is the **server rendering stays on** kind: the section is written by the server in the HTML, and the code of the component is fetched afterwards. `next/dynamic` with `ssr: true`, which is the default, does exactly that. What is saved is the JavaScript of the first load, not the content of the page.

The other risk is the largest contentful element. LCP measures the largest picture or the largest block of text that appears. If the element that LCP measures is in a section that is loaded late, the target of PRD §74 becomes harder to reach, not easier. The hero is the first thing of the page and is the element that is measured today, so the rule of this task is that **the hero is never lazy-loaded**.

## Requirements

### 1. The chat and the palette are not in the first load

- `ChatWrapper` and `CommandPalette` are loaded with `next/dynamic` in `app/layout.tsx`.
- The launcher of the chat, which is the small button that opens it, stays in the first load, so that the first click of a visitor opens the chat without a wait that a visitor can feel.
- The palette is opened with a key (`⌘K` / `Ctrl+K`), and the key has to work before the palette is loaded. The listener of the key is therefore in a component that is in the first load, and the palette itself is the part that is loaded late.
- The two components keep their behaviour exactly as it is: the same markup, the same states, the same keyboard behaviour, the same analytics events of M19 and the same rate limits of M17.

### 2. The sections of the home page are loaded after the first paint

- The sections that are below the fold are loaded with `next/dynamic` and with the server rendering **on**, so the HTML of the page still holds the content of every section.
- The hero is not lazy-loaded.
- The sections that the visitor reaches by scrolling are loaded when they are close to the viewport, not when the page opens.
- A section that is lazy-loaded still works without JavaScript: the content is in the HTML and the actions that need JavaScript are inside the section itself.

### 3. The loading of a lazy section never breaks the page

- A section that fails to load does not take the page with it. The boundary of M20 catches the failure of the page and shows the page of the site.
- The layout of the page does not move when a section arrives, because the server already sent the space that it takes. A section that is loaded late must not create a shift of the layout, which is CLS.

### 4. The pages that are not the home page are not made slower

- The lazy loading is done per page and not globally, so that the page of the resume, the page of the projects and the page of the design system keep what they need.
- The pages that are a single component, such as `/resume`, are left as they are.

## Scope

### In scope

- `app/layout.tsx` (the chat and the palette)
- `src/components/aiChat/ChatWrapper.tsx` and the launcher of the chat
- `src/components/command-palette/CommandPalette.tsx` and the hook of the key
- `app/page.tsx` (the sections of the home page)
- The components of the sections that are made late, where the loading needs a small change of their own
- A test of the rule that the hero and the launcher are in the first load

### Out of scope

- The size of the animation library itself, which is M21.03.
- The removal of a dependency, which is M21.04.
- The images and the fonts, which are M21.05 and M21.06.
- The cache of the pages and of the assets, which is M21.07.
- Any change of the design, of the content, of the accessibility of the sections or of the behaviour of the chat.
- The pages of the projects, of the resume, of the contact, of the analyzer and of the design system, except where they share a component with the home page.

## Dependencies

- M21.01 – the size of the first load is measured before and after.
- M21.03 – the sections that are made late are the ones that use the animation library, and the two tasks touch the same files. M21.03 comes first.

## Files / Areas Expected To Change

- `app/layout.tsx`
- `app/page.tsx`
- `src/components/aiChat/ChatWrapper.tsx`
- `src/components/aiChat/ChatLauncher.tsx`
- `src/components/command-palette/CommandPalette.tsx`
- `src/components/command-palette/index.ts`
- `src/hooks/useCommandPalette.ts`
- The section components of the home page that are made late
- `src/lib/performance/` (a rule that checks what is in the first load)

## Implementation Guidance

1. **`next/dynamic` with the server rendering on is the shape.** `const Chat = dynamic(() => import('@/src/components/aiChat/ChatWrapper').then(m => m.ChatWrapper))` keeps the HTML of the page and takes the JavaScript out of the first load. The `ssr: false` is not to be used for a section of the content: it would empty the HTML and would break the crawler and the reader without JavaScript.
2. **The launcher stays.** The button that opens the chat is small and it is the promise of the chat to the visitor. It is in the first load and it opens the panel as soon as the panel is there. If the panel is not there yet, the click waits for it and then opens it; the visitor sees the panel open, not a button that does nothing.
3. **The key of the palette is listened to early.** `useCommandPalette` is in the first load and it holds the listener of `⌘K`. The palette itself is loaded when it is opened for the first time. The key has to open the palette the first time, with no second try.
4. **The sections are loaded when they are near the viewport.** `next/dynamic` loads the chunk when the component is rendered, and the rendering of a section of the home page happens in the server. The way to hold a section back until the visitor scrolls to it is a small client wrapper that renders the section when it comes close to the viewport, and that renders the server's HTML until then. The wrapper must be simple: it holds a reference, it watches the intersection and it renders the child.
5. **The shift of the layout is the thing to watch.** A section that arrives late and pushes the content below it down is a CLS that fails the target of PRD §74. The server has to send the space of the section, which the sections already do with their own spacing.
6. **The rule of the first load.** A test that reads the HTML of the home page and of the layout checks that the launcher of the chat is in the HTML and that the code of the palette and of the panel of the chat is not. The test is a rule on the build, not on the source, so it catches a component that is imported directly again.

## Acceptance Criteria

- The HTML of the home page holds the content of every section, including the sections that are loaded late.
- The launcher of the chat is in the first load of the layout and opens the chat on the first click.
- The key of the command palette opens the palette on the first press, before the palette is loaded.
- The code of the chat panel and of the command palette is not in the first load of the layout.
- The code of the sections that are below the fold is not in the first load of the home page.
- The hero is in the first load.
- A section that fails to load does not take the page with it, and the boundary of M20 shows the page of the site.
- The size of the first load of the home page is under the ceiling of M21.01 and the number is written down.
- The content, the design, the accessibility and the analytics of the sections are the ones of today.
- The existing tests pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the rule of the first load holds on the HTML that the build produces: the launcher is there, the panel of the chat and the palette are not.
- Unit test: the server rendering of a lazy section is on, and a component that is made late is still written in the HTML.
- Manual: the chat opens on the first click, the palette opens on the first press of the key, the sections of the home page arrive when the visitor scrolls, and the page does not shift when they arrive.
- Manual: the page of the home was read with JavaScript turned off and the content is all there.
- The measurement of M21.01 was run before and after, and the two numbers are written down.

## Security / Privacy Considerations

- Nothing changes in the data the site keeps. The lazy loading moves the code of a component and not the body of a request.
- The chat of the AI stays behind the same rate limits of M17 and the same guardrails. The chat being loaded late does not make it a different chat.
- The analytics of M19 must not be loaded twice. A component that is loaded late and that also appears in the first load would fire its events twice, and the numbers of the visits would be wrong.

## Performance / Accessibility Considerations

- The whole point of the task is to take the JavaScript of the first load down. The measurement of M21.01 is the proof.
- The content must stay reachable. A section that is not in the HTML is a section that a crawler cannot read and that a reader without JavaScript cannot see, and PRD §75 asks for both to work.
- The focus must not be lost. When a lazy section arrives, the focus does not move to it, because the visitor did not ask for it.
- The reduced motion of PRD §131 is not touched here, but a section that animates when it arrives must not animate when the visitor asked for no motion. M22 is the milestone that checks that in full; this task must not make it worse.

## Definition of Done

- The chat, the palette and the sections below the fold are not in the first load.
- The content of the page is still in the HTML, and the page is still useful without JavaScript.
- The chat and the palette open on the first try.
- The size of the first load of the home page is under the ceiling of M21.01, and the number is written down.
- All the tests pass, the lint is clean, the typecheck is clean, and the build succeeds.

## Related Requirements

- PRD §74 – the lazy loading of the chat UI, of the heavy media and of the visualizations
- PRD §75 – the site stays useful when the JavaScript partly fails
- PRD §108 – the performance is not sacrificed for the visual effects
- ROADMAP Milestone 21 – lazy loading of the heavy assets
- M21.01 – the measurement that judges this task
- M21.03 – the loading of the animation library, which comes first
