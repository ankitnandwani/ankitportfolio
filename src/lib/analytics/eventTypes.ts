/**
 * Event types for AI chat analytics.
 *
 * All properties are privacy-safe: no PII, no raw IP addresses,
 * no user identifiers beyond an anonymous session ID.
 */

/**
 * The category a question was classified into by the input guardrails.
 */
export type QuestionCategory =
  | 'profile'           // Questions about Ankit's professional profile
  | 'experience'        // Questions about work experience
  | 'skills'            // Questions about technical skills
  | 'projects'          // Questions about projects
  | 'education'         // Questions about education
  | 'off_topic'         // Questions outside the allowed scope
  | 'injection'         // Prompt injection attempts
  | 'private_data'      // Requests for private data (phone, email, etc.)
  | 'unknown';          // Fallback

/**
 * The action taken by the input guardrails.
 */
export type GuardrailAction =
  | 'allow'
  | 'redirect_off_topic'
  | 'redirect_injection'
  | 'redirect_private_data'
  | 'block';

/**
 * The action taken by the output guardrails.
 */
export type OutputGuardrailAction =
  | 'output_allowed'
  | 'output_redacted'
  | 'output_blocked';

/**
 * The rating given by the user.
 */
export type FeedbackRating = 'up' | 'down';

/**
 * The type of CTA clicked.
 */
export type CtaType = 'resume' | 'project' | 'github' | 'linkedin' | 'email' | 'other';

/**
 * Base properties shared by all analytics events.
 */
export interface BaseAnalyticsEvent {
  /** Anonymous session ID (UUID generated per session) */
  sessionId: string;
  /** ISO timestamp of the event */
  timestamp: string;
  /** The event type */
  eventType: string;
}

/**
 * Event fired when a chat session starts (first message).
 */
export interface ChatSessionStartEvent extends BaseAnalyticsEvent {
  eventType: 'chat_session_start';
  /** User agent string (hashed or truncated) */
  userAgentHash?: string;
}

/**
 * Event fired when a user sends a message.
 */
export interface MessageSentEvent extends BaseAnalyticsEvent {
  eventType: 'message_sent';
  /** The query ID from the orchestration layer */
  queryId: string;
  /** Category of the question from input guardrails */
  questionCategory: QuestionCategory;
  /** Action taken by input guardrails */
  guardrailAction: GuardrailAction;
  /** Length of the user message (not the content itself) */
  messageLength: number;
}

/**
 * Event fired when an AI response is received.
 */
export interface ResponseReceivedEvent extends BaseAnalyticsEvent {
  eventType: 'response_received';
  /** The query ID from the orchestration layer */
  queryId: string;
  /** Whether relevant chunks were found in retrieval */
  retrievalSuccess: boolean;
  /** Number of chunks retrieved */
  chunksRetrieved: number;
  /** Average similarity score of retrieved chunks */
  averageSimilarity: number | null;
  /** Latency from message sent to response received (ms) */
  latencyMs: number;
  /** Total orchestration time (ms) */
  totalOrchestrationMs: number;
  /** Token usage */
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  /** Model that generated the response */
  model: string;
  /** Whether the response was a redirect */
  isRedirect: boolean;
  /** Whether output guardrails redacted content */
  wasRedacted: boolean;
  /** Output guardrail action */
  outputGuardrailAction: OutputGuardrailAction;
  /** Heuristic confidence based on retrieval similarity */
  answerConfidence: number | null;
}

/**
 * Event fired when user gives feedback on a response.
 */
export interface FeedbackGivenEvent extends BaseAnalyticsEvent {
  eventType: 'feedback_given';
  /** The query ID the feedback is for */
  queryId: string;
  /** Thumbs up or down */
  rating: FeedbackRating;
  /** Optional comment from user (PII redacted) */
  comment?: string;
  /** Whether the response was a redirect */
  isRedirect: boolean;
}

/**
 * Event fired when a CTA/link is clicked in a response.
 */
export interface CtaClickedEvent extends BaseAnalyticsEvent {
  eventType: 'cta_clicked';
  /** The query ID the CTA was in */
  queryId: string;
  /** Type of CTA clicked */
  ctaType: CtaType;
  /** Target URL (domain only for privacy) */
  targetDomain: string;
}

/**
 * Properties for the job fit analysis event.
 * All properties are counts/timings - no job description text or PII.
 */
export interface JobFitAnalysisProperties {
  /** The query ID from the analysis */
  queryId: string;
  /** Whether the analysis succeeded */
  success: boolean;
  /** Number of requirements found in the job description */
  requirementCount: number;
  /** Number of requirements analysed (after limit) */
  analysedRequirementCount: number;
  /** Number of requirements classified as DIRECT_MATCH */
  directMatchCount: number;
  /** Number of requirements classified as STRONG_TRANSFER */
  strongTransferCount: number;
  /** Number of requirements classified as RELATED */
  relatedCount: number;
  /** Number of requirements classified as LEARNABLE */
  learnableCount: number;
  /** Number of requirements classified as UNKNOWN */
  unknownCount: number;
  /** Number of chunks retrieved */
  chunksRetrieved: number;
  /** Average similarity score of retrieved chunks */
  averageSimilarity: number | null;
  /** Whether retrieval found any chunks */
  retrievalSuccess: boolean;
  /** Total latency in ms */
  latencyMs: number;
  /** Token usage */
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  /** Model used */
  model: string;
  /** Whether the fallback analysis was used (M17.03) */
  usedFallback: boolean;
  /** Whether the analysis was replaced by the safe fallback (M17.05) */
  replacedBySafeFallback: boolean;
  /** Number of claims corrected by M17.04 (downgraded to LEARNABLE) */
  correctedClaims: number;
  /** Number of PII redactions on the job description */
  redactions: number;
  /** Rate limit scope if blocked */
  rateLimitScope: 'window' | 'daily' | null;
}

/**
 * Event fired when a job fit analysis is completed.
 */
export interface JobFitAnalysisEvent extends BaseAnalyticsEvent {
  eventType: 'job_fit_analysis';
  /** The query ID from the analysis */
  queryId: string;
  /** Properties for the job fit analysis */
  properties: JobFitAnalysisProperties;
}

/**
 * Properties for the contact form submission event.
 * No PII - only field presence and success status.
 */
export interface ContactFormSubmissionProperties {
  /** The query ID from the submission */
  queryId: string;
  /** Whether the submission succeeded */
  success: boolean;
  /** Which fields were present in the request */
  fieldsPresent: {
    name: boolean;
    email: boolean;
    company: boolean;
    message: boolean;
  };
  /** Rate limit scope if blocked */
  rateLimitScope: 'window' | 'daily' | null;
}

/**
 * Event fired when a contact form is submitted.
 */
export interface ContactFormSubmissionEvent extends BaseAnalyticsEvent {
  eventType: 'contact_form_submission';
  /** The query ID from the submission */
  queryId: string;
  /** Properties for the contact form submission */
  properties: ContactFormSubmissionProperties;
}

/**
 * Union of all analytics event types.
 */
export type AnalyticsEvent =
  | ChatSessionStartEvent
  | MessageSentEvent
  | ResponseReceivedEvent
  | FeedbackGivenEvent
  | CtaClickedEvent
  | JobFitAnalysisEvent
  | ContactFormSubmissionEvent;

/**
 * Configuration for the analytics system.
 */
export interface AnalyticsConfig {
  /** Whether analytics is enabled */
  enabled: boolean;
  /** PostHog API key (if using PostHog) */
  posthogKey?: string;
  /** PostHog host (if using PostHog) */
  posthogHost?: string;
  /** Whether to log events to console (for development) */
  logToConsole: boolean;
}

/**
 * Default analytics configuration.
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: false,
  logToConsole: true,
};