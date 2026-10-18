# M13.08 — Create AI Chat UI Components

## Objective

Create the user interface components for the AI chat assistant, including chat launcher, message bubbles, streaming response display, suggested prompts, and interaction states, following the design system and ensuring accessibility and responsiveness.

## Context

The AI chat assistant needs a polished, intuitive interface that fits within the overall NeoPOP-inspired design system of the portfolio. Following PRD §31 (Product name: Ask Ankit), PRD §30 (AI Job Description Analysis), and PRD §16 (AI Chat UX), we need to implement UI components that provide a seamless experience on both desktop and mobile. The chat should be accessible via a floating button or integrated into the "Ask Ankit's AI" section of the homepage, with message bubbles showing user and AI messages, streaming responses for real-time feel, and suggested prompts to guide users.

## Requirements
- Implement a chat launcher button (floating or inline) that opens the chat interface.
- Create a chat interface that can be displayed as a desktop floating panel or mobile full-screen modal.
- Design message bubbles for user and AI messages with appropriate styling.
- Implement streaming response display that shows text incrementally as it's generated.
- Add suggested prompts / quick questions to help users start conversations.
- Include typing indicator for AI responses.
- Provide error states for API failures or rate limiting.
- Add conversation reset / clear chat functionality.
- Ensure accessibility: ARIA labels, keyboard navigation, focus management, reduced motion support.
- Ensure responsiveness: works on mobile and desktop screen sizes.
- Follow the NeoPOP-inspired design system with appropriate elevation, shadows, and motion.
- Allow the chat to be minimized or closed.

## Scope
### In scope
- Chat launcher button component (floating action button or inline button)
- Chat panel/container component (desktop floating, mobile modal)
- Message bubble components (user and AI variants)
- Streaming message component that updates incrementally
- Suggested prompts carousel or list
- Typing indicator component
- Error and loading states
- Conversation controls (new chat, reset, close)
- Accessibility features (ARIA, keyboard traps for modal, focus management)
- Responsiveness (breakpoints for mobile/desktop)
- Animation and motion using Framer Motion
- Integration with NeoPOP design tokens (colors, spacing, elevation)

### Out of scope
- Job Description Analyzer UI (separate milestone M17)
- Persistent chat history across sessions (optional for MVP)
- Advanced features like file uploads, voice input, etc.
- Multi-turn conversation memory beyond session scope (handled in state)
- Integration with analytics or feedback systems (separate tasks)

## Dependencies
- Design system and NeoPOP components available
- Framer Motion for animations
- LLM provider and retrieval system (for actual functionality, but UI can be developed with mocks)
- Accessibility guidelines (WCAG 2.2 AA)

## Files / Areas Expected To Change
- `src/components/aiChat/` directory (to be created) - All chat UI components
- `src/components/aiChat/ChatLauncher.tsx` - Button to open chat
- `src/components/aiChat/ChatPanel.tsx` - Main container (floating/modal)
- `src/components/aiChat/ChatMessage.tsx` - Individual message bubble
- `src/components/aiChat/StreamingMessage.tsx` - For AI streaming responses
- `src/components/aiChat/SuggestedPrompts.tsx` - List of starter questions
- `src/components/aiChat/TypingIndicator.tsx` - Shows when AI is responding
- `src/components/aiChat/ChatError.tsx` - Error state display
- `src/components/aiChat/ChatControls.tsx` - Reset, new chat, close buttons
- `src/components/aiChat/hooks/useChatState.ts` (to be created) - React state management
- `src/components/aiChat/hooks/useChatAPI.ts` (to be created) - Data layer for sending messages
- Updates to homepage or layout to include chat launcher
- Possible updates to `src/components/ui/` for shared components if needed

## Implementation Guidance
1. Chat Launcher:
   - Create a floating button (bottom-right) with icon (e.g., robot or chat) and tooltip "Ask Ankit's AI".
   - On mobile, could be integrated into the homepage section as a regular button.
   - Use NeoPOP Button component with appropriate elevation.
   - Add hover and tap animations using Framer Motion.
2. Chat Panel:
   - Desktop: Floating panel that appears near launcher, can be dragged or resized? For simplicity, fixed position panel.
   - Mobile: Full-screen modal that slides up from bottom.
   - Header with title "Ask Ankit's AI" and close button.
   - Message list area that scrolls.
   - Input area at bottom with text field and send button.
   - Use motion for entrance/exit animations.
   - Manage focus trap when modal is open.
3. Message Bubbles:
   - User messages: right-aligned, different background color.
   - AI messages: left-aligned, possibly with NeoPOP elevation.
   - Both should have proper padding, border radius, and max width.
   - Support for markdown-like formatting (basic: bold, italic, code) or plain text.
   - Ensure text wraps correctly.
4. Streaming Message:
   - Component that accepts a promise or callback for incremental text updates.
   - Show cursor blinking effect to indicate ongoing generation.
   - Update text content as chunks arrive.
   - When complete, remove cursor and show final message.
5. Suggested Prompts:
   - Display 3-4 example questions as chips or buttons.
   - On click, populate the input field with that question.
   - Examples from PRD §29: "What does Ankit specialize in?", "Tell me about his automation experience."
6. Typing Indicator:
   - Show animated ellipsis or "Typing..." label when AI is generating response.
   - Use Framer Motion for smooth animation.
7. Error and Loading States:
   - Show appropriate messages for API errors, rate limiting, or network issues.
   - Retry mechanism for transient errors.
8. State Management:
   - Use React state (useState, useReducer) or Context for chat messages, loading states, etc.
   - Consider a custom hook useChatState to encapsulate logic.
9. Data Layer:
   - Custom hook useChatAPI that handles sending messages to backend API route.
   - Backend API route will handle retrieval, generation, guardrails, etc.
   - For UI development, can mock this layer initially.
10. Accessibility:
    - Ensure all interactive elements are keyboard accessible.
    - Add ARIA labels: chat region as role="application" or aria-label.
    - Message bubbles should be marked up appropriately.
    - Focus management when opening/closing chat.
    - Reduced motion support: respect prefers-reduced-motion media query.
11. Styling:
    - Use NeoPOP design tokens for colors, spacing, elevation.
    - Apply appropriate shadows and depth.
    - Follow the premium, bold, minimal visual language from PRD §61.
    - Ensure dark mode support.

## Acceptance Criteria
- Chat launcher button is visible and accessible.
- Clicking launcher opens chat interface appropriately for device type.
- Chat interface includes message display, input area, and controls.
- User can send a message and see it appear in the chat.
- AI responses (mocked or real) appear in left-aligned bubbles.
- Streaming response shows incremental text update.
- Suggested prompts work to populate input field.
- Chat can be closed or minimized.
- Interface is usable via keyboard and screen reader.
- Layout adapts to mobile and desktop screens.
- Animations are smooth and respect reduced motion preferences.

## Testing Requirements
- Manual testing of chat opening/closing on desktop and mobile browsers.
- Verify message sending and display works.
- Test streaming simulation (can use mock delay).
- Check suggested populator functionality.
- Test keyboard navigation: tab through elements, enter to send.
- Verify ARIA labels and roles are present.
- Test with screen reader (if available).
- Ensure no focus trapping issues.
- Validate responsive breakpoints.
- Check that animations respect prefers-reduced-motion.

## Security / Privacy Considerations
- UI should not expose any sensitive information in props or state that could be leaked.
- Error messages should not reveal internal details (API keys, etc.).
- Input sanitization to prevent XSS (though React protects against this).
- Ensure that chat does not store PII inadvertently (guardrails will handle at API level).
- Consider adding rate limiting UI feedback (e.g., "Too many requests, please wait").

## Performance / Accessibility Considerations
- Lazy load heavy components if needed (though chat is small).
- Virtual scrolling for long message lists (optional for MVP).
- Efficient re-rendering: use React.memo where appropriate.
- Animation performance: use Framer Motion's optimizations.
- Accessibility should not be compromised for visual effects.

## Definition of Done
- Chat launcher component is implemented and placed appropriately.
- Chat panel can be opened as desktop floating panel and mobile modal.
- Message bubbles distinguish user and AI messages.
- Streaming message component shows incremental updates.
- Suggested prompts populate input on click.
- Chat controls (close, new chat) work as expected.
- Interface is accessible via keyboard and screen reader.
- Layout responds to mobile and desktop breakpoints.
- Animations are implemented with Framer Motion and respect reduced motion.
- UI follows NeoPOP-inspired design system with proper elevation and styling.

## Related Requirements
- PRD §16: AI Chat UX
- PRD §30: AI Job Description Analysis (UI aspects)
- PRD §31: Product name – Ask Ankit
- PRD §61: Visual Language
- PRD §62: Typography
- PRD §71: Accessibility target – WCAG 2.2 AA
- PRD §74: Performance targets
- PRD §82: Hosting and UI implementation details