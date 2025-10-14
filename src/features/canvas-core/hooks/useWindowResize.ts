/**
 * useWindowResize Hook
 *
 * Custom hook that tracks window resize events and returns current dimensions.
 * Uses debouncing to optimize performance during rapid resize events.
 */

import { useEffect, useState } from 'react';

/**
 * Dimensions interface
 * @interface Dimensions
 * @property {number} width - Window width in pixels
 * @property {number} height - Window height in pixels
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * useWindowResize hook
 * Tracks window dimensions with debounced updates
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns {Dimensions} Current window dimensions
 */
export function useWindowResize(debounceMs: number = 100): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let timeoutId: number;

    function handleResize() {
      // Debounce resize for performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return dimensions;
}
