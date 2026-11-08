import {
  buildMonitoringOptions,
  readMonitoringConfig,
  readMonitoringSecrets,
} from './src/lib/monitoring/config';
import { setMonitoringClientFactory } from './src/lib/monitoring/capture';
import { setMonitoringSecrets } from './src/lib/monitoring/scrub';

/**
 * The configuration of the monitoring of the browser.
 *
 * The DSN of the browser is a public variable, because a DSN of Sentry is not
 * a secret: it is written in the page by design and only allows sending
 * events to the project it belongs to.
 */
const config = readMonitoringConfig({
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  nodeEnv: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
});

// The values of the secrets of the environment are read once, and every
// string that is sent is checked against them.
setMonitoringSecrets(readMonitoringSecrets(process.env));

/**
 * The SDK of the browser, once it has been loaded.
 */
let sentry: typeof import('@sentry/nextjs') | undefined;

if (config.enabled) {
  // The SDK is loaded on its own. It weighs about a hundred kilobytes
  // gzipped, and the page should not wait for it: Next.js runs this file
  // before the page becomes interactive and does not await the import, so the
  // chunk is fetched while the page is being made and the SDK is ready a
  // moment later. When there is no DSN the chunk is never fetched at all.
  const ready = import('@sentry/nextjs').then((sdk) => {
    sentry = sdk;
    sdk.init(buildMonitoringOptions(config));
    return sdk;
  });

  // The SDK of the browser is handed to the capture of the site, so the
  // package is never loaded a second time in the page. The boundary of the
  // page reports through the capture, and the capture uses the SDK that is
  // already here.
  setMonitoringClientFactory(async () => {
    const sdk = await ready;

    return {
      captureException: (error, hint) => sdk.captureException(error, hint),
      captureMessage: (message, hint) => sdk.captureMessage(message, hint),
      flush: async () => {
        await sdk.flush(5000);
      },
    };
  });
}

/**
 * Notes the start of a navigation of the router.
 *
 * The SDK asks for this hook and warns at the build when it is missing. It
 * starts a span for the navigation, and the tracing is off, so it records
 * nothing.
 */
export const onRouterTransitionStart = (url: string, navigationType: string): void => {
  sentry?.captureRouterTransitionStart(url, navigationType);
};
