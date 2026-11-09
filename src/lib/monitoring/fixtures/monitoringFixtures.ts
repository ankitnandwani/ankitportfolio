/**
 * Fixtures for the verification of the monitoring.
 *
 * Each fixture is one case of the monitoring. A fixture says which failure is
 * expected, which report it has to produce, and what the report has to look
 * like.
 *
 * The report itself is built by the capture of the site and caught before it
 * is sent, so the rules are checked against the very payload that the
 * service would receive and not against a copy of it.
 *
 * The fixtures carry no personal data of anyone. The phrases that are used to
 * try to smuggle something into a report are made up, and the addresses and
 * the numbers are of the reserved ranges of the documentation, so they cannot
 * belong to a person.
 */

import { buildAiFailureContext } from '../aiFailures.ts';
import { buildBoundaryFailureContext, buildSafeBoundaryError } from '../boundary.ts';
import { buildRouteContext, captureException, type MonitoringHint } from '../capture.ts';
import type { MonitoringConfig } from '../config.ts';
import {
  classifyExternalFailure,
  reportExternalFailure,
  resetExternalFailureCounts,
} from '../externalFailures.ts';
import { reportSlowOperation } from '../performance.ts';
import type { ReportLevel } from '../scrub.ts';
import { LLMError } from '../../llm/provider.ts';

/**
 * The part of the monitoring a fixture belongs to.
 */
export type MonitoringCategory =
  /** A failure that a route of the site caught. */
  | 'route'
  /** A failure of the language model. */
  | 'ai'
  /** A failure of a service outside the site. */
  | 'external'
  /** A request that took too long. */
  | 'performance'
  /** A failure of the page of a visitor. */
  | 'browser'
  /** The edges of the monitoring. */
  | 'edge';

/**
 * The request that is made against the running site.
 */
export interface MonitoringRequest {
  /** The path of the endpoint. */
  path: string;
  /** The method of the request. */
  method?: string;
  /**
   * The body of the request.
   *
   * It is sent as it is, so a body that cannot be read can be sent. A body
   * that cannot be read is a failure of the site, and a body that is read
   * and found to be wrong is a refusal, and the two are not the same.
   */
  rawBody?: string;
  /** The headers of the request, besides the ones the script adds. */
  headers?: Record<string, string>;
}

/**
 * What a report has to look like.
 */
export interface MonitoringExpectation {
  /** Whether the report is a failure or a message. */
  kind?: 'exception' | 'message';
  /** The tags the report has to carry, and the value they have to hold. */
  tags?: Record<string, string>;
  /**
   * The tags the report has to carry, whatever they hold.
   *
   * It is used for the tags whose value depends on the environment, such as
   * the name of the model.
   */
  tagsPresent?: string[];
  /** The level the report has to have. */
  level?: ReportLevel;
  /** The parts of the report that have to be there. */
  extra?: string[];
  /** The fingerprint the report has to have. */
  fingerprint?: string[];
}

/**
 * One case of the monitoring.
 */
export interface MonitoringFixture {
  /** Unique identifier of the fixture. */
  id: string;
  /** Human readable label. */
  label: string;
  /** The part of the monitoring the fixture belongs to. */
  category: MonitoringCategory;
  /** The request that is made against the running site. */
  request?: MonitoringRequest;
  /** The status the endpoint has to answer with. */
  expectedStatus?: number;
  /** A text the answer of the endpoint has to hold. */
  expectedAnswerText?: string;
  /**
   * The line the server writes when the failure is reported.
   *
   * It is what the script looks for in the file of the server, when the file
   * is given, to show that the failure really left the running site.
   */
  serverLogLabel?: string;
  /** What the report has to look like. */
  expected?: MonitoringExpectation;
  /** The case expects no report at all. */
  expectsNoReport?: boolean;
  /** The patterns that must not be found anywhere in the report. */
  forbiddenPatterns?: RegExp[];
  /**
   * Builds the report with the function of the site.
   *
   * The function is given the configuration of the monitoring, so a case can
   * turn the monitoring off on purpose.
   */
  build?: (config: MonitoringConfig) => Promise<void>;
  /**
   * The live part of the case needs the language model to fail on purpose.
   *
   * The model of the environment has to be a name that does not exist, and
   * the case is only run when `LIVE_LLM_TESTS=1` is given.
   */
  needsLiveModel?: boolean;
  /** The live part of the case can only be made in a browser. */
  manual?: boolean;
  /**
   * The client of the monitoring throws for this case.
   *
   * The capture has to stay quiet when the service cannot be reached, and
   * the only way to show it is a client that fails.
   */
  clientThrows?: boolean;
  /** A note about the case, for the report of the script. */
  note?: string;
}

/**
 * The result of one rule.
 */
export interface MonitoringRuleResult {
  /** The name of the rule. */
  rule: string;
  /** The case the rule belongs to. */
  fixture: string;
  /** Whether the rule was met. */
  passed: boolean;
  /**
   * What the rule found.
   *
   * It never holds a value that could be private, because the report of the
   * script is read by a person and by a file that is kept.
   */
  message?: string;
}

/**
 * A report, as the service would receive it.
 */
export interface MonitoringPayload {
  /** Whether the report is a failure or a message. */
  kind: 'exception' | 'message';
  /** The text of the report. */
  text: string;
  /** The name of the error, when the report is a failure. */
  errorName: string | null;
  /** The tags of the report. */
  tags: Record<string, string>;
  /** The extra parts of the report. */
  extra: Record<string, unknown>;
  /** The fingerprint of the report. */
  fingerprint: string[] | null;
  /** The level of the report. */
  level: ReportLevel | null;
  /** Everything the report holds, as one text. */
  serialised: string;
}

/**
 * A phrase that is only in the question of the chat.
 *
 * A report must not carry the question of a visitor, so the phrase is put in
 * the failure of the parser of the body, which is the failure that holds the
 * first words of a body it could not read.
 */
export const CHAT_QUESTION_MARKER = 'cobalt marigold telescope';

/**
 * A phrase that is only in the answer of the assistant.
 */
export const CHAT_ANSWER_MARKER = 'saffron indigo harbour';

/**
 * A phrase that is only in the description of a job.
 */
export const JOB_DESCRIPTION_MARKER = 'quartz lantern protocol';

/**
 * A phrase that is only in the form of the contact.
 */
export const CONTACT_FORM_MARKER = 'vermillion amber meridian';

/**
 * The patterns of the private data that must never reach a report.
 *
 * The pattern of the address is careful about the length of the numbers, so
 * a long number of a measurement is not mistaken for a number of a phone.
 */
export const FORBIDDEN_PATTERNS = {
  /** An address of a mailbox. */
  email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}/i,
  /** A number of a phone, with the parts told apart. */
  phoneWithParts: /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/,
  /** A number of a phone, written as ten digits in a row. */
  phoneDigits: /\b\d{10}\b/,
  /** An address of a computer, which is the address of a visitor. */
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /** The shape of the address of the service of the monitoring. */
  dsn: /https?:\/\/[a-z0-9]+@[a-z0-9.-]+\/\d+/i,
  /** The shape of a key of the API of the model. */
  modelKey: /AIza[0-9A-Za-z_-]{10,}/,
  /** The shape of a key of the service of the database. */
  serviceKey: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /** The shape of a token of a service. */
  token: /(?:sk|pk|ghp|gho|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{10,}/,
} as const;

/**
 * The patterns every report has to be free of.
 */
export const COMMON_FORBIDDEN_PATTERNS: RegExp[] = [
  FORBIDDEN_PATTERNS.email,
  FORBIDDEN_PATTERNS.phoneWithParts,
  FORBIDDEN_PATTERNS.phoneDigits,
  FORBIDDEN_PATTERNS.ipv4,
  FORBIDDEN_PATTERNS.dsn,
  FORBIDDEN_PATTERNS.modelKey,
  FORBIDDEN_PATTERNS.serviceKey,
  FORBIDDEN_PATTERNS.token,
];

/**
 * The identifier of the query the fixtures use.
 */
export const FIXTURE_QUERY_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

/**
 * A description of a job, long enough for the analyzer to accept it.
 *
 * The phrase of the description is in it on purpose, so the rules can show
 * that a report does not carry it.
 */
export const FIXTURE_JOB_DESCRIPTION = [
  'Senior Software Engineer, Platform',
  '',
  'We are looking for a senior engineer to build and scale our internal platform.',
  `The code of the team is written around the ${JOB_DESCRIPTION_MARKER}.`,
  '',
  'Requirements:',
  '- 5+ years of professional software engineering experience.',
  '- Strong proficiency in TypeScript and at least one server-side framework.',
  '- Experience with relational databases, caching and message queues.',
].join('\n');

/**
 * The failure of a body that cannot be read.
 *
 * The message of the parser holds the first words of the body it could not
 * read, and the phrase of the question is put in it on purpose, so the rules
 * can show that the report does not carry it.
 */
function unreadableBodyError(marker: string): SyntaxError {
  return new SyntaxError(`Unexpected token o in JSON at position 1 while reading near "${marker}"`);
}

/**
 * The failure of the delivery of the email of the contact form.
 */
function emailDeliveryError(): Error {
  return new Error('The message could not be sent: the service of the mail refused it.');
}

/**
 * The failure of the analyzer of a job description.
 */
function analysisError(): Error {
  return new Error('The analysis of the description could not be read.');
}

/**
 * The failure of the database.
 *
 * The message of PostgreSQL can name a row, and a row holds a piece of a
 * description of a job. The site reads the fixed words of it and reports the
 * kind of the failure, and never the message.
 */
function databaseError(): Error {
  return new Error(`relation "chunks" does not exist while reading ${JOB_DESCRIPTION_MARKER}`);
}

/**
 * Puts a failure of the site into the report it would produce.
 *
 * @param route The name of the route.
 * @param error The failure.
 * @param status The status the route is about to answer with.
 * @param kind The kind of the failure.
 * @returns Nothing. The report is handed to the client of the monitoring.
 */
async function reportRouteFailure(
  route: string,
  error: unknown,
  status: number,
  kind: 'llm_configuration_error' | 'llm_unavailable' | 'unknown_failure',
  config: MonitoringConfig
): Promise<void> {
  await captureException(
    error,
    buildRouteContext(route, { method: 'POST' }, { status, kind, queryId: FIXTURE_QUERY_ID }),
    config
  );
}

/**
 * Every case of the monitoring.
 */
export const MONITORING_FIXTURES: MonitoringFixture[] = [
  // ---------------------------------------------------------------------
  // The failures of the routes
  // ---------------------------------------------------------------------
  {
    id: 'chat_body_that_cannot_be_read',
    label: 'A body of the chat that cannot be read is a failure of the site',
    category: 'route',
    request: {
      path: '/api/chat',
      rawBody: '{ this is not the body of a question',
    },
    expectedStatus: 500,
    expectedAnswerText: 'An error occurred processing your request',
    serverLogLabel: 'Chat API error:',
    expected: {
      kind: 'exception',
      tags: { route: 'chat', kind: 'unknown_failure' },
      extra: ['queryId'],
    },
    forbiddenPatterns: [new RegExp(CHAT_QUESTION_MARKER)],
    build: async (config) => {
      await reportRouteFailure(
        'chat',
        unreadableBodyError(CHAT_QUESTION_MARKER),
        500,
        'unknown_failure',
        config
      );
    },
  },
  {
    id: 'feedback_body_that_cannot_be_read',
    label: 'A body of the feedback that cannot be read is a failure of the site',
    category: 'route',
    request: {
      path: '/api/feedback',
      rawBody: '{ this is not the body of a feedback',
    },
    expectedStatus: 500,
    expectedAnswerText: 'Failed to process feedback',
    serverLogLabel: '[feedback] Error processing feedback:',
    expected: {
      kind: 'exception',
      tags: { route: 'feedback', kind: 'unknown_failure' },
    },
    forbiddenPatterns: [new RegExp(CONTACT_FORM_MARKER)],
    build: async (config) => {
      await reportRouteFailure(
        'feedback',
        unreadableBodyError(CONTACT_FORM_MARKER),
        500,
        'unknown_failure',
        config
      );
    },
  },
  {
    id: 'contact_form_failure',
    label: 'A failure of the delivery of the email of the contact form is reported',
    category: 'route',
    expected: {
      kind: 'exception',
      tags: { route: 'contact', kind: 'unknown_failure' },
    },
    forbiddenPatterns: [],
    note: 'The delivery of the email is not reported by the route yet, so the live part of this case is not run. The report is built here, with the function of the route, and the rules are checked on it.',
    build: async (config) => {
      await reportRouteFailure('contact', emailDeliveryError(), 500, 'unknown_failure', config);
    },
  },
  {
    id: 'job_fit_failure',
    label: 'A failure of the analyzer of a job description is reported',
    category: 'route',
    needsLiveModel: true,
    request: {
      path: '/api/job-fit',
      rawBody: JSON.stringify({ jobDescription: FIXTURE_JOB_DESCRIPTION }),
    },
    expectedStatus: 503,
    expectedAnswerText: 'The analysis service is not configured.',
    expected: {
      kind: 'exception',
      tags: { route: 'job-fit', kind: 'unknown_failure' },
    },
    forbiddenPatterns: [],
    note: 'The live part of this case needs the model to fail on purpose, so it is only run when LIVE_LLM_TESTS=1 is given.',
    build: async (config) => {
      await reportRouteFailure('job-fit', analysisError(), 500, 'unknown_failure', config);
    },
  },

  // ---------------------------------------------------------------------
  // The failures of the language model
  // ---------------------------------------------------------------------
  {
    id: 'model_configuration',
    label: 'A model that is not configured is told apart from a model that is down',
    category: 'ai',
    needsLiveModel: true,
    request: {
      path: '/api/chat',
      rawBody: JSON.stringify({
        message: 'What are the main technical skills?',
        stream: false,
      }),
    },
    expectedStatus: 503,
    expectedAnswerText: 'AI service is not configured',
    expected: {
      kind: 'exception',
      tags: { kind: 'configuration' },
      tagsPresent: ['model'],
      extra: ['queryId'],
    },
    forbiddenPatterns: [],
    build: async (config) => {
      const error = new LLMError(
        'Gemini does not know the model "definitely-not-a-real-model" (HTTP 404).',
        404
      );

      await captureException(
        error,
        buildAiFailureContext(error, { queryId: FIXTURE_QUERY_ID }),
        config
      );
    },
  },
  {
    id: 'model_unavailable',
    label: 'A model that is down is reported as a failure that another attempt could survive',
    category: 'ai',
    needsLiveModel: true,
    expected: {
      kind: 'exception',
      tags: { kind: 'unavailable' },
    },
    forbiddenPatterns: [],
    build: async (config) => {
      const error = new LLMError('The model is not answering (HTTP 503).', 503);

      await captureException(
        error,
        buildAiFailureContext(error, { queryId: FIXTURE_QUERY_ID }),
        config
      );
    },
  },
  {
    id: 'model_unknown',
    label: 'A failure of the model that nothing is known about is reported as unknown',
    category: 'ai',
    expected: {
      kind: 'exception',
      tags: { kind: 'unknown' },
    },
    forbiddenPatterns: [],
    build: async (config) => {
      const error = new Error('The model answered something that could not be read.');

      await captureException(
        error,
        buildAiFailureContext(error, { queryId: FIXTURE_QUERY_ID }),
        config
      );
    },
  },

  // ---------------------------------------------------------------------
  // The failures of the services
  // ---------------------------------------------------------------------
  {
    id: 'github_service_failure',
    label: 'A failure of the service of GitHub is reported with the name of the repository',
    category: 'external',
    expected: {
      kind: 'message',
      tags: { service: 'github', kind: 'unavailable', what: 'cached' },
      level: 'warning',
      extra: ['repository', 'url'],
    },
    forbiddenPatterns: [],
    build: async () => {
      resetExternalFailureCounts();

      await reportExternalFailure({
        service: 'github',
        kind: 'unavailable',
        what: 'cached',
        status: 503,
        repository: 'ankitnandwani/example',
        url: 'https://api.github.com/repos/ankitnandwani/example',
        level: 'warning',
      });
    },
  },
  {
    id: 'database_failure',
    label: 'A failure of the database is reported without the message of the database',
    category: 'external',
    expected: {
      kind: 'message',
      tags: { service: 'supabase', kind: 'unavailable', what: 'empty' },
      level: 'warning',
    },
    forbiddenPatterns: [new RegExp(JOB_DESCRIPTION_MARKER)],
    build: async () => {
      resetExternalFailureCounts();

      const error = databaseError();

      await reportExternalFailure({
        service: 'supabase',
        // The kind is read out of the message of the database, and the
        // message itself never reaches the report.
        kind: classifyExternalFailure({ status: 500, message: error.message }),
        what: 'empty',
        status: 500,
        level: 'warning',
      });
    },
  },

  // ---------------------------------------------------------------------
  // The performance
  // ---------------------------------------------------------------------
  {
    id: 'slow_request',
    label: 'A request that took too long is reported with the name of the operation',
    category: 'performance',
    expected: {
      kind: 'message',
      tags: { operation: 'chat' },
      level: 'warning',
    },
    forbiddenPatterns: [],
    build: async () => {
      reportSlowOperation('chat', 31000, 30000);
    },
  },

  // ---------------------------------------------------------------------
  // The failures of the page of a visitor
  // ---------------------------------------------------------------------
  {
    id: 'browser_boundary',
    label: 'A failure of a boundary of the page is reported without the message of the failure',
    category: 'browser',
    manual: true,
    expected: {
      kind: 'exception',
      tags: { scope: 'routes', kind: 'browser_boundary_failure' },
      level: 'error',
      extra: ['scope'],
    },
    forbiddenPatterns: [new RegExp(CHAT_ANSWER_MARKER)],
    note: 'The live part of this case is made in a browser: the failure of a boundary of the page cannot be reached over http. The payload is built here and the rules are checked on it.',
    build: async (config) => {
      const error = new Error(`The answer could not be shown: ${CHAT_ANSWER_MARKER}`);
      error.stack = `Error: The answer could not be shown: ${CHAT_ANSWER_MARKER}\n    at Card (page.tsx:12:3)`;

      await captureException(
        buildSafeBoundaryError(error),
        buildBoundaryFailureContext({ scope: 'routes', error, digest: '1234567890' }),
        config
      );
    },
  },

  // ---------------------------------------------------------------------
  // The edges
  // ---------------------------------------------------------------------
  {
    id: 'the_monitoring_is_off',
    label: 'Nothing is reported while the monitoring is off',
    category: 'edge',
    expectsNoReport: true,
    build: async (config) => {
      await reportRouteFailure(
        'chat',
        unreadableBodyError(CHAT_QUESTION_MARKER),
        500,
        'unknown_failure',
        { ...config, enabled: false }
      );
    },
  },
  {
    id: 'a_report_that_fails',
    label: 'A report that cannot be sent does not become a second failure',
    category: 'edge',
    expectsNoReport: true,
    clientThrows: true,
    note: 'The client of the monitoring is replaced by one that throws, and the capture has to stay quiet.',
    build: async (config) => {
      await reportRouteFailure(
        'chat',
        unreadableBodyError(CHAT_QUESTION_MARKER),
        500,
        'unknown_failure',
        config
      );
    },
  },
  {
    id: 'contact_refuses_a_body_that_cannot_be_read',
    label: 'A body of the contact form that cannot be read is a refusal and not a failure',
    category: 'edge',
    request: {
      path: '/api/contact',
      rawBody: '{ this is not the body of a form',
    },
    expectedStatus: 400,
    expectedAnswerText: 'Invalid JSON body',
    expectsNoReport: true,
  },
  {
    id: 'job_fit_refuses_a_body_that_cannot_be_read',
    label: 'A body of the analyzer that cannot be read is a refusal and not a failure',
    category: 'edge',
    request: {
      path: '/api/job-fit',
      rawBody: '{ this is not the body of a description',
    },
    expectedStatus: 400,
    expectedAnswerText: 'Invalid JSON body',
    expectsNoReport: true,
  },
  {
    id: 'the_proxy_refuses_another_site',
    label: 'An event from another site is refused and nothing is reported',
    category: 'edge',
    request: {
      path: '/api/analytics',
      rawBody: JSON.stringify({
        eventType: 'cta_clicked',
        sessionId: '11111111-2222-4333-8444-555555555555',
        queryId: FIXTURE_QUERY_ID,
        ctaType: 'resume',
        targetDomain: 'ankitnandwani.com',
      }),
      headers: { Origin: 'https://someone-else.example.com' },
    },
    expectedStatus: 403,
    expectsNoReport: true,
  },
];

/**
 * Puts a failure into the shape of a report.
 *
 * @param error The failure the report is about.
 * @param hint The hint that goes with the report.
 * @returns The report as the service would receive it.
 */
export function toPayloadView(error: unknown, hint?: MonitoringHint): MonitoringPayload {
  const errorName = error instanceof Error ? error.name : null;
  const text = error instanceof Error ? error.message : String(error ?? '');
  const stack = error instanceof Error ? (error.stack ?? '') : '';

  return {
    kind: 'exception',
    text,
    errorName,
    tags: hint?.tags ?? {},
    extra: hint?.extra ?? {},
    fingerprint: hint?.fingerprint ?? null,
    level: hint?.level ?? null,
    serialised: serialisePayload(errorName, text, stack, hint),
  };
}

/**
 * Puts a message into the shape of a report.
 *
 * @param message The text of the report.
 * @param hint The hint that goes with the report.
 * @returns The report as the service would receive it.
 */
export function toMessageView(message: string, hint?: MonitoringHint): MonitoringPayload {
  return {
    kind: 'message',
    text: message,
    errorName: null,
    tags: hint?.tags ?? {},
    extra: hint?.extra ?? {},
    fingerprint: hint?.fingerprint ?? null,
    level: hint?.level ?? null,
    serialised: serialisePayload(null, message, '', hint),
  };
}

/**
 * The parts of a report that hold an identifier and not a text.
 *
 * The site cleans them as identifiers, because they are identifiers: a
 * digest is a hash of a failure and it cannot hold personal data. They are
 * left out of the text that the rules of the privacy look at, because a
 * digest is a number and a number of ten digits looks like a number of a
 * phone.
 */
const IDENTIFIER_EXTRA_FIELDS: readonly string[] = ['digest'];

/**
 * Puts everything a report holds into one text.
 *
 * The rules that look for something private look at the whole report and not
 * only at the parts the other rules look at.
 */
function serialisePayload(
  errorName: string | null,
  text: string,
  stack: string,
  hint?: MonitoringHint
): string {
  const extra = { ...(hint?.extra ?? {}) };

  for (const field of IDENTIFIER_EXTRA_FIELDS) {
    delete extra[field];
  }

  return [
    errorName ?? '',
    text,
    stack,
    JSON.stringify(hint?.tags ?? {}),
    JSON.stringify(extra),
    JSON.stringify(hint?.fingerprint ?? []),
  ].join('\n');
}

/**
 * Checks a report against what a case expects and against the rules of the
 * privacy of PRD §79.
 *
 * The message of a rule never holds what it found, because the report of the
 * script is read by a person and is kept in a file.
 *
 * @param payload The report, or null when there was none.
 * @param fixture The case the report belongs to.
 * @param secrets The values of the secrets of the environment.
 * @returns The result of every rule.
 */
export function checkMonitoringRules(
  payload: MonitoringPayload | null,
  fixture: MonitoringFixture,
  secrets: readonly string[] = []
): MonitoringRuleResult[] {
  const rules: MonitoringRuleResult[] = [];

  if (fixture.expectsNoReport) {
    rules.push({
      rule: 'no_report_produced',
      fixture: fixture.id,
      passed: payload === null,
      message: payload === null ? undefined : 'A report was produced',
    });

    return rules;
  }

  rules.push({
    rule: 'report_produced',
    fixture: fixture.id,
    passed: payload !== null,
    message: payload === null ? 'No report was produced' : undefined,
  });

  if (!payload) {
    return rules;
  }

  const expected = fixture.expected ?? {};

  if (expected.kind) {
    rules.push({
      rule: 'kind_of_report',
      fixture: fixture.id,
      passed: payload.kind === expected.kind,
      message:
        payload.kind === expected.kind
          ? undefined
          : `Expected ${expected.kind}, got ${payload.kind}`,
    });
  }

  for (const [name, value] of Object.entries(expected.tags ?? {})) {
    const actual = payload.tags[name];
    rules.push({
      rule: `tag:${name}`,
      fixture: fixture.id,
      passed: actual === value,
      message: actual === value ? undefined : `Expected ${value}, got ${String(actual)}`,
    });
  }

  for (const name of expected.tagsPresent ?? []) {
    const actual = payload.tags[name];
    rules.push({
      rule: `tag_is_there:${name}`,
      fixture: fixture.id,
      passed: typeof actual === 'string' && actual.length > 0,
      message:
        typeof actual === 'string' && actual.length > 0
          ? undefined
          : `The report does not carry the tag ${name}`,
    });
  }

  if (expected.level) {
    rules.push({
      rule: 'level_of_report',
      fixture: fixture.id,
      passed: payload.level === expected.level,
      message:
        payload.level === expected.level
          ? undefined
          : `Expected ${expected.level}, got ${String(payload.level)}`,
    });
  }

  for (const name of expected.extra ?? []) {
    rules.push({
      rule: `extra:${name}`,
      fixture: fixture.id,
      passed: payload.extra[name] !== undefined && payload.extra[name] !== null,
      message:
        payload.extra[name] === undefined || payload.extra[name] === null
          ? `The report does not hold ${name}`
          : undefined,
    });
  }

  if (expected.fingerprint) {
    const actual = payload.fingerprint ?? [];
    const same =
      actual.length === expected.fingerprint.length &&
      actual.every((part, index) => part === expected.fingerprint?.[index]);
    rules.push({
      rule: 'fingerprint',
      fixture: fixture.id,
      passed: same,
      message: same ? undefined : `Expected ${expected.fingerprint.join(', ')}`,
    });
  }

  // The rules of the privacy are checked on every report, and not only on
  // the ones of a case that asks for them.
  for (const pattern of [...COMMON_FORBIDDEN_PATTERNS, ...(fixture.forbiddenPatterns ?? [])]) {
    rules.push({
      rule: `no_pii:${pattern.source}`,
      fixture: fixture.id,
      passed: !pattern.test(payload.serialised),
      message: pattern.test(payload.serialised)
        ? 'The report carries something that must not be in it'
        : undefined,
    });
  }

  for (const secret of secrets) {
    if (!secret || secret.length < 8) {
      continue;
    }

    rules.push({
      rule: 'no_secret',
      fixture: fixture.id,
      passed: !payload.serialised.includes(secret),
      message: payload.serialised.includes(secret)
        ? 'The report carries a secret of the environment'
        : undefined,
    });
  }

  return rules;
}
