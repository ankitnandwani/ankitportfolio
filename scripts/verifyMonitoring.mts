#!/usr/bin/env node
/**
 * Verification script for the monitoring.
 *
 * Runs the cases of the monitoring against the running site and writes a
 * report with the result of every rule. Exits with a non-zero code when a
 * rule fails.
 *
 * The cases are in `src/lib/monitoring/fixtures/monitoringFixtures.ts`.
 *
 * What is checked:
 *
 * - The report that a failure produces is built by the capture of the site
 *   and caught before it is sent, so the rules are checked against the very
 *   payload that the service would receive.
 * - The payload holds nothing that belongs to a person: no address of a
 *   mailbox, no number of a phone, no question, no answer, no description of
 *   a job, no form, no key, no token, no address of the service and no
 *   address of a visitor (PRD §79).
 * - The live request answers the way the case says it should, with the safe
 *   message of today and never with the reason of the failure.
 * - The failure really left the running site, when the file of the server is
 *   given.
 *
 * The script never writes a secret to its own output. A rule that fails
 * prints the name of the rule and a short description of what was found, and
 * never the value it found.
 *
 * Usage:
 *   npm run verify:monitoring
 *   # or
 *   node scripts/verifyMonitoring.mts
 *
 * Requires:
 * - Development server running at http://localhost:3000
 *
 * Optional:
 * - `LIVE_SERVER_URL` – the address of the site. The default is
 *   `http://localhost:3000`.
 * - `SERVER_LOG` – the file the server writes its output to. When it is
 *   given, the failures the server reported are read from it, which shows
 *   that the failure really left the running site.
 * - `LIVE_LLM_TESTS=1` – the cases that need the language model to fail on
 *   purpose are only run when it is given. The model of the environment has
 *   to be a name that does not exist.
 */

import { readFileSync, statSync } from 'node:fs';
import dotenv from 'dotenv';

import {
  COMMON_FORBIDDEN_PATTERNS,
  MONITORING_FIXTURES,
  checkMonitoringRules,
  toMessageView,
  toPayloadView,
  type MonitoringFixture,
  type MonitoringPayload,
  type MonitoringRuleResult,
} from '../src/lib/monitoring/fixtures/monitoringFixtures.ts';
import {
  captureMessage,
  setMonitoringClientFactory,
  type MonitoringClient,
  type MonitoringHint,
} from '../src/lib/monitoring/capture.ts';
import {
  buildMonitoringOptions,
  getMonitoringConfig,
  readMonitoringSecrets,
  type MonitoringConfig,
} from '../src/lib/monitoring/config.ts';
import { setMonitoringSecrets } from '../src/lib/monitoring/scrub.ts';

dotenv.config({ path: '.env.local' });

/**
 * The address of the service that is used while the cases run.
 *
 * The reports are caught before they are sent, so nothing leaves the
 * machine. The address is not a real one, and it is never printed.
 */
const CAPTURE_DSN = 'https://verification@example.invalid/1';

/**
 * The configuration the cases are built with.
 */
const CAPTURE_CONFIG: MonitoringConfig = {
  enabled: true,
  dsn: CAPTURE_DSN,
  environment: 'development',
  release: undefined,
  logToConsole: false,
};

/**
 * A report that the recording client received.
 */
interface CapturedReport {
  kind: 'exception' | 'message';
  error?: unknown;
  message?: string;
  hint?: MonitoringHint;
}

/**
 * The report of one case.
 */
interface FixtureReport {
  fixture: MonitoringFixture;
  success: boolean;
  statusCode?: number;
  rules: MonitoringRuleResult[];
  skipped?: string;
  error?: string;
}

/**
 * The reports that were caught.
 */
const captured: CapturedReport[] = [];

/**
 * A client of the monitoring that keeps what it is given, so the reports can
 * be looked at without sending anything.
 */
