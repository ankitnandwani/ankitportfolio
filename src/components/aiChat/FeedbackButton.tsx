'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackButtonProps {
  /** Unique ID of the message this feedback is for */
  messageId: string;
  /** Query ID from the orchestration layer */
  queryId: string;
  /** Whether the response was a redirect */
  isRedirect?: boolean;
  /** Theme */
  theme: 'light' | 'dark';
  /** Callback when feedback is submitted */
  onSubmit?: (rating: 'up' | 'down', comment?: string) => void;
}

/**
 * Feedback button component with thumbs up/down and optional comment.
 *
 * Appears after AI messages. On selection, shows optional comment field
 * for negative ratings. Submits feedback to the analytics endpoint.
 */
export function FeedbackButton({
  messageId,
  queryId,
  isRedirect = false,
  theme,
  onSubmit,
}: FeedbackButtonProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';
  const primaryColor = isDark ? '#64B5F6' : '#1565C0';
  const bgColor = isDark ? '#2D2D2D' : '#F5F5F5';
  const borderColor = isDark ? '#444' : '#E0E0E0';
  const textColor = isDark ? '#E0E0E0' : '#212121';

  const submitFeedback = useCallback(
    async (selectedRating: 'up' | 'down', commentText?: string) => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            queryId,
            rating: selectedRating,
            comment: commentText,
            isRedirect,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }

        onSubmit?.(selectedRating, commentText);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        // Reset on error so user can try again
        setSubmitted(false);
        setRating(null);
        setShowComment(false);
        setComment('');
      } finally {
        setIsSubmitting(false);
      }
    },
    [messageId, queryId, isRedirect, onSubmit]
  );

  const handleRating = useCallback(
    async (selectedRating: 'up' | 'down') => {
      if (submitted || isSubmitting) return;

      setRating(selectedRating);
      setSubmitted(true);

      // For negative ratings, show comment field
      if (selectedRating === 'down') {
        setShowComment(true);
      } else {
        // For positive, submit immediately
        await submitFeedback(selectedRating);
      }
    },
    [submitted, isSubmitting, submitFeedback]
  );

  const handleCommentSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitFeedback(rating!, comment);
    },
    [rating, comment, submitFeedback]
  );

  if (submitted && rating === 'up') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: `${primaryColor}15`,
          borderRadius: 20,
          border: `1px solid ${primaryColor}40`,
        }}
      >
        <span
          role="img"
          aria-label="Thumbs up"
          style={{
            fontSize: '1.25rem',
            color: primaryColor,
          }}
        >
          👍
        </span>
        <span style={{ fontSize: '0.75rem', color: primaryColor, fontWeight: 500 }}>
          Thanks for your feedback!
        </span>
      </motion.div>
    );
  }

  if (submitted && rating === 'down' && !showComment) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: '#EF535015',
          borderRadius: 20,
          border: '1px solid #EF535040',
        }}
      >
        <span
          role="img"
          aria-label="Thumbs down"
          style={{ fontSize: '1.25rem', color: '#EF5350' }}
        >
          👎
        </span>
        <span style={{ fontSize: '0.75rem', color: '#EF5350', fontWeight: 500 }}>
          We&apos;ll try to do better
        </span>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <AnimatePresence mode="wait">
        {!submitted && (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', gap: 4 }}
          >
            <button
              type="button"
              onClick={() => handleRating('up')}
              disabled={isSubmitting}
              aria-label="Helpful"
              aria-pressed={rating === 'up'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 18,
                border: `1px solid ${borderColor}`,
                backgroundColor: rating === 'up' ? `${primaryColor}20` : bgColor,
                color: rating === 'up' ? primaryColor : textColor,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                fontSize: '1.1rem',
              }}
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => handleRating('down')}
              disabled={isSubmitting}
              aria-label="Not helpful"
              aria-pressed={rating === 'down'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 18,
                border: `1px solid ${borderColor}`,
                backgroundColor: rating === 'down' ? '#EF535020' : bgColor,
                color: rating === 'down' ? '#EF5350' : textColor,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                fontSize: '1.1rem',
              }}
            >
              👎
            </button>
          </motion.div>
        )}
        {submitted && rating === 'down' && showComment && (
          <motion.form
            key="comment"
            onSubmit={handleCommentSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', gap: 8, width: '100%' }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could be better? (optional)"
              aria-label="Feedback comment"
              rows={2}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                backgroundColor: bgColor,
                color: textColor,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: primaryColor,
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}