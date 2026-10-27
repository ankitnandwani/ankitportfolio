# M17.08 — Add Job Fit Analytics and the Entry Points

## Objective

Add the `job_fit_analysis` event of PRD §78, track the calls to action of PRD §90, and connect the analyzer to the rest of the site so a recruiter reaches it from the place they are already in: the chat and the homepage.

## Context

PRD §78 lists the events to track and `job_fit_analysis` is one of them. The analytics of M13.11 already has the session identifier, the event types and the PostHog integration, so this task adds one event type and one tracking function.

The event has to answer one question: is the job fit analysis being used, and does it produce a result that a recruiter can act on? That means the number of requirements, how they were classified, how long the analysis took, whether the retrieval found anything, and whether the result was replaced. It does **not** mean the job description, the company, or the name of the role. A recruiter pasting a job description pastes a piece of confidential information from their employer, and it must never reach the analytics.

The entry points matter more than the event. PRD §91 draws the recruiter flow:

```text
Recruiter arrives → Understands role in 10 seconds → Sees achievements →
Explores experience → Checks projects → Asks AI a question → Pastes JD →
AI explains fit → Downloads resume → Contacts Ankit
```

The analyzer is the step after "Asks AI a question", and the call to action is the step after "AI explains fit". So the analyzer has to be reachable from the chat, and the chat has to be able to point at it. The homepage is the other place a recruiter starts.

PRD §8 and PRD §92 list the navigation, and neither has an entry for the analyzer. So the analyzer does not become a ninth navigation item. It is reached from the chat panel and from the homepage, which is where the recruiter already is. This is decision D7 of `tasks/M17/README.md` and it needs a human to confirm it.

## Requirements

- Add the `JobFitAnalysisEvent` to `src/lib/analytics/eventTypes.ts` with the event type `job_fit_analysis`, which PRD §78 names.
- The event carries:
  - the session identifier and the timestamp, the way every event does,
  - the query identifier of the analysis, so it can be tied to the log of the server,
  - the number of requirements that were found and the number that were analysed,
  - the number of requirements in each of the five classifications,
  - whether the retrieval found anything, and how many chunks it returned,
  - the latency of the analysis,
  - the token usage, the way the chat event carries it,
  - the model that produced the analysis,
  - whether the fallback of M17.03 was used,
  - whether the analysis was replaced by the safe fallback of M17.05,
  - how many claims were corrected by M17.04.
- The event carries **no** job description, no title, no company, no requirement text, no evidence text and no personal data of any kind.
- Add the tracking function `trackJobFitAnalysis` to `src/lib/analytics/analytics.ts`, with the same shape as the other tracking functions: fire and forget, a failure is caught and logged, and it never throws.
- Add the event to the `AnalyticsEvent` union.
- Extend the `ctaType` of the existing `cta_clicked` event with the value `email`, because PRD §90 has an e-mail call to action and the union does not cover it.
- Track the three calls to action of the result: the resume, LinkedIn and the e-mail. The existing `cta_clicked` event is used, with the type of the call to action and the domain of the target.
- Add the link to the analyzer in the chat panel, with a label that says what it does, so the recruiter who asked "would he be a good fit for a Staff SDET role?" can go further.
- Add the entry point on the homepage, next to the section that carries the AI assistant, so the recruiter reaches the analyzer from the first screen.
- Make sure the chat keeps working. The suggested question of PRD §29, "Would he be a good fit for a Staff SDET role?", already exists and is answered by the chat. The link is an addition and not a replacement.

## Scope

### In scope

- `src/lib/analytics/eventTypes.ts` (updated) — the event type and the extension of the union.
- `src/lib/analytics/analytics.ts` (updated) — the tracking function.
- `app/api/job-fit/route.ts` (updated) — the call to the tracking function.
- `src/components/jobFit/JobFitResults.tsx` (updated) — the tracking of the calls to action.
- `src/components/aiChat/ChatPanel.tsx` (updated) — the link to the analyzer.
- `app/page.tsx` (updated) — the entry point on the homepage.
- The tests of the analytics, if the analytics has any.

### Out of scope

- A new analytics provider. PostHog is used the way M13.11 set it up.
- The PostHog keys. They are still placeholders in the environment, and this task does not change that.
- A dashboard. The events are enough.
- The tracking of the job description, of the company or of the role.
- Any change to the analysis, the policy or the route behaviour.

## Dependencies

- M17.01 — the contract, so the counts of the classifications are known.
- M17.06 — the route, which fires the event.
- M17.07 — the result, which fires the calls to action.
- M13.11 — the analytics that are extended.

## Files / Areas Expected To Change

- `src/lib/analytics/eventTypes.ts` (updated) — `JobFitAnalysisEvent`, the union and the `ctaType`.
- `src/lib/analytics/analytics.ts` (updated) — `trackJobFitAnalysis`.
- `app/api/job-fit/route.ts` (updated) — the call.
- `src/components/jobFit/JobFitResults.tsx` (updated) — the calls to action.
- `src/components/aiChat/ChatPanel.tsx` (updated) — the link.
- `app/page.tsx` (updated) — the entry point.

## Implementation Guidance

1. Write the event the way the other events in `src/lib/analytics/eventTypes.ts` are written: an interface that extends `BaseAnalyticsEvent`, with a comment on every property that says what it is and why it is safe.

