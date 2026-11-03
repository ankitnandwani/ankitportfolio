# M19F.02 – Add the Page Level Events of PRD §78

## Objective

Track the four events of PRD §78 that M19 did not implement: `page_view`, `project_view`, `chat_open` and the click on the contact link.

## Context

PRD §78 lists the events the site tracks:

```text
page_view
resume_download
project_view
project_github_click
linkedin_click
contact_click
chat_open
chat_question
chat_feedback
job_fit_analysis
```

The events of M19 cover the calls to action with one event of their own (`cta_clicked` with the kind of the action), the conversation with `chat_session_start`, `message_sent` and `response_received`, the feedback with `feedback_given`, the analyzer with `job_fit_analysis`, and the contact form with `contact_form_submission`. What is missing is `page_view`, `project_view`, `chat_open` and the click on the link that leads to the contact form.

These four were not in the acceptance criteria of M19.04, which enumerate PRD §46, §47, §48 and §90, so M19 met what it was asked to meet. The gap is between the plan and the PRD, and it is recorded in `tasks/M19/README.md` and in `TODO.md`.

**Why they were not simply added.** The proxy of M19.02 accepts one kind of event, `cta_clicked`, and it refuses anything else. That was a deliberate decision: only the events the site sends are accepted, and a client cannot put anything of its own into the project. Adding four kinds of event means widening that list, which is a decision about what the browser is allowed to send.

**The recommendation.** Widen the list of the proxy with exactly the four kinds of event that PRD §78 asks for, each of them with its own schema, and keep the refusal of everything else. `page_view` is the one that needs care: it must carry the path of the page and nothing else. An address that holds a query can hold a search, a token or a contact, so the query is not carried.

**The decision that needs a person.** The `page_view` event is the one that counts a visit, and with it the number of people of the project becomes the number of visits. Whether that is wanted, and whether the events of the pages are worth the trouble, is a question for the owner of the site. The other three are about the use of one page and are cheap.

## Requirements

### 1. The four kinds of event are defined

In `src/lib/analytics/eventTypes.ts`:

- `page_view` – the path of the page, without the query and without the fragment.
- `project_view` – the slug of the project and the path of the page.
- `chat_open` – the moment the panel of the chat is opened. No question, no answer, no text of the field.
- `contact_click` – the part of the site the click came from, so the footer and the page can be told apart.

Each one is a separate kind with its own fields, the way the other events of the catalogue are.

### 2. The proxy accepts them and refuses everything else

- `src/lib/analytics/proxy.ts` accepts the new kinds with the same rules as `cta_clicked`:
  - the kind of the event has to be on the list,
  - the fields have to be exactly the fields of that kind, and a field that is not one of them is refused rather than dropped,
  - the target has to be a bare host name where the event carries one,
  - the limit of the proxy holds them all.
- The list of the kinds that are accepted is one list, so it is easy to see what the browser is allowed to send.

### 3. The browser sends them

- The page is reported when it is shown. The path is read from the place of the page and not from a value that a visitor can set, so a path cannot be forged.
- A project is reported when its page is opened, with the slug of the project.
- The chat is reported when the panel is opened, not when the launcher is rendered, so a visitor who never opens it is not counted as one who did.
- The click on the link of the contact is reported the way the other calls to action are reported: sent and not awaited, so the link opens without waiting.
- Nothing in the path of the visitor throws. A failure of the analytics is not worth an error in the page of the visitor.

### 4. The privacy rules hold

- `page_view` carries the path of the page and nothing else. The query and the fragment are left out.
- A path that could carry personal data is not carried. The paths of the site are known, so a path that is not one of them is refused or reduced to the part of the site.
- No event of this task carries a question, an answer, a description of a job, a form or an address of a mailbox.
- The session recording stays off and the browser snippet stays unused.

### 5. The events are counted in the project

- The four kinds of events are added to the catalogue of the verification script of M19.05, with the rules that they have to be sent and that they carry nothing private.
- The script of M19.05 runs them against the running site.

