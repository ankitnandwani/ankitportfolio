import { NextRequest, NextResponse } from 'next/server';
import {
  validateContactForm,
  createSuccessResponse,
  createErrorResponse,
  type ContactFormRequest,
} from '@/src/lib/contact/validation';
import { getContactRateLimiter } from '@/src/lib/contact/rateLimiter';
import { sendContactEmail } from '@/src/lib/contact/email';
import {
  getAnalyticsConfig,
  generateClientKey,
  getSessionId,
  trackContactFormSubmission,
  type ContactFormSubmissionProperties,
} from '@/src/lib/analytics';

/**
 * The message a visitor sees when the limit is reached.
 *
 * It says what happened and what to do, without saying anything about the
 * limits themselves.
 */
const RATE_LIMIT_MESSAGE =
  'You have sent too many messages recently. Please wait a bit before sending another message.';

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

/**
 * POST /api/contact
 *
 * Handles contact form submissions.
 *
 * The request is counted against the rate limit of the visitor before
 * anything else happens, and the email is sent only when it passes
 * all validation.
 */
export async function POST(request: NextRequest) {
  const rateLimiter = getContactRateLimiter();
  const clientKey = getClientKey(request);
  const limit = rateLimiter.check(`contact:${clientKey}`);

  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(limit.limit),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)),
  };

  if (!limit.allowed) {
    console.log(
      `[rate-limit] key=${clientKey} scope=${limit.scope} ` +
        `retryAfter=${limit.retryAfterSeconds}s action=blocked`
    );

    return NextResponse.json(
      {
        error: RATE_LIMIT_MESSAGE,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          'Retry-After': String(limit.retryAfterSeconds),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // Analytics configuration
  const analyticsConfig = getAnalyticsConfig();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  const analyticsClientKey = generateClientKey(forwardedFor, realIp, userAgent);
  const sessionId = getSessionId(analyticsClientKey);
  const queryId = crypto.randomUUID();

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      // Fire analytics event for invalid JSON
      fireContactAnalytics(
        sessionId,
        queryId,
        false,
        { name: false, email: false, company: false, message: false },
        limit.scope,
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackContactFormSubmission failed:', err));

      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const requestData = body as ContactFormRequest;

    // Validate the form data
    const validationResult = validateContactForm(requestData);

    if (!validationResult.ok) {
      // Fire analytics event for validation failure
      fireContactAnalytics(
        sessionId,
        queryId,
        false,
        {
          name: !!requestData.name,
          email: !!requestData.email,
          company: !!requestData.company,
          message: !!requestData.message,
        },
        limit.scope,
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackContactFormSubmission failed:', err));

      return NextResponse.json(
        createErrorResponse(validationResult.errors),
        { status: 400, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const validatedData = validationResult.data;

    // Send the email
    const emailResult = await sendContactEmail(validatedData);

    if (!emailResult.ok) {
      console.error('Contact email delivery failed:', emailResult.error);

      // Fire analytics event for email delivery failure
      fireContactAnalytics(
        sessionId,
        queryId,
        false,
        { name: true, email: true, company: true, message: true },
        limit.scope,
        analyticsConfig
      ).catch((err) => console.warn('[analytics] trackContactFormSubmission failed:', err));

      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // Fire analytics event for success
    fireContactAnalytics(
      sessionId,
      queryId,
      true,
      { name: true, email: true, company: true, message: true },
      limit.scope,
      analyticsConfig
    ).catch((err) => console.warn('[analytics] trackContactFormSubmission failed:', err));

    // Return successful response
    return NextResponse.json(
      createSuccessResponse('Your message has been sent. I will get back to you soon.'),
      { headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Contact form API error:', error);

    // Fire analytics event for unexpected error
    fireContactAnalytics(
      sessionId,
      queryId,
      false,
      { name: false, email: false, company: false, message: false },
      limit.scope,
      analyticsConfig
    ).catch((err) => console.warn('[analytics] trackContactFormSubmission failed:', err));

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500, headers: { ...rateLimitHeaders, 'Cache-Control': 'no-store' } }
    );
  }
}

/**
 * Fires the contact_form_submission analytics event (fire-and-forget).
 *
 * @param sessionId The session ID.
 * @param queryId The query ID.
 * @param success Whether the submission was successful.
 * @param fieldsPresent Which fields were present in the request.
 * @param rateLimitScope The rate limit scope if blocked.
 * @param config The analytics configuration.
 */
async function fireContactAnalytics(
  sessionId: string,
  queryId: string,
  success: boolean,
  fieldsPresent: { name: boolean; email: boolean; company: boolean; message: boolean },
  rateLimitScope: 'window' | 'daily' | null,
  config: Awaited<ReturnType<typeof getAnalyticsConfig>>
): Promise<void> {
  const properties: ContactFormSubmissionProperties = {
    queryId,
    success,
    fieldsPresent,
    rateLimitScope,
  };
  await trackContactFormSubmission(sessionId, queryId, properties, config);
}