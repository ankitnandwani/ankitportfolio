# M19 Follow-ups – The Findings That M19 Left Behind

The verification of M19 (M19.06, 2026-11-03) found four things that were deliberately left alone, because each one is a change of its own and M19.06 only checked. This directory holds their specifications, so that they live in the same system as the rest of the work instead of as a paragraph in `TODO.md`.

These are not part of M20. M20 is Monitoring, and mixing analytics work into it would blur what the milestone is. They are written here and are worked on when they are chosen.

## Execution Order

| Order | Task | Depends On | Parallel |
|-------|------|------------|----------|
| 1 | M19F.03 – Close out the findings of the verification of M19 | M19.06 | – |
| 2 | M19F.01 – Give the visitor one identity across the events | M19F.03 | – |
| 3 | M19F.02 – Add the page level events of PRD §78 | M19F.03 | M19F.01 |

M19F.03 is first because it is small, it is already diagnosed, and it leaves the code of M19 telling the truth about itself. M19F.01 and M19F.02 are changes of the design of the analytics and can be worked on in parallel with each other, because they touch different files: M19F.01 changes the identity of the events, M19F.02 adds kinds of events.

## Traceability Table

| Requirement | Source | Task | Status |
|-------------|--------|------|--------|
| The limits of the analyzer are configurable through the environment | PRD §48 | M19F.03 | Covered |
| The comment of the proxy tells the truth about the proxy | the finding of M19.06 | M19F.03 | Covered |
| The events of the browser and the events of the server share one identity | PRD §46, ROADMAP M19 | M19F.01 | Covered |
| The number of people in the project is the number of visitors | ROADMAP M19 | M19F.01 | Covered |
| `page_view`, `project_view`, `chat_open` and `contact_click` are tracked | PRD §78 | M19F.02 | Covered |
| The events carry no personal data | PRD §36, §78 | M19F.01, M19F.02 | Covered |

## Why these were left alone

- **The limits of the analyzer.** `src/lib/jobFit/policy.ts` uses the constants of the code and never looks at `JOB_FIT_MAX_REQUESTS`, `JOB_FIT_WINDOW_SECONDS`, `JOB_FIT_DAILY_MAX_REQUESTS` or `JOB_FIT_DAILY_WINDOW_SECONDS`, although they are declared in `src/lib/env.ts` and written in `.env.example`. PRD §48 asks for the limits to be configurable, and the chat and the contact form already are.
- **The comment of the proxy.** The comment of `app/api/analytics/route.ts` says that every answer of the proxy carries the headers of the limit and that the request is counted before anything is parsed. The code does not do that for the two answers that are refused before the counting, the request from another site and the body that cannot be read. Counting a request from another site would let it use up the allowance of a visitor, so **the code is right and the comment is wrong.**
- **The two sessions.** The browser keeps its session in the storage of the tab and the server keeps its own in the memory of the process, so a click on a call to action cannot be joined with the conversation of the same visit in PostHog.
- **The session counted as a person.** The identifier of the session is the identity of the event, so every session becomes a person of its own in PostHog and the number of people is the number of sessions rather than the number of visitors.
- **The page level events.** PRD §78 lists `page_view`, `resume_download`, `project_view`, `project_github_click`, `linkedin_click`, `contact_click`, `chat_open`, `chat_question`, `chat_feedback` and `job_fit_analysis`. The events of M19 cover the last four and the calls to action, but not `page_view`, `project_view`, `chat_open` and the click on the contact link.

## The decisions that these tasks need

- **The identity of the events.** DECISIONS.md records "The session id is the identity of the event". M19F.01 changes that, and the change has to be written there as well. It also decides whether the events that are already in the project keep their meaning, which is why it needs a person.
- **A separate project for the work on the machine.** The clicks of a developer land in the numbers of the site. A project of its own for the machine keeps the two apart, the way the EU cloud of M19.01 keeps the events inside the region. This is an account action and it belongs to M19F.01 or to M20.08, whichever is worked on first.
