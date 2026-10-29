import { NextRequest, NextResponse } from 'next/server';
import {
  trackFeedbackGiven,
  getAnalyticsConfig,
  generateClientKey,
  getSessionId,
} from '@/src/lib/analytics';

/**
 * POST /api/feedback
 *
 * Receives feedback from the chat UI and sends it to analytics.
 * Also returns a success response for the UI.
 */
export async function POST(request: NextRequest) {
  const config = getAnalyticsConfig();

  // The feedback belongs to the conversation it was given on, so it carries
  // the session of the visitor. A session of its own would put the feedback
  // apart from the questions and the answers it is about.
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  const analyticsClientKey = generateClientKey(forwardedFor, realIp, userAgent);
  const sessionId = getSessionId(analyticsClientKey);

  try {
    const body = await request.json();
    const { messageId, queryId, rating, comment, isRedirect } = body;

    // Validate required fields
    if (!messageId || !queryId || !rating || !['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    // Track feedback in analytics (fire-and-forget)
    trackFeedbackGiven(
      sessionId,
      queryId,
      rating,
      comment,
      isRedirect ?? false,
      config
    ).catch((error) => {
      console.error('[feedback] Failed to track feedback:', error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[feedback] Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}