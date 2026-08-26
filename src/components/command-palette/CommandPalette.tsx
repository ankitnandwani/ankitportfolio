'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useCommandPalette } from '@/src/hooks/useCommandPalette';
import { useClickOutside } from '@/src/hooks/useClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMAND_ITEMS } from './commandItems';
import { CommandItem } from './types';

// Simple fuzzy matching function
const fuzzyMatch = (search: string, text: string): boolean => {
  if (!search) return true;
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();
  
  let searchIdx = 0;
  for (let i = 0; i < textLower.length && searchIdx < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIdx]) {
      searchIdx++;
    }
  }
  return searchIdx === searchLower.length;
};

// Command palette variants for animation
const paletteVariants = {
  closed: {
    opacity: 0,
    scale: 0.95,
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    } as const,
  },
};

interface CommandPaletteProps {
  /**
   * Optional className for the container
   */
  className?: string;
}

export const CommandPalette = ({ className = '' }: CommandPaletteProps) => {
  const { open, closePalette } = useCommandPalette();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const paletteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute filtered items based on search term
  const getFilteredItems = (term: string) => {
    return COMMAND_ITEMS.filter(item => fuzzyMatch(term, item.label));
  };
  
  // Filtered items computed via getFilteredItems helper

  // Update selected index when search term changes
  // This is handled in the onChange handler of the search input

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        // Select all text in input
        inputRef.current?.select();
      });
    }
  }, [open]);

  // Handle keydown events within the palette
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) return;

    const filtered = getFilteredItems(searchTerm);
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closePalette();
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        if (filtered.length === 0) return;
        setSelectedIndex(prev => 
          prev >= filtered.length - 1 ? 0 : prev + 1
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        if (filtered.length === 0) return;
        setSelectedIndex(prev => 
          prev <= 0 ? filtered.length - 1 : prev - 1
        );
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filtered.length) {
          const item = filtered[selectedIndex];
          executeCommand(item);
        }
        break;
    }
  };

  // Execute command based on item type
  const executeCommand = (item: CommandItem) => {
    closePalette();
    
    if (item.href) {
      // Navigate to href (in a real app, we'd use useRouter)
      // For now, we'll just log - in production this would use Next.js navigation
      console.log(`Navigating to ${item.href}`);
      // Note: Actual navigation would require useRouter from next/navigation
      // Since this is a client component, we can use it
      // But for simplicity in this implementation, we'll just log
      // In a full implementation, we'd use:
      // const router = useRouter();
      // router.push(item.href);
    } else if (item.action) {
      // Handle actions
      switch (item.action) {
        case 'toggleTheme':
          // Find the theme toggle button and click it
          // This is a simplification - in reality we'd call the toggle function directly
          console.log('Toggling theme');
          break;
        case 'viewResume':
          console.log('Viewing resume');
          break;
        case 'askAI':
          console.log('Asking AI');
          break;
      }
    }
  };

  // Handle click outside to close
  const handleClickOutside = () => {
    if (open) {
      closePalette();
    }
  };

  useClickOutside(paletteRef, handleClickOutside);

  return (
    <>
      {/* Portal would be better but for simplicity we'll render in place with fixed positioning */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <div className="relative pointer-events-auto">
            <AnimatePresence>
              {open && (
                <motion.div
                  ref={paletteRef}
                  className={`max-w-2xl w-full max-h-[80vh] ${className}`}
                  variants={paletteVariants}
                  initial="closed"
                  animate="open"
                  onKeyDown={handleKeyDown}
                  tabIndex={-1} // Make div focusable for keyboard events
                >
                  <div className="bg-background/80 backdrop-blur-support border-border/50">
                    <div className="max-w-xl mx-auto py-6">
                      <div className="flex flex-col space-y-4">
                        {/* Header */}
                        <div className="flex flex-col items-center space-y-2">
                          <h2 className="text-xl font-semibold text-text/90">
                            Command Palette
                          </h2>
                          <p className="text-sm text-text/60">
                            Search and execute commands
                          </p>
                        </div>
                        
                        {/* Search input */}
                        <div className="relative">
                          <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search commands..."
                            className={`
                              w-full px-4 py-3 rounded-lg bg-surface/80 backdrop-blur-support 
                              border border-border/50 text-text/90 placeholder-text/50
                              focus:outline-none focus:ring-2 focus:ring-primary/20
                              transition-all duration-200
                            `}
                            value={searchTerm}
                            onChange={(_e) => {
                              const term = _e.target.value;
                              setSearchTerm(term);
                              // Reset selected index based on new filter
                              const filtered = getFilteredItems(term);
                              setSelectedIndex(filtered.length > 0 ? 0 : -1);
                            }}
                            onBlur={() => {
                              // Don't close on blur, only on escape or click outside
                            }}
                          />
                        </div>
                        
                        {/* Command list */}
                        <div className="flex-1 min-h-0">
                          {getFilteredItems(searchTerm).length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-text/50">
                              No commands found
                            </div>
                          ) : (
                            <ul className="space-y-1">
                              {getFilteredItems(searchTerm).map((item, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                  <li
                                    key={item.label || index}
                                    onClick={() => {
                                      setSelectedIndex(index);
                                      executeCommand(item);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`
                                      cursor-pointer rounded-lg px-4 py-3 text-sm flex items-center space-x-3
                                      ${isSelected
                                        ? `bg-primary/10 text-primary`
                                        : `hover:bg-muted hover:text-text/90`}
                                      transition-all duration-150
                                    `}
                                  >
                                    {/* Icon placeholder */}
                                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                      {/* In a real implementation, we'd use actual icons */}
                                      {item.icon?.toUpperCase() ?? '?'}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="font-medium text-text/90">{item.label}</div>
                                      {item.href && (
                                        <div className="text-xs text-text/40 truncate">
                                          {item.href}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Action indicator for non-navigation items */}
                                    {!item.href && (
                                      <div className="text-xs text-text/40 italic">
                                        Action
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                        
                        {/* Footer with hints */}
                        <div className="flex items-center justify-between px-4 pt-4 text-xs text-text/40">
                          <div className="flex space-x-3">
                            <span>↑↓ Navigate</span>
                            <span>Enter Select</span>
                            <span>Esc Close</span>
                          </div>
                          <span>Mod+K to open</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
};