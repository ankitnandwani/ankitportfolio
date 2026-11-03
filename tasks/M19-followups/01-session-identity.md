# M19F.01 – Give the Visitor One Identity Across the Events

## Objective

Make the events of the browser and the events of the server belong to one visitor, so that a click on a call to action can be joined with the conversation of the same visit, and so that the number of people in the project is the number of visitors rather than the number of sessions.

## Context

Two findings of M19.06 have the same root cause and have to be fixed together.

**The two sessions.** The browser keeps its session in the storage of the tab (`src/lib/analytics/client.ts`), and the server keeps its own in the memory of the process (`src/lib/analytics/analytics.ts`). The click on a call to action is counted by the browser, so it carries the session of the browser. The conversation is counted by the server, so it carries the session of the server. A click on "Download Resume" after a question therefore cannot be joined with that question in PostHog, even though both happened in the same visit.

**The session counted as a person.** DECISIONS.md records: "The session id is the identity of the event". PostHog asks who an event belongs to, and it therefore creates a person for every session. The activity log of the project shows one person per session, so the number of people is the number of sessions and not the number of visitors. On a site with low traffic, a visitor who comes back tomorrow is a second person.

The decision that is being changed is in DECISIONS.md, so the change is a decision that needs a person.

**The recommendation.** The identity of an event becomes an anonymous identifier of the visitor that is kept in the storage of the browser for a long time, and the session stays a property of the event.

- The identifier of the visitor is generated once, stored in `localStorage` (not `sessionStorage`), and is never anything but a random identifier. It identifies a browser, not a person, and it says nothing about who the visitor is.
- The session keeps its own identifier and stays a property of every event, so the events of one visit can still be joined with each other.
- The server uses the identifier of the visitor that the request carries, so the events of the server and the events of the browser belong to the same visitor.
- A visitor that refuses the storage of the browser gets an identifier that lives only as long as the page is open, the way the session does today. Nothing breaks and nothing is guessed.

**The trust question.** The browser sends the identifier of the visitor, so the server takes it from the request. That is the same trust as the session of today, which the browser also sends. The proxy of M19.02 already accepts the session of the browser and uses it as the identity, so this does not open a hole that is not already open. The identifier is anonymous and a visitor cannot do anything with it that they could not do with the session.

**The data that is already in the project.** The events that were sent before the change keep the session as their identity. They will not be joined with the events of after the change, because the identity is different. The dataset is small, so this is cheap, and it is the reason to do the change now rather than after the site has traffic.

## Requirements

### 1. The visitor has one identifier

- Create a module that holds the identifier of the visitor:
  - it is a random identifier that is generated once,
  - it is kept in `localStorage` under a name of the project,
  - it falls back to the memory of the page when the storage is refused,
  - it never holds anything but the identifier, and it is never sent anywhere but to the server of the site.
- The storage of the browser can be refused in a private window, and it can hold a value that is not the identifier, for example when another program wrote there. A value that is not a valid identifier is replaced.

### 2. The events of the server use it

- The routes work out the identifier of the visitor and the session of the visit, the way they work out the session today:
  - the identifier of the visitor comes from the header that carries it, and from the address of the visitor when the header is not there,
  - the session of the visit is worked out from the address and the agent of the browser, the way it is today.
- The identifier of the visitor is the identity of the event. The session stays a property of every event.
- The refusal of the limit is counted and reported with the same pair, so a refusal belongs to a visitor and to a visit.
- The start of the chat is remembered per session, as it is today, and not per visitor.

### 3. The events of the browser use it

- The browser sends the identifier of the visitor together with the session.
- The proxy of M19.02 accepts the identifier of the visitor as part of the event it accepts, and refuses a value that is not a valid identifier, the way it refuses a field that is not part of the event.
- The proxy uses the identifier of the visitor as the identity of the event it sends.

### 4. The privacy rules do not change

- The identifier of the visitor is anonymous. It says nothing about who the visitor is, and it is not derived from anything that does.
- The events keep carrying no personal data.
- The browser does not send a timestamp, the way M19.03 decided.

### 5. The decision is written down

- DECISIONS.md records the new rule and the fact that it replaces the rule of M19.01.
- The change of the identity is noted in the CHANGELOG, because the events that were sent before are not joined with the ones after.

## Scope

### In scope

