import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a reference element
 * @param ref Ref to the element to detect outside element to detect clicks
 * @param onClickOutside Callback when click outside occurs
 */
export const useClickOutside = (ref: RefObject<HTMLElement>, onClickOutside: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClickOutside]);
};