2. The counts of the classifications are computed from the classified requirements of the analysis:

   ```typescript
   const counts = {
     directMatch: 0,
     strongTransfer: 0,
     related: 0,
     learnable: 0,
     unknown: 0,
   };
   ```

   The property names are the camel case of the five classifications of PRD §88.

3. The tracking function follows the shape of `trackResponseReceived`: it takes the session identifier, the query identifier, the properties and the configuration, it returns a promise, and it never throws.

   ```typescript
   export async function trackJobFitAnalysis(
     sessionId: string,
     queryId: string,
     properties: JobFitAnalysisProperties,
     config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
   ): Promise<void>
   ```

4. The route fires the event the way the chat route fires its events: fire and forget, with the failure caught and logged.

   ```typescript
   trackJobFitAnalysis(sessionId, queryId, properties, analyticsConfig)
     .catch((err) => console.warn('[analytics] trackJobFitAnalysis failed:', err));
   ```

   The session identifier comes from the same helper the chat uses, so one visitor has one identifier across the chat and the analyzer.

5. The session identifier of the analyzer is the one of the analytics, not the one of the rate limit. They are different things: the rate limit counts the requests of an address, the analytics follows a browser session.

6. Extend the `ctaType` of the `cta_clicked` event with `email`. The union is a union of string literals, so it is a one line change and the existing values keep working.

7. Track the calls to action in the result component. The click on the resume, on LinkedIn and on the e-mail each fire a `cta_clicked` event with the type and the domain of the target. The e-mail target has no domain, so it uses the domain of the site.

8. Add the link in the chat panel. It is an ordinary link to `/job-fit`, it opens in the same tab, and it is labelled in plain words: "Analyse a job description". It sits under the suggested prompts, so it is offered at the moment the recruiter is thinking about a role. It is not a chat action and must not look like one.

9. Add the entry point on the homepage, next to the section that carries the AI assistant. A short line with a link to `/job-fit`, styled like the other section headings and the secondary calls to action of the hero. It must not push the professional content of the first screen down.

10. Do not add the analyzer to `src/data/navigationItems.ts`. PRD §8 and PRD §92 fix the navigation, and the analyzer is not in it. This is decision D7 and it is waiting for a human.

11. Keep the properties of the event safe by construction. The event takes the counts and the timings, not the analysis and not the document. A test asserts that the properties of the event hold no text of the job description.

## Acceptance Criteria

- The `job_fit_analysis` event exists, is part of the union and is fired by the route.
- The event carries the counts of the classifications, the requirement counts, the retrieval outcome, the latency, the token usage, the model, the fallback flag, the replacement flag and the number of corrections.
- The event carries no job description, no title, no company, no requirement text and no evidence text. A test asserts it.
- `trackJobFitAnalysis` never throws, and a failure is caught and logged.
- A failure of the analytics does not change the status of the answer.
- The `ctaType` covers the resume, LinkedIn and the e-mail, and the three calls to action of the result fire the event.
- The chat panel has a link to `/job-fit`.
- The homepage has an entry point to `/job-fit`.
- The navigation of the site is unchanged.
- The chat still works, and the suggested question of PRD §29 is still there.
- The tests pass, and lint and typecheck pass.

## Testing Requirements

- The event is created with the counts of the five classifications and they add up to the number of classified requirements.
- The properties of the event hold no text: a job description with a company name in it produces an event whose serialised form does not contain the name.
- A failure of the tracking function is caught and does not throw.
- The route fires the event with the session identifier of the visitor and with the query identifier of the analysis.
- The three calls to action fire the `cta_clicked` event with the right type and the right domain.
- The link of the chat panel points at `/job-fit`.
- The entry point of the homepage points at `/job-fit`.
- `NAVIGATION_ITEMS` still holds the eight items of PRD §8.
- The lint and the typecheck pass.

## Security / Privacy Considerations

- A job description is confidential information from the employer's side. It is never part of an analytics event, never part of a log, and never part of the storage of the browser. The event carries counts and timings.
- The session identifier is the privacy-conscious one of M13.11, a hash of the address and the user agent, and not the address itself.
- The domain of a call to action is recorded, not the full address, so a LinkedIn address with a tracking parameter does not reach the analytics.
- The e-mail address of `siteConfig` is a generic contact address, and it is never part of an event.
- The analytics stays optional. Without the PostHog keys the events are only written to the console in development, which is the behaviour of M13.11.

## Performance / Accessibility Considerations

- The tracking is fire and forget and never delays the answer.
- The link in the chat panel is an ordinary link, so it is reachable with the keyboard and announced as a link.
- The entry point on the homepage is a link with a clear label, and it does not push the professional content of the first screen down.
- The call to action links keep the behaviours they already have: they open in a new tab, and the middle click works.

## Definition of Done

- The `job_fit_analysis` event exists, is fired and holds no personal data.
- The three calls to action are tracked.
- The analyzer is reachable from the chat and from the homepage.
- The navigation is unchanged.
- The tests pass, and lint and typecheck pass.

## Related Requirements

- PRD §8: Information Architecture
- PRD §29: Suggested Questions
- PRD §43: AI Source Grounding
- PRD §46: Chat Analytics
- PRD §78: Analytics
- PRD §90: AI CTA
- PRD §91: Recruiter Experience
- PRD §92: Recommended Homepage Navigation