- `src/lib/analytics/analytics.ts` and the modules of the identity
- `src/lib/analytics/client.ts`
- `src/lib/analytics/proxy.ts`
- `src/lib/analytics/eventTypes.ts`
- `app/api/chat/route.ts`, `app/api/job-fit/route.ts`, `app/api/contact/route.ts`, `app/api/feedback/route.ts`, `app/api/analytics/route.ts`
- The tests of the analytics
- `DECISIONS.md`, `CHANGELOG.md`

### Out of scope

- The page level events of PRD §78, which are M19F.02
- The recording of the sessions, which stays off
- The browser snippet of PostHog, which stays unused
- The project of the machine, which is an account action and belongs to M19F.01 or M20.08

## Dependencies

- M19F.03 – the code of M19 tells the truth before it is changed.

## Files / Areas Expected To Change

- `src/lib/analytics/` (the identity, the client, the proxy, the event types)
- `app/api/` (the five routes)
- `src/lib/analytics/*.test.mts`
- `DECISIONS.md`, `CHANGELOG.md`

## Implementation Guidance

1. **The identity of the visitor is not the session.** Two identifiers, two jobs: the visitor is who it is, the session is which visit. Keep them apart in the names of the variables and in the properties of the events.
2. **The identifier is generated, not derived.** It is a random identifier. A hash of the address of the visitor would be stable enough to join the visits, and it would also be a personal identifier that is derived from something about the visitor, which is exactly what PRD §36 refuses.
3. **The storage of the browser is used the way the session uses it today.** `src/lib/analytics/client.ts` already has the pattern of a session in `sessionStorage` with a fallback in memory. The identifier of the visitor is the same pattern with `localStorage`.
4. **The server keeps working without the header.** A request that does not carry the identifier of the visitor falls back to the address of the visitor, the way the session does today. The events of such a request are not joined with the events of the browser, but nothing breaks.
5. **The proxy refuses a value that is not an identifier.** The shape of the identifier is checked, the way the target of a call to action is checked as a bare host name.
6. **The tests are updated, not deleted.** The tests of M19 hold the rules of the session. The rules of the visitor are added beside them.

## Acceptance Criteria

- The events of the browser and the events of the server of one visit carry the same identifier of the visitor, and it is the identity of the event.
- The events of one visit can still be told from the events of another visit, by the session.
- A click on a call to action and the conversation of the same visit are joined in PostHog.
- The project counts one person for a visitor who comes back, and not one for every session.
- The identifier of the visitor is anonymous and holds nothing but a random identifier.
- A browser that refuses the storage still works, with an identifier that lives as long as the page is open.
- The proxy refuses an identifier that is not a valid one.
- The events carry no personal data, exactly as before.
- DECISIONS.md records the change and says which rule it replaces.
- All the tests pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the identifier of the visitor is the same over two calls and different for two browsers.
- Unit test: an identifier that is not a valid one is replaced.
- Unit test: the events of the server and the events of the browser carry the same identifier of the visitor.
- Unit test: the session of the visit is still carried as a property.
- Unit test: the refusal of the limit carries the identifier of the visitor and the session of the visit.
- Unit test: the start of the chat is remembered per session and not per visitor.
- Unit test: the proxy refuses an identifier that is not a valid one and accepts a valid one.
- Unit test: the identifier of the visitor never appears in a place that holds personal data.
- Manual: a question and a click on a call to action in one visit are joined in the project, and one person is shown for the visitor.

## Security / Privacy Considerations

- The identifier of the visitor is a random identifier. It is not derived from the address of the visitor, from the agent of the browser or from anything else, because a derived identifier is a personal identifier.
- The identifier is stored in the storage of the browser and is sent only to the server of the site. It is never published in the page and never sent to a third party directly.
- The browser snippet of PostHog stays unused, so the key of the project is never on the page.
- The events carry no personal data, and the rules of the privacy of M19 hold unchanged.

## Performance / Accessibility Considerations

- The identifier is read from the storage of the browser once per visit and then kept in memory.
- The size of the payload of the proxy grows by one field.
- Nothing in the path of the visitor changes.

## Definition of Done

- The events of the browser and the events of the server belong to one visitor, and the sessions are still told apart.
- The project counts the visitors and not the sessions.
- The decision is written down in DECISIONS.md and in the CHANGELOG.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §46 – the session of the visit
- PRD §36, §78 – the privacy of the events
- ROADMAP Milestone 19 – Session tracking
- DECISIONS.md – The session id is the identity of the event (the rule this task replaces)
- M19.06 – the two findings this task closes
