/**
 * AI Chat UI Components
 *
 * Export barrel for all chat UI components and hooks.
 */

export { Chat } from './Chat';
export { ChatWrapper } from './ChatWrapper';
export { ChatLauncher } from './ChatLauncher';
// The panel of the chat is loaded on demand, when the chat is opened. It is
// not exported here on purpose: a file that is in the first load of every
// page must not reach it through the barrel. The parts of the panel are
// exported for the same reason, and a file of the first load must not import
// this barrel: it would bring the panel with it.
export { ChatMessageComponent as ChatMessage } from './ChatMessage';
export { StreamingMessage } from './StreamingMessage';
export { SuggestedPrompts } from './SuggestedPrompts';
export { TypingIndicator } from './TypingIndicator';
export { ChatError } from './ChatError';
export { ChatControls } from './ChatControls';
export { ChatInput } from './ChatInput';
export { FeedbackButton } from './FeedbackButton';

// Hooks
export {
  useChatState,
  type ChatMessage as ChatMessageType,
  type ChatState,
  type StreamingState,
  type UseChatStateReturn,
} from './hooks/useChatState';
export { useChatAPI, type UseChatAPIReturn } from './hooks/useChatAPI';
