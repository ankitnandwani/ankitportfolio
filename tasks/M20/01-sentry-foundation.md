# M20.01 – Install and Configure Sentry; Make the Monitoring Environment Variables Optional

## Objective

Put the monitoring in place: the Sentry SDK is installed and configured for the browser and for the server, the environment stops demanding variables that nothing reads, and the site boots and runs with the monitoring switched off.

## Context

The milestone M20 asks for Sentry (ROADMAP M20, PRD §129), and the repository has none of it yet.

What the repository holds today:

- `src/lib/env.ts` requires `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` with `z.string().nonempty()`. Nothing in the code reads them, so the site refuses to boot unless three placeholders are filled in. PRD's _Environment variables_ section states: "Only variables actually required by the implementation should be present."
- `.env.example` lists the same three variables with the placeholder values `your_sentry_dsn`, `your_upstash_redis_rest_url` and `your_upstash_redis_rest_token`.
- There is no `instrumentation.ts`, no `sentry.server.config.ts`, no `sentry.client.config.ts` and no `src/lib/monitoring/`.
- `next.config.ts` is an empty configuration.
- The analytics of M19 already solved the same problem for PostHog: the credentials are optional, a value that is still a placeholder counts as no credentials, and the site runs in a console only mode. `src/lib/analytics/config.ts` holds that shape and `src/lib/analytics/config.test.mts` holds its tests.

Next.js 16 runs the monitoring through the `instrumentation.ts` file in the root of the project. The file may export:

- `register()` — called once when a new server instance starts, before it is ready to answer requests.
- `onRequestError(error, errorRequest, errorContext)` — called when Next.js catches a server error. `errorRequest` is `{ path, method, headers }` and `errorContext` is `{ routerKind, routePath, routeType, renderSource, revalidateReason }`.

Both are described in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md` and typed in `node_modules/next/dist/server/instrumentation/types.d.ts`. **Read both before writing the code.** The version of Next.js in this repository is not the one in the training data of an agent, and this file convention is exactly the kind of thing that changes.

The important detail in `onRequestError` is that `errorRequest` carries no body. That is what makes the framework level capture safe to use without a scrubbing layer for the body.

## Requirements

### 1. The environment stops demanding what nothing reads

- `SENTRY_DSN` becomes optional in `src/lib/env.ts`, with the same comment style as the analytics credentials.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` become optional as well. DECISIONS.md records that Upstash Redis is optional for the MVP and that no milestone has reached it, so a variable that nothing reads must not stop the site from booting.
- `.env.example` keeps the three variables, with a comment that says they are optional and that leaving them as they are keeps the monitoring in its console only mode.

### 2. A configuration of the monitoring that has one implementation

Create `src/lib/monitoring/config.ts` with the same shape as `src/lib/analytics/config.ts`:

- A function that reports whether the monitoring is on.
- A function that returns the DSN, and nothing else. A DSN that cannot be used is not carried around, so it cannot reach a log or a payload by accident.
- A value that is still the placeholder of `.env.example` counts as no DSN. The placeholder values are `your_sentry_dsn` and `your_upstash_redis_rest_url`, and a value that only holds the placeholder is not a credential.
- The DSN has to be an http or https url. A value that is not a url is refused before a client is built, rather than after the first report fails.
- The configuration is read when the function is called and not when the module is loaded, so a change of the environment is picked up without a restart. This is the rule the analytics follow.
- The module holds no import of the Sentry package, so the browser can read the configuration without pulling a server only package into a client bundle.

### 3. The Sentry SDK is installed and configured

- Add the Sentry SDK for Next.js. The recommendation is `@sentry/nextjs`, because it covers the browser, the server and the edge in one dependency and it uses the `instrumentation.ts` hook of Next.js 16 on its own. **The version that is installed has to be a version that declares support for Next.js 16; check that at the moment it is installed, do not take the latest number on the page.** A version that does not support the version of Next.js in this repository is not acceptable, and a second SDK is not acceptable either.
- Add `sentry.server.config.ts` and `sentry.client.config.ts` at the root of the project, next to `next.config.ts`.
- Add `instrumentation.ts` at the root of the project, with a `register()` that starts the server side SDK.
- Add `instrumentation-client.ts` at the root of the project, which is the browser side entry point of Next.js 16. Confirm the exact name and the shape of the export from the bundled documentation, because it is a recent convention.
- The configuration must set, at the least:
  - `sendDefaultPii: false`. This is the setting that stops the SDK from attaching the request body, the cookie and the address of the visitor on its own.
  - No session replay. PRD §36 and §78 do not want a recording of what a visitor types, and the same rule that stopped the PostHog session recording stops this one.
  - No browser tracing and no automatic performance instrumentation yet. The performance of M20.06 is a deliberate measurement, not a span per request.
  - The environment and the release are reported, so an issue can be told apart from the one of another environment.
- `next.config.ts` needs the source map upload that the SDK asks for in production. Keep it to what the installed version of the SDK documents, and make sure the build still succeeds with the monitoring switched off.
- The SDK must not be initialised when there is no DSN. The site has to boot without a monitoring project and without an error.

### 4. The monitoring is off by default and never breaks a request

- Nothing in this task sends anything anywhere. The capture arrives in M20.03.
- A failure inside the monitoring must never reach the visitor. Nothing in the path of a request may throw because of the monitoring.

## Scope