## Scope

### In scope

- `src/lib/analytics/eventTypes.ts`
- `src/lib/analytics/proxy.ts`
- `src/lib/analytics/client.ts`
- `src/components/` (the page, the project, the chat and the link of the contact)
- `src/lib/analytics/fixtures/analyticsFixtures.ts` (the new cases)
- `test-plan.md` (the new cases)

### Out of scope

- The identity of the events, which is M19F.01
- The recording of the sessions, which stays off
- The browser snippet of PostHog, which stays unused
- The page level events of other analytics, of which there are none

## Dependencies

- M19F.03 – the code of M19 tells the truth before it is changed.
- M19F.01 is **not** required, but if it is worked on at the same time, the two changes touch the same modules and should be done one after the other.

## Files / Areas Expected To Change

- `src/lib/analytics/eventTypes.ts`
- `src/lib/analytics/proxy.ts`
- `src/lib/analytics/client.ts`
- `src/lib/analytics/proxy.test.mts`
- `src/lib/analytics/fixtures/analyticsFixtures.ts`
- The components that show a page, a project, the chat and the link of the contact

## Implementation Guidance

1. **The path of the page is read from the place of the page.** `window.location.pathname` is what the browser says, and a visitor cannot set it to anything else without leaving the site. The query and the fragment are left out with `window.location.pathname` itself, which never holds them.
2. **A path that is not one of the known ones is reduced.** The site has a known set of routes. A path that is not one of them is reduced to its first part, so a strange address never reaches the project in full.
3. **The chat is reported when it opens.** The launcher is on every page, and a report of every page would count every page as a chat. The panel is what the event is about.
4. **The proxy stays strict.** A field that is not part of the kind of the event is refused rather than dropped, the way it is today. This is what keeps a client from putting anything of its own into the project.
5. **The cases follow the shape of the existing ones.** The catalogue of M19.05 is the model, and the rules of the privacy are the rules that are already there.

## Acceptance Criteria

- `page_view`, `project_view`, `chat_open` and `contact_click` are defined, with their own fields.
- The proxy accepts exactly these four kinds and `cta_clicked`, and refuses everything else.
- A field that is not part of a kind is refused rather than dropped.
- The path of a page carries no query and no fragment, and a path that is not one of the known ones is reduced.
- The chat is counted when the panel is opened and not when the launcher is rendered.
- The click on the link of the contact does not wait for the analytics.
- None of the four kinds carries a question, an answer, a form, an address of a mailbox or a number of a phone.
- The new cases pass in `npm run verify:analytics`.
- All the tests pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the proxy accepts each of the four kinds and refuses an unknown one.
- Unit test: the proxy refuses a field that is not part of a kind.
- Unit test: the path of a page holds no query and no fragment.
- Unit test: a path that is not one of the known ones is reduced.
- Unit test: none of the four kinds carries a personal detail.
- Manual: the four events are seen in the project after a visit that opens the chat, opens a project and follows the link of the contact.
- Manual: the events of the page carry the path of the page and nothing else.

## Security / Privacy Considerations

- The path of a page is the one piece of information of this task that says something about what the visitor did, so it is the one that needs care. The query is left out, because a query can hold a search, a token or an address.
- The events of the browser go through the server, so the key of the project is never on the page.
- The events carry no personal data, and the audit of M19.06 is repeated for the new kinds.

## Performance / Accessibility Considerations

- The report of a page is sent once per page, and it is sent on its own.
- The click on the link of the contact is sent and not awaited, the way the other calls to action are.
- Nothing in the path of the visitor waits for the analytics.

## Definition of Done

- The four kinds of event are tracked, they are refused when they are not allowed, and they carry nothing private.
- The verification script of M19.05 covers them and passes.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §78 – the list of the events
- PRD §36 – the privacy of the tracking
- ROADMAP Milestone 19 – the events of the PRD fire correctly
- M19.02 – the proxy and the list of the kinds it accepts
- M19.05 – the catalogue of the cases, which the new ones follow
