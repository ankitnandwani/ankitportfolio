/**
 * Analytics module for AI chat interactions.
 *
 * Provides privacy-conscious tracking of chat sessions, messages,
 * responses, and user feedback. Integrates with PostHog when configured.
 */

export {
  trackChatSessionStart,
  trackMessageSent,
  trackResponseReceived,
  trackFeedbackGiven,
  trackCtaClicked,
  getSessionId,
  generateClientKey,
  getAnalyticsConfig,
  shutdownAnalytics,
} from './analytics.ts';

export {
  type AnalyticsConfig,
  type AnalyticsEvent,
  type ChatSessionStartEvent,
  type MessageSentEvent,
  type ResponseReceivedEvent,
  type FeedbackGivenEvent,
  type CtaClickedEvent,
  type QuestionCategory,
  type GuardrailAction,
  type OutputGuardrailAction,
  type FeedbackRating,
} from './eventTypes.ts';