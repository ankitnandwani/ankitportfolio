/**
 * The scrubbing of the monitoring.
 *
 * Everything that is sent to the monitoring service goes through this module.
 * It takes the parts of a failure and gives back the safe version of them,
 * with everything private taken out: the message of the chat, the description
 * of a job, the form of a contact, the address of a mailbox, the number of a
 * phone, the keys and the tokens.
 *
 * The rule is the one the guardrails follow: **the log never holds the
 * question and the answer.** The difference is that a guardrail decides what
 * to write, while a failure arrives with whatever the caller passed, so it has
 * to be taken apart.
 *
 * The safe shape is built from the parts that are known to be safe. A part
 * that is not on the list does not reach the service, so a field that nobody
 * thought of is not sent by accident.
 */

import { isPlaceholderValue } from '../analytics/config.ts';
import { redactPii, REDACTION_TOKEN } from '../guardrails/piiDetection.ts';

/**
 * The fields of the site that hold what a visitor wrote.
 *
 * They are listed in one place, so a new field is added here rather than to a
 * dozen call sites.
 */
const PRIVATE_FIELD_NAMES: readonly string[] = [
  'message',
  'history',
  'description',
  'jobDescription',
  'text',
  'answer',
  'question',
  'name',
  'email',
  'company',
  'comment',
  'feedback',
  'body',
  'requestBody',
  'rawBody',
  'payload',
  'form',
  'formData',
];

/**
 * The headers that carry a secret, whatever their name.
 */
const PRIVATE_HEADER_NAMES: readonly string[] = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
  // The address of the visitor. The limiter of the routes counts the
  // requests under it, and a report that carries it would carry a personal
  // detail of the visitor.
  'x-forwarded-for',
  'x-real-ip',
  'forwarded',
];

/**
 * The parts of a name of a header that mean it carries a secret.
 */
const SECRET_HEADER_PARTS: readonly string[] = ['token', 'secret', 'key', 'password'];

/**
 * The parts of an event of the SDK that are worth reporting.
 *
 * Everything else is left out. The user of a visitor is one of them, and it
 * is never sent.
 */
const SAFE_EVENT_KEYS: readonly string[] = [
  'event_id',
  'timestamp',
  'platform',
  'level',
  'logger',
  'transaction',
  'server_name',
  'environment',
  'release',
  'dist',
  'sdk',
  'modules',
  'tags',
  'extra',
  'contexts',
  'exception',
  'stacktrace',
  'breadcrumbs',
  'request',
  // The fingerprint is what groups the reports. It is a list of the words
  // that name the kind of the failure and the route, so it holds nothing
  // private, and without it every failure opens an issue of its own.
  'fingerprint',
];

/**
 * How deep the scrubbing of a value goes.
 *
 * A failure is a small thing, and a depth of six is far more than any shape
 * of the site needs. The limit keeps a value that points at itself from
 * running forever.
 */
const MAX_DEPTH = 6;

/**
 * The shortest value that is worth looking for in a text.
 *
 * A secret that is shorter than this would be removed from half of the words
 * of a message, which would make the message useless.
 */
const MIN_SECRET_LENGTH = 8;

/**
 * The values of the secrets of the environment.
 *
 * They are read once, when the configuration is read, and every string that
 * is sent is checked against them.
 */
let secrets: readonly string[] = [];

/**
 * Whether a value is worth looking for in a text.
 *
 * A value that is empty, that is still the placeholder of `.env.example` or
 * that is too short to be a secret is left out. A placeholder is not a
 * secret, and looking for it would only change the text for nothing.
 *
 * @param value The value to check.
 * @returns True when the value is worth looking for.
 */
export function isSecretValue(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (trimmed.length < MIN_SECRET_LENGTH) return false;
  if (isPlaceholderValue(trimmed)) return false;

  return true;
}

/**
 * Sets the values of the secrets of the environment.
 *
 * @param values The values to look for. A value that is empty, that is a
 * placeholder or that is too short is left out.
 */
export function setMonitoringSecrets(values: readonly string[]): void {
  secrets = values
    .filter((value): value is string => typeof value === 'string')
    .filter(isSecretValue)
    .map((value) => value.trim());
}

/**
 * The values of the secrets of the environment.
 *
 * @returns The values that are looked for.
 */
export function getMonitoringSecrets(): readonly string[] {
  return secrets;
}

/**
 * Forgets the values of the secrets of the environment.
 */
export function resetMonitoringSecrets(): void {
  secrets = [];
}

/**
 * Whether a name of a field holds what a visitor wrote.
 *
 * @param name The name of the field.
 * @returns True when the field holds private data.
 */
export function isPrivateFieldName(name: string): boolean {
  const lower = name.toLowerCase();
  return PRIVATE_FIELD_NAMES.some((field) => field.toLowerCase() === lower);
}

/**
 * Whether a header carries a secret.
 *
 * @param name The name of the header.
 * @returns True when the header carries a secret or a token.
 */
export function isPrivateHeaderName(name: string): boolean {
  const lower = name.toLowerCase();

  if (PRIVATE_HEADER_NAMES.includes(lower)) {
    return true;
  }

  return SECRET_HEADER_PARTS.some((part) => lower.includes(part));
}

/**
 * The values of the secrets that are looked for.
 *
 * The SDK calls the hook of `beforeSend` with the event and a hint, so the
 * second argument of a hook is not always the list of the secrets. A value
 * that is not a list is ignored, and the secrets of the environment are used
 * instead, so a hook that is called by the SDK never loses its scrubbing.
 *
 * @param values The values that were given.
 * @returns The values that are looked for.
 */
function resolveSecrets(values: readonly string[] | undefined): readonly string[] {
  return Array.isArray(values) ? values : getMonitoringSecrets();
}

/**
 * Removes the values of the secrets of the environment from a text.
 *
 * @param text The text to clean.
 * @param values The values to remove. The ones of the environment are used
 * when none are given.
 * @returns The text without the secrets.
 */
export function redactSecrets(text: string, values?: readonly string[]): string {
  if (!text) return text;

  let cleaned = text;

  for (const value of resolveSecrets(values)) {
    if (!value || value.length < MIN_SECRET_LENGTH) continue;
    cleaned = cleaned.split(value).join(REDACTION_TOKEN);
  }

  return cleaned;
}

/**
 * Removes everything private from a text.
 *
 * The personal data is removed by the redaction the guardrails use, and the
 * values of the secrets of the environment are removed as well.
 *
 * @param text The text to clean.
 * @param values The values of the secrets to remove.
 * @returns The text without the private parts.
 */
export function redactText(text: string, values?: readonly string[]): string {
  if (!text) return text;

  return redactPii(redactSecrets(text, values));
}

/**
 * Cleans the strings of a value of any shape, and keeps every field.
 *
 * This is the cleaning of the parts the SDK builds itself, where a field of
 * the shape of the site does not mean what it means in a body of a request.
 * The name of the SDK is a name of the SDK, and not the name of a recruiter.
 *
 * @param value The value to clean.
 * @param values The values of the secrets to remove.
 * @param depth How deep the cleaning goes.
 * @returns The clean value.
 */
export function scrubStrings(value: unknown, values?: readonly string[], depth = 0): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactText(value, values);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => scrubStrings(entry, values, depth + 1))
      .filter((entry) => entry !== undefined);
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const scrubbed = scrubStrings(entry, values, depth + 1);
      if (scrubbed !== undefined) {
        cleaned[key] = scrubbed;
      }
    }

    return cleaned;
  }

  return undefined;
}

/**
 * Cleans a value of any shape.
 *
 * A string is cleaned of its private parts. An object loses the fields that
 * hold private data and keeps the rest, cleaned. An array is cleaned piece by
 * piece.
 *
 * @param value The value to clean.
 * @param values The values of the secrets to remove.
 * @param depth How deep the cleaning goes.
 * @returns The clean value.
 */
export function scrubValue(value: unknown, values?: readonly string[], depth = 0): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactText(value, values);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => scrubValue(entry, values, depth + 1))
      .filter((entry) => entry !== undefined);
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (isPrivateFieldName(key)) continue;

      const scrubbed = scrubValue(entry, values, depth + 1);
      if (scrubbed !== undefined) {
        cleaned[key] = scrubbed;
      }
    }

    return cleaned;
  }

  // A function or a symbol holds nothing that is worth reporting.
  return undefined;
}

/**
 * Keeps the headers that carry no secret.
 *
 * @param headers The headers of the request.
 * @returns The headers that are safe to send.
 */
export function scrubHeaders(
  headers: Record<string, string | string[] | undefined> | undefined
): Record<string, string> {
  const safe: Record<string, string> = {};

  if (!headers || typeof headers !== 'object') {
    return safe;
  }

  for (const [name, value] of Object.entries(headers)) {
    if (isPrivateHeaderName(name)) continue;
    if (value === undefined || value === null) continue;

    safe[name] = Array.isArray(value) ? value.join(', ') : String(value);
  }

  return safe;
}

/**
 * Keeps the path of an address and leaves out the query.
 *
 * A query can hold a search, a token or an address of a mailbox, so it is
 * left out. The path says where the visitor was, which is what a failure
 * needs.
 *
 * @param url The address to clean.
 * @returns The path of the address.
 */
export function scrubUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    // An address that is not a URL is not worth a failure of its own.
    return url.split('?')[0]?.split('#')[0];
  }
}

/**
 * The parts of a failure that are worth reporting.
 *
 * The names are the ones the site uses, and anything else is left out. The
 * type allows any other field, because the caller may pass one that nobody
 * thought of, and the safe shape is built from the parts that are known.
 */
export interface FailureContext {
  /** The name of the error. */
  errorName?: string | undefined;
  /** The message of the error. */
  message?: string | undefined;
  /** The kind of the failure. */
  kind?: string | undefined;
  /** The name of the route. */
  route?: string | undefined;
  /** The method of the request. */
  method?: string | undefined;
  /** The status of the answer. */
  status?: number | undefined;
  /** The moment of the failure. */
  timestamp?: string | undefined;
  /** The identifier of the query. */
  queryId?: string | undefined;
  /** The stack of the failure. */
  stack?: string | undefined;
  /** The headers of the request. */
  headers?: Record<string, string | string[] | undefined> | undefined;
  /** The extra parts of the failure. */
  extra?: Record<string, unknown> | undefined;
  /** Any other part. It is left out of the safe shape. */
  [key: string]: unknown;
}

/**
 * The safe version of a failure.
 *
 * The same shape as the context that went in, with everything private taken
 * out and the parts that are missing set to null.
 */
export interface SafeFailure {
  errorName: string | null;
  message: string | null;
  kind: string | null;
  route: string | null;
  method: string | null;
  status: number | null;
  timestamp: string | null;
  queryId: string | null;
  stack: string | null;
  headers: Record<string, string>;
  extra: Record<string, unknown>;
}

/**
 * Builds the safe version of a failure.
 *
 * The safe shape is built from the parts that are known to be safe, so a
 * field that nobody thought of is not sent by accident. The function never
 * throws: a failure of the scrubbing must not become a second failure.
 *
 * @param context The parts of the failure.
 * @param values The values of the secrets to remove.
 * @returns The safe version of the failure.
 */
export function scrubFailure(context: FailureContext, values?: readonly string[]): SafeFailure {
  const safe: SafeFailure = {
    errorName: null,
    message: null,
    kind: null,
    route: null,
    method: null,
    status: null,
    timestamp: null,
    queryId: null,
    stack: null,
    headers: {},
    extra: {},
  };

  try {
    if (!context || typeof context !== 'object') {
      return safe;
    }

    const secrets = resolveSecrets(values);

    const clean = (value: unknown): string | null =>
      typeof value === 'string' ? redactText(value, secrets) : null;

    // The identifiers the site builds are not touched by the redaction of the
    // personal data. The pattern of a number of a phone would take a piece of
    // an identifier apart, and an identifier cannot hold personal data.
    const cleanIdentifier = (value: unknown): string | null =>
      typeof value === 'string' ? redactSecrets(value, secrets) : null;

    safe.errorName = cleanIdentifier(context.errorName);
    safe.message = clean(context.message);
    safe.kind = cleanIdentifier(context.kind);
    safe.route = clean(context.route);
    safe.method = cleanIdentifier(context.method);
    safe.timestamp = cleanIdentifier(context.timestamp);
    safe.queryId = cleanIdentifier(context.queryId);
    safe.stack = clean(context.stack);

    if (typeof context.status === 'number') {
      safe.status = context.status;
    }

    safe.headers = scrubHeaders(context.headers);

    if (context.extra && typeof context.extra === 'object') {
      const cleaned = scrubValue(context.extra, secrets, 0);
      if (cleaned && typeof cleaned === 'object' && !Array.isArray(cleaned)) {
        safe.extra = cleaned as Record<string, unknown>;
      }
    }
  } catch {
    // A failure of the scrubbing gives the empty shape, which says nothing
    // but never anything private.
    return {
      errorName: null,
      message: null,
      kind: null,
      route: null,
      method: null,
      status: null,
      timestamp: null,
      queryId: null,
      stack: null,
      headers: {},
      extra: {},
    };
  }

  return safe;
}

/**
 * The parts of an event that the application fills itself.
 *
 * The fields that hold private data are dropped from these, because a field
 * of the shape of the site means what it means in a body of a request. The
 * parts the SDK builds itself keep every field, because the name of the SDK
 * is the name of the SDK and not the name of a recruiter.
 */
const FREE_FORM_EVENT_KEYS: readonly string[] = ['extra', 'breadcrumbs', 'tags'];

/**
 * The shape of an event whose scrubbing failed.
 *
 * The event is not sent as it came, because it may hold something private.
 * But the report is not lost either: the shape below holds nothing but the
 * identity of the event and a note that says the scrubbing failed.
 *
 * @param event The event that came in.
 * @returns The safe shape.
 */
function safeEvent(event: unknown): Record<string, unknown> {
  const source =
    event && typeof event === 'object' && !Array.isArray(event)
      ? (event as Record<string, unknown>)
      : {};

  const safe: Record<string, unknown> = {};

  const read = (key: string): unknown => {
    try {
      return source[key];
    } catch {
      // A field that throws when it is read is left out.
      return undefined;
    }
  };

  const eventId = read('event_id');
  if (typeof eventId === 'string') safe.event_id = eventId;

  const timestamp = read('timestamp');
  if (typeof timestamp === 'number') safe.timestamp = timestamp;

  const level = read('level');
  if (typeof level === 'string') safe.level = level;

  const platform = read('platform');
  if (typeof platform === 'string') safe.platform = platform;

  safe.tags = { scrubbing: 'failed' };

  return safe;
}

/**
 * Cleans an event of the SDK before it leaves the process.
 *
 * This is the backstop: it covers the paths that nobody remembered. The
 * parts of the event that are worth reporting are kept, the user of a
 * visitor is left out, and everything that is kept is cleaned of its private
 * parts.
 *
 * The shape of the event is the same as it came in, so the SDK still gets
 * what it expects.
 *
 * The SDK calls the hook of `beforeSend` with the event and a hint. The hint
 * is not a list of secrets, so it is ignored, and the secrets of the
 * environment are used instead.
 *
 * @param event The event of the SDK.
 * @param values The values of the secrets to remove.
 * @returns The clean event.
 */
export function scrubEvent<T>(event: T, values?: readonly string[]): T {
  try {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      return event;
    }

    const source = event as Record<string, unknown>;
    const clean: Record<string, unknown> = {};
    const secrets = resolveSecrets(values);

    for (const key of SAFE_EVENT_KEYS) {
      if (!(key in source)) continue;

      const value = source[key];

      if (key === 'request') {
        clean[key] = scrubRequest(value);
        continue;
      }

      const scrubbed = FREE_FORM_EVENT_KEYS.includes(key)
        ? scrubValue(value, secrets, 0)
        : scrubStrings(value, secrets, 0);

      if (scrubbed !== undefined) {
        clean[key] = scrubbed;
      }
    }

    return clean as T;
  } catch {
    // The scrubbing of this event failed. The event is not sent as it came,
    // because it may hold something private, and the report is not lost
    // either: the safe shape takes its place.
    try {
      return safeEvent(event) as T;
    } catch {
      return {} as T;
    }
  }
}

/**
 * Cleans the request of an event.
 *
 * The body is never sent, the query of the address is left out, and the
 * headers that carry a secret are dropped.
 *
 * @param request The request of the event.
 * @returns The clean request.
 */
function scrubRequest(request: unknown): Record<string, unknown> | undefined {
  if (!request || typeof request !== 'object') {
    return undefined;
  }

  const source = request as Record<string, unknown>;
  const clean: Record<string, unknown> = {};

  if (typeof source.url === 'string') {
    clean.url = scrubUrl(source.url);
  }

  if (typeof source.method === 'string') {
    clean.method = source.method;
  }

  const headers = scrubHeaders(
    source.headers && typeof source.headers === 'object'
      ? (source.headers as Record<string, string | string[] | undefined>)
      : undefined
  );

  if (Object.keys(headers).length > 0) {
    clean.headers = headers;
  }

  // The body of the request is never sent, whatever shape it has.
  return clean;
}
