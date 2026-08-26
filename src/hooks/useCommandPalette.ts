import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling command palette keyboard shortcuts and state
 * @param onOpenChange Callback when open state changes
 * @returns Object with open state, toggle function, and keyboard handlers
 */
export const useCommandPalette = (onOpenChange?: (open: boolean) => void) => {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => {
    setOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const closePalette = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const togglePalette = useCallback(() => {
    setOpen(prev => {
      const newState = !prev;
      onOpenChange?.(newState);
      return newState;
    });
  }, [onOpenChange]);

  // Handle keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Mod+K (Cmd+K on Mac, Ctrl+K on Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && !event.shiftKey) {
        event.preventDefault();
        togglePalette();
      }
      
      // Escape key to close when palette is open
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        closePalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, togglePalette, closePalette]);

  return {
    open,
    openPalette,
    closePalette,
    togglePalette,
    isOpen: open, // alias for clarity
  };
};

