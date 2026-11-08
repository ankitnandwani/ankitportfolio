'use client';

import { useEffect } from 'react';
import { ErrorBoundaryView } from '@/src/components/layout';
import { reportBoundaryFailure } from '@/src/lib/monitoring/boundary';

/**
 * The boundary of the root.
 *
 * It catches the failures that the boundary of the routes cannot catch: the
 * failure of the layout of the site and the failure of the root itself.
 *
 * This page replaces the whole document, so it renders its own `html` and
 * `body`. It holds no style of the site, because the styles of the site live
 * in the layout that this page replaces, so the colours and the typography
 * are the ones of the design system and they are carried by the page itself.
 *
 * The message of the failure is never shown to the visitor, and the report
 * goes out on its own and is not awaited.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    void reportBoundaryFailure({
      scope: 'root',
      error,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: 'var(--neopop-boundary-background, #FFFFFF)',
          color: 'var(--neopop-boundary-text, #212121)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <ErrorBoundaryView
          title="Something went wrong"
          message="Something went wrong while loading this page. Please try again."
          onRetry={retry}
          fullPage
        />
      </body>
    </html>
  );
}
