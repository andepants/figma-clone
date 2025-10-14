/**
 * useSpacebarPan Hook
 *
 * Custom hook that handles spacebar-based panning mode.
 * Enables temporary pan mode when spacebar is held down.
 */

import { useEffect, useState } from 'react';

/**
 * SpacebarPanState interface
 * @interface SpacebarPanState
 * @property {boolean} isSpacePressed - Whether spacebar is currently pressed
 * @property {boolean} isPanning - Whether canvas is actively being panned
 * @property {() => void} setIsPanning - Function to manually set panning state
 */
export interface SpacebarPanState {
  isSpacePressed: boolean;
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
}

/**
 * useSpacebarPan hook
 * Manages spacebar-based panning state
 * @returns {SpacebarPanState} Spacebar panning state and setter
 */
export function useSpacebarPan(): SpacebarPanState {
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  useEffect(() => {
    /**
     * Handle spacebar key down
     * Enables pan mode when spacebar is pressed (unless typing in input)
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyDown(e: KeyboardEvent) {
      // Check if spacebar is pressed and not already in pan mode
      // Prevent if user is typing in an input field
      if (
        e.code === 'Space' &&
        !isSpacePressed &&
        e.target instanceof HTMLElement &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    }

    /**
     * Handle spacebar key up
     * Disables pan mode when spacebar is released
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  return {
    isSpacePressed,
    isPanning,
    setIsPanning,
  };
}
