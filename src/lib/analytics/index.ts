/**
 * Analytics module for AI chat interactions.
 *
 * Provides privacy-conscious tracking of chat sessions, messages,
 * responses, and user feedback. Integrates with PostHog when configured.
 */

// Server-side analytics (with PostHog integration)
export {
  trackChatSessionStart,
  trackMessageSent,
  trackResponseReceived,
  trackFeedbackGiven,
  trackJobFitAnalysis,
  trackContactFormSubmission,
  shutdownAnalytics,
  initPostHog,
  setPostHogClientFactory,
  flushAnalytics,
  getAnalyticsConfig,
  type PostHogClient,
  type PostHogClientFactory,
  type PostHogClientOptions,
  type PostHogEventMessage,
} from './analytics.ts';

// Client-side analytics (no PostHog, no Node.js dependencies)
export {
  getSessionId,
  generateClientKey,
  trackCtaClicked,
} from './client.ts';

// The configuration of the analytics layer, shared by both sides
export {
  readAnalyticsConfig,
  isConfiguredValue,
  isPlaceholderValue,
  isValidPostHogHost,
} from './config.ts';

// The proxy for the events the browser sends
export {
  handleClientEvent,
  validateClientEvent,
  createAnalyticsRateLimiter,
  getAnalyticsRateLimiter,
  setAnalyticsRateLimiter,
  isSameOrigin,
  CLIENT_EVENT_TYPES,
  type ClientEvent,
  type ClientEventType,
  type ClientEventValidation,
  type HandleClientEventOptions,
  type ProxyResult,
} from './proxy.ts';

export {
  type AnalyticsConfig,
  type AnalyticsEvent,
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