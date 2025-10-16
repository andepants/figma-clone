/**
 * useResize Hook
 *
 * Manages object resizing with anchor point logic and Firebase sync.
 * Handles resize state, coordinate transforms, and real-time collaboration.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/stores';
import { useAuth } from '@/features/auth/hooks';
import {
  calculateResizedBounds,
  getAnchorPoint,
  isValidResize,
} from '@/lib/utils';
import {
  startResizing,
  throttledUpdateResizePosition,
  endResizing,
  updateCanvasObject,
  throttledUpdateCanvasObject,
} from '@/lib/firebase';
import type { ResizeHandle, ResizeAnchor } from '@/types';
import { getUserColor } from '@/features/collaboration/utils';

/**
 * Bounds interface for objects
 */
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Resize hook return type
 */
interface UseResizeReturn {
  /** Whether currently resizing */
  isResizing: boolean;
  /** Which handle is being dragged */
  activeHandle: ResizeHandle | null;
  /** Anchor point (opposite corner that stays fixed) */
  anchor: ResizeAnchor | null;
  /** Whether Shift key is pressed (lock aspect ratio) */
  isShiftPressed: boolean;
  /** Whether Alt key is pressed (resize from center) */
  isAltPressed: boolean;
  /** Start resize operation */
  handleResizeStart: (objectId: string, handle: ResizeHandle, bounds: Bounds) => Promise<void>;
  /** Update resize position */
  handleResizeMove: (objectId: string, currentPointerX: number, currentPointerY: number) => void;
  /** End resize operation */
  handleResizeEnd: (objectId: string) => Promise<void>;
}

/**
 * Hook for managing object resize operations
 *
 * Provides handlers for resize start, move, and end events.
 * Manages anchor point calculations and Firebase sync.
 *
 * @returns {UseResizeReturn} Resize state and handlers
 *
 * @example
 * ```tsx
 * const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize();
 *
 * <ResizeHandles
 *   object={rectangle}
 *   isSelected={true}
 *   onResizeStart={(handle) => handleResizeStart(rectangle.id, handle, bounds)}
 *   onResizeMove={(handle, x, y) => handleResizeMove(rectangle.id, x, y)}
 *   onResizeEnd={() => handleResizeEnd(rectangle.id)}
 * />
 * ```
 */
export function useResize(): UseResizeReturn {
  const { updateObject } = useCanvasStore();
  const { currentUser } = useAuth();

  // Resize state - use refs for synchronous updates in drag handlers
  // This prevents race conditions where drag events fire before React state updates
  const isResizingRef = useRef(false);
  const activeHandleRef = useRef<ResizeHandle | null>(null);
  const anchorRef = useRef<ResizeAnchor | null>(null);
  const startBoundsRef = useRef<Bounds | null>(null);

  // Also keep state versions for UI rendering (ResizeHandles visual feedback)
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [anchor, setAnchor] = useState<ResizeAnchor | null>(null);

  // Keyboard modifier states
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);

  // Track keyboard modifiers
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift') setIsShiftPressed(true);
      if (e.key === 'Alt') setIsAltPressed(true);
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Shift') setIsShiftPressed(false);
      if (e.key === 'Alt') setIsAltPressed(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /**
   * Handle resize start
   * Calculates anchor point and initializes resize state
   */
  const handleResizeStart = useCallback(
    async (objectId: string, handle: ResizeHandle, bounds: Bounds) => {
      if (!currentUser) {
        return;
      }

      // Calculate anchor point (opposite corner that stays fixed)
      const anchorPoint = getAnchorPoint(handle, bounds);

      // Store state synchronously in refs (for immediate use in drag handlers)
      isResizingRef.current = true;
      activeHandleRef.current = handle;
      anchorRef.current = anchorPoint;
      startBoundsRef.current = bounds;

      // Also update React state for UI rendering
      setIsResizing(true);
      setActiveHandle(handle);
      setAnchor(anchorPoint);

      // Get user info for Firebase
      const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
      const color = getUserColor(currentUser.uid);

      // Start resize in Firebase (sets up onDisconnect cleanup)
      try {
        await startResizing(
          'main',
          objectId,
          currentUser.uid,
          handle,
          bounds,
          username,
          color
        );
      } catch {
        // Reset state on error (both refs and React state)
        isResizingRef.current = false;
        activeHandleRef.current = null;
        anchorRef.current = null;
        startBoundsRef.current = null;
        setIsResizing(false);
        setActiveHandle(null);
        setAnchor(null);
      }
    },
    [currentUser]
  );

  /**
   * Handle resize move
   * Calculates new bounds and updates local store + Firebase
   * Supports Shift (lock aspect ratio) and Alt (resize from center)
   */
  const handleResizeMove = useCallback(
    (objectId: string, currentPointerX: number, currentPointerY: number) => {
      // Only update if we're actively resizing (use refs for synchronous check)
      if (!isResizingRef.current || !activeHandleRef.current || !anchorRef.current || !startBoundsRef.current) return;

      let currentAnchor = anchorRef.current;
      const pointer = { x: currentPointerX, y: currentPointerY };

      // Alt key: Resize from center (anchor becomes center point)
      if (isAltPressed && startBoundsRef.current) {
        const centerX = startBoundsRef.current.x + startBoundsRef.current.width / 2;
        const centerY = startBoundsRef.current.y + startBoundsRef.current.height / 2;
        currentAnchor = { x: centerX, y: centerY };
      }

      // Calculate new bounds based on current pointer position
      const newBounds = calculateResizedBounds(
        activeHandleRef.current,
        currentAnchor,
        pointer
      );

      // Get object to check if it's a circle
      const objects = useCanvasStore.getState().objects;
      const object = objects.find((obj) => obj.id === objectId);
      const isCircle = object?.type === 'circle';

      // CIRCLES: Always enforce uniform scaling (maintain 1:1 aspect ratio)
      // Circles must maintain width === height to stay circular
      if (isCircle) {
        // Use the larger dimension to maintain circle shape
        // This prevents the circle from becoming an oval
        const maxDimension = Math.max(newBounds.width, newBounds.height);
        newBounds.width = maxDimension;
        newBounds.height = maxDimension;

        // Recalculate position based on which SIDE OF ANCHOR the pointer is on
        // This correctly handles both normal resizing AND flipped resizing
        // (when user drags past the anchor point)
        const pointerIsLeft = currentPointerX < currentAnchor.x;
        const pointerIsAbove = currentPointerY < currentAnchor.y;

        // Position bounding box to extend from anchor toward pointer
        if (pointerIsLeft) {
          // Pointer is left of anchor → box extends left from anchor
          newBounds.x = currentAnchor.x - maxDimension;
        } else {
          // Pointer is right of anchor → box extends right from anchor
          newBounds.x = currentAnchor.x;
        }

        if (pointerIsAbove) {
          // Pointer is above anchor → box extends up from anchor
          newBounds.y = currentAnchor.y - maxDimension;
        } else {
          // Pointer is below anchor → box extends down from anchor
          newBounds.y = currentAnchor.y;
        }
      }

      // Shift key: Lock aspect ratio (for non-circles)
      if (isShiftPressed && startBoundsRef.current && !isCircle) {
        const aspectRatio = startBoundsRef.current.width / startBoundsRef.current.height;

        // Determine which dimension to constrain based on resize direction
        const widthChange = Math.abs(newBounds.width - startBoundsRef.current.width);
        const heightChange = Math.abs(newBounds.height - startBoundsRef.current.height);

        if (widthChange > heightChange) {
          // Width changed more, constrain height
          newBounds.height = newBounds.width / aspectRatio;
        } else {
          // Height changed more, constrain width
          newBounds.width = newBounds.height * aspectRatio;
        }

        // Recalculate position based on locked dimensions and currentAnchor
        if (!isAltPressed) {
          // Normal anchoring (opposite corner stays fixed)
          if (activeHandleRef.current === 'nw') {
            newBounds.x = currentAnchor.x - newBounds.width;
            newBounds.y = currentAnchor.y - newBounds.height;
          } else if (activeHandleRef.current === 'ne') {
            newBounds.x = currentAnchor.x;
            newBounds.y = currentAnchor.y - newBounds.height;
          } else if (activeHandleRef.current === 'sw') {
            newBounds.x = currentAnchor.x - newBounds.width;
            newBounds.y = currentAnchor.y;
          } else if (activeHandleRef.current === 'se') {
            newBounds.x = currentAnchor.x;
            newBounds.y = currentAnchor.y;
          }
        }
      }

      // Alt key: Adjust position to resize from center
      if (isAltPressed && startBoundsRef.current && !isCircle) {
        const centerX = startBoundsRef.current.x + startBoundsRef.current.width / 2;
        const centerY = startBoundsRef.current.y + startBoundsRef.current.height / 2;
        newBounds.x = centerX - newBounds.width / 2;
        newBounds.y = centerY - newBounds.height / 2;
      }

      // Validate bounds (minimum size, positive dimensions)
      if (!isValidResize(newBounds)) return;

      // Convert bounds to shape-specific updates
      // Different shapes use different coordinate systems:
      // - Rectangle: (x, y) = top-left corner, has width/height
      // - Circle: (x, y) = CENTER point, has radius (not width/height)
      // - Text: (x, y) = top-left corner, has width (height from fontSize)
      // Note: object was already retrieved above for circle check
      if (!object) return;

      let shapeUpdates: Partial<typeof object>;

      if (object.type === 'rectangle') {
        // Rectangle: Update x, y, width, height directly
        shapeUpdates = newBounds;
      } else if (object.type === 'circle') {
        // Circle: Convert bounding box back to center point + radius
        // newBounds is the bounding box (top-left corner + dimensions)
        // Circle needs center point (x, y) and radius
        const radius = newBounds.width / 2; // Use width (should equal height for circles)
        shapeUpdates = {
          x: newBounds.x + radius, // Center x = left edge + radius
          y: newBounds.y + radius, // Center y = top edge + radius
          radius,
        };
      } else if (object.type === 'text') {
        // Text: Update x, y, width, and height
        // Text boxes are fixed-dimension containers like rectangles
        shapeUpdates = {
          x: newBounds.x,
          y: newBounds.y,
          width: newBounds.width,
          height: newBounds.height,
        };
      } else {
        // Default fallback
        shapeUpdates = newBounds;
      }

      // Update local store immediately (optimistic update)
      updateObject(objectId, shapeUpdates);

      // Sync to Firebase (throttled to 50ms)
      // Update BOTH resize state AND object position to keep them in perfect sync
      throttledUpdateResizePosition('main', objectId, newBounds);
      throttledUpdateCanvasObject('main', objectId, shapeUpdates); // ← CRITICAL: Keep object current!
    },
    [isShiftPressed, isAltPressed, updateObject]
  );

  /**
   * Handle resize end
   * Finalizes resize and clears state
   *
   * CRITICAL: Updates object IMMEDIATELY (no throttle) BEFORE clearing resize state
   * This prevents flash-back bug where remote users see object jump back
   */
  const handleResizeEnd = useCallback(
    async (objectId: string) => {
      if (!isResizingRef.current) return;

      // Get final bounds from store
      const objects = useCanvasStore.getState().objects;
      const object = objects.find((obj) => obj.id === objectId);

      if (object) {
        // Extract final shape-specific properties based on object type
        // IMPORTANT: Send only the properties that each shape type actually uses
        let finalUpdates: Record<string, unknown>;

        switch (object.type) {
          case 'rectangle':
            // Rectangle: x, y, width, height
            finalUpdates = {
              x: object.x,
              y: object.y,
              width: object.width,
              height: object.height,
            };
            break;
          case 'circle':
            // Circle: x (center), y (center), radius
            // DO NOT send width/height for circles!
            finalUpdates = {
              x: object.x,
              y: object.y,
              radius: object.radius,
            };
            break;
          case 'text':
            // Text: x, y, width, height (fixed dimensions like rectangles)
            finalUpdates = {
              x: object.x,
              y: object.y,
              width: object.width,
              height: object.height,
            };
            break;
          case 'line':
            // Line: x, y, width, points, rotation
            // Lines don't have height property
            finalUpdates = {
              x: object.x,
              y: object.y,
              width: object.width,
              points: object.points,
              rotation: object.rotation,
            };
            break;
          case 'group': {
            // Groups: Only position (no dimensions)
            // Groups don't have visual properties, only organizational
            finalUpdates = {
              x: object.x,
              y: object.y,
            };
            break;
          }
          default: {
            // Fallback for unknown types - ensure exhaustive check
            const _exhaustiveCheck: never = object;
            finalUpdates = {
              x: (_exhaustiveCheck as { x: number; y: number }).x,
              y: (_exhaustiveCheck as { x: number; y: number }).y,
            };
            break;
          }
        }

        try {
          // CRITICAL: Update object position IMMEDIATELY (no throttle)
          // This ensures RTDB has the correct position before resize state is cleared
          await updateCanvasObject('main', objectId, finalUpdates);

          // Clear resize state AFTER object update completes
          // This prevents flash-back: when resize state clears, object is already at correct position
          await endResizing('main', objectId);
        } catch {
          // Silently fail
        }
      }

      // Reset local state (both refs and React state)
      isResizingRef.current = false;
      activeHandleRef.current = null;
      anchorRef.current = null;
      startBoundsRef.current = null;
      setIsResizing(false);
      setActiveHandle(null);
      setAnchor(null);
    },
    []
  );

  return {
    isResizing,
    activeHandle,
    anchor,
    isShiftPressed,
    isAltPressed,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
}
