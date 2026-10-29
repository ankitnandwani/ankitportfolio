/**
 * Fixtures for the verification of the analytics.
 *
 * Each fixture is one case of the catalogue of events. A fixture says which
 * request is made against the running site, which event that request is
 * expected to produce, and what the event has to look like.
 *
 * The event itself is built by the tracking function of the site, so the
 * rules are checked against the very payload that PostHog would receive and
 * not against a copy of it.
 *
 * The fixtures carry no personal data of anyone. The addresses and the
 * numbers are of the reserved ranges of the documentation, so they cannot
 * belong to a person.
 */

import {
  trackChatSessionStart,
  trackContactFormSubmission,
  trackCtaClicked,
  trackFeedbackGiven,
  trackJobFitAnalysis,
  trackMessageSent,
  trackRateLimitExceeded,
  trackResponseReceived,
} from '../analytics.ts';
import type { AnalyticsConfig } from '../eventTypes.ts';

/**
 * The part of the site the fixture belongs to.
 */
export type AnalyticsCategory =
  | 'chat'
  | 'job-fit'
  | 'contact'
  | 'feedback'
  | 'cta'
  | 'rate-limit'
  | 'edge';

/**
 * The request that is made against the running site.
 */
export interface AnalyticsRequest {
  /** The path of the endpoint. */
  path: string;
  /** The body of the request. */
  body?: unknown;
  /** The headers of the request, besides the ones the script adds. */
  headers?: Record<string, string>;
  /**
   * The request is sent again until the endpoint answers with this status.
   * It is used for the limits, where the number of requests that are needed
   * depends on the limit the site is configured with.
   */
  untilStatus?: number;
  /** The most requests that are sent, so a limit that is broken cannot run away. */
  maxRequests?: number;
  /**
   * Whether the answer carries the headers of the limit. An answer that is
   * refused before the request is counted carries none of them, because
   * there is no count to tell.
   */
  expectLimitHeaders?: boolean;
}

/**
 * One case of the catalogue of events.
 */
export interface AnalyticsFixture {
  /** Unique identifier of the fixture. */
  id: string;
  /** Human readable label. */
  label: string;
  /** The part of the site the fixture belongs to. */
  category: AnalyticsCategory;
  /** The request that is made against the running site. */
  request: AnalyticsRequest;
  /** The status the endpoint has to answer with. */
  expectedStatus: number;
  /**
   * The event the request is expected to produce. A fixture without one
   * expects no event at all, which is the case of a request that is refused
   * before anything is counted.
   */
  expectedEventType?: string;
  /** The paths of the fields the event has to carry. */
  expectedFields?: string[];
  /** The paths of the fields and the values they have to hold. */
  expectedValues?: Record<string, unknown>;
  /** The paths of the fields and a text they have to hold. */
  expectedText?: Record<string, string>;
  /** The patterns that must not be found anywhere in the event. */
  forbiddenPatterns?: RegExp[];
  /**
   * Calls the tracking function of the site, so the event can be looked at.
   * A fixture without one produces no event.
   */
  track?: (config: AnalyticsConfig) => Promise<void>;
}

/**
 * The session the fixtures of the events use. It is an anonymous identifier
 * of the same shape the site uses.
 */
export const FIXTURE_SESSION_ID = '11111111-2222-4333-8444-555555555555';

/**
 * The identifier of the query the fixtures of the events use.
 */
export const FIXTURE_QUERY_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

/**
 * The agent of the browser the fixtures use.
 */
export const FIXTURE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) VerifyAnalytics/1.0';

/**
 * A phrase that is only in the question of the chat. The event must not
 * carry it, because the site counts the length of the question and never
 * the question itself.
 */
export const CHAT_MESSAGE_MARKER = 'cobalt marigold telescope';

/**
 * A phrase that is only in the description of the job. The event must not
 * carry it, because the site counts the requirements and never the
 * description itself.
 */
export const JOB_DESCRIPTION_MARKER = 'quartz lantern protocol';

/**
 * A comment with personal data in it. The addresses and the numbers are of
 * the reserved ranges, so they cannot belong to a person. The event has to
 * carry the comment with the personal data taken out of it.
 */
export const FEEDBACK_COMMENT =
  'The answer was not enough. Call me on +1 555 123 4567 or email me at recruiter@example.com';

/**
 * A description of a job, long enough for the analyzer to accept it.
 */
export const FIXTURE_JOB_DESCRIPTION = [
  'Senior Software Engineer, Platform',
  '',
  'We are looking for a senior engineer to build and scale our internal platform.',
  `The code of the team is written around the ${JOB_DESCRIPTION_MARKER}.`,
  '',
  'Responsibilities:',
  '- Design and build services in TypeScript and Node.js that serve millions of requests.',
  '- Own features end to end, from design through deployment and monitoring.',
  '- Improve reliability, latency and cost of the systems you own.',
  '- Review code and mentor engineers earlier in their career.',
  '',
  'Requirements:',
  '- 5+ years of professional software engineering experience.',
  '- Strong proficiency in TypeScript and at least one server-side framework.',
  '- Experience with relational databases, caching and message queues.',
  '- Familiarity with cloud infrastructure, CI/CD and observability tooling.',
].join('\n');

/**
 * The patterns of the personal data that must never reach an event.
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
  /** An address of a computer. */
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
} as const;

/**
 * The patterns every event has to be free of.
 */
export const COMMON_FORBIDDEN_PATTERNS: RegExp[] = [
  FORBIDDEN_PATTERNS.email,
  FORBIDDEN_PATTERNS.phoneWithParts,
  FORBIDDEN_PATTERNS.phoneDigits,
  FORBIDDEN_PATTERNS.ipv4,
];

/**
 * The question the chat fixtures use. It is about the profile of Ankit, so
 * the answer is a real one and the event is a real one.
 */
const CHAT_QUESTION = `What are Ankit's main technical skills? ${CHAT_MESSAGE_MARKER}`;

/**
 * A question that is outside the scope of the assistant, so the answer is a
 * redirect.
 */
const OFF_TOPIC_QUESTION = 'What is the weather in Reykjavik tomorrow?';

/**
 * The form the contact fixtures use. The address is of the reserved domain
 * of the documentation.
 */
const CONTACT_FORM = {
  name: 'Verification Recruiter',
  email: 'recruiter@example.com',
  company: 'Example Corporation',
  message: 'I would like to talk about a role on your platform team.',
};

/**
 * The body the browser sends for a click on a call to action.
 */
function ctaBody(
  ctaType: 'resume' | 'project' | 'github' | 'linkedin' | 'email',
  targetDomain: string
): Record<string, unknown> {
  return {
    eventType: 'cta_clicked',
    sessionId: FIXTURE_SESSION_ID,
    queryId: FIXTURE_QUERY_ID,
    ctaType,
    targetDomain,
  };
}

/**
 * Every fixture of the catalogue.
 */
export const ANALYTICS_FIXTURES: AnalyticsFixture[] = [
  // ---------------------------------------------------------------------
  // The events of the conversation
  // ---------------------------------------------------------------------
  {
    id: 'chat_session_start',
    label: 'The chat of a visitor starts with the first message',
    category: 'chat',
    request: {
      path: '/api/chat',
      body: { message: CHAT_QUESTION, stream: false },
    },
    expectedStatus: 200,
    expectedEventType: 'chat_session_start',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'userAgentHash'],
    expectedValues: { eventType: 'chat_session_start' },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS, new RegExp(CHAT_MESSAGE_MARKER)],
    track: async (config) => {
      await trackChatSessionStart(FIXTURE_SESSION_ID, FIXTURE_USER_AGENT, config);
    },
  },
  {
    id: 'message_sent',
    label: 'A question of the visitor is counted',
    category: 'chat',
    request: {
      path: '/api/chat',
      body: { message: CHAT_QUESTION, stream: false },
    },
    expectedStatus: 200,
    expectedEventType: 'message_sent',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'questionCategory',
      'guardrailAction',
      'messageLength',
    ],
    expectedValues: {
      eventType: 'message_sent',
      questionCategory: 'profile',
      guardrailAction: 'allow',
      messageLength: CHAT_QUESTION.length,
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS, new RegExp(CHAT_MESSAGE_MARKER)],
    track: async (config) => {
      await trackMessageSent(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'profile',
        'allow',
        CHAT_QUESTION.length,
        config
      );
    },
  },
  {
    id: 'response_received',
    label: 'An answer of the assistant is counted',
    category: 'chat',
    request: {
      path: '/api/chat',
      body: { message: CHAT_QUESTION, stream: false },
    },
    expectedStatus: 200,
    expectedEventType: 'response_received',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'retrievalSuccess',
      'chunksRetrieved',
      'averageSimilarity',
      'latencyMs',
      'totalOrchestrationMs',
      'tokenUsage',
      'model',
      'isRedirect',
      'wasRedacted',
      'outputGuardrailAction',
      'answerConfidence',
    ],
    expectedValues: {
      eventType: 'response_received',
      retrievalSuccess: true,
      isRedirect: false,
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS, new RegExp(CHAT_MESSAGE_MARKER)],
    track: async (config) => {
      await trackResponseReceived(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        true,
        8,
        0.71,
        3100,
        3400,
        { promptTokens: 1800, completionTokens: 640, totalTokens: 2440 },
        'gemini-flash-lite-latest',
        false,
        false,
        'output_allowed',
        0.82,
        config
      );
    },
  },
  {
    id: 'response_received_redirect',
    label: 'An answer that is a redirect is counted as one',
    category: 'chat',
    request: {
      path: '/api/chat',
      body: { message: OFF_TOPIC_QUESTION, stream: false },
    },
    expectedStatus: 200,
    expectedEventType: 'response_received',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'isRedirect'],
    expectedValues: {
      eventType: 'response_received',
      isRedirect: true,
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackResponseReceived(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        false,
        0,
        null,
        120,
        140,
        null,
        'guardrail',
        true,
        false,
        'output_allowed',
        null,
        config
      );
    },
  },
  {
    id: 'chat_request_refused',
    label: 'A question that is refused is not counted',
    category: 'chat',
    request: {
      path: '/api/chat',
      body: { message: 'x'.repeat(2001), stream: false },
    },
    expectedStatus: 400,
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
  },

  // ---------------------------------------------------------------------
  // The events of the job fit analysis
  // ---------------------------------------------------------------------
  {
    id: 'job_fit_analysis',
    label: 'An analysis of a job description is counted',
    category: 'job-fit',
    request: {
      path: '/api/job-fit',
      body: { jobDescription: FIXTURE_JOB_DESCRIPTION },
    },
    expectedStatus: 200,
    expectedEventType: 'job_fit_analysis',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'properties.success',
      'properties.requirementCount',
      'properties.chunksRetrieved',
      'properties.retrievalSuccess',
      'properties.latencyMs',
      'properties.model',
      'properties.usedFallback',
    ],
    expectedValues: {
      eventType: 'job_fit_analysis',
      'properties.success': true,
      'properties.retrievalSuccess': true,
    },
    forbiddenPatterns: [
      ...COMMON_FORBIDDEN_PATTERNS,
      new RegExp(JOB_DESCRIPTION_MARKER),
      /Senior Software Engineer/,
    ],
    track: async (config) => {
      await trackJobFitAnalysis(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, {
        queryId: FIXTURE_QUERY_ID,
        success: true,
        requirementCount: 9,
        analysedRequirementCount: 9,
        directMatchCount: 4,
        strongTransferCount: 2,
        relatedCount: 1,
        learnableCount: 1,
        unknownCount: 1,
        chunksRetrieved: 8,
        averageSimilarity: 0.71,
        retrievalSuccess: true,
        latencyMs: 3100,
        tokenUsage: { promptTokens: 1800, completionTokens: 640, totalTokens: 2440 },
        model: 'gemini-flash-lite-latest',
        usedFallback: false,
        replacedBySafeFallback: false,
        correctedClaims: 0,
        redactions: 0,
        rateLimitScope: null,
      }, config);
    },
  },
  {
    id: 'job_fit_analysis_refused',
    label: 'A description that is refused is counted as a failure',
    category: 'job-fit',
    request: {
      path: '/api/job-fit',
      body: { jobDescription: 'too short' },
    },
    expectedStatus: 400,
    expectedEventType: 'job_fit_analysis',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'properties.success'],
    expectedValues: {
      eventType: 'job_fit_analysis',
      'properties.success': false,
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackJobFitAnalysis(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, {
        queryId: FIXTURE_QUERY_ID,
        success: false,
        requirementCount: 0,
        analysedRequirementCount: 0,
        directMatchCount: 0,
        strongTransferCount: 0,
        relatedCount: 0,
        learnableCount: 0,
        unknownCount: 0,
        chunksRetrieved: 0,
        averageSimilarity: null,
        retrievalSuccess: false,
        latencyMs: 40,
        tokenUsage: null,
        model: 'none',
        usedFallback: false,
        replacedBySafeFallback: false,
        correctedClaims: 0,
        redactions: 0,
        rateLimitScope: null,
      }, config);
    },
  },

  // ---------------------------------------------------------------------
  // The events of the contact form
  // ---------------------------------------------------------------------
  {
    id: 'contact_form_submission',
    label: 'A message of the contact form is counted',
    category: 'contact',
    request: {
      path: '/api/contact',
      body: CONTACT_FORM,
    },
    expectedStatus: 200,
    expectedEventType: 'contact_form_submission',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'properties.success',
      'properties.fieldsPresent',
    ],
    expectedValues: {
      eventType: 'contact_form_submission',
      'properties.success': true,
    },
    forbiddenPatterns: [
      ...COMMON_FORBIDDEN_PATTERNS,
      /Verification Recruiter/,
      /Example Corporation/,
    ],
    track: async (config) => {
      await trackContactFormSubmission(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, {
        queryId: FIXTURE_QUERY_ID,
        success: true,
        fieldsPresent: { name: true, email: true, company: true, message: true },
        rateLimitScope: null,
      }, config);
    },
  },
  {
    id: 'contact_form_validation_error',
    label: 'A form that is not filled in properly is counted as a failure',
    category: 'contact',
    request: {
      path: '/api/contact',
      body: { name: 'Verification Recruiter', email: 'not-an-address', message: 'Hello.' },
    },
    expectedStatus: 400,
    expectedEventType: 'contact_form_submission',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'properties.success'],
    expectedValues: {
      eventType: 'contact_form_submission',
      'properties.success': false,
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackContactFormSubmission(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, {
        queryId: FIXTURE_QUERY_ID,
        success: false,
        fieldsPresent: { name: true, email: true, company: false, message: true },
        rateLimitScope: null,
      }, config);
    },
  },

  // ---------------------------------------------------------------------
  // The events of the feedback
  // ---------------------------------------------------------------------
  {
    id: 'feedback_given_up',
    label: 'A thumb up of the visitor is counted',
    category: 'feedback',
    request: {
      path: '/api/feedback',
      body: {
        messageId: 'message-1',
        queryId: FIXTURE_QUERY_ID,
        rating: 'up',
        isRedirect: false,
      },
    },
    expectedStatus: 200,
    expectedEventType: 'feedback_given',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'rating', 'isRedirect'],
    expectedValues: {
      eventType: 'feedback_given',
      rating: 'up',
      isRedirect: false,
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackFeedbackGiven(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, 'up', undefined, false, config);
    },
  },
  {
    id: 'feedback_given_down',
    label: 'A thumb down with a comment is counted, without the personal data',
    category: 'feedback',
    request: {
      path: '/api/feedback',
      body: {
        messageId: 'message-2',
        queryId: FIXTURE_QUERY_ID,
        rating: 'down',
        comment: FEEDBACK_COMMENT,
        isRedirect: false,
      },
    },
    expectedStatus: 200,
    expectedEventType: 'feedback_given',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'rating', 'comment'],
    expectedValues: {
      eventType: 'feedback_given',
      rating: 'down',
    },
    expectedText: { comment: '[REDACTED]' },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackFeedbackGiven(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'down',
        FEEDBACK_COMMENT,
        false,
        config
      );
    },
  },

  // ---------------------------------------------------------------------
  // The events of the calls to action
  // ---------------------------------------------------------------------
  {
    id: 'cta_clicked_resume',
    label: 'A click on the resume is counted',
    category: 'cta',
    request: {
      path: '/api/analytics',
      body: ctaBody('resume', 'ankitnandwani.com'),
    },
    expectedStatus: 200,
    expectedEventType: 'cta_clicked',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'ctaType', 'targetDomain'],
    expectedValues: {
      eventType: 'cta_clicked',
      ctaType: 'resume',
      targetDomain: 'ankitnandwani.com',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackCtaClicked(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'resume',
        'ankitnandwani.com',
        config
      );
    },
  },
  {
    id: 'cta_clicked_linkedin',
    label: 'A click on LinkedIn is counted',
    category: 'cta',
    request: {
      path: '/api/analytics',
      body: ctaBody('linkedin', 'linkedin.com'),
    },
    expectedStatus: 200,
    expectedEventType: 'cta_clicked',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'ctaType', 'targetDomain'],
    expectedValues: {
      eventType: 'cta_clicked',
      ctaType: 'linkedin',
      targetDomain: 'linkedin.com',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackCtaClicked(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, 'linkedin', 'linkedin.com', config);
    },
  },
  {
    id: 'cta_clicked_email',
    label: 'A click on the address is counted',
    category: 'cta',
    request: {
      path: '/api/analytics',
      body: ctaBody('email', 'ankitnandwani.com'),
    },
    expectedStatus: 200,
    expectedEventType: 'cta_clicked',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'ctaType', 'targetDomain'],
    expectedValues: {
      eventType: 'cta_clicked',
      ctaType: 'email',
      targetDomain: 'ankitnandwani.com',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackCtaClicked(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'email',
        'ankitnandwani.com',
        config
      );
    },
  },
  {
    id: 'cta_clicked_github',
    label: 'A click on the code of a project is counted',
    category: 'cta',
    request: {
      path: '/api/analytics',
      body: ctaBody('github', 'github.com'),
    },
    expectedStatus: 200,
    expectedEventType: 'cta_clicked',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'ctaType', 'targetDomain'],
    expectedValues: {
      eventType: 'cta_clicked',
      ctaType: 'github',
      targetDomain: 'github.com',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackCtaClicked(FIXTURE_SESSION_ID, FIXTURE_QUERY_ID, 'github', 'github.com', config);
    },
  },
  {
    id: 'cta_clicked_project',
    label: 'A click on a project is counted',
    category: 'cta',
    request: {
      path: '/api/analytics',
      body: ctaBody('project', 'ankitnandwani.com'),
    },
    expectedStatus: 200,
    expectedEventType: 'cta_clicked',
    expectedFields: ['eventType', 'sessionId', 'timestamp', 'queryId', 'ctaType', 'targetDomain'],
    expectedValues: {
      eventType: 'cta_clicked',
      ctaType: 'project',
      targetDomain: 'ankitnandwani.com',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackCtaClicked(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'project',
        'ankitnandwani.com',
        config
      );
    },
  },

  // ---------------------------------------------------------------------
  // The events of the limits
  // ---------------------------------------------------------------------
  {
    id: 'rate_limit_exceeded_chat',
    label: 'A visitor that asks too many questions is counted',
    category: 'rate-limit',
    request: {
      path: '/api/chat',
      // A question that is refused is still counted against the limit, so
      // the limit is reached without a single answer being made.
      body: { stream: false },
      untilStatus: 429,
      maxRequests: 60,
    },
    expectedStatus: 429,
    expectedEventType: 'rate_limit_exceeded',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'properties.scope',
      'properties.endpoint',
      'properties.retryAfterSeconds',
    ],
    expectedValues: {
      eventType: 'rate_limit_exceeded',
      'properties.endpoint': 'chat',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackRateLimitExceeded(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'window',
        'chat',
        1800,
        config
      );
    },
  },
  {
    id: 'rate_limit_exceeded_job_fit',
    label: 'A visitor that asks for too many analyses is counted',
    category: 'rate-limit',
    request: {
      path: '/api/job-fit',
      body: { jobDescription: 'too short' },
      untilStatus: 429,
      maxRequests: 30,
    },
    expectedStatus: 429,
    expectedEventType: 'rate_limit_exceeded',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'properties.scope',
      'properties.endpoint',
      'properties.retryAfterSeconds',
    ],
    expectedValues: {
      eventType: 'rate_limit_exceeded',
      'properties.endpoint': 'job-fit',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackRateLimitExceeded(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'window',
        'job-fit',
        1800,
        config
      );
    },
  },
  {
    id: 'rate_limit_exceeded_contact',
    label: 'A visitor that sends too many messages is counted',
    category: 'rate-limit',
    request: {
      path: '/api/contact',
      body: { name: 'x' },
      untilStatus: 429,
      maxRequests: 30,
    },
    expectedStatus: 429,
    expectedEventType: 'rate_limit_exceeded',
    expectedFields: [
      'eventType',
      'sessionId',
      'timestamp',
      'queryId',
      'properties.scope',
      'properties.endpoint',
      'properties.retryAfterSeconds',
    ],
    expectedValues: {
      eventType: 'rate_limit_exceeded',
      'properties.endpoint': 'contact',
    },
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
    track: async (config) => {
      await trackRateLimitExceeded(
        FIXTURE_SESSION_ID,
        FIXTURE_QUERY_ID,
        'window',
        'contact',
        1800,
        config
      );
    },
  },

  // ---------------------------------------------------------------------
  // The edges of the proxy
  // ---------------------------------------------------------------------
  {
    id: 'proxy_unknown_event_type',
    label: 'An event of a kind that is not known is refused',
    category: 'edge',
    request: {
      path: '/api/analytics',
      body: {
        eventType: 'made_up_event',
        sessionId: FIXTURE_SESSION_ID,
        queryId: FIXTURE_QUERY_ID,
        ctaType: 'resume',
        targetDomain: 'ankitnandwani.com',
      },
    },
    expectedStatus: 400,
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
  },
  {
    id: 'proxy_unknown_field',
    label: 'An event with a field that is not known is refused',
    category: 'edge',
    request: {
      path: '/api/analytics',
      body: {
        ...ctaBody('resume', 'ankitnandwani.com'),
        somethingExtra: 'should not be accepted',
      },
    },
    expectedStatus: 400,
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
  },
  {
    id: 'proxy_missing_field',
    label: 'An event without the identifier of the query is refused',
    category: 'edge',
    request: {
      path: '/api/analytics',
      body: {
        eventType: 'cta_clicked',
        sessionId: FIXTURE_SESSION_ID,
        ctaType: 'resume',
        targetDomain: 'ankitnandwani.com',
      },
    },
    expectedStatus: 400,
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
  },
  {
    id: 'proxy_foreign_origin',
    label: 'An event from another site is refused',
    category: 'edge',
    request: {
      path: '/api/analytics',
      body: ctaBody('resume', 'ankitnandwani.com'),
      headers: { Origin: 'https://someone-else.example.com' },
      expectLimitHeaders: false,
    },
    expectedStatus: 403,
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
  },
  {
    id: 'proxy_body_that_is_not_json',
    label: 'A body that is not a list of fields is refused',
    category: 'edge',
    request: {
      path: '/api/analytics',
      body: 'this is not a body of fields',
      expectLimitHeaders: false,
    },
    expectedStatus: 400,
    forbiddenPatterns: [...COMMON_FORBIDDEN_PATTERNS],
  },
];
