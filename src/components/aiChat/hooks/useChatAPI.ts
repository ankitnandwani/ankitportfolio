'use client';

import { useCallback, useRef } from 'react';
import { ChatMessage } from './useChatState';

/**
 * The shape of a request to the chat API.
 */
interface ChatAPIRequest {
  message: string;
  history: ChatMessage[];
  signal?: AbortSignal;
}

/**
 * Metadata from the streaming response.
 */
interface StreamMetadata {
  queryId?: string;
  isRedirect?: boolean;
  inputGuardrails?: unknown;
  retrieval?: unknown;
  outputGuardrails?: unknown;
  tokenUsage?: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
  finishReason?: string;
  model?: string;
}

/**
 * The shape of a response from the chat API.
 */
interface ChatAPIResponse {
  text: string;
  tokenUsage?: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
  finishReason?: string;
  model?: string;
}



/**
 * Custom hook for interacting with the chat backend API.
 *
 * Handles sending messages and receiving streaming responses.
 * In production, this connects to the actual API route.
 * For development, it can be mocked.
 */
export function useChatAPI() {
  const isStreamingRef = useRef(false);

  /**
   * Sends a message to the chat API and returns an async iterable of response chunks
   * along with metadata from the stream.
   *
   * @param message The user's message.
   * @param history The conversation history (excluding the current message).
   * @param signal Optional abort signal for cancellation.
   * @returns An object with textChunks (async iterable) and metadata (promise).
   */
  const sendMessage = useCallback(
    async function* (
      message: string,
      history: ChatMessage[],
      signal?: AbortSignal
    ): AsyncIterable<string> {
      if (isStreamingRef.current) {
        throw new Error('A request is already in progress');
      }

      isStreamingRef.current = true;

      let metadata: StreamMetadata = {};
      let metadataResolved = false;
      const metadataPromise = new Promise<StreamMetadata>((resolve) => {
        // Store resolver to be called when metadata is available
        (metadataPromise as { _resolve?: (value: StreamMetadata) => void })._resolve = resolve;
      });

      try {
        const controller = new AbortController();
        const abortSignal = signal
          ? AbortSignal.any([signal, controller.signal])
          : controller.signal;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, history } satisfies ChatAPIRequest),
          signal: abortSignal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          let firstChunk = true;
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Parse SSE format or plain text chunks
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  if (!metadataResolved) {
                    (metadataPromise as { _resolve?: (value: StreamMetadata) => void })._resolve?.(metadata);
                    metadataResolved = true;
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    yield parsed.text;
                  }
                  // Capture metadata from first and last chunks
                  if (firstChunk) {
                    firstChunk = false;
                    metadata = {
                      ...metadata,
                      queryId: parsed.queryId,
                      isRedirect: parsed.isRedirect,
                      inputGuardrails: parsed.inputGuardrails,
                      retrieval: parsed.retrieval,
                    };
                  }
                  if (parsed.done) {
                    metadata = {
                      ...metadata,
                      outputGuardrails: parsed.outputGuardrails,
                      tokenUsage: parsed.tokenUsage,
                      finishReason: parsed.finishReason,
                      model: parsed.model,
                      isRedirect: parsed.isRedirect ?? metadata.isRedirect,
                    };
                  }
                } catch {
                  // If not JSON, treat as plain text
                  yield data;
                }
              } else if (line.trim()) {
                // Plain text chunk
                yield line;
              }
            }
          }
          if (!metadataResolved) {
            (metadataPromise as { _resolve?: (value: StreamMetadata) => void })._resolve?.(metadata);
            metadataResolved = true;
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't throw
          return;
        }
        throw error;
      } finally {
        isStreamingRef.current = false;
      }
    },
    []
  );

  /**
   * Sends a message and gets the complete response (non-streaming).
   * Useful for simpler implementations or fallback.
   */
  const sendMessageComplete = useCallback(
    async (
      message: string,
      history: ChatMessage[],
      signal?: AbortSignal
    ): Promise<ChatAPIResponse> => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history, stream: false } satisfies ChatAPIRequest & { stream: boolean }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      return response.json();
    },
    []
  );

  /**
   * Checks if a request is currently in progress.
   */
  const isStreaming = useCallback(() => isStreamingRef.current, []);

  return {
    sendMessage,
    sendMessageComplete,
    isStreaming,
  };
}

export type UseChatAPIReturn = ReturnType<typeof useChatAPI>;