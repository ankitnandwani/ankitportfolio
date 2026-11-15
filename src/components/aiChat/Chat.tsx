'use client';

import React, { useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useChatState } from './hooks/useChatState';
import { useChatAPI } from './hooks/useChatAPI';
import { ChatLauncher } from './ChatLauncher';

/**
 * The panel of the chat is the heavy part of it: the messages, the input, the
 * controls, the suggestions and the animation of the library.
 *
 * It is loaded when the chat is opened for the first time, and the launcher
 * stays in the first load of every page, so that the button is there the
 * moment the page is. The panel is never rendered when the chat is closed
 * today either: it returns nothing, so no content of the site is lost by
 * loading it late.
 */
const ChatPanel = dynamic(() => import('./ChatPanel').then((module) => module.ChatPanel), {
  ssr: false,
});

/**
 * How long the site waits before it fetches the code of the panel while
 * nothing else is happening.
 *
 * The code is not needed before the visitor opens the chat, and the browser
 * has nothing better to do after the page is there. Two seconds is late
 * enough that the code never competes with the content the visitor is
 * waiting for, and early enough that the chat opens at once.
 */
const CHAT_PREFETCH_DELAY_MS = 2000;

/**
 * Fetches the code of the panel before the visitor asks for it.
 *
 * The button of the chat is in the first load and the code of the panel is
 * not. A visitor who puts the pointer on the button, who presses it or who
 * focuses it with the keyboard has shown that the chat is about to be
 * opened, and the code is fetched at that moment. The browser keeps it, so
 * the chat opens without a wait.
 */
function prefetchChatPanel(): void {
  void import('./ChatPanel');
}

/**
 * Main chat component that integrates all chat UI components.
 *
 * Manages the complete chat lifecycle including:
 * - Opening/closing the chat panel
 * - Sending messages and handling streaming responses
 * - Error handling and retry logic
 * - Conversation state management
 */
export function Chat() {
  const {
    messages,
    chatState,
    streamingState,
    error,
    isLoading,
    suggestedPrompts,
    closeChat,
    minimizeChat,
    toggleChat,
    addUserMessage,
    startStreamingMessage,
    updateStreamingMessage,
    completeStreamingMessage,
    setStreamingError,
    clearChat,
    getAbortSignal,
    clearError,
    setIsLoading,
  } = useChatState();

  const { sendMessage } = useChatAPI();

  const isOpen = chatState === 'open';

  const handleSendMessage = useCallback(
    async (message: string) => {
      // Add user message
      addUserMessage(message);
      setIsLoading(true);

      // Start streaming assistant message
      startStreamingMessage();

      try {
        const abortSignal = getAbortSignal();

        // Stream response from API
        const stream = sendMessage(message, messages, abortSignal);
        
        for await (const chunk of stream) {
          updateStreamingMessage(chunk);
        }

        // Wait for metadata - stream has a metadata property attached
        const metadata = await (stream as AsyncIterable<string> & { metadata: Promise<{ queryId?: string; isRedirect?: boolean }> }).metadata;

        // Complete streaming with metadata
        completeStreamingMessage(metadata.queryId, metadata.isRedirect);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Cancelled, clean up
          return;
        }
        console.error('Chat error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response. Please try again.';
        setStreamingError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      addUserMessage,
      startStreamingMessage,
      updateStreamingMessage,
      completeStreamingMessage,
      setStreamingError,
      sendMessage,
      getAbortSignal,
      setIsLoading,
    ]
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  const handleRetry = useCallback(() => {
    clearError();
    // Retry the last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  }, [messages, clearError, handleSendMessage]);

  const handleClose = useCallback(() => {
    closeChat();
    clearError();
  }, [closeChat, clearError]);

  const handleMinimize = useCallback(() => {
    minimizeChat();
  }, [minimizeChat]);

  const handleClearChat = useCallback(() => {
    clearChat();
  }, [clearChat]);

  // Handle keyboard shortcut to open chat (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleChat]);

  // The code of the panel is fetched when the browser has nothing better to
  // do, so that the chat opens at once when the visitor asks for it and the
  // code never competes with the content of the page.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      prefetchChatPanel();
    }, CHAT_PREFETCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <ChatLauncher
        onClick={toggleChat}
        isOpen={isOpen}
        aria-label={isOpen ? 'Close Ask Ankit\'s AI' : 'Open Ask Ankit\'s AI'}
        onPointerEnter={prefetchChatPanel}
        onPointerDown={prefetchChatPanel}
        onFocus={prefetchChatPanel}
      />
      {isOpen && (
        <ChatPanel
          isOpen={isOpen}
          onClose={handleClose}
          onMinimize={handleMinimize}
          messages={messages}
          streamingState={streamingState}
          error={error}
          isLoading={isLoading}
          suggestedPrompts={suggestedPrompts}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onPromptClick={handlePromptClick}
          onRetry={handleRetry}
          onDismissError={clearError}
        />
      )}
    </>
  );
}