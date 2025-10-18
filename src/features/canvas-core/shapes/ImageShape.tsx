/**
 * Image Shape Component
 *
 * Renders an image shape on the canvas with selection and drag capabilities.
 */

import { useState, useEffect, useRef, memo, Fragment } from 'react';
import { Image } from 'react-konva';
import type Konva from 'konva';
import type { ImageObject } from '@/types';
import { useToolStore, useCanvasStore, useUIStore } from '@/stores';
import {
  updateCanvasObject,
  throttledUpdateCanvasObject,
  startDragging,
  throttledUpdateDragPosition,
  throttledUpdateCursor,
  endDragging,
} from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { getUserColor } from '@/features/collaboration/utils';
import { screenToCanvasCoords } from '../utils';
import { ResizeHandles, DimensionLabel } from '../components';
import { useResize } from '../hooks';
import { imagePool } from '@/lib/utils/imagePool';

/**
 * ImageShape component props
 */
interface ImageShapeProps {
  /** Image data */
  image: ImageObject;
  /** Whether this image is currently selected */
  isSelected: boolean;
  /** Whether this image is part of a multi-select */
  isInMultiSelect?: boolean;
  /** Callback when image is selected (receives event for shift-click detection) */
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Optional drag state from another user (for real-time position updates) */
  remoteDragState?: { x: number; y: number; userId: string; username: string; color: string } | null;
  /** Project/canvas ID for Firebase sync (defaults to 'main' for legacy support) */
  projectId?: string;
}

/**
 * Image shape component
 *
 * Renders a Konva image with selection, drag, and interaction support.
 * Loads image from src (data URL or Firebase Storage URL) and caches it.
 * Maintains aspect ratio during resize if lockAspectRatio is true.
 *
 * @param {ImageShapeProps} props - Component props
 * @returns {JSX.Element | null} ImageShape component or null if image failed to load
 *
 * @example
 * ```tsx
 * <ImageShape
 *   image={imageData}
 *   isSelected={selectedId === imageData.id}
 *   onSelect={() => selectObject(imageData.id)}
 * />
 * ```
 */
export const ImageShape = memo(function ImageShape({
  image,
  isSelected,
  isInMultiSelect = false,
  onSelect,
  remoteDragState,
  projectId = 'main',
}: ImageShapeProps) {
  const { activeTool } = useToolStore();
  const { projectId: storeProjectId, updateObject } = useCanvasStore();
  const { currentUser } = useAuth();

  // Use projectId from store if not provided via props
  const effectiveProjectId = projectId || storeProjectId;
  const setHoveredObject = useUIStore((state) => state.setHoveredObject);
  const hoveredObjectId = useUIStore((state) => state.hoveredObjectId);

  // Check if object is locked
  const isLocked = image.locked === true;

  // Resize hook
  const { isResizing, handleResizeStart, handleResizeMove, handleResizeEnd } = useResize(effectiveProjectId);

  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Image loading state
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Refs for animation
  const shapeRef = useRef<Konva.Image>(null);
  const animationRef = useRef<Konva.Tween | null>(null);

  // Determine if this object is being dragged by a remote user
  const isRemoteDragging = !!remoteDragState;

  // Check if this object is hovered in the sidebar (but not selected)
  const isHoveredFromSidebar = hoveredObjectId === image.id && !isSelected;

  // Use drag state position if available, otherwise use persisted position
  const displayX = remoteDragState?.x ?? image.x;
  const displayY = remoteDragState?.y ?? image.y;

  // Ensure width and height are valid numbers to prevent NaN in offset calculations
  const width = image.width || 100;
  const height = image.height || 100;

  /**
   * Load image from src URL
   * Uses imagePool for caching to prevent re-loading same images
   * Includes 10-second timeout to handle slow/failed loads
   */
  useEffect(() => {
    let isCancelled = false;

    console.log('[ImageShape] Loading image:', {
      id: image.id,
      fileName: image.fileName,
      srcPreview: image.src.substring(0, 100) + '...',
      srcLength: image.src.length,
      mimeType: image.mimeType,
      storageType: image.storageType,
      width: image.width,
      height: image.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    });

    // Set up 10-second timeout
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        console.error('[ImageShape] Image load timeout (10s):', {
          id: image.id,
          fileName: image.fileName,
          srcPreview: image.src.substring(0, 100),
        });
        setImageLoadError(true);
      }
    }, 10000); // 10 seconds

    // Load image from cache (or fetch if not cached)
    imagePool
      .getImage(image.src)
      .then((img) => {
        if (!isCancelled) {
          clearTimeout(timeoutId);
          console.log('[ImageShape] Image loaded successfully:', {
            id: image.id,
            fileName: image.fileName,
            loadedWidth: img.width,
            loadedHeight: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
          setHtmlImage(img);
          setImageLoadError(false);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          clearTimeout(timeoutId);

          // Enhanced error logging for debugging production issues
          console.error('[ImageShape] Failed to load image:', {
            id: image.id,
            fileName: image.fileName,
            srcPreview: image.src.substring(0, 100) + '...',
            srcLength: image.src.length,
            srcType: image.src.startsWith('data:')
              ? 'data URL'
              : image.src.includes('firebasestorage.googleapis.com')
              ? 'Firebase Storage'
              : 'External URL',
            storageType: image.storageType,
            storagePath: image.storagePath,
            mimeType: image.mimeType,
            errorMessage: error?.message || 'Unknown error',
            errorType: error?.constructor?.name || 'unknown',
            error: error,
            hasToken: image.src.includes('token='),
            hasAltMedia: image.src.includes('alt=media'),
          });

          setImageLoadError(true);
        }
      });

    // Cleanup
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [image.src, image.id, image.fileName, image.mimeType, image.storageType, image.width, image.height, image.naturalWidth, image.naturalHeight]);

  /**
   * Animate selection changes
   * Smoothly transitions stroke properties when selection state changes
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    // Cancel any previous animation to prevent buildup
    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }

    // Animate selection change
    if (isSelected) {
      // Animate to selected state (subtle scale pulse for Figma-style feedback)
      node.to({
        scaleX: (image.scaleX ?? 1) * 1.01,
        scaleY: (image.scaleY ?? 1) * 1.01,
        duration: 0.1,
        onFinish: () => {
          // Return to normal scale
          node.to({
            scaleX: image.scaleX ?? 1,
            scaleY: image.scaleY ?? 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected, image.scaleX, image.scaleY]);

  /**
   * Handle click on image
   * Only triggers selection when move tool is active
   * Ignores clicks on locked objects
   * Passes event to parent for shift-click multi-select detection
   */
  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    // Ignore clicks on locked objects
    if (isLocked) {
      return;
    }

    if (activeTool === 'move') {
      onSelect(e);
    }
  }

  /**
   * Handle drag start
   * Checks for drag lock and prevents stage from dragging when dragging a shape
   * Note: In multi-select mode, individual shapes are non-draggable; group drag is handled by invisible drag target
   */
  async function handleDragStart(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    if (!currentUser) return;

    // Select object when drag starts (if not already selected)
    // This ensures the dragged object becomes the selected object
    if (!isSelected) {
      // Create fake event without shift key to ensure single selection
      const fakeEvent = {
        evt: { shiftKey: false },
      } as Konva.KonvaEventObject<MouseEvent>;
      onSelect(fakeEvent);
    }

    // Attempt to acquire drag lock
    const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
    const color = getUserColor(currentUser.uid);

    const canDrag = await startDragging(
      effectiveProjectId,
      image.id,
      currentUser.uid,
      { x: image.x, y: image.y },
      username,
      color
    );

    if (!canDrag) {
      // Another user is dragging this object
      // Cancel the drag
      e.target.stopDrag();
      return;
    }
  }

  /**
   * Handle drag move
   * Emits throttled position updates to Realtime DB for real-time sync
   * Also updates cursor position so other users see cursor moving with object
   *
   * CRITICAL: Updates BOTH drag state AND object position to keep them in sync
   * This prevents flash-back bugs when drag ends.
   */
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const stage = node.getStage();
    // With offset, node.x() returns CENTER position, subtract offset to get top-left
    const position = {
      x: node.x() - width / 2,
      y: node.y() - height / 2
    };

    // Update local store immediately (optimistic update)
    updateObject(image.id, position);

    // Emit throttled updates to Realtime DB (50ms)
    // Update BOTH drag state AND object to keep them in perfect sync
    throttledUpdateDragPosition(effectiveProjectId, image.id, position);
    throttledUpdateCanvasObject(effectiveProjectId, image.id, position); // ← CRITICAL: Keep object current!

    // Update cursor position during drag so other users see cursor moving with object
    if (stage && currentUser) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const canvasCoords = screenToCanvasCoords(stage, pointerPosition);
        const username = (currentUser.username || currentUser.email || 'Anonymous') as string;
        const color = getUserColor(currentUser.uid);
        throttledUpdateCursor(effectiveProjectId, currentUser.uid, canvasCoords, username, color);
      }
    }
  }

  /**
   * Handle drag end
   * Updates image position in store and syncs to Realtime Database
   *
   * CRITICAL FIX: Updates object IMMEDIATELY (no throttle) BEFORE clearing drag state
   * This eliminates the flash-back bug by ensuring object position is current
   * when remote users fall back from drag state to object position.
   */
  async function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    // Prevent event from bubbling to stage (prevents stage drag)
    e.cancelBubble = true;

    const node = e.target;
    // With offset, node.x() returns CENTER position, subtract offset to get top-left
    const position = {
      x: node.x() - width / 2,
      y: node.y() - height / 2
    };

    // Update local store (optimistic update)
    updateObject(image.id, position);

    // CRITICAL: Update object position IMMEDIATELY (no throttle)
    // This ensures RTDB has the correct position before drag state is cleared
    await updateCanvasObject(effectiveProjectId, image.id, position);

    // Clear drag state AFTER object update completes
    // This prevents flash-back: when drag state clears, object is already at correct position
    await endDragging(effectiveProjectId, image.id);
  }

  /**
   * Handle mouse enter
   * Changes cursor and sets hover state
   * Syncs hover state to UI store for bidirectional sidebar sync
   */
  function handleMouseEnter(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Set hover state for visual feedback
    if (activeTool === 'move') {
      setIsHovered(true);
      stage.container().style.cursor = 'move';
      // Sync to UI store for sidebar hover highlighting
      setHoveredObject(image.id);
    }
  }

  /**
   * Handle mouse leave
   * Resets cursor and hover state
   * Clears UI store hover state if this object is still hovered (prevents race conditions)
   */
  function handleMouseLeave(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;

    // Clear hover state
    setIsHovered(false);

    // Reset cursor based on active tool
    stage.container().style.cursor = activeTool === 'move' ? 'pointer' : 'crosshair';

    // Clear UI store hover only if this object is still the hovered one
    // This prevents race conditions when quickly moving between objects
    const current = useUIStore.getState().hoveredObjectId;
    if (current === image.id) {
      setHoveredObject(null);
    }
  }

  // Determine stroke styling based on state
  const getStroke = () => {
    if (isLocked && isSelected) return '#0ea5e9'; // Locked + Selected: blue (same as normal selection)
    if (isRemoteDragging) return remoteDragState.color; // Remote drag: user's color
    if (isInMultiSelect) return '#38bdf8'; // Multi-select: lighter blue
    if (isSelected) return '#0ea5e9'; // Selected: bright blue
    if (isHovered && activeTool === 'move') return '#94a3b8'; // Hovered: subtle gray
    return undefined; // Default: no stroke
  };

  const getStrokeWidth = () => {
    if (isLocked && isSelected) return 3; // Locked + Selected: same as normal selection
    if (isRemoteDragging) return 2; // Remote drag: medium border
    if (isSelected) return 3; // Selected: thick border
    if (isHovered && activeTool === 'move') return 2; // Hovered: thin border
    return undefined; // Default: no border
  };

  const getOpacity = () => {
    if (isRemoteDragging) return 0.85; // Remote drag: slightly transparent
    return 1; // Default: fully opaque
  };

  const getShadow = () => {
    // Add subtle glow when selected for better visual feedback
    if (isSelected) {
      return {
        shadowColor: '#0ea5e9',
        shadowBlur: 5,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0.5,
        shadowEnabled: true,
      };
    }
    // Use shape's own shadow properties
    return {
      shadowColor: image.shadowColor,
      shadowBlur: image.shadowBlur ?? 0,
      shadowOffsetX: image.shadowOffsetX ?? 0,
      shadowOffsetY: image.shadowOffsetY ?? 0,
      shadowOpacity: image.shadowOpacity ?? 1,
      shadowEnabled: image.shadowEnabled ?? false,
    };
  };

  // Don't render if hidden
  if (image.visible === false) {
    console.log('[ImageShape] Not rendering (hidden):', image.id);
    return null;
  }

  // Don't render if image failed to load
  if (imageLoadError) {
    console.error('[ImageShape] Not rendering (load error):', image.id, image.fileName);
    return null;
  }

  if (!htmlImage) {
    console.log('[ImageShape] Not rendering (waiting for image to load):', image.id, image.fileName);
    return null;
  }

  return (
    <Fragment>
      <Image
        id={image.id}
        ref={shapeRef}
        image={htmlImage}
        // Position adjusted for center-based offset: x,y in data model represents top-left,
        // but with offset we need to position at center, so add half dimensions
        x={displayX + width / 2}
        y={displayY + height / 2}
        width={width}
        height={height}
        // Transform properties
        rotation={image.rotation ?? 0}
        opacity={(image.opacity ?? 1) * getOpacity()} // Combine shape opacity with state opacity
        scaleX={image.scaleX ?? 1}
        scaleY={image.scaleY ?? 1}
        skewX={image.skewX ?? 0}
        skewY={image.skewY ?? 0}
        // Offset for center-based rotation (shapes rotate around their center, not top-left)
        offsetX={width / 2}
        offsetY={height / 2}
        // Stroke properties (with state-based overrides for selection/hover)
        stroke={getStroke() ?? image.stroke}
        strokeWidth={getStrokeWidth() ?? image.strokeWidth ?? 0}
        strokeEnabled={image.strokeEnabled ?? true}
        dash={isRemoteDragging ? [5, 5] : undefined} // Dashed border when being remotely dragged
        // Shadow properties (with selection glow override)
        {...getShadow()}
        // Interaction
        listening={!isLocked} // Locked objects don't respond to events
        onClick={handleClick}
        onTap={handleClick} // Mobile support
        draggable={!isLocked && (isSelected || isHovered) && activeTool === 'move' && !isRemoteDragging && !isInMultiSelect} // Disable drag if locked, remotely dragging, or in multi-select
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover outline from sidebar (only when hovered in panel, not selected) */}
      {isHoveredFromSidebar && (
        <Image
          image={htmlImage}
          x={displayX + width / 2}
          y={displayY + height / 2}
          width={width}
          height={height}
          stroke="#9ca3af"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
          rotation={image.rotation ?? 0}
          scaleX={image.scaleX ?? 1}
          scaleY={image.scaleY ?? 1}
          skewX={image.skewX ?? 0}
          skewY={image.skewY ?? 0}
          offsetX={width / 2}
          offsetY={height / 2}
          opacity={0.5} // Semi-transparent for hover outline
        />
      )}

      {/* Resize Handles - only visible when selected and not locked */}
      {!isLocked && (
        <ResizeHandles
          object={image}
          isSelected={isSelected && activeTool === 'move'}
          isResizing={isResizing}
          onResizeStart={(handleType) =>
            handleResizeStart(image.id, handleType, {
              x: image.x,
              y: image.y,
              width: width,
              height: height,
            })
          }
          onResizeMove={(_handleType, x, y) => handleResizeMove(image.id, x, y)}
          onResizeEnd={() => handleResizeEnd(image.id)}
        />
      )}

      {/* Dimension Label - shows width × height when selected and not locked */}
      {!isLocked && (
        <DimensionLabel object={image} visible={isSelected && activeTool === 'move'} />
      )}
    </Fragment>
  );
});
