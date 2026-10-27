# M17.07 — Build the Job Fit Analyzer Interface

## Objective

Build the surface a recruiter uses: a page where a job description is pasted, a button that starts the analysis, a loading state, an error state, and a result that presents the six sections of PRD §30 with the qualitative alignment summary of PRD §89 and the call to action of PRD §90.

## Context

This is the first time the site presents a full page of AI output rather than a chat bubble. It has to look like the rest of the portfolio, it has to be usable on a phone, and it has to be honest about what it is.

The building blocks already exist:

- `src/components/ui/` — `Button`, `Card` and `Badge`, built on NeoPOP, used by the rest of the site.
- `design/themeContext.tsx` — `useTheme()` gives the current theme.
- `design/tokens.ts` and `design/motion.ts` — the tokens and the motion presets.
- `src/components/aiChat/ChatInput.tsx` — the paste field of the chat: an auto-resizing textarea, a character counter, Enter to send and Shift+Enter for a new line. The field of the analyzer is the same pattern with a much larger limit and a different label.
- `src/components/aiChat/ChatError.tsx` — the error state with a retry and a dismiss.
- `src/components/aiChat/TypingIndicator.tsx` — the loading animation.
- `src/siteConfig.ts` — the name, the e-mail address, the LinkedIn address and the site address that the call to action needs.
- `src/seo/metadata.ts` — `generateBaseMetadata`, which every page uses.

Two rules shape the interface.

**The alignment summary is qualitative.** PRD §89 shows three bars — strong alignment, transferable, growth areas — and it explicitly forbids a number like "87.34% match". The bars show how many requirements fall into each band, one segment per requirement, out of four. There is no percentage anywhere in the interface.

**The interface never shows the internals.** No chunk identifiers, no similarity scores, no model name, no token counts, no timing. The interface shows the analysis, the sources it is based on, and the call to action. The metadata of M17.06 is used for the analytics of M17.08 and is not rendered.

## Requirements

- Create the page at `app/job-fit/page.tsx`, with the metadata of the other pages.
- Create the client component that holds the state, at `src/components/jobFit/JobFitAnalyzer.tsx`.
- Show a field a job description is pasted into, with:
  - a visible label that says what it is,
  - a placeholder that shows what is expected,
  - a character counter that shows the number of characters and the limit,
  - the limit of M17.01, which is much larger than the limit of the chat,
  - the field that grows as the text is pasted, up to a maximum height, and then scrolls.
- Show a button that starts the analysis. It is disabled while the field is empty and while an analysis is running.
- While the analysis runs, show a loading state that says what is happening. It has to explain that the analysis reads the job description and compares it against the professional profile, because an analysis takes longer than a chat answer.
- When the request is refused, show the error state with a retry and a dismiss, the way the chat does. The message of the route is shown as it is, because the route already writes it for the visitor.
- When the analysis succeeds, show:
  - the heading "HOW ANKIT MAPS TO THIS ROLE" of PRD §89,
  - the three alignment bars, with the labels of PRD §89 and no percentage,
  - the section "Overall positioning",
  - the section "Strong matches",
  - the section "Transferable experience",
  - the section "Learning agility",
  - the section "Interview talking points",
  - the section "Recommended positioning",
  - the sources the analysis is based on, using the titles of the evidence of PRD §43 and nothing else,
  - the call to action of PRD §90: download the resume, connect on LinkedIn, send an e-mail.
- Show the privacy notice of PRD §99 and the disclaimer of PRD §100 under the result.
- Show the job description again above the result, or a button that brings it back, so the recruiter can check what was analysed.
- Keep the pasted job description in the state of the page. It is never sent anywhere except to the route.
- Support the light and the dark theme, the way the rest of the site does.
- Respect `prefers-reduced-motion`.
- Be usable with the keyboard alone, and be readable by a screen reader.
- Be usable on a phone. The field and the result stack in one column.

## Scope

### In scope

- `app/job-fit/page.tsx` (to be created) — the page and its metadata.
- `src/components/jobFit/JobFitAnalyzer.tsx` (to be created) — the client component.
- `src/components/jobFit/JobFitResults.tsx` (to be created) — the presentation of the analysis.
- `src/components/jobFit/AlignmentBars.tsx` (to be created) — the three bars of PRD §89.
- `src/components/jobFit/index.ts` (to be created) — the exports.
- The link to the page from the chat panel, which is part of the entry points of M17.08.

### Out of scope

