'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Represents a single message in the chat conversation.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

/**
 * The possible states of the chat interface.
 */
export type ChatState = 'closed' | 'open' | 'minimized';

/**
 * The possible states of a streaming response.
 */
export type StreamingState = 'idle' | 'streaming' | 'complete' | 'error';

/**
 * Custom hook for managing chat state.
 *
 * Encapsulates all chat-related state including messages, UI state,
 * streaming status, and error handling.
 */
export function useChatState() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [streamingState, setStreamingState] = useState<StreamingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'What does Ankit specialize in?',
    'Tell me about his automation experience.',
    'What backend technologies has he worked with?',
    'Has he worked with CI/CD?',
    'What kind of projects has he built?',
    'Would he be a good fit for a Staff SDET role?',
    'How does his experience translate to financial services?',
    'What are his strongest technical areas?',
  ]);

  // Refs for managing streaming
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  /**
   * Opens the chat interface.
   */
  const openChat = useCallback(() => {
    setChatState('open');
    setError(null);
  }, []);

  /**
   * Closes the chat interface.
   */
  const closeChat = useCallback(() => {
    setChatState('closed');
    // Abort any ongoing streaming when closing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingState('idle');
  }, []);

  /**
   * Minimizes the chat interface.
   */
  const minimizeChat = useCallback(() => {
    setChatState('minimized');
  }, []);

  /**
   * Toggles the chat open/closed state.
   */
  const toggleChat = useCallback(() => {
    if (chatState === 'open') {
      closeChat();
    } else {
      openChat();
    }
  }, [chatState, closeChat, openChat]);

  /**
   * Adds a user message to the conversation.
   */
  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    return message.id;
  }, []);

  /**
   * Starts a streaming assistant message.
   */
  const startStreamingMessage = useCallback(() => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, message]);
    streamingMessageIdRef.current = message.id;
    setStreamingState('streaming');
    setError(null);
    return message.id;
  }, []);

  /**
   * Updates the content of a streaming message.
   */
  const updateStreamingMessage = useCallback((content: string) => {
    if (!streamingMessageIdRef.current) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingMessageIdRef.current
          ? { ...msg, content }
          : msg
      )
    );
  }, []);

  /**
   * Completes the streaming message.
   */
  const completeStreamingMessage = useCallback(() => {
    if (!streamingMessageIdRef.current) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingMessageIdRef.current
          ? { ...msg, isStreaming: false }
          : msg
      )
    );
    streamingMessageIdRef.current = null;
    setStreamingState('complete');
  }, []);

  /**
   * Sets an error on the streaming message.
   */
  const setStreamingError = useCallback((errorMessage: string) => {
    if (!streamingMessageIdRef.current) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingMessageIdRef.current
          ? { ...msg, isStreaming: false, content: errorMessage }
          : msg
      )
    );
    streamingMessageIdRef.current = null;
    setStreamingState('error');
    setError(errorMessage);
  }, []);

  /**
   * Clears all messages and resets state.
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingState('idle');
    setError(null);
    streamingMessageIdRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Creates a new abort controller for a request.
   */
  const createAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  /**
   * Gets the current abort signal.
   */
  const getAbortSignal = useCallback(() => {
    return abortControllerRef.current?.signal;
  }, []);

  /**
   * Clears the error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    messages,
    chatState,
    streamingState,
    error,
    isLoading,
    suggestedPrompts,
    // Actions
    openChat,
    closeChat,
    minimizeChat,
    toggleChat,
    addUserMessage,
    startStreamingMessage,
    updateStreamingMessage,
    completeStreamingMessage,
    setStreamingError,
    clearChat,
    createAbortController,
    getAbortSignal,
    clearError,
    setSuggestedPrompts,
    setIsLoading,
  };
}

export type UseChatStateReturn = ReturnType<typeof useChatState>;