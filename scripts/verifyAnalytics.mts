#!/usr/bin/env node
/**
 * Verification script for the analytics.
 *
 * Runs the cases of the catalogue of events against the running site and
 * writes a report with the result of every rule. Exits with a non-zero code
 * when a rule fails.
 *
 * The cases are in `src/lib/analytics/fixtures/analyticsFixtures.ts`.
 *
 * What is checked:
 *
 * - The live request answers the way the case says it should, with the
 *   headers of its limit where the endpoint has one.
 * - The event the request is expected to produce is built by the tracking
 *   function of the site and handed to PostHog, so the rules are checked
 *   against the very payload that PostHog would receive.
 * - The event carries the name, the identity, the moment and the fields the
 *   PRD asks for, and nothing that belongs to a person.
 * - The route of every event calls the tracking function that belongs to it.
 *
 * The last check reads the source of the route, because a route cannot be
 * loaded by the test runner: the routes import their modules with the path
 * alias. It is a check of the wiring and not of the running.
 *
 * Usage:
 *   npm run verify:analytics
 *   # or
 *   node scripts/verifyAnalytics.mts
 *
 * Requires:
 * - Development server running at http://localhost:3000
 *
 * Optional:
 * - `LIVE_SERVER_URL` – the address of the site. The default is
 *   `http://localhost:3000`.
 * - `SERVER_LOG` – the file the server writes its output to. When it is
 *   given, the events the server counted are read from it, which shows that
 *   the event really left the running site.
 */

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import {
  ANALYTICS_FIXTURES,
  type AnalyticsFixture,
  type AnalyticsRequest,
} from '../src/lib/analytics/fixtures/analyticsFixtures.ts';
import {
  getAnalyticsConfig,
  initPostHog,
  setPostHogClientFactory,
  shutdownAnalytics,
  type PostHogClient,
  type PostHogEventMessage,
} from '../src/lib/analytics/analytics.ts';
import type { AnalyticsConfig } from '../src/lib/analytics/eventTypes.ts';

dotenv.config({ path: '.env.local' });

/**
 * The root of the repository, so the source of the routes can be read.
 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The result of one rule.
 */
interface RuleResult {
  rule: string;
  fixture: string;
  passed: boolean;
  message?: string;
}

/**
 * The report of one fixture.
 */
interface FixtureReport {
  fixture: AnalyticsFixture;
  success: boolean;
  statusCode?: number;
  rules: RuleResult[];
  error?: string;
}

/**
 * The endpoints that answer with the headers of their limit.
 */
const LIMITED_ENDPOINTS = ['/api/chat', '/api/job-fit', '/api/contact', '/api/analytics'];

/**
 * The configuration the events are built with. The credentials are not real,
 * because the events are caught before they are sent.
 */
const CAPTURE_CONFIG: AnalyticsConfig = {
  enabled: true,
  posthogKey: 'phc_verification_only',
  posthogHost: 'https://eu.i.posthog.com',
  logToConsole: false,
};

/**
 * The shape of an anonymous session.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The routes and the tracking functions they have to call.
 *
 * The check of the wiring reads the source of the route, because a route
 * cannot be loaded by the test runner. It shows that the event of the route
 * is the one the route is meant to count, and not that the route counts it.
 */
const WIRING_CHECKS: { file: string; mustCall: string[] }[] = [
  {
    file: 'app/api/chat/route.ts',
    mustCall: ['trackChatSessionStart', 'trackMessageSent', 'trackResponseReceived', 'reportRateLimitExceeded'],
  },
  {
    file: 'app/api/contact/route.ts',
    mustCall: ['trackContactFormSubmission', 'reportRateLimitExceeded'],
  },
  {
    file: 'app/api/job-fit/route.ts',
    mustCall: ['trackJobFitAnalysis', 'reportRateLimitExceeded'],
  },
  {
    file: 'app/api/feedback/route.ts',
    mustCall: ['trackFeedbackGiven'],
  },
  {
    file: 'app/api/analytics/route.ts',
    mustCall: ['handleClientEvent'],
  },
  {
    file: 'src/components/jobFit/JobFitResults.tsx',
    mustCall: ['trackCtaClicked'],
  },
];

/**
 * The events that are caught while the cases run.
 */
const captured: PostHogEventMessage[] = [];

/**
 * A client of PostHog that keeps what it is given, so the events can be
 * looked at without sending anything.
 */