- The route (M17.06).
- The analytics (M17.08), apart from the call to action firing the event of M17.08.
- A change to the chat, apart from the link to the page.
- A change to the design tokens or to the components in `src/components/ui/`.
- A second analysis at a time. One analysis runs at a time on the page.

## Dependencies

- M17.01 — the shape of the analysis and of the evidence.
- M17.06 — the route the page calls.
- M13.08 — the chat components the field, the loading state and the error state are modelled on.

## Files / Areas Expected To Change

- `app/job-fit/page.tsx` (to be created) — the page.
- `src/components/jobFit/JobFitAnalyzer.tsx` (to be created) — the state and the field.
- `src/components/jobFit/JobFitResults.tsx` (to be created) — the presentation.
- `src/components/jobFit/AlignmentBars.tsx` (to be created) — the bars.
- `src/components/jobFit/index.ts` (to be created) — the exports.
- `src/components/aiChat/ChatPanel.tsx` (updated) — the link to the analyzer.

## Implementation Guidance

1. Follow the shape of the pages that already exist. `app/resume/page.tsx` is a server component that renders a client component and exports the metadata:

   ```tsx
   import { JobFitAnalyzer } from '@/src/components/jobFit';
   import { generateBaseMetadata } from '@/src/seo/metadata';

   export const metadata = {
     ...generateBaseMetadata('Job Description Analyzer', '…'),
   };

   export default function JobFitPage() {
     return <JobFitAnalyzer />;
   }
   ```

2. The state of the component is small:

   ```typescript
   type AnalyzerState =
     | { status: 'idle' }
     | { status: 'loading' }
     | { status: 'error'; message: string }
     | { status: 'done'; result: JobFitResponse };
   ```

   The job description is a separate piece of state, because it survives the states. It is never written to the storage of the browser and never put into a URL.

3. Call the route with a plain `fetch` to `/api/job-fit`, with the body `{ jobDescription }`. The route is the only thing the page talks to. There is no server action and no extra endpoint.

4. Read the answer defensively. The route answers with the analysis, the evidence and the metadata, and answers with an `error` message and a status when something goes wrong. Both have to be handled, and the page has to survive an answer it does not understand by showing the error state.

5. Build the field on the pattern of `src/components/aiChat/ChatInput.tsx`: a textarea that grows with the text up to a maximum height and then scrolls, Enter to submit and Shift+Enter for a new line, a character counter that is announced politely, and the label above the field rather than only a placeholder. The limit is `MAX_JOB_DESCRIPTION_LENGTH` from M17.01, which is imported so the field and the server agree.

6. The loading state uses the `TypingIndicator` of M13.08 or a similar motion, and it says what is happening: "Reading the job description and comparing it against Ankit's professional profile." A spinner alone makes a slow answer look broken.

7. The error state reuses the pattern of `src/components/aiChat/ChatError.tsx`: the message, a retry that runs the analysis again with the same text, and a dismiss that goes back to the idle state with the text still in the field.

8. The bars of PRD §89 are drawn from the alignment bands of M17.01. Each band shows up to four segments, and a filled segment means one requirement in that band. The segments are simple blocks with the NeoPOP elevation, the way the rest of the site draws its blocks.

   ```tsx
   <AlignmentBars bands={analysis.alignment} />
   ```

   The label of each band comes from the contract, so the interface does not spell it out. There is no percentage and no number in the bars. The number of requirements in each band may be shown as plain text next to the label, because that is a count of requirements and not a fit score.

9. The six sections are rendered in the order of the `FIT_SECTIONS` constant of M17.01, so the interface cannot get the order wrong. The heading of each section is a constant as well, with the wording of PRD §30: Overall positioning, Strong matches, Transferable experience, Learning agility, Interview talking points, Recommended positioning.

10. The sources are rendered as a list of the titles of the evidence. No identifier, no score, no date unless the evidence has one. The visitor does not need the internals, and PRD §43 says the interface does not have to expose the raw identifiers.

11. The call to action of PRD §90 uses the links of `src/siteConfig.ts`:

    - Download resume → `/resume`
    - Connect on LinkedIn → `siteConfig.linkedin`
    - Send an e-mail → `mailto:${siteConfig.author.email}`

    The links are ordinary links, so they open in a new tab and the middle click works. The e-mail link is a `mailto:` and nothing else; the address is the one of `siteConfig`, not a personal one.

12. The privacy notice and the disclaimer are the exact sentences of PRD §99 and PRD §100. They are constants, placed in a `src/components/jobFit/notices.ts` next to the components, so they cannot be reworded by accident.

