/**
 * AI Chat UI Components
 *
 * Export barrel for all chat UI components and hooks.
 */

export { Chat } from './Chat';
export { ChatWrapper } from './ChatWrapper';
export { ChatLauncher } from './ChatLauncher';
export { ChatPanel } from './ChatPanel';
export { ChatMessageComponent as ChatMessage } from './ChatMessage';
export { StreamingMessage } from './StreamingMessage';
export { SuggestedPrompts } from './SuggestedPrompts';
export { TypingIndicator } from './TypingIndicator';
export { ChatError } from './ChatError';
export { ChatControls } from './ChatControls';
export { ChatInput } from './ChatInput';

// Hooks
export { useChatState, type ChatMessage as ChatMessageType, type ChatState, type StreamingState, type UseChatStateReturn } from './hooks/useChatState';
export { useChatAPI, type UseChatAPIReturn } from './hooks/useChatAPI';