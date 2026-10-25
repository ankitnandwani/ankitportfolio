'use client';

import { Chat } from '@/src/components/aiChat';

/**
 * Client-side wrapper for the Chat component.
 *
 * This wrapper exists because the Chat component uses client-side hooks
 * (useState, useEffect) and Framer Motion, which require the 'use client'
 * directive. The root layout is a server component, so we need this
 * client component wrapper to include the chat in the layout.
 */
export function ChatWrapper() {
  return <Chat />;
}