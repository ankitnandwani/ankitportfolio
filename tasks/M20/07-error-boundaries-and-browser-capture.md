# M20.07 – Add the Error Boundaries and the Browser Error Capture

## Objective

Make a failure in the browser visible to the owner of the site, and give the visitor a page that keeps working instead of a blank one.

## Context

The site has no error boundary at all. `app/` holds `layout.tsx`, `page.tsx` and the route folders, and no `error.tsx` and no `global-error.tsx`. Next.js shows its own page when a failure reaches it, and that page says that something went wrong without saying what and without telling anybody.

PRD §129 asks for the error boundaries as a part of this milestone, and PRD §79 asks for the frontend errors to be tracked.

Two things happen here:

1. **The boundaries.** A boundary is a component that catches the failure of the part of the page below it, shows something to the visitor, and reports the failure. Next.js has two file conventions for them: `error.tsx` for a part of the routes, and `global-error.tsx` for the root of the application. **Read the bundled documentation before writing them** — `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` and the file for `global-error` — because the version of Next.js in this repository is 16.3.2 and the conventions differ from the ones in the training data of an agent. In particular, check which of the two has to be a client component and what the shape of the props is.
2. **The capture.** The browser SDK of M20.01 is started by `instrumentation-client.ts`, which catches the failures that nothing else catches: a failure in an event handler, a promise that is rejected with nothing to catch it, and a failure while the page is loading.

The client side of the site already handles the failures of the chat on its own: `src/components/aiChat/hooks/useChatAPI.ts` throws an `Error` with the message of the answer of the server, and `src/components/aiChat/ChatError.tsx` shows it to the visitor. Those failures are an answer of the server and not a failure of the page, and they must not be reported as a failure of the browser.

The repository has no React testing library, so the boundaries are checked in a browser and not in a unit test. The same approach was used for the click of a call to action in M19.03.

## Requirements

### 1. The error boundaries exist

- `app/error.tsx` — the boundary of the routes. It catches the failure of the page below it, shows the visitor a message that says what happened and offers a way to try again, and reports the failure.
- `app/global-error.tsx` — the boundary of the root. It catches what the first one cannot, and it has to render its own `html` and `body`.
- Both are written in the style of the site: the design system, the colours of `globals.css`, the same typography. They are pages of the site and not a raw message of the framework.
- Both meet the accessibility of PRD §71: the message is readable by a screen reader, the way to try again is a real button that can be reached with a keyboard, and the focus is moved to it.
- The message a visitor sees says that something went wrong and offers to try again. It never shows the message of the failure, the stack or the name of a service. The visitor is not a developer of the site.

### 2. The failure is reported

- The boundary reports the failure with the name of the part of the page it covers and the digest that Next.js gives, when there is one. The digest is the short identifier that ties the failure in the browser to the one on the server.
- The report holds no text of the page, no value of a field and no answer of the chat.
- The report is sent on its own and is not awaited before the visitor sees the page. A visitor must never wait for a report.

### 3. The failures that nothing catches are reported by the SDK

- The browser SDK of M20.01 catches a failure in an event handler, a promise that is rejected with nothing to catch it, and a failure while the page is loading.
- The scrubbing of M20.02 applies to them as well. The `beforeSend` hook of the browser configuration already does that.

### 4. The failures that are not failures are not reported

- The failure of a request of the chat, of the analyzer or of the contact form is an answer of the server that the interface already shows to the visitor. It is not a failure of the browser and it must not be reported as one.
- A request that the visitor cancels is not a failure.
- A failure of the analytics of the browser is never reported to the browser, because the analytics is not allowed to throw in the path of the visitor and because a failure of the analytics is not worth a report.

## Scope

### In scope

- `app/error.tsx` (new)
- `app/global-error.tsx` (new)
- The reporting of the boundary, through the capture module of M20.03 or a small addition to it
- The configuration of the browser SDK of M20.01, where the capture of the unhandled failures is confirmed
- The styles of the boundaries, in `app/globals.css` or in the module of the component, following the style of the site

### Out of scope

- The server side boundaries, which are the routes of M20.03
- Changing what the chat shows when it fails
- The analytics of M19
- A test framework for the React components. Adding one is not part of this milestone.

## Dependencies

- M20.02 – the report goes through the scrubbing.
- M20.01 – the browser SDK has to exist before it can catch anything.

## Files / Areas Expected To Change

- `app/error.tsx` (new)
- `app/global-error.tsx` (new)
- `src/components/layout/` (the presentation of the boundary, if it is a component of its own)
- `app/globals.css` (only if the style needs a rule that is not there)
- `sentry.client.config.ts` (the confirmation that the unhandled failures are caught)

## Implementation Guidance

1. **Read the bundled documentation first.** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` and the file for `global-error`. The version of Next.js in this repository is 16.3.2.
2. **Follow the style of the site.** The page has to look like the rest of the site: the same container, the same button, the same typography. Look at `src/components/aiChat/ChatError.tsx` and at the design system in `src/design/` before writing anything.
3. **The visitor is told what happened, not what the failure was.** "Something went wrong while loading this part of the page. Please try again." is what the visitor reads.
4. **The digest is the link between the two sides.** When the boundary catches a failure that the server also saw, the digest ties them together. Include it in the report and never in the page.
5. **The report is not awaited.** `useEffect` with a promise that is not awaited is the shape. The page of the visitor appears first.
6. **Do not report the failures of the requests.** The interface shows them already. A report of every failed request would fill the project with the ordinary failures of a visitor who typed something the guardrails refused.

## Acceptance Criteria

- `app/error.tsx` exists and catches the failure of the page below it.
- `app/global-error.tsx` exists and catches what the first one cannot.
- Both show the visitor a page in the style of the site, with a way to try again that can be reached with a keyboard.
- Neither shows the message of the failure, the stack or the name of a service to the visitor.
- The failure is reported with the part of the page and the digest, and holds nothing that the page held.
- The visitor does not wait for the report.
- A failed request of the chat, of the analyzer or of the contact form is not reported as a failure of the browser.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Manual: a page is made to fail on purpose and the boundary is seen, with the design of the site and a way to try again.
- Manual: the failure is seen in the Sentry project with the part of the page and the digest, and with no text of the page.
- Manual: the way to try again is reached with the keyboard alone and the message is read by a screen reader.
- Manual: a failed request of the chat does not appear in the project.
- Manual: the site builds and the boundaries do not break the build.

## Security / Privacy Considerations

- The page that a visitor sees never shows the failure. The digest is not shown either.
- The report holds no text of the page and no value of a field. A form that a visitor was filling in must not end up in a report.
- The browser configuration keeps `sendDefaultPii: false` and the session replay off, exactly as M20.01 set it.

## Performance / Accessibility Considerations

- The boundary is loaded only when it is needed, because Next.js loads the boundary and not the page that failed.
- The boundary meets WCAG 2.2 AA as the rest of the site does (PRD §71): the message is announced, the button can be reached and used with a keyboard, and the colours have enough contrast.
- The bundle grows by the size of the boundary, which is small.

## Definition of Done

- The two boundaries exist, are in the style of the site, and are accessible.
- The failure of the browser is reported with nothing private in it.
- The failures that are answers of the server are not reported.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §129 – error boundaries
- PRD §79 – frontend errors
- PRD §71 – WCAG 2.2 AA
- ROADMAP Milestone 20
- M19.03 – the shape of a browser side action that never throws in the path of the visitor
