import { logGuardrailEvent } from './logger.ts';
import { detectPii } from './piiDetection.ts';
import { detectInjection } from './promptInjection.ts';
import { validateResponse } from './outputValidation.ts';
import { buildRedirect, type RedirectResponse } from './redirects.ts';
import { classifyTopic } from './topicClassification.ts';
import type {
  GuardrailAction,
  GuardrailOptions,
  InjectionDetection,
  OutputValidationResult,
  TopicClassification,
} from './types.ts';

/**
 * The longest question the guardrails look at.
 *
 * A question is a sentence or two. Anything longer is not a question, and
 * the guardrails do not have to spend time on it.
 */
export const MAX_QUERY_LENGTH = 2000;

/**
 * What the guardrails made of a question.
 */
export interface InputGuardrailResult {
  /**
   * Whether the question may be answered from the knowledge base.
   */
  allowed: boolean;

  /**
   * The question without the personal data it carried.
   */
  query: string;

  /**
   * What the question was found to be about.
   */
  classification: TopicClassification;

  /**
   * What the attack detection found.
   */
  injection: InjectionDetection;

  /**
   * The answer to give instead, when the question is not answered.
   */
  redirect: RedirectResponse | null;

  /**
   * What was done.
   */
  action: GuardrailAction;
}

/**
 * What the guardrails made of an answer.
 */
export interface OutputGuardrailResult extends OutputValidationResult {
  /**
   * What was done.
   */
  action: GuardrailAction;
}

/**
 * Checks a question before it is answered.
 *
 * The order follows the privacy architecture of PRD §35: the attack
 * detection runs first, because a question that tries to change the
 * instructions must not reach the knowledge base, and the topic
 * classification runs after it.
 *
 * @param query The question the visitor asked.
 * @param options The sensitivity, the query id and the sink.
 * @returns Whether the question may be answered, and what to answer instead.
 */
export function evaluateInput(
  query: string,
  options: GuardrailOptions = {}
): InputGuardrailResult {
  const bounded = (query ?? '').slice(0, MAX_QUERY_LENGTH);

  const injection = detectInjection(bounded, options);
  const classification = classifyTopic(bounded, options);
  const sanitised = detectPii(bounded).text;

  let action: GuardrailAction = 'input_allowed';
  let redirect: RedirectResponse | null = null;
  let allowed = true;

  if (injection.isInjection) {
    action = 'input_injection_blocked';
    redirect = buildRedirect('injection');
    allowed = false;
  } else if (injection.isSensitiveRequest) {
    action = 'input_sensitive_request_blocked';
    redirect = buildRedirect('sensitive_request');
    allowed = false;
  } else if (!classification.isAllowed) {
    action = 'input_off_topic';
    redirect = buildRedirect('off_topic');
    allowed = false;
  }

  logGuardrailEvent(
    {
      action,
      timestamp: new Date().toISOString(),
      queryId: options.queryId ?? null,
      topic: classification.topic,
      confidence: classification.confidence,
      category: injection.category,
      findingCount: injection.matches.length,
    },
    { sink: options.sink }
  );

  return {
    allowed,
    query: sanitised,
    classification,
    injection,
    redirect,
    action,
  };
}

/**
 * Checks an answer before it is shown.
 *
 * @param response The answer of the model.
 * @param options The query id and the sink.
 * @returns The answer to show and what was found.
 */
export function applyOutputGuardrails(
  response: string,
  options: GuardrailOptions = {}
): OutputGuardrailResult {
  const result = validateResponse(response, options);

  let action: GuardrailAction = 'output_allowed';

  if (!result.isValid) {
    action = 'output_warned';
  } else if (result.wasRedacted) {
    action = 'output_redacted';
  } else if (result.violations.length > 0) {
    action = 'output_warned';
  }

  logGuardrailEvent(
    {
      action,
      timestamp: new Date().toISOString(),
      queryId: options.queryId ?? null,
      topic: null,
      confidence: null,
      category: null,
      findingCount: result.violations.length,
    },
    { sink: options.sink }
  );

  return { ...result, action };
}