const recordingClient: MonitoringClient = {
  captureException: (error, hint) => {
    captured.push({ kind: 'exception', error, hint });
  },
  captureMessage: (message, hint) => {
    captured.push({ kind: 'message', message, hint });
  },
  flush: async () => {},
};

/**
 * A client of the monitoring that fails, so the capture can be shown to stay
 * quiet when the service cannot be reached.
 */
const failingClient: MonitoringClient = {
  captureException: () => {
    throw new Error('the service cannot be reached');
  },
  captureMessage: () => {
    throw new Error('the service cannot be reached');
  },
  flush: async () => {},
};

/**
 * Waits a little, so a report that goes out on its own has arrived.
 */
function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Runs something while the lines of the console are kept to themselves.
 *
 * The site writes a line of the local log for every failure it catches, and
 * the line holds the failure as it came. The line is not printed by the
 * script, so the report of the script holds the rules and nothing else.
 */
async function withQuietConsole<T>(run: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => {};

  try {
    return await run();
  } finally {
    console.error = original;
  }
}

/**
 * Puts the reports that were caught into the shape of a report.
 *
 * @returns The report, or null when there was none.
 */
function readCapturedPayload(): MonitoringPayload | null {
  const report = captured[0];

  if (!report) {
    return null;
  }

  if (report.kind === 'message') {
    return toMessageView(report.message ?? '', report.hint);
  }

  return toPayloadView(report.error, report.hint);
}

/**
 * Makes the request of a case against the running site.
 *
 * @param baseUrl The address of the site.
 * @param request The request to make.
 * @returns The status and the text of the answer.
 */
async function makeRequest(
  baseUrl: string,
  request: NonNullable<MonitoringFixture['request']>
): Promise<{ status: number; text: string }> {
  const response = await fetch(`${baseUrl}${request.path}`, {
    method: request.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(request.headers ?? {}),
    },
    body: request.rawBody,
  });

  return { status: response.status, text: await response.text() };
}

/**
 * Checks the answer of the endpoint against what the case expects.
 */
function checkAnswer(
  fixture: MonitoringFixture,
  status: number,
  text: string
): MonitoringRuleResult[] {
  const rules: MonitoringRuleResult[] = [];

  if (fixture.expectedStatus !== undefined) {
    rules.push({
      rule: 'expected_status',
      fixture: fixture.id,
      passed: status === fixture.expectedStatus,
      message:
        status === fixture.expectedStatus
          ? undefined
          : `Expected ${fixture.expectedStatus}, got ${status}`,
    });
  }

  if (fixture.expectedAnswerText) {
    rules.push({
      rule: 'answer_holds_the_safe_message',
      fixture: fixture.id,
      passed: text.includes(fixture.expectedAnswerText),
      message: text.includes(fixture.expectedAnswerText)
        ? undefined
        : 'The answer does not hold the message of the site',
    });
  }

  // The answer of a visitor never holds the reason of a failure, and never
  // holds anything of what the visitor wrote.
  for (const pattern of COMMON_FORBIDDEN_PATTERNS) {
    rules.push({
      rule: `answer_holds_nothing_private:${pattern.source}`,
      fixture: fixture.id,
      passed: !pattern.test(text),
      message: pattern.test(text)
        ? 'The answer carries something that must not be in it'
        : undefined,
    });
  }

  return rules;
}

/**
 * Reads the failures the server reported out of the file it writes to.
 *
 * The check is only made when the file is given, because the server may be
 * running somewhere the script cannot see.
 *
 * @param offset The place in the file the reading starts at.
 * @returns The lines of the failures that were reported after the place.
 */
