/**
 * The types the guardrails share.
 *
 * This module has no imports, so every part of the guardrails can use it
 * without pulling anything else in.
 */

/**
 * How strict the guardrails are.
 *
 * A stricter profile allows less through: it needs more evidence that a
 * question is about the professional profile, and it also acts on the
 * borderline attack phrases.
 */
export type GuardrailSensitivity = 'strict' | 'balanced' | 'relaxed';

/**
 * The subjects a question can be about.
 *
 * The list follows the goals of the assistant in PRD §28 and the source
 * types of the knowledge base.
 */
export type TopicId =
  | 'experience'
  | 'skills'
  | 'projects'
  | 'career'
  | 'technologies'
  | 'achievements'
  | 'philosophy'
  | 'domains'
  | 'education'
  | 'certifications'
  | 'profile'
  | 'job_fit'
  | 'interview'
  | 'off_topic';

/**
 * The kinds of attack the prompt injection detection knows.
 */
export type InjectionCategory =
  | 'instruction_override'
  | 'system_prompt_exfiltration'
  | 'data_exfiltration'
  | 'identity_manipulation'
  | 'roleplay'
  | 'jailbreak'
  | 'sensitive_data_request';

/**
 * The kinds of personal data the guardrails look for.
 */
export type PiiType = 'phone' | 'email';

/**
 * How bad a finding in a response is.
 *
 * A redaction is applied to the text, a block replaces the whole answer and
 * a warning is only reported.
 */
export type ViolationSeverity = 'redact' | 'block' | 'warn';

/**
 * The kinds of finding the output validation reports.
 */
export type ViolationKind = 'pii' | 'secret' | 'system_prompt' | 'tone';

/**
 * The settings that control how the guardrails behave.
 */
export interface GuardrailProfile {
  /**
   * The lowest confidence a topic classification needs to be allowed.
   */
  topicThreshold: number;

  /**
   * Whether a question that only mentions Ankit counts as professional.
   */
  allowPersonalAnchor: boolean;

  /**
   * Whether the borderline attack phrases are acted on as well.
   */
  includeWeakPatterns: boolean;
}

/**
 * The settings of the three sensitivity levels.
 */
export const SENSITIVITY_PROFILES: Record<
  GuardrailSensitivity,
  GuardrailProfile
> = {
  strict: {
    topicThreshold: 0.8,
    allowPersonalAnchor: false,
    includeWeakPatterns: true,
  },
  balanced: {
    topicThreshold: 0.5,
    allowPersonalAnchor: false,
    includeWeakPatterns: false,
  },
  relaxed: {
    topicThreshold: 0.3,
    allowPersonalAnchor: true,
    includeWeakPatterns: false,
  },
};

/**
 * The options every guardrail call understands.
 */
export interface GuardrailOptions {
  /**
   * How strict the guardrails are. Defaults to balanced.
   */
  sensitivity?: GuardrailSensitivity;

  /**
   * The id of the question, used in the log so the events of one question
   * can be found again.
   */
  queryId?: string;

  /**
   * Where the guardrail events are written to. Defaults to the logger.
   */
  sink?: GuardrailEventSink;
}

/**
 * A question that was classified.
 */
export interface TopicClassification {
  /**
   * Whether the question may be answered from the knowledge base.
   */
  isAllowed: boolean;

  /**
   * The subject the question was matched to.
   */
  topic: TopicId;

  /**
   * The name of the subject, for a message that names it.
   */
  label: string;

  /**
   * How sure the classification is, between 0 and 1.
   */
  confidence: number;

  /**
   * The words that were matched.
   */
  matches: string[];

  /**
   * Why the question was classified the way it was.
   */
  reason: string;
}

/**
 * The result of looking for an attack in a question.
 */
export interface InjectionDetection {
  /**
   * Whether the question tries to change or read the instructions.
   */
  isInjection: boolean;

  /**
   * Whether the question asks for data that must never be disclosed.
   */
  isSensitiveRequest: boolean;

  /**
   * The kind of attack that was found.
   */
  category: InjectionCategory | null;

  /**
   * The phrases that matched.
   */
  matches: string[];

  /**
   * How sure the detection is, between 0 and 1.
   */
  confidence: number;
}

/**
 * A piece of personal data that was found.
 */
export interface PiiFinding {
  /**
   * The kind of data.
   */
  type: PiiType;

  /**
   * How many times it was found.
   */
  count: number;
}

/**
 * The result of looking for personal data in a text.
 */
export interface PiiDetectionResult {
  /**
   * The text with every piece of personal data replaced.
   */
  text: string;

  /**
   * The kinds of data that were found.
   */
  findings: PiiFinding[];

  /**
   * Whether anything was found.
   */
  hasPii: boolean;
}

/**
 * A finding in a response.
 */
export interface OutputViolation {
  /**
   * The kind of finding.
   */
  kind: ViolationKind;

  /**
   * How bad it is.
   */
  severity: ViolationSeverity;

  /**
   * What was found, without the value itself.
   */
  detail: string;

  /**
   * How many times it was found.
   */
  count: number;
}

/**
 * The result of checking a response.
 */
export interface OutputValidationResult {
  /**
   * The response, with everything that had to leave it removed.
   */
  text: string;

  /**
   * Whether the response may be shown.
   */
  isValid: boolean;

  /**
   * What was found.
   */
  violations: OutputViolation[];

  /**
   * Whether anything was removed.
   */
  wasRedacted: boolean;
}

/**
 * The kinds of action a guardrail can take.
 */
export type GuardrailAction =
  | 'input_allowed'
  | 'input_off_topic'
  | 'input_injection_blocked'
  | 'input_sensitive_request_blocked'
  | 'output_allowed'
  | 'output_redacted'
  | 'output_warned';

/**
 * A guardrail event.
 *
 * The event never carries the question or the answer, so a log can be kept
 * without keeping the personal data that went through it.
 */
export interface GuardrailEvent {
  /**
   * What was done.
   */
  action: GuardrailAction;

  /**
   * When it happened, as an ISO timestamp.
   */
  timestamp: string;

  /**
   * The id of the question, when one was given.
   */
  queryId: string | null;

  /**
   * The subject of the question, when it was classified.
   */
  topic: TopicId | null;

  /**
   * How sure the classification was.
   */
  confidence: number | null;

  /**
   * The kind of attack that was found, when one was.
   */
  category: InjectionCategory | null;

  /**
   * How many findings there were.
   */
  findingCount: number;
}

/**
 * Where guardrail events are written to.
 */
export type GuardrailEventSink = (event: GuardrailEvent) => void;
