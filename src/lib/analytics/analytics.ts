/**
 * Privacy-conscious analytics for AI chat interactions.
 *
 * Tracks session IDs, message events, response metrics, and feedback
 * without collecting PII. Integrates with PostHog when configured,
 * otherwise logs to console in development.
 */

import { randomUUID } from './crypto.ts';
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
  type JobFitAnalysisProperties,
  type ContactFormSubmissionEvent,
  type ContactFormSubmissionProperties,
  type QuestionCategory,
  type GuardrailAction,
  type OutputGuardrailAction,
  type FeedbackRating,
  type CtaType,
} from './eventTypes.ts';
import { readAnalyticsConfig } from './config.ts';
import type { TokenUsage } from '../llm/provider.ts';

/**
 * The options the PostHog client is created with.
 */
export interface PostHogClientOptions {
  /** The PostHog host the events are sent to. */
  host: string;
  /** Whether the IP address is left out of the events. */
  disableGeoip: boolean;
  /** How often the queue is flushed, in milliseconds. */
  flushInterval: number;
  /** How many events are queued before the queue is flushed. */
  flushAt: number;
}

/**
 * The message one event is sent as.
 *
 * This is the shape `posthog-node` expects. It takes a single object with
 * the name of the event, the identity it belongs to and the properties. An
 * earlier version of this module called `capture(name, properties)` instead,
 * which is the shape of the version 3 of the package. Against the version
 * that is installed, that call sends an event with no name and no identity,
 * so the events never arrive.
 */
export interface PostHogEventMessage {
  /** The identity the event belongs to. The anonymous session id. */
  distinctId: string;
  /** The name of the event. */
  event: string;
  /** The properties of the event. */
  properties?: Record<string, unknown>;
  /** When the event happened. */
  timestamp?: Date;
}

/**
 * The part of the PostHog client this module uses.
 */
export interface PostHogClient {
  capture: (message: PostHogEventMessage) => void;
  shutdown: () => Promise<void>;
  /**
   * Sends the events that are waiting in the queue.
   *
   * The client queues the events and sends them on its own interval. A
   * request that ends before that interval is over can lose the events it
   * queued, because a serverless function is put to sleep as soon as it has
   * answered. Flushing before the answer goes out keeps the event.
   */
  flush?: () => Promise<void>;
}

/**
 * Creates the PostHog client. Used by the tests to replace the real one.
 */
export type PostHogClientFactory = (
  key: string,
  options: PostHogClientOptions
) => PostHogClient | Promise<PostHogClient>;

/**
 * In-memory PostHog client (lazy initialized).
 */
let posthogClient: PostHogClient | null = null;

/**
 * The factory that creates the client. When it is null the real PostHog
 * package is used.
 */
let posthogClientFactory: PostHogClientFactory | null = null;

/**
 * Replaces the factory that creates the PostHog client. Used by the tests.
 *
 * The cached client is dropped, so the new factory is used from the next
 * event on.
 *
 * @param factory The factory to use, or null to use the real package.
 */
export function setPostHogClientFactory(factory: PostHogClientFactory | null): void {
  posthogClientFactory = factory;
  posthogClient = null;
}

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
 * Creates the real PostHog client.
 *
 * The package is loaded with a dynamic import, so it is never part of a
 * client bundle.
 */
async function createPostHogClient(
  key: string,
  options: PostHogClientOptions
): Promise<PostHogClient> {
  const { PostHog } = await import('posthog-node');
  // The options and the methods this module uses are a subset of the ones
  // the package offers. The cast keeps the package at the edge of this
  // module, so a change in the package does not spread through the code.
  return new PostHog(key, options) as unknown as PostHogClient;
}

/**
 * Initializes the PostHog client if credentials are available.
 *
 * @param config The configuration to build the client from.
 * @returns The client, or null when there are no credentials or the client
 *          could not be created.
 */
export async function initPostHog(config: AnalyticsConfig): Promise<PostHogClient | null> {
  if (posthogClient) return posthogClient;

  if (!config.posthogKey || !config.posthogHost) {
    return null;
  }

  const options: PostHogClientOptions = {
    host: config.posthogHost,
    // Disable IP collection for privacy
    disableGeoip: true,
    // Flush quickly for serverless environments
    flushInterval: 5000,
    flushAt: 20,
  };

  try {
    const factory = posthogClientFactory ?? createPostHogClient;
    posthogClient = await factory(config.posthogKey, options);
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
    // PostHog takes a single message with the name of the event, the
    // identity it belongs to and the properties. The session id is the
    // identity, because it is the only thing that connects the events of
    // one visit without identifying the visitor.
    const { eventType, sessionId, timestamp, ...properties } = event;
    client.capture({
      distinctId: sessionId,
      event: eventType,
      properties: {
        ...properties,
        session_id: sessionId,
      },
      timestamp: new Date(timestamp),
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
  config: AnalyticsConfig = getAnalyticsConfig()
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
  config: AnalyticsConfig = getAnalyticsConfig()
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
  config: AnalyticsConfig = getAnalyticsConfig()
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
  config: AnalyticsConfig = getAnalyticsConfig()
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
  ctaType: CtaType,
  targetDomain: string,
  config: AnalyticsConfig = getAnalyticsConfig()
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
  properties: JobFitAnalysisProperties,
  config: AnalyticsConfig = getAnalyticsConfig()
): Promise<void> {
  const event: JobFitAnalysisEvent = {
    ...createBaseEvent(sessionId, 'job_fit_analysis'),
    queryId,
    properties,
  };
  await sendEvent(event, config);
}

/**
 * Tracks a contact form submission.
 */
export async function trackContactFormSubmission(
  sessionId: string,
  queryId: string,
  properties: ContactFormSubmissionProperties,
  config: AnalyticsConfig = getAnalyticsConfig()
): Promise<void> {
  const event: ContactFormSubmissionEvent = {
    ...createBaseEvent(sessionId, 'contact_form_submission'),
    queryId,
    properties,
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
 * Sends the events that are waiting in the queue.
 *
 * The client queues the events and sends them on its own interval, which is
 * the right shape for a process that stays alive. A request that ends before
 * that interval is over can lose the events it queued, because a serverless
 * function is put to sleep as soon as it has answered. A route that sends a
 * single event flushes it, so the event is not left in the queue.
 *
 * A failure of the flush is not reported. The event is still in the queue,
 * and the client sends it on its own schedule.
 */
export async function flushAnalytics(): Promise<void> {
  if (!posthogClient) {
    return;
  }

  try {
    await posthogClient.flush?.();
  } catch (error) {
    console.warn('[analytics] Failed to flush the events:', error);
  }
}

/**
 * Shuts down the analytics client (flushes pending events).
 */
export async function shutdownAnalytics(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}

/**
 * Gets the current analytics configuration from environment.
 *
 * The configuration is read when it is asked for rather than when the module
 * is loaded, so a change of the environment is picked up without a restart
 * of the module.
 *
 * @returns The configuration.
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  return readAnalyticsConfig(
    {
      posthogKey: process.env.POSTHOG_KEY,
      posthogHost: process.env.POSTHOG_HOST,
      nodeEnv: process.env.NODE_ENV,
    },
    { isBrowser: typeof window !== 'undefined' }
  );
}