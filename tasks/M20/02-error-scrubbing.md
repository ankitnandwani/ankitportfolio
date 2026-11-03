# M20.02 – Scrub the Failures So That Nothing Private Reaches the Monitoring Service

## Objective

Put one layer between the application and the monitoring service that removes everything private from what is sent: the message of the chat, the description of a job, the form of a contact, the address of a mailbox, the number of a phone, the keys and the tokens.

## Context

PRD §79 lists what may never be logged:

```
- API keys
- user private messages unnecessarily
- secrets
- phone number
- authentication tokens
```

PRD §36 and §78 add the same rule for the analytics, and the milestone M19 kept the PostHog session recording and the automatic capture off for exactly this reason. The monitoring service is a third party that keeps what it receives, so a body that reaches it is a body that is kept.

The site handles three free text fields that a recruiter fills in:

- the chat (`app/api/chat/route.ts` reads `message` and `history`),
- the job description analyzer (`app/api/job-fit/route.ts` reads the description),
- the contact form (`app/api/contact/route.ts` reads `name`, `email`, `company` and `message`).

The rules of the repository already hold the machinery this task needs:

- `src/lib/guardrails/piiDetection.ts` exports `detectPii`, `redactPii`, `containsPii` and `piiTypes`, and `REDACTION_TOKEN` is `[REDACTED]`.
- `src/lib/knowledge/pii.ts` exports `redactPII` and `redactPhoneNumbers`.
- `src/lib/guardrails/outputValidation.ts` already holds the list of the variables that hold a secret, and treats a name with an underscore as a secret as well.
- `src/lib/guardrails/logger.ts` writes a structured event through a sink that a test can replace, and the event holds no question and no answer. That is the shape of the monitor the monitoring follows.

Next.js hands the framework level failure over without a body: `onRequestError` receives `{ path, method, headers }` and a context with `routePath` and `routeType`. The headers are the one place where a secret can still arrive, because a request can carry an `authorization` header or a cookie.

The rule this task follows is the one the guardrails follow: **the log never holds the question and the answer.** The difference is that a guardrail decides what to write, while a monitoring failure arrives with whatever the caller passed, so it has to be taken apart.

## Requirements

### 1. One scrubbing function that everything goes through

Create `src/lib/monitoring/scrub.ts`:

- A function that takes the parts of a failure and returns the safe version of them.
- It removes:
  - the body of the request, in every shape it can arrive in (a string, an object, a stream that was already read),
  - the fields `message`, `history`, `description`, `jobDescription`, `text`, `answer`, `question`, `name`, `email`, `company`, `comment` and `feedback`,
  - the address of a mailbox and the number of a phone wherever they appear in a string, using the redaction that already exists,
  - the values of the variables that hold a secret, including the DSN itself,
  - the headers that carry a secret or a token: `authorization`, `cookie`, `set-cookie`, `x-api-key`, and any header whose name holds `token`, `secret`, `key` or `password`.
- It keeps what makes a failure useful: the name of the error, the message of the error, the kind of the failure, the route, the method, the status, the moment, the identifier of the query, and the stack.
- It never throws. A failure of the scrubbing must not become a second failure.
- It is a pure function of its arguments. It reads no environment and touches no network, so it can be checked on its own.

### 2. The scrubbing is applied to everything that is sent

- The SDK is given a `beforeSend` hook that runs the scrubbing on every event before it leaves the process. This is the backstop that covers the paths nobody remembered.
- The capture module of M20.03 runs the same scrubbing on what it builds, so the safe shape is what the application holds, not only what the SDK receives.

### 3. The secrets of the environment are removed from the messages

- The messages of the failures are checked against the values of the variables that hold a secret, so a key that leaks into a message of an error is removed from it. `src/lib/guardrails/outputValidation.ts` already holds the names and the rule about the names with an underscore.
- The API key of the language model is already removed by the provider (`src/lib/llm/geminiProvider.ts`), and this task does not change that. It makes sure that a key which arrives by another way is removed as well.

### 4. The scrubbing is checked against the shapes that really happen

- The tests use the real shapes of the site: the body of a chat message, the body of a job description, the body of a contact form, and a failure whose message holds an address of a mailbox, a number of a phone and a key.

## Scope

### In scope

- `src/lib/monitoring/scrub.ts` (new)
- `src/lib/monitoring/scrub.test.mts` (new)
- `src/lib/monitoring/index.ts` (the exports)
- The `beforeSend` hook of the two SDK configurations of M20.01
- A helper that removes the secrets of the environment from a string, if the one that exists in the guardrails cannot be reused as it is

### Out of scope

- Capturing anything (M20.03 to M20.07)
- Changing the guardrails or the redaction they hold
- Changing the analytics of M19
- The user interface of a failure

## Dependencies

- M20.01 – the SDK has to exist before a hook can be given to it.

## Files / Areas Expected To Change

- `src/lib/monitoring/scrub.ts` (new)
- `src/lib/monitoring/scrub.test.mts` (new)
- `src/lib/monitoring/index.ts` (new or extended)
- `sentry.server.config.ts`
- `sentry.client.config.ts`

## Implementation Guidance

1. **Reuse, do not rewrite.** `redactPii` and `redactPhoneNumbers` already do the work on the text. The new module decides *what* is worth sending and calls them.
2. **Remove by allow list, not by deny list.** The safe shape is built from the parts that are known to be safe. A part that is not on the list does not reach the service, so a field that nobody thought of is not sent by accident.
3. **The request body never reaches the module.** The capture of M20.03 builds the context itself and does not hand the body over, so there is nothing to remove. The scrubbing is the second line, not the only one.
4. **The secrets of the environment are read once.** The values are held in a module level set that is filled when the configuration is read, and the removal replaces each of them with `[REDACTED]`. A value that is the placeholder of `.env.example` is not a secret and is not looked for.
5. **A field that holds the whole body is removed by its name.** The names of the fields of the three free text forms of the site are listed in one place, so a new field is added to that list rather than to a dozen call sites.
6. **The tests are the shape of the payloads that really happen.** Take them from `scripts/verifyAnalytics.mts` and from the fixtures of M19.05, which hold the real bodies of the chat, of the job description and of the contact form.

## Acceptance Criteria

- A failure whose context holds the body of a chat message, of a job description or of a contact form sends none of that text.
- An address of a mailbox and a number of a phone are removed from every string that is sent.
- The value of a key, of a token and of the DSN is removed from every string that is sent.
- The headers `authorization`, `cookie`, `set-cookie` and `x-api-key` are never sent, and neither is any header whose name holds `token`, `secret`, `key` or `password`.
- The name of the error, its message, the kind of the failure, the route, the method, the status, the moment, the identifier of the query and the stack are kept.
- The scrubbing never throws.
- The `beforeSend` hook of both SDK configurations runs the scrubbing.
- The existing tests still pass, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the body of a chat message is not in the safe shape.
- Unit test: the body of a job description is not in the safe shape.
- Unit test: the body of a contact form is not in the safe shape.
- Unit test: an address of a mailbox and a number of a phone are removed from the message of a failure.
- Unit test: the value of the key of the language model and the value of the DSN are removed from the message of a failure.
- Unit test: the headers that carry a token are not in the safe shape, and a header whose name holds `secret` is not either.
- Unit test: the useful parts survive the scrubbing.
- Unit test: the scrubbing of a value that is not an object does not throw.
- Unit test: a failure whose text holds a secret of the environment that is the placeholder is not changed, because a placeholder is not a secret.

## Security / Privacy Considerations

- This task is the privacy centre of the milestone. Everything that is captured later goes through it.
- The rule of PRD §79 is that a private message is never logged unnecessarily. A failure of the chat that holds the question of the visitor is a private message, so the question is removed.
- The removal is not a replacement of the whole message with a fixed text, because a failure that says nothing is not worth a report. The useful parts are kept and the private parts are taken out.
- The scrubbing must not be defeated by a value that only looks like a field name. A body that arrives as a string with a name that is not on the list is still removed by the redaction of the address of a mailbox and of the number of a phone.

## Performance / Accessibility Considerations

- The scrubbing runs once per report. The site has low traffic and the reports are rare, so the cost does not matter. It must not run on the path of every request, and it does not.
- Nothing in this task changes what a visitor sees.

## Definition of Done

- The scrubbing exists, is one implementation, and is used by the `beforeSend` hook of both SDK configurations.
- Every test of the acceptance criteria passes.
- The privacy audit of M20.09 finds no private data in any reported failure.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- PRD §79 – Never log: API keys, user private messages unnecessarily, secrets, phone number, authentication tokens
- PRD §36, §78 – the privacy rules the analytics follow
- DECISIONS.md – The guardrail log never holds the question or the answer
- M19.01, M19.03 – the analytics and the proxy, which are the model for a capture that goes through the server
