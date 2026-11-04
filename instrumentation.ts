import * as Sentry from '@sentry/nextjs';

import {
  buildMonitoringOptions,
  readMonitoringConfig,
  readMonitoringSecrets,
} from './src/lib/monitoring/config';
import { setMonitoringSecrets } from './src/lib/monitoring/scrub';

/**
 * Starts the monitoring of the server when the instance starts.
 *
 * Next.js calls this once, before the instance answers a request. The
 * monitoring only starts when a DSN is configured, so the site boots without
 * a Sentry project and without an error.
 */
export function register(): void {
  const config = readMonitoringConfig({
    sentryDsn: process.env.SENTRY_DSN,
    nodeEnv: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
  });

  // The values of the secrets of the environment are read once, and every
  // string that is sent is checked against them.
  setMonitoringSecrets(readMonitoringSecrets(process.env));

  if (!config.enabled) {
    return;
  }

  Sentry.init(buildMonitoringOptions(config));
}

/**
 * Reports the failures that Next.js catches.
 *
 * The hook receives the path, the method and the headers of the request, and
 * no body, so a failure can be reported without anything a visitor wrote.
 * When the monitoring is off there is no client and the report goes nowhere.
 */
export const onRequestError = Sentry.captureRequestError;
