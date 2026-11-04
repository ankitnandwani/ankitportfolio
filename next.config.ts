import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  // The organization and the project the source maps belong to. They are set
  // when the Sentry project is created, which is the task M20.08.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // The key of the project. It is never written into a tracked file.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // The build does not send anything to Sentry about itself. The statistics
  // of the build are not needed here, and the site keeps its data to itself.
  telemetry: false,
  // The source maps of the browser are kept.
  //
  // The SDK deletes them once they are uploaded, and the upload only happens
  // when there is a key. Without this the maps would be deleted by a build
  // that never uploaded them, and a failure in the production could not be
  // read.
  sourcemaps: {
    deleteSourcemapsAfterUpload: false,
  },
  // Next.js 15 and later keep the source maps of the browser in a place the
  // upload does not find on its own.
  widenClientFileUpload: true,
});
