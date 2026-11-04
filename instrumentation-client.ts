import { buildMonitoringOptions, readMonitoringConfig } from './src/lib/monitoring/config';

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
  void import('@sentry/nextjs').then((module) => {
    sentry = module;
    module.init(buildMonitoringOptions(config));
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