13. Accessibility:
    - the field has a visible label that is associated with it,
    - the result region has `aria-live="polite"` so the answer is announced when it arrives,
    - the error region has `role="alert"`,
    - every action is reachable with the keyboard and has a visible focus,
    - the bars carry a text alternative that says which band holds how many requirements, because a bar of blocks means nothing to a screen reader,
    - the headings follow the order of the sections, so the document outline makes sense,
    - the colour of the bars meets the contrast of the theme, and the filled and the empty segments are told apart by more than colour alone.

14. Responsive behaviour: one column on a phone, the bars stack, the field fills the width. The result is read without horizontal scrolling.

15. Reduced motion: the loading animation and the entrance of the result are removed when the visitor asks for reduced motion, the way the chat does it with `window.matchMedia('(prefers-reduced-motion: reduce)')`.

16. The link from the chat panel is a single line that points to `/job-fit`, with a label that says what it does. It sits under the suggested prompts or in the panel header. It must not look like a button that belongs to the chat itself, because it leaves the chat.

## Acceptance Criteria

- The page exists at `/job-fit`, has the metadata of the other pages and is registered by the build.
- The page shows a labelled field with a placeholder, a character counter and the limit of M17.01.
- The field grows with the text and scrolls after it reaches the maximum height.
- The button is disabled when the field is empty and while the analysis runs.
- The loading state says what is happening.
- The error state shows the message of the route and offers a retry and a dismiss.
- The result shows the heading of PRD §89, the three bars, the six sections of PRD §30, the sources and the call to action.
- No percentage and no fit score appears anywhere in the interface.
- The bars have a text alternative.
- The call to action links to the resume, to LinkedIn and to the e-mail address of `siteConfig`.
- The privacy notice of PRD §99 and the disclaimer of PRD §100 are shown.
- The interface works in the light and the dark theme and respects reduced motion.
- The interface is usable with the keyboard alone and with a screen reader.
- The interface is usable on a phone.
- The job description is never put into the storage of the browser and never into the URL.
- The build passes, and lint and typecheck pass.

## Testing Requirements

- The build registers `/job-fit` and the page renders without an error.
- The component renders the idle state with the field and a disabled button.
- The button becomes available when there is text in the field.
- The loading state is shown while the request is open.
- The error state is shown for a refusal, and the message of the route is displayed.
- The result state renders all six sections, in the order of the contract.
- The bars render one segment per requirement, up to four, and no percentage.
- The sources render the titles of the evidence and no identifier.
- The call to action renders the three links of PRD §90.
- The privacy notice and the disclaimer are rendered.
- The document outline of the result is in the order of the sections.
- The field and the result have their accessible names.
- The lint and the typecheck pass, and the build succeeds.

## Security / Privacy Considerations

- The job description stays in the state of the page. It is never written to the storage of the browser, never put into the URL and never sent anywhere except to the route of this project. A URL with a job description in it would end up in the history of the browser and in the logs of the server.
- The interface renders the analysis, and the analysis has already been through the output guardrails and the response validation of M17.05. Nothing is rendered that has not passed them.
- The interface shows the source titles and nothing else of the evidence. No identifier and no score.
- The e-mail link uses the address of `siteConfig`, which is the generic contact address and not a personal one. The phone number is never shown anywhere.

## Performance / Accessibility Considerations

- The page is a server component that renders one client component, so the page itself ships very little JavaScript.
- The result is rendered once and is not re-rendered while it is shown.
- The loading animation is light and is removed when the visitor asks for reduced motion.
- The field is limited in height so that a long job description does not push the page down forever.
- The whole result fits on a phone without horizontal scrolling.
- The bars are told apart by more than colour, the sections use the heading levels of the document, and the result is announced politely when it arrives.

## Definition of Done

- `/job-fit` exists and works.
- The field, the loading state, the error state and the result are all implemented and reachable with the keyboard.
- The six sections, the three bars and the call to action are shown.
- No fit percentage and no internal identifier reach the interface.
- The theme, the reduced motion and the phone layout work.
- The privacy notice and the disclaimer are shown.
- The build passes, and lint and typecheck pass.

## Related Requirements

- PRD §30: AI Job Description Analysis
- PRD §41: AI Tone
- PRD §43: AI Source Grounding
- PRD §45: Conversation Memory
- PRD §66: Reduced Motion
- PRD §69: Mobile Experience
- PRD §71: Accessibility
- PRD §74: Performance
- PRD §89: Job Fit UI
- PRD §90: AI CTA
- PRD §91: Recruiter Experience
- PRD §99: Privacy Notice
- PRD §100: AI Disclaimer
- PRD §126: Milestone 17 — Job Description Analyzer
