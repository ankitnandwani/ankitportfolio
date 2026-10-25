import type {
  GuardrailAction,
  GuardrailEvent,
  GuardrailEventSink,
  InjectionCategory,
  TopicId,
} from './types.ts';

/**
 * Where the guardrail events go when nothing else is set.
 *
 * The event holds no question and no answer, so writing it to the log does
 * not write the personal data that went through it.
 */
const defaultSink: GuardrailEventSink = (event) => {
  console.log(`[guardrail] ${JSON.stringify(event)}`);
};

/**
 * The sink the guardrails write to.
 */
let sink: GuardrailEventSink | null = null;

/**
 * Replaces the sink the guardrails write to.
 *
 * @param next The sink to use, or null to go back to the default one.
 */
export function setGuardrailSink(next: GuardrailEventSink | null): void {
  sink = next;
}

/**
 * Goes back to the default sink.
 */
export function resetGuardrailSink(): void {
  sink = null;
}

/**
 * Builds a guardrail event.
 *
 * @param input What happened.
 * @returns The event.
 */
export function createGuardrailEvent(input: {
  action: GuardrailAction;
  queryId?: string | null;
  topic?: TopicId | null;
  confidence?: number | null;
  category?: InjectionCategory | null;
  findingCount?: number;
}): GuardrailEvent {
  return {
    action: input.action,
    timestamp: new Date().toISOString(),
    queryId: input.queryId ?? null,
    topic: input.topic ?? null,
    confidence: input.confidence ?? null,
    category: input.category ?? null,
    findingCount: input.findingCount ?? 0,
  };
}

/**
 * Writes a guardrail event.
 *
 * @param event The event to write.
 * @param options The sink to write it to. Defaults to the sink that was set.
 */
export function logGuardrailEvent(
  event: GuardrailEvent,
  options: { sink?: GuardrailEventSink } = {}
): void {
  const target = options.sink ?? sink ?? defaultSink;
  target(event);
}
