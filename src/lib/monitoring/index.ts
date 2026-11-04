/**
 * The monitoring layer.
 *
 * The configuration lives in `config.ts` and is the only part of the layer
 * that the browser and the server share. The capture of the failures arrives
 * with M20.03.
 */

export { buildMonitoringOptions, isValidSentryDsn, readMonitoringConfig } from './config.ts';
export type { MonitoringConfig, MonitoringEnvSource, MonitoringOptions } from './config.ts';
