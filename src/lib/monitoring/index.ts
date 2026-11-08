/**
 * The monitoring layer.
 *
 * The configuration lives in `config.ts`, the scrubbing lives in `scrub.ts`
 * and the capture lives in `capture.ts`. They are the parts of the layer that
 * the browser and the server share. The capture of the failures of the
 * routes arrived with M20.03.
 */

export {
  buildMonitoringOptions,
  getMonitoringConfig,
  isValidSentryDsn,
  readMonitoringConfig,
  readMonitoringSecrets,
} from './config.ts';
export type { MonitoringConfig, MonitoringEnvSource, MonitoringOptions } from './config.ts';

export {
  buildRouteContext,
  captureException,
  captureMessage,
  classifyFailure,
  isFailureReported,
  markFailureReported,
  setMonitoringClientFactory,
} from './capture.ts';
export type {
  FailureKind,
  MonitoringClient,
  MonitoringClientFactory,
  MonitoringHint,
  RouteAnswer,
  RouteRequest,
} from './capture.ts';

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

export {
  buildAiFailureContext,
  classifyAiFailure,
  readAiFailureStatus,
  readAiModel,
} from './aiFailures.ts';
export type { AiFailureKind } from './aiFailures.ts';

export {
  buildExternalFailureContext,
  buildExternalFailureMessage,
  classifyExternalFailure,
  reportExternalFailure,
  resetExternalFailureCounts,
  setExternalFailureWindow,
} from './externalFailures.ts';
export type {
  ExternalFallback,
  ExternalFailure,
  ExternalFailureKind,
  ExternalFailureSignal,
  ExternalServiceName,
} from './externalFailures.ts';

export {
  DEFAULT_PERFORMANCE_THRESHOLDS,
  readPerformanceThreshold,
  reportSlowOperation,
  startPerformanceMeasurement,
} from './performance.ts';
export type {
  PerformanceClock,
  PerformanceMeasurement,
  PerformanceOperation,
  PerformanceOptions,
  PerformanceReport,
  PerformanceReporter,
} from './performance.ts';

export {
  BOUNDARY_FAILURE_KIND,
  BOUNDARY_FAILURE_MESSAGE,
  buildBoundaryFailureContext,
  buildSafeBoundaryError,
  readBoundaryDigest,
  readBoundaryErrorName,
  readBoundaryStackFrames,
  reportBoundaryFailure,
} from './boundary.ts';
export type { BoundaryFailure, BoundaryScope } from './boundary.ts';