const recordingClient: PostHogClient = {
  capture: (message) => {
    captured.push(message);
  },
  shutdown: async () => {},
};

/**
 * Reads a value out of an object by its path.
 *
 * @param source The object to read from.
 * @param fieldPath The path of the value, such as `properties.success`.
 * @returns The value, or undefined when the path leads nowhere.
 */
function getPath(source: unknown, fieldPath: string): unknown {
  let current: unknown = source;

  for (const part of fieldPath.split('.')) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Puts the message that goes to PostHog into the shape of the event of the
 * site, so the paths of the rules read the way the code reads.
 *
 * @param message The message that goes to PostHog.
 * @returns The event as the site describes it.
 */
function toEventView(message: PostHogEventMessage): Record<string, unknown> {
  const properties = { ...(message.properties ?? {}) } as Record<string, unknown>;

  return {
    eventType: message.event,
    sessionId: message.distinctId,
    timestamp: message.timestamp ? new Date(message.timestamp).toISOString() : undefined,
    ...properties,
  };
}

/**
 * Makes the request of a fixture against the running site.
 *
 * The request is sent again until the endpoint answers with the status the
 * fixture waits for, which is how the limits are reached. The number of
 * requests that are needed depends on the limit the site is configured with,
 * so the limit is read from the answer of the first request.
 *
 * @param baseUrl The address of the site.
 * @param request The request to make.
 * @param clientIp The address of the visitor.
 * @returns The last answer, and the number of requests that were made.
 */
async function makeRequest(
  baseUrl: string,
  request: AnalyticsRequest,
  clientIp: string
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': clientIp,
    ...(request.headers ?? {}),
  };

  const maxRequests = request.untilStatus ? (request.maxRequests ?? 60) : 1;

  let status = 0;
  let body: unknown;
  let responseHeaders = new Headers();

  for (let attempt = 1; attempt <= maxRequests; attempt++) {
    const response = await fetch(`${baseUrl}${request.path}`, {
      method: 'POST',
      headers,
      body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {}),
    });

    status = response.status;
    responseHeaders = response.headers;

    const text = await response.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    if (!request.untilStatus || status === request.untilStatus) {
      break;
    }

    // A small pause, so the site is not asked faster than a visitor could.
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return { status, body, headers: responseHeaders };
}

/**
 * Checks the answer of the endpoint against what the fixture expects.
 */
function checkResponse(
  fixture: AnalyticsFixture,
  status: number,
  headers: Headers
): RuleResult[] {
  const rules: RuleResult[] = [];

  rules.push({
    rule: 'expected_status',
    fixture: fixture.id,
    passed: status === fixture.expectedStatus,
    message:
      status === fixture.expectedStatus ? undefined : `Expected ${fixture.expectedStatus}, got ${status}`,
  });

  if (LIMITED_ENDPOINTS.includes(fixture.request.path)) {
    // An answer that is refused before the request is counted carries no
    // headers of the limit, because there is no count to tell. The proxy
    // refuses a request from another site before it is counted, on purpose,
    // so that a request from another site cannot use up the limit of a
    // visitor.
    if (fixture.request.expectLimitHeaders !== false) {
      const required = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'];
      const missing = required.filter((header) => !headers.has(header));
      rules.push({
        rule: 'rate_limit_headers',
        fixture: fixture.id,
        passed: missing.length === 0,
        message: missing.length === 0 ? undefined : `Missing header: ${missing.join(', ')}`,
      });
    }
  }

  if (fixture.request.path === '/api/analytics') {
    // Every answer of the proxy is kept out of any cache.
    const cacheControl = headers.get('Cache-Control') ?? '';
    rules.push({
      rule: 'no_store_header',
      fixture: fixture.id,
      passed: cacheControl.includes('no-store'),
      message: cacheControl.includes('no-store')
        ? undefined
        : 'Cache-Control is missing no-store',
    });
  }

  if (fixture.expectedStatus === 429) {
    const hasRetryAfter = headers.has('Retry-After');
    rules.push({
      rule: 'retry_after_header',
      fixture: fixture.id,
      passed: hasRetryAfter,
      message: hasRetryAfter ? undefined : 'Missing Retry-After header',
    });
  }

  return rules;
}

/**
 * Checks the event of a fixture against the rules of the catalogue.
 */
function checkEvent(fixture: AnalyticsFixture): RuleResult[] {
  const rules: RuleResult[] = [];
  const message = captured[0];

  if (!fixture.expectedEventType) {
    // A request that is refused before anything is counted must not leave
    // an event behind.
    rules.push({
      rule: 'no_event_produced',
      fixture: fixture.id,
      passed: captured.length === 0,
      message:
        captured.length === 0
          ? undefined
          : `Expected no event, got ${captured.map((m) => m.event).join(', ')}`,
    });
    return rules;
  }

  rules.push({
    rule: 'event_produced',
    fixture: fixture.id,
    passed: captured.length === 1,
    message:
      captured.length === 1 ? undefined : `Expected one event, got ${captured.length}`,
  });

  if (!message) {
    return rules;
  }

  const view = toEventView(message);

  rules.push({
    rule: 'event_type',
    fixture: fixture.id,
    passed: view.eventType === fixture.expectedEventType,
    message:
      view.eventType === fixture.expectedEventType
        ? undefined
        : `Expected ${fixture.expectedEventType}, got ${String(view.eventType)}`,
  });

  rules.push({
    rule: 'session_id_is_anonymous',
    fixture: fixture.id,
    passed: typeof view.sessionId === 'string' && UUID_PATTERN.test(view.sessionId),
    message:
      typeof view.sessionId === 'string' && UUID_PATTERN.test(view.sessionId)
        ? undefined
        : `The session is not an anonymous identifier: ${String(view.sessionId)}`,
  });

  rules.push({
    rule: 'timestamp_is_iso',
    fixture: fixture.id,
    passed:
      typeof view.timestamp === 'string' &&
      !Number.isNaN(new Date(view.timestamp as string).getTime()),
    message:
      typeof view.timestamp === 'string' &&
      !Number.isNaN(new Date(view.timestamp as string).getTime())
        ? undefined
        : `The moment is not a time: ${String(view.timestamp)}`,
  });

  for (const fieldPath of fixture.expectedFields ?? []) {
    const value = getPath(view, fieldPath);
    rules.push({
      rule: `has_field:${fieldPath}`,
      fixture: fixture.id,
      passed: value !== undefined && value !== null,
      message: value === undefined || value === null ? `Missing field: ${fieldPath}` : undefined,
    });
  }

  for (const [fieldPath, expected] of Object.entries(fixture.expectedValues ?? {})) {
    const value = getPath(view, fieldPath);
    rules.push({
      rule: `value_of:${fieldPath}`,
      fixture: fixture.id,
      passed: value === expected,
      message: value === expected ? undefined : `Expected ${String(expected)}, got ${String(value)}`,
    });
  }

  for (const [fieldPath, text] of Object.entries(fixture.expectedText ?? {})) {
    const value = getPath(view, fieldPath);
    rules.push({
      rule: `text_of:${fieldPath}`,
      fixture: fixture.id,
      passed: typeof value === 'string' && value.includes(text),
      message:
        typeof value === 'string' && value.includes(text)
          ? undefined
          : `Expected the text "${text}", got ${String(value)}`,
    });
  }

  // The personal data is looked for in the whole message that goes to
  // PostHog, not only in the parts the rules above look at.
  const serialised = JSON.stringify(message);
  for (const pattern of fixture.forbiddenPatterns ?? []) {
    rules.push({
      rule: `no_pii:${pattern.source}`,
      fixture: fixture.id,
      passed: !pattern.test(serialised),
      message: pattern.test(serialised)
        ? `The event carries something that must not be in it: ${pattern.source}`
        : undefined,
    });
  }

  return rules;
}

/**
 * Checks that every route calls the tracking function that belongs to it.
 */
function checkWiring(): RuleResult[] {
  const rules: RuleResult[] = [];

  for (const check of WIRING_CHECKS) {
    const file = path.join(REPO_ROOT, check.file);

    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      rules.push({
        rule: 'wiring',
        fixture: check.file,
        passed: false,
        message: 'The file could not be read',
      });
      continue;
    }

    for (const call of check.mustCall) {
      const called = source.includes(`${call}(`);
      rules.push({
        rule: 'wiring',
        fixture: check.file,
        passed: called,
        message: called ? undefined : `The route does not call ${call}`,
      });
    }
  }

  return rules;
}

/**
 * Reads the events the server counted out of the file it writes to.
 *
 * The check is only made when the file is given, because the server may be
 * running somewhere the script cannot see.
 *
 * @param offset The place in the file the reading starts at.
 * @returns The names of the events that were counted after the place.
 */
