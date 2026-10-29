import { NextRequest, NextResponse } from 'next/server';
import { handleClientEvent, isSameOrigin } from '@/src/lib/analytics';

/**
 * POST /api/analytics
 *
 * The proxy for the events the browser sends.
 *
 * The browser cannot talk to PostHog itself, because the project key would
 * have to be published to the page. It posts the event here instead, and
 * this route checks it and sends it on with the credentials of the server.
 *
 * The request is counted against the limit of the visitor before anything
 * is parsed, and every answer carries the limit headers and the header
 * that keeps the answer out of any cache.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!isSameOrigin(origin, host)) {
    return NextResponse.json(
      { ok: false, error: 'Request not allowed.' },
      {
        status: 403,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const clientKey = getClientKey(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid event payload' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const result = await handleClientEvent(body, { clientKey });

  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}

/**
 * Works out which visitor a request comes from.
 *
 * The hosting platform writes the address of the client into the header, so
 * the first address in it is the one of the visitor.
 *
 * @param request The request that came in.
 * @returns The key the visitor is counted under.
 */
function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
