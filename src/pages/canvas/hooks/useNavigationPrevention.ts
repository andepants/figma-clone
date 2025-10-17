/**
 * Navigation Prevention Hook
 *
 * Prevents unwanted browser navigation from trackpad gestures and swipes.
 * This hook implements a multi-layered approach to block browser back/forward navigation
 * while preserving canvas panning functionality.
 *
 * Features:
 * - Blocks horizontal wheel events (trackpad two-finger swipe)
 * - Blocks horizontal touch gestures at screen edges (macOS swipe-back)
 * - Prevents history navigation via popstate interception
 * - Canvas panning remains fully functional (handled by Konva)
 */

import { useEffect } from 'react';

/**
 * Custom hook to prevent browser navigation from gestures
 *
 * Implements three prevention strategies:
 * 1. Horizontal wheel event blocking (trackpad swipes)
 * 2. Edge-based touch gesture blocking (mobile/trackpad swipes)
 * 3. History manipulation to prevent back button navigation
 *
 * @example
 * function CanvasPage() {
 *   useNavigationPrevention();
 *   return <CanvasStage />;
 * }
 */
export function useNavigationPrevention(): void {
  /**
   * Strategy 1: Prevent horizontal wheel events (trackpad scroll)
   * Aggressively prevents ALL horizontal wheel events
   * Canvas panning is handled by Konva's onWheel handler, not browser wheel events
   */
  useEffect(() => {
    const preventWheelNavigation = (e: WheelEvent) => {
      // Block any horizontal wheel movement to prevent browser navigation
      if (Math.abs(e.deltaX) > 0) {
        e.preventDefault();
      }
    };

    // Add event listener with passive: false to allow preventDefault
    document.addEventListener('wheel', preventWheelNavigation, { passive: false, capture: true });

    return () => {
      document.removeEventListener('wheel', preventWheelNavigation, { capture: true } as EventListenerOptions);
    };
  }, []);

  /**
   * Strategy 2: Prevent horizontal touch/swipe gestures that trigger browser navigation
   * Specifically targets edge-based swipes (common on macOS and mobile)
   */
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const preventTouchNavigation = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const preventTouchMoveNavigation = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        const deltaX = touchCurrentX - touchStartX;
        const deltaY = touchCurrentY - touchStartY;

        // If horizontal swipe is dominant and starts near screen edge, prevent it
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          const isEdgeSwipe = touchStartX < 50 || touchStartX > window.innerWidth - 50;
          if (isEdgeSwipe) {
            e.preventDefault();
          }
        }
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    document.addEventListener('touchstart', preventTouchNavigation, { passive: false });
    document.addEventListener('touchmove', preventTouchMoveNavigation, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventTouchNavigation);
      document.removeEventListener('touchmove', preventTouchMoveNavigation);
    };
  }, []);

  /**
   * Strategy 3: Prevent browser back navigation via history manipulation
   * Pushes a dummy history state and intercepts popstate events
   * This is a safety net for any navigation attempts that bypass gesture prevention
   */
  useEffect(() => {
    // Push a dummy state so back button doesn't leave the app
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Prevent navigation by immediately pushing state back
      window.history.pushState(null, '', window.location.href);
      e.preventDefault();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
