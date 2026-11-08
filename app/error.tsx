'use client';

import { useEffect } from 'react';
import { ErrorBoundaryView } from '@/src/components/layout';
import { reportBoundaryFailure } from '@/src/lib/monitoring/boundary';

/**
 * The boundary of the routes.
 *
 * It catches the failure of the page below it, shows the visitor a page that
 * works, and reports the failure to the owner of the site.
 *
 * The message of the failure is never shown to the visitor. The visitor is
 * not a developer of the site, and the message can hold the text of the page
 * and the value of a field.
 *
 * The report goes out on its own and is not awaited, so a visitor never waits
 * for a report. The page is there first.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    void reportBoundaryFailure({
      scope: 'routes',
      error,
      digest: error.digest,
    });
  }, [error]);

  return (
    <ErrorBoundaryView
      title="Something went wrong"
      message="Something went wrong while loading this part of the page. Please try again."
      onRetry={retry}
    />
  );
}