function readServerEvents(offset: number): string[] {
  const logFile = process.env.SERVER_LOG;
  if (!logFile) {
    return [];
  }

  try {
    const size = statSync(logFile).size;
    if (size <= offset) {
      return [];
    }

    // The file is read as bytes, because the place the reading starts at is
    // a place in the file and not a place in the text. A text read would
    // lose the first lines of every reading, because the signs of the
    // console take more than one byte each.
    const fresh = readFileSync(logFile).subarray(offset).toString('utf8');
    const names: string[] = [];

    for (const line of fresh.split('\n')) {
      const match = line.match(/^\[analytics\] ([a-z_]+)/);
      if (match) {
        names.push(match[1]);
      }
    }

    return names;
  } catch {
    return [];
  }
}

/**
 * The place in the file of the server the reading starts at.
 */
function serverLogOffset(): number {
  const logFile = process.env.SERVER_LOG;
  if (!logFile) {
    return 0;
  }

  try {
    return statSync(logFile).size;
  } catch {
    return 0;
  }
}

/**
 * Sends one event to the real PostHog, so the connection of the site with
 * the project is shown to work.
 */
async function checkPostHogIntegration(): Promise<RuleResult> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.posthogKey || !config.posthogHost) {
    return {
      rule: 'posthog_integration',
      fixture: 'posthog',
      passed: true,
      message: 'Skipped, because no credentials are configured',
    };
  }

  setPostHogClientFactory(null);

  try {
    const client = await initPostHog(config);
    if (!client) {
      return {
        rule: 'posthog_integration',
        fixture: 'posthog',
        passed: false,
        message: 'The client could not be built',
      };
    }

    client.capture({
      distinctId: 'verification-of-the-analytics',
      event: 'cta_clicked',
      properties: {
        verification: true,
        ctaType: 'other',
        targetDomain: 'ankitnandwani.com',
        session_id: 'verification-of-the-analytics',
      },
    });

    await client.flush?.();

    return {
      rule: 'posthog_integration',
      fixture: 'posthog',
      passed: true,
      message: 'One event was sent to PostHog',
    };
  } catch (error) {
    return {
      rule: 'posthog_integration',
      fixture: 'posthog',
      passed: false,
      message: `The event did not reach PostHog: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  } finally {
    await shutdownAnalytics();
  }
}

/**
 * Runs one fixture and returns its report.
 */
async function verifyFixture(
  fixture: AnalyticsFixture,
  baseUrl: string,
  clientIp: string
): Promise<FixtureReport> {
  const report: FixtureReport = {
    fixture,
    success: false,
    rules: [],
  };

  try {
    const { status, headers } = await makeRequest(baseUrl, fixture.request, clientIp);
    report.statusCode = status;
    report.rules.push(...checkResponse(fixture, status, headers));
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error);
    report.rules.push({
      rule: 'request_failed',
      fixture: fixture.id,
      passed: false,
      message: `The request failed: ${report.error}`,
    });
  }

  // The event is built by the tracking function of the site, so the rules
  // are checked against the payload PostHog would receive.
  captured.length = 0;

  if (fixture.track) {
    try {
      await fixture.track(CAPTURE_CONFIG);
      report.rules.push(...checkEvent(fixture));
    } catch (error) {
      report.rules.push({
        rule: 'event_built',
        fixture: fixture.id,
        passed: false,
        message: `The event could not be built: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  report.success = report.rules.every((rule) => rule.passed);

  return report;
}

/**
 * The main verification function.
 */
async function main(): Promise<void> {
  console.log('Analytics — End-to-End Verification');
  console.log('===================================\n');

  const baseUrl = process.env.LIVE_SERVER_URL ?? 'http://localhost:3000';

  // The server has to be there, otherwise the live part means nothing.
  try {
    const healthCheck = await fetch(`${baseUrl}/`, { method: 'GET' });
    if (!healthCheck.ok) {
      console.log(`ERROR: The server at ${baseUrl} answered with ${healthCheck.status}`);
      process.exit(1);
    }
  } catch {
    console.log(`ERROR: Cannot reach the server at ${baseUrl}. Is the dev server running?`);
    process.exit(1);
  }

  // The events are caught before they are sent.
  setPostHogClientFactory(() => recordingClient);

  console.log(`Running ${ANALYTICS_FIXTURES.length} cases against ${baseUrl}\n`);

  const reports: FixtureReport[] = [];

  // Every case has an address of its own, so the limits of one case never
  // reach another. The addresses are of the range the documentation sets
  // aside, and a new one is used for every run, so the limit of a day is
  // never carried over from one run to the next.
  const runOffset = Math.floor(Date.now() / 1000) % 60000;

  for (let index = 0; index < ANALYTICS_FIXTURES.length; index++) {
    const fixture = ANALYTICS_FIXTURES[index];
    const clientIp = `2001:db8::${(runOffset + index).toString(16)}`;

    const logOffset = serverLogOffset();
    const report = await verifyFixture(fixture, baseUrl, clientIp);
    reports.push(report);

    console.log(`=== ${fixture.label} (${fixture.id}) ===`);
    console.log(`    request: POST ${fixture.request.path} → ${report.statusCode ?? 'failed'}`);

    for (const rule of report.rules) {
      const status = rule.passed ? '✓' : '✗';
      const message = rule.message ? ` — ${rule.message}` : '';
      console.log(`  ${status} ${rule.rule}${message}`);
    }

    // When the file of the server is given, the events it counted are read
    // from it, which shows that the event left the running site. The events
    // are counted without waiting, so a short pause is made first.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const counted = readServerEvents(logOffset);
    if (counted.length > 0) {
      const wanted = fixture.expectedEventType;
      const seen = wanted ? counted.includes(wanted) : true;
      const rule: RuleResult = {
        rule: 'counted_by_the_server',
        fixture: fixture.id,
        passed: seen,
        message: seen ? undefined : `The server counted ${counted.join(', ')}`,
      };
      report.rules.push(rule);
      report.success = report.rules.every((r) => r.passed);
      console.log(`  ${rule.passed ? '✓' : '✗'} ${rule.rule}${rule.message ? ` — ${rule.message}` : ''}`);
    }

    if (report.error) {
      console.log(`  ✗ ERROR: ${report.error}`);
    }

    console.log('');
  }

  console.log('=== Wiring ===');
  const wiringRules = checkWiring();
  for (const rule of wiringRules) {
    const status = rule.passed ? '✓' : '✗';
    const message = rule.message ? ` — ${rule.message}` : '';
    console.log(`  ${status} ${rule.rule}: ${rule.fixture}${message}`);
  }
  console.log('');

  console.log('=== PostHog ===');
  const posthogRule = await checkPostHogIntegration();
  console.log(
    `  ${posthogRule.passed ? '✓' : '✗'} ${posthogRule.rule}${
      posthogRule.message ? ` — ${posthogRule.message}` : ''
    }`
  );
  console.log('');

  // The summary.
  let totalRules = 0;
  let passedRules = 0;
  let failedFixtures = 0;

  for (const report of reports) {
    if (!report.rules.every((rule) => rule.passed)) {
      failedFixtures++;
    }
    for (const rule of report.rules) {
      totalRules++;
      if (rule.passed) passedRules++;
    }
  }

  for (const rule of wiringRules) {
    totalRules++;
    if (rule.passed) passedRules++;
  }

  totalRules++;
  if (posthogRule.passed) passedRules++;

  console.log('=== SUMMARY ===');
  console.log(`Cases: ${reports.length}`);
  console.log(`Cases with failures: ${failedFixtures}`);
  console.log(`Rules checked: ${totalRules}`);
  console.log(`Rules passed: ${passedRules}`);
  console.log(`Rules failed: ${totalRules - passedRules}`);

  if (passedRules < totalRules) {
    console.log('\n=== FAILED RULES ===');
    for (const report of reports) {
      for (const rule of report.rules) {
        if (!rule.passed) {
          console.log(`  ✗ [${report.fixture.id}] ${rule.rule}: ${rule.message}`);
        }
      }
    }
    for (const rule of wiringRules) {
      if (!rule.passed) {
        console.log(`  ✗ [${rule.fixture}] ${rule.rule}: ${rule.message}`);
      }
    }
    if (!posthogRule.passed) {
      console.log(`  ✗ [posthog] ${posthogRule.rule}: ${posthogRule.message}`);
    }
  }

  // The events of the last run are not left in the queue.
  await shutdownAnalytics();

  process.exit(passedRules === totalRules ? 0 : 1);
}

main().catch((error) => {
  console.error('Verification script failed:', error);
  process.exit(1);
});
