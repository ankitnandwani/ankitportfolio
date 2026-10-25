/**
 * The guardrails of the assistant.
 *
 * They run on both sides of the model. A question is checked before it
 * reaches the knowledge base, and an answer is checked before it reaches the
 * visitor. The order follows the privacy architecture of PRD §35.
 */

export {
  SENSITIVITY_PROFILES,
  type GuardrailAction,
  type GuardrailEvent,
  type GuardrailEventSink,
  type GuardrailOptions,
  type GuardrailProfile,
  type GuardrailSensitivity,
  type InjectionCategory,
  type InjectionDetection,
  type OutputValidationResult,
  type OutputViolation,
  type PiiDetectionResult,
  type PiiFinding,
  type PiiType,
  type TopicClassification,
  type TopicId,
  type ViolationKind,
  type ViolationSeverity,
} from './types.ts';

export {
  TOPIC_DEFINITIONS,
  classifyTopic,
  resolveProfile,
} from './topicClassification.ts';

export {
  REDACTION_TOKEN,
  containsPii,
  detectPii,
  piiTypes,
  redactPii,
} from './piiDetection.ts';

export { INJECTION_PATTERNS, detectInjection } from './promptInjection.ts';

export {
  SUGGESTED_QUESTIONS,
  buildRedirect,
  type RedirectKind,
  type RedirectResponse,
} from './redirects.ts';

export { validateResponse } from './outputValidation.ts';

export {
  createGuardrailEvent,
  logGuardrailEvent,
  resetGuardrailSink,
  setGuardrailSink,
} from './logger.ts';

export {
  MAX_QUERY_LENGTH,
  applyOutputGuardrails,
  evaluateInput,
  type InputGuardrailResult,
  type OutputGuardrailResult,
} from './pipeline.ts';

export {
  MAX_PHRASE_LENGTH,
  buildPhraseIndex,
  containsTokenSequence,
  indexHasPhrase,
  squash,
  tokenize,
} from './text.ts';
