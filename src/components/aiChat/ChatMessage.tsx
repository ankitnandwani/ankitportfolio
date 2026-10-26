'use client';

import React from 'react';
import type { ChatMessage } from './hooks/useChatState';
import { FeedbackButton } from './FeedbackButton';

interface ChatMessageProps {
  message: ChatMessage;
  theme: 'light' | 'dark';
}

/**
 * Individual chat message bubble component.
 *
 * Renders user messages (right-aligned) and assistant messages (left-aligned)
 * with appropriate styling based on the theme. Supports basic markdown-like
 * formatting (bold, italic, code).
 */
export function ChatMessageComponent({ message, theme }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
    backgroundColor: isUser
      ? theme === 'dark'
        ? '#0D47A1'
        : '#0D47A1'
      : theme === 'dark'
      ? '#2D2D2D'
      : '#F5F5F5',
    color: isUser
      ? '#FFFFFF'
      : theme === 'dark'
      ? '#E0E0E0'
      : '#212121',
    boxShadow: theme === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.3)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    wordWrap: 'break-word',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
  };

  const timeStyle: React.CSSProperties = {
    fontSize: '0.625rem',
    color: isUser
      ? 'rgba(255,255,255,0.7)'
      : theme === 'dark'
      ? 'rgba(224,224,224,0.6)'
      : 'rgba(33,33,33,0.5)',
    marginTop: 4,
    textAlign: isUser ? 'right' : 'left',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: isUser ? 'flex-end' : 'flex-start',
    width: '100%',
  };

  /**
   * Simple markdown-like formatting for bold, italic, and inline code.
   */
  const formatContent = (content: string): React.ReactNode => {
    // Split by code blocks first
    const parts = content.split(/(`[^`]+`)/);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            style={{
              backgroundColor: theme === 'dark' ? '#3D3D3D' : '#E8E8E8',
              padding: '2px 6px',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: '0.875em',
              color: theme === 'dark' ? '#FFAB40' : '#FF6F00',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Handle bold and italic
      const boldParts = part.split(/(\*\*[^*]+\*\*)/);
      return boldParts.map((bp, bi) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={bi}>{bp.slice(2, -2)}</strong>;
        }
        const italicParts = bp.split(/(\*[^*]+\*)/);
        return italicParts.map((ip, ii) => {
          if (ip.startsWith('*') && ip.endsWith('*')) {
            return <em key={ii}>{ip.slice(1, -1)}</em>;
          }
          return ip;
        });
      });
    });
  };

  return (
    <div style={containerStyle} role="listitem" aria-label={`${isUser ? 'Your' : 'Assistant'} message`}>
      <div style={bubbleStyle}>
        <div style={{ lineHeight: 1.5 }}>{formatContent(message.content)}</div>
        <div style={timeStyle}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {!isUser && !message.isStreaming && message.queryId && (
        <FeedbackButton
          messageId={message.id}
          queryId={message.queryId}
          isRedirect={message.isRedirect}
          theme={theme}
        />
      )}
    </div>
  );
}