### In scope

- `src/lib/env.ts`
- `.env.example`
- `src/lib/monitoring/config.ts` and `src/lib/monitoring/index.ts`
- `package.json` (the dependency)
- `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.client.config.ts`
- `next.config.ts`
- The tests of the configuration

### Out of scope

- Capturing anything (M20.03 to M20.07)
- The scrubbing (M20.02)
- The error boundaries (M20.07)
- The Sentry project, the alerts and the DSN (M20.08)
- Changing the analytics of M19 in any way

## Dependencies

- M19.06 (complete). The milestone is the first after M19 and builds on the shape the analytics left behind.

## Files / Areas Expected To Change

- `src/lib/env.ts`
- `.env.example`
- `src/lib/monitoring/config.ts` (new)
- `src/lib/monitoring/index.ts` (new)
- `src/lib/monitoring/config.test.mts` (new)
- `instrumentation.ts` (new)
- `instrumentation-client.ts` (new)
- `sentry.server.config.ts` (new)
- `sentry.client.config.ts` (new)
- `next.config.ts`
- `package.json`, `package-lock.json`

## Implementation Guidance

1. **Read the bundled documentation first.** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`, `node_modules/next/dist/docs/01-app/02-guides/instrumentation.md` and `node_modules/next/dist/server/instrumentation/types.d.ts`. The version of Next.js in this repository is 16.3.2 and it differs from the version in the training data of an agent.
2. **Check the version of the SDK before it is installed.** The page of the package states the versions of Next.js it supports. If the newest version does not support Next.js 16, take the newest that does, and write the version and the reason in `DECISIONS.md`.
3. **Copy the shape of `src/lib/analytics/config.ts`.** The analytics configuration was written for exactly this problem and its tests are a model. Do not build a second shape.
4. **Keep the Sentry import out of the shared module.** `src/lib/monitoring/config.ts` reads the environment and returns plain values. The package is only imported by the two `sentry.*.config.ts` files and by the capture module of M20.03, and the import is done dynamically where the module has to be importable without a complete environment.
5. **A placeholder is not a credential.** The analytics made this rule and the tests for it can be read in `src/lib/analytics/config.test.mts`.
6. **The build must pass with the monitoring off.** The CI does not run the build today, so the build is run by hand here: `npm run build` with no DSN in the environment, and `npm run build` with a DSN. Both have to succeed.

## Acceptance Criteria

- `src/lib/env.ts` no longer requires `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`, and the site boots without them.
- `src/lib/monitoring/config.ts` reports the monitoring as off when the DSN is missing, when the DSN is the placeholder of `.env.example`, or when the DSN is not an http or https url, and reports it as on otherwise.
- The DSN is not carried in the configuration when the monitoring is off.
- The server side SDK is started by `instrumentation.ts` and the browser side one by `instrumentation-client.ts`.
- `sendDefaultPii` is `false` and the session replay is off in both configurations.
- The site boots, builds and answers with no DSN in the environment, and reports no error of the SDK.
- The build succeeds both with and without a DSN.
- Every existing test still passes, the lint is clean, the typecheck is clean.

## Testing Requirements

- Unit test: the configuration reports the monitoring as off with no DSN, with the placeholder, and with a value that is not a url.
- Unit test: the configuration reports the monitoring as on with a real looking DSN, and the DSN is carried.
- Unit test: the DSN is not carried while the monitoring is off.
- Unit test: the optional variables of the environment no longer stop the module from loading. `src/lib/env.test.mts` holds the pattern, with the placeholders set before a dynamic import.
- Manual: `npm run dev` starts with no DSN in the environment and the site answers normally.
- Manual: `npm run build` succeeds with no DSN and with a DSN.

## Security / Privacy Considerations

- `sendDefaultPii: false` is the setting that keeps the SDK from attaching the request body, the cookies and the address of the visitor on its own. It is not optional and it is set in both configurations.
- The session replay stays off. A recording would show what a recruiter types into the chat and into the field of the job description, which is the exact thing PRD §36 and §78 refuse.
- The DSN is not a secret that has to be hidden the way a key is. It is still not published to the page, and it is not written into a log.
- The monitoring configuration holds the DSN and nothing else. A key of a service is never read by it.

## Performance / Accessibility Considerations

- The SDK is loaded once when the server starts. Nothing is sent on the path of a request in this task.
- The browser side SDK adds a small bundle. Keep it as small as the installed version allows, and make sure the bundle does not grow in a way that PRD §74 would notice. The analysis of the bundle is the task of M21.
- No error boundary is added in this task, so the visitor sees nothing different.

## Definition of Done

- The Sentry SDK is installed in a version that supports Next.js 16, and the reason for the version is written in `DECISIONS.md`.
- The monitoring environment variables are optional and the site boots without them.
- The monitoring configuration has one implementation, with its tests.
- The server and the browser are configured with `sendDefaultPii: false` and no session replay.
- The build succeeds with and without a DSN.
- All the tests pass, the lint is clean, the typecheck is clean.

## Related Requirements

- ROADMAP Milestone 20 – Monitoring
- PRD §79 – Monitoring
- PRD §129 – Milestone 20
- PRD _Environment variables_ – only the variables the implementation needs
- DECISIONS.md – Monitoring: Sentry (optional, free tier) for error tracking
- M19.01 – the shape of the analytics configuration, which this task copies
