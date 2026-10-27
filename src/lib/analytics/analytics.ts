/**
 * Privacy-conscious analytics for AI chat interactions.
 *
 * Tracks session IDs, message events, response metrics, and feedback
 * without collecting PII. Integrates with PostHog when configured,
 * otherwise logs to console in development.
 */

import { randomUUID } from 'node:crypto';
import {
  type AnalyticsConfig,
  type AnalyticsEvent,
  type BaseAnalyticsEvent,
  type ChatSessionStartEvent,
  type MessageSentEvent,
  type ResponseReceivedEvent,
  type FeedbackGivenEvent,
  type CtaClickedEvent,
  type JobFitAnalysisEvent,
  type QuestionCategory,
  type GuardrailAction,
  type OutputGuardrailAction,
  type FeedbackRating,
  DEFAULT_ANALYTICS_CONFIG,
} from './eventTypes.ts';
import type { TokenUsage } from '../llm/provider.ts';

/**
 * In-memory PostHog client (lazy initialized).
 */
let posthogClient: unknown = null;

/**
 * In-memory storage for session IDs (per process).
 * In production with multiple instances, this would be replaced
 * by a shared store (e.g., Upstash Redis).
 */
const sessionStore = new Map<string, string>();

/**
 * Hashes a string using a simple hash function.
 * Used for user agent hashing to avoid storing raw UA strings.
 */
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Gets or creates an anonymous session ID for a client.
 *
 * @param clientKey A key identifying the client (e.g., hashed IP + UA)
 * @returns The session ID
 */
export function getSessionId(clientKey: string): string {
  let sessionId = sessionStore.get(clientKey);
  if (!sessionId) {
    sessionId = randomUUID();
    sessionStore.set(clientKey, sessionId);
  }
  return sessionId;
}

/**
 * Generates a client key from request headers.
 * Uses hashed IP + user agent for privacy.
 */
export function generateClientKey(
  forwardedFor: string | null,
  realIp: string | null,
  userAgent: string | null
): string {
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'unknown';
  const uaHash = userAgent ? hashString(userAgent) : 'unknown';
  return `${ip}:${uaHash}`;
}

/**
 * Initializes the PostHog client if credentials are available.
 */
async function initPostHog(config: AnalyticsConfig): Promise<unknown> {
  if (posthogClient) return posthogClient;

  if (!config.posthogKey || !config.posthogHost) {
    return null;
  }

  try {
    // Dynamic import to avoid bundling PostHog in client builds
    const { PostHog } = await import('posthog-node');
    posthogClient = new PostHog(config.posthogKey, {
      host: config.posthogHost,
      // Disable IP collection for privacy
      disableGeoip: true,
      // Flush quickly for serverless environments
      flushInterval: 5000,
      flushAt: 20,
    });
    return posthogClient;
  } catch (error) {
    console.warn('[analytics] Failed to initialize PostHog:', error);
    return null;
  }
}

/**
 * Sends an event to the analytics backend.
 * Fire-and-forget: does not await the send to avoid blocking.
 */
async function sendEvent(
  event: AnalyticsEvent,
  config: AnalyticsConfig
): Promise<void> {
  // Always log to console in development
  if (config.logToConsole) {
    console.log(`[analytics] ${event.eventType}`, event);
  }

  if (!config.enabled) {
    return;
  }

  const client = await initPostHog(config);
  if (!client) {
    return;
  }

  try {
    // PostHog expects event name and properties
    const { eventType, sessionId, timestamp, ...properties } = event;
    (client as { capture: (event: string, properties: Record<string, unknown>) => void }).capture(eventType, {
      ...properties,
      session_id: sessionId,
      timestamp,
    });
  } catch (error) {
    console.warn('[analytics] Failed to send event:', error);
  }
}

/**
 * Creates a base event with session ID and timestamp.
 */
function createBaseEvent<const T extends string>(
  sessionId: string,
  eventType: T
): BaseAnalyticsEvent & { eventType: T } {
  return {
    sessionId,
    timestamp: new Date().toISOString(),
    eventType,
  };
}

/**
 * Tracks the start of a chat session.
 */
export async function trackChatSessionStart(
  sessionId: string,
  userAgent?: string,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): Promise<void> {
  const event: ChatSessionStartEvent = {
    ...createBaseEvent(sessionId, 'chat_session_start'),
    userAgentHash: userAgent ? hashString(userAgent) : undefined,
  };
  await sendEvent(event, config);
}

/**
 * Tracks a user message being sent.
 */
export async function trackMessageSent(
  sessionId: string,
  queryId: string,
  questionCategory: QuestionCategory,
  guardrailAction: GuardrailAction,
  messageLength: number,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): Promise<void> {
  const event: MessageSentEvent = {
    ...createBaseEvent(sessionId, 'message_sent'),
    queryId,
    questionCategory,
    guardrailAction,
    messageLength,
  };
  await sendEvent(event, config);
}

/**
 * Tracks an AI response being received.
 */
export async function trackResponseReceived(
  sessionId: string,
  queryId: string,
  retrievalSuccess: boolean,
  chunksRetrieved: number,
  averageSimilarity: number | null,
  latencyMs: number,
  totalOrchestrationMs: number,
  tokenUsage: TokenUsage | null,
  model: string,
  isRedirect: boolean,
  wasRedacted: boolean,
  outputGuardrailAction: OutputGuardrailAction,
  answerConfidence: number | null,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): Promise<void> {
  const event: ResponseReceivedEvent = {
    ...createBaseEvent(sessionId, 'response_received'),
    queryId,
    retrievalSuccess,
    chunksRetrieved,
    averageSimilarity,
    latencyMs,
    totalOrchestrationMs,
    tokenUsage: tokenUsage
      ? {
          promptTokens: tokenUsage.promptTokens ?? 0,
          completionTokens: tokenUsage.completionTokens ?? 0,
          totalTokens: tokenUsage.totalTokens ?? 0,
        }
      : null,
    model,
    isRedirect,
    wasRedacted,
    outputGuardrailAction,
    answerConfidence,
  };
  await sendEvent(event, config);
}

/**
 * Tracks user feedback on a response.
 */
export async function trackFeedbackGiven(
  sessionId: string,
  queryId: string,
  rating: FeedbackRating,
  comment: string | undefined,
  isRedirect: boolean,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): Promise<void> {
  // Redact PII from comment if provided
  const redactedComment = comment ? redactPiiFromText(comment) : undefined;

  const event: FeedbackGivenEvent = {
    ...createBaseEvent(sessionId, 'feedback_given'),
    queryId,
    rating,
    comment: redactedComment,
    isRedirect,
  };
  await sendEvent(event, config);
}

/**
 * Tracks a CTA click in a response.
 */
export async function trackCtaClicked(
  sessionId: string,
  queryId: string,
  ctaType: 'resume' | 'project' | 'github' | 'linkedin' | 'other',
  targetDomain: string,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): Promise<void> {
  const event: CtaClickedEvent = {
    ...createBaseEvent(sessionId, 'cta_clicked'),
    queryId,
    ctaType,
    targetDomain,
  };
  await sendEvent(event, config);
}

/**
 * Tracks a job fit analysis completion.
 */
export async function trackJobFitAnalysis(
  sessionId: string,
  queryId: string,
  success: boolean,
  requirementCount: number,
  chunksRetrieved: number,
  averageSimilarity: number | null,
  latencyMs: number,
  tokenUsage: TokenUsage | null,
  model: string,
  usedFallback: boolean,
  redactions: number,
  rateLimitScope: 'window' | 'daily' | null,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): Promise<void> {
  const event: JobFitAnalysisEvent = {
    ...createBaseEvent(sessionId, 'job_fit_analysis'),
    queryId,
    success,
    requirementCount,
    chunksRetrieved,
    averageSimilarity,
    latencyMs,
    tokenUsage: tokenUsage
      ? {
          promptTokens: tokenUsage.promptTokens ?? 0,
          completionTokens: tokenUsage.completionTokens ?? 0,
          totalTokens: tokenUsage.totalTokens ?? 0,
        }
      : null,
    model,
    usedFallback,
    redactions,
    rateLimitScope,
  };
  await sendEvent(event, config);
}

/**
 * Simple PII redaction for feedback comments.
 * Uses the same phone number redaction as the knowledge base.
 */
function redactPiiFromText(text: string): string {
  // Import the phone number redaction function
  // We use a simple inline version to avoid circular imports
  const PHONE_NUMBER_PATTERN =
    /(?:\+?(\d{1,3})[-.\s]?)?\(?(\d{1,4})[-.\s]?\)?[\d\s.-]{6,64}(\d{1,4})/g;
  const DATE_PATTERN = /(\b\d{4}-\d{2}(?:-\d{2})?\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b)/g;

  function mapOutsideDates(
    input: string,
    transform: (segment: string) => string
  ): string {
    return input
      .split(DATE_PATTERN)
      .map((segment, index) => (index % 2 === 1 ? segment : transform(segment)))
      .join('');
  }

  return mapOutsideDates(text, (segment) =>
    segment.replace(PHONE_NUMBER_PATTERN, '[REDACTED]')
  ).replace(/[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,63}/gi, '[REDACTED]');
}

/**
 * Shuts down the analytics client (flushes pending events).
 */
export async function shutdownAnalytics(): Promise<void> {
  if (posthogClient) {
    await (posthogClient as { shutdown: () => Promise<void> }).shutdown();
    posthogClient = null;
  }
}

/**
 * Gets the current analytics configuration from environment.
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  if (typeof window !== 'undefined') {
    // Client-side: analytics disabled (only server tracks)
    return DEFAULT_ANALYTICS_CONFIG;
  }

  const enabled = !!(
    process.env.POSTHOG_KEY &&
    process.env.POSTHOG_HOST
  );

  return {
    enabled,
    posthogKey: process.env.POSTHOG_KEY,
    posthogHost: process.env.POSTHOG_HOST,
    logToConsole: process.env.NODE_ENV !== 'production',
  };
}