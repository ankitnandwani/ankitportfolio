'use client';

import { Chat } from './Chat';

/**
 * Client-side wrapper for the Chat component.
 *
 * This wrapper exists because the Chat component uses client-side hooks
 * (useState, useEffect) and Framer Motion, which require the 'use client'
 * directive. The root layout is a server component, so we need this
 * client component wrapper to include the chat in the layout.
 *
 * The chat is imported from its own file and not from the barrel of the
 * folder: the barrel exports the panel of the chat, and the panel is loaded
 * on demand. A file that is in the first load of every page must not reach
 * it.
 */
export function ChatWrapper() {
  return <Chat />;
}