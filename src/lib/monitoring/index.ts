/**
 * The monitoring layer.
 *
 * The configuration lives in `config.ts` and the scrubbing lives in
 * `scrub.ts`. They are the two parts of the layer that the browser and the
 * server share. The capture of the failures arrives with M20.03.
 */

export {
  buildMonitoringOptions,
  isValidSentryDsn,
  readMonitoringConfig,
  readMonitoringSecrets,
} from './config.ts';
export type { MonitoringConfig, MonitoringEnvSource, MonitoringOptions } from './config.ts';

export {
  getMonitoringSecrets,
  isPrivateFieldName,
  isPrivateHeaderName,
  redactSecrets,
  redactText,
  resetMonitoringSecrets,
  scrubEvent,
  scrubFailure,
  scrubHeaders,
  scrubUrl,
  scrubValue,
  setMonitoringSecrets,
} from './scrub.ts';
export type { FailureContext, SafeFailure } from './scrub.ts';