function readServerFailures(offset: number): string[] {
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
    // a place in the file and not a place in the text.
    const fresh = readFileSync(logFile).subarray(offset).toString('utf8');

    return fresh
      .split('\n')
      .filter((line) =>
        /API error:|Error processing feedback:|Proxy error:|boundary of the page/.test(line)
      );
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
 * Sends one report to the real project, so the connection of the site with
 * the service is shown to work.
 *
 * The report is built by the capture of the site and it is marked, so it can
 * be found in the project and told apart from a real failure.
 */
async function checkSentryIntegration(): Promise<MonitoringRuleResult[]> {
  const rules: MonitoringRuleResult[] = [];
  const config = getMonitoringConfig();

  if (!config.enabled) {
    rules.push({
      rule: 'sentry_integration',
      fixture: 'sentry',
      passed: true,
      message: 'Skipped, because no credentials are configured',
    });

    return rules;
  }

  let handedOver = false;
  let flushed = false;

  try {
    // The SDK is started the way the server starts it, so the report that
    // goes out is the report the site would send.
    const sdk = await import('@sentry/nextjs');
    sdk.init(buildMonitoringOptions(config));

    setMonitoringClientFactory(() => ({
      captureException: (error, hint) => {
        handedOver = true;
        sdk.captureException(error, hint);
      },
      captureMessage: (message, hint) => {
        handedOver = true;
        sdk.captureMessage(message, hint);
      },
      flush: async () => {
        flushed = await sdk.flush(5000);
      },
    }));

    await captureMessage(
      'Verification of the monitoring of the site.',
      {
        kind: 'verification',
        tags: { verification: 'true' },
        level: 'info',
        timestamp: new Date().toISOString(),
      },
      config
    );
  } catch {
    rules.push({
      rule: 'sentry_integration',
      fixture: 'sentry',
      passed: false,
      message: 'The report could not be handed over to the SDK',
    });

    return rules;
  }

  rules.push({
    rule: 'report_handed_to_the_sdk',
    fixture: 'sentry',
    passed: handedOver,
    message: handedOver ? undefined : 'The report was not handed over to the SDK',
  });

  rules.push({
    rule: 'queue_flushed',
    fixture: 'sentry',
    passed: flushed,
    message: flushed ? undefined : 'The queue of the SDK was not empty',
  });

  return rules;
}

/**
 * Runs one case and returns its report.
 */
async function runFixture(
  fixture: MonitoringFixture,
  baseUrl: string,
  secrets: readonly string[]
): Promise<FixtureReport> {
  const report: FixtureReport = {
    fixture,
    success: false,
    rules: [],
  };

  // The report is built by the capture of the site, and it is caught before
  // it is sent, so the rules are checked against the very payload that the
  // service would receive.
  captured.length = 0;

  if (fixture.build) {
    setMonitoringClientFactory(() => (fixture.clientThrows ? failingClient : recordingClient));

    try {
      // The line of the local log of the site is quiet while the cases run,
      // so the report of the script is the report of the rules and not a
      // copy of the log of the site.
      const build = fixture.build;
      await withQuietConsole(async () => {
        await build(CAPTURE_CONFIG);
      });
    } catch {
      report.rules.push({
        rule: 'report_built',
        fixture: fixture.id,
        passed: false,
        message: 'The report could not be built',
      });
    }

    // A report of a slow operation goes out on its own, so a moment is given
    // to it.
    await wait(100);

    setMonitoringClientFactory(() => recordingClient);
  }

  report.rules.push(...checkMonitoringRules(readCapturedPayload(), fixture, secrets));

  // The live part of the case.
  if (fixture.request) {
    const liveAllowed = !fixture.needsLiveModel || process.env.LIVE_LLM_TESTS === '1';

    if (!liveAllowed) {
      report.skipped =
        'The live part needs the language model to fail on purpose, so it is only run when LIVE_LLM_TESTS=1 is given.';
    } else {
      const logOffset = serverLogOffset();

      try {
        const { status, text } = await makeRequest(baseUrl, fixture.request);
        report.statusCode = status;
        report.rules.push(...checkAnswer(fixture, status, text));

        // When the file of the server is given, the failures it reported are
        // read from it, which shows that the failure left the running site.
        await wait(300);
        const reported = readServerFailures(logOffset);

        if (fixture.serverLogLabel) {
          const seen = reported.some((line) => line.includes(fixture.serverLogLabel as string));
          report.rules.push({
            rule: 'caught_by_the_server',
            fixture: fixture.id,
            passed: seen,
            message: seen ? undefined : 'The server did not report the failure',
          });
        } else if (fixture.expectsNoReport) {
          const seen = reported.some((line) =>
            /API error:|Error processing feedback:|Proxy error:/.test(line)
          );
          report.rules.push({
            rule: 'no_failure_by_the_server',
            fixture: fixture.id,
            passed: !seen,
            message: seen ? 'The server reported a failure' : undefined,
          });
        }
      } catch (error) {
        report.error = error instanceof Error ? error.message : String(error);
        report.rules.push({
          rule: 'request_failed',
          fixture: fixture.id,
          passed: false,
          message: 'The request failed',
        });
      }
    }
  }

  report.success = report.rules.every((rule) => rule.passed);

  return report;
}

/**
 * The main verification function.
 */
async function main(): Promise<void> {
  console.log('Monitoring — End-to-End Verification');
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

  // The secrets of the environment are the ones the site looks for, so the
  // reports that are built here are cleaned of them, the way the reports of
  // the site are cleaned.
  const secrets = readMonitoringSecrets(process.env);
  setMonitoringSecrets(secrets);

  // While the cases run, the reports are caught. The address of the service
  // is a fake one, so nothing leaves the machine even if a report is missed.
  const realDsn = process.env.SENTRY_DSN;
  process.env.SENTRY_DSN = CAPTURE_DSN;

  console.log(`Running ${MONITORING_FIXTURES.length} cases against ${baseUrl}\n`);

  const reports: FixtureReport[] = [];

  for (const fixture of MONITORING_FIXTURES) {
    const report = await runFixture(fixture, baseUrl, secrets);
    reports.push(report);

    console.log(`=== ${fixture.label} (${fixture.id}) ===`);

    if (fixture.request) {
      console.log(`    request: POST ${fixture.request.path} → ${report.statusCode ?? 'skipped'}`);
    }

    for (const rule of report.rules) {
      const status = rule.passed ? '✓' : '✗';
      const message = rule.message ? ` — ${rule.message}` : '';
      console.log(`  ${status} ${rule.rule}${message}`);
    }

    if (report.skipped) {
      console.log(`  – ${report.skipped}`);
    }

    if (fixture.note) {
      console.log(`  · ${fixture.note}`);
    }

    if (report.error) {
      console.log(`  ✗ ERROR: ${report.error}`);
    }

    console.log('');
  }

  // The real report goes out with the real address of the service.
  if (realDsn === undefined) {
    delete process.env.SENTRY_DSN;
  } else {
    process.env.SENTRY_DSN = realDsn;
  }

  setMonitoringClientFactory(null);

  console.log('=== Sentry ===');
  const integrationRules = await checkSentryIntegration();
  for (const rule of integrationRules) {
    const status = rule.passed ? '✓' : '✗';
    const message = rule.message ? ` — ${rule.message}` : '';
    console.log(`  ${status} ${rule.rule}${message}`);
  }
  console.log('');

  console.log('=== The cases that are checked in a browser ===');
  console.log('  The failure of a boundary of the page cannot be reached over http.');
  console.log('  The report is built by the case above and the rules are checked on it.');
  console.log('  The live part is made by hand: make a page fail on purpose and watch');
  console.log('  the project for a report with the scope of the boundary.');
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

  for (const rule of integrationRules) {
    totalRules++;
    if (rule.passed) passedRules++;
  }

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
          console.log(`  ✗ [${report.fixture.id}] ${rule.rule}: ${rule.message ?? ''}`);
        }
      }
    }
    for (const rule of integrationRules) {
      if (!rule.passed) {
        console.log(`  ✗ [${rule.fixture}] ${rule.rule}: ${rule.message ?? ''}`);
      }
    }
  }

  process.exit(passedRules === totalRules ? 0 : 1);
}

main().catch((error) => {
  console.error('Verification script failed:', error);
  process.exit(1);
});
