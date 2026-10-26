'use client';

import React, { useCallback, useEffect } from 'react';
import { useChatState } from './hooks/useChatState';
import { useChatAPI } from './hooks/useChatAPI';
import { ChatPanel } from './ChatPanel';
import { ChatLauncher } from './ChatLauncher';

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
        for await (const chunk of sendMessage(message, messages, abortSignal)) {
          updateStreamingMessage(chunk);
        }

        // Complete streaming
        completeStreamingMessage();
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

  return (
    <>
      <ChatLauncher
        onClick={toggleChat}
        isOpen={isOpen}
        aria-label={isOpen ? 'Close Ask Ankit\'s AI' : 'Open Ask Ankit\'s AI'}
      />
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
    </>
  );
}