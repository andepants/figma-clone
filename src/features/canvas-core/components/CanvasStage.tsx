/**
 * CanvasStage Component
 *
 * Main Konva canvas stage component that handles rendering, pan, zoom, and interactions.
 * This is the core of the collaborative canvas application.
 */

import { useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useShapeCreation, useWindowResize, useSpacebarPan, useTouchGestures, useGroupDrag, useDragToSelect, useArrowKeyPan, useCanvasDropzone } from '../hooks';
import { useToolStore, useCanvasStore, usePageStore } from '@/stores';
import { useCursors, useDragStates, useRemoteSelections, useRemoteResizes, useEditStates } from '@/features/collaboration/hooks';
import { Cursor } from '@/features/collaboration/components';
import { updateSelection } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks';
import { hexToRgba } from '@/lib/utils';
import { useStageHandlers, StageObjects, StagePreviewShapes } from './stage';

/**
 * CanvasStage component props
 * @interface CanvasStageProps
 * @property {React.RefObject<Konva.Stage | null>} [stageRef] - Optional external ref to access the stage
 * @property {string} [projectId] - Project/canvas ID (defaults to 'main' for legacy support)
 */
interface CanvasStageProps {
  stageRef?: React.RefObject<Konva.Stage | null>;
  projectId?: string;
}

/**
 * CanvasStage component
 * Renders the main Konva stage with pan and zoom capabilities
 * @param {CanvasStageProps} props - Component props
 * @returns {JSX.Element} Canvas stage component
 */
export function CanvasStage({ stageRef: externalStageRef, projectId = 'main' }: CanvasStageProps = {}) {
  // Get active tool to control canvas behavior
  const { activeTool } = useToolStore();

  // Get canvas objects, selection, zoom and pan from store
  const { objects, selectedIds, selectObjects, toggleSelection, zoom, panX, panY, setZoom, setPan, setStageRef } = useCanvasStore();

  // Get page settings for background color
  const { pageSettings } = usePageStore();

  // Shape creation handlers
  const { previewShape, handleMouseDown, handleMouseMove, handleMouseUp } =
    useShapeCreation();

  // Auth and collaboration
  const { currentUser } = useAuth();
  const cursors = useCursors(projectId);
  const dragStates = useDragStates(projectId);
  const remoteSelections = useRemoteSelections(projectId);
  const remoteResizes = useRemoteResizes(projectId);
  const editStates = useEditStates(projectId);

  // Canvas dimensions (full window size with debounced resize)
  const dimensions = useWindowResize(100);

  // Spacebar panning state
  const { isSpacePressed, isPanning, setIsPanning } = useSpacebarPan();

  // Arrow key panning
  useArrowKeyPan();

  // Reference to the Konva stage (internal)
  const internalStageRef = useRef<Konva.Stage | null>(null);

  // Use external ref if provided, otherwise use internal ref
  const stageRef = externalStageRef || internalStageRef;

  // Sync stageRef to canvas store for viewport calculations
  useEffect(() => {
    setStageRef(stageRef.current);
    return () => setStageRef(null); // Cleanup on unmount
  }, [stageRef, setStageRef]);

  // Drag-to-select handlers for marquee selection (needs to be before useStageHandlers)
  const {
    handleStageMouseDown: handleDragSelectMouseDown,
    handleStageMouseMove: handleDragSelectMouseMove,
    handleStageMouseUp: handleDragSelectMouseUp,
    selectionRect,
  } = useDragToSelect(stageRef);

  // Stage event handlers
  const {
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleStageMouseDown,
    handleStageClick,
    handleCursorMove,
    handleMouseLeave,
  } = useStageHandlers({
    stageRef,
    projectId,
    panX,
    panY,
    zoom,
    setZoom,
    setPan,
    setIsPanning,
    currentUser,
    handleMouseDown,
    handleDragSelectMouseDown,
  });

  // Touch gesture handlers
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures(
    stageRef,
    setZoom,
    setPan
  );

  // Group drag handlers for multi-select
  const {
    handleGroupDragStart,
    handleGroupDragMove,
    handleGroupDragEnd,
    isGroupDragging,
  } = useGroupDrag();

  // Canvas dropzone for drag-and-drop image uploads
  const {
    getRootProps,
    getInputProps,
    isDragActive: isImageDragActive,
    isUploading: isImageUploading,
    uploadProgress: imageUploadProgress,
  } = useCanvasDropzone({ stageRef, projectId });

  /**
   * Sync local selection to Realtime DB
   * Emits selection changes so other users can see what's selected
   */
  useEffect(() => {
    if (!currentUser) return;

    // Update selection in Realtime DB (supports multi-select)
    updateSelection(projectId, currentUser.uid, selectedIds);
  }, [selectedIds, currentUser, projectId]);

  // Stage is draggable when spacebar is pressed
  const isDraggable = isSpacePressed;

  // Determine cursor style based on state
  let cursorStyle = activeTool === 'move' ? 'pointer' : 'crosshair';
  if (isSpacePressed) {
    cursorStyle = isPanning ? 'grabbing' : 'grab';
  }

  // Calculate background color with opacity from page settings
  const backgroundColor = pageSettings.backgroundColor;
  const opacity = pageSettings.opacity / 100;
  const bgColorWithOpacity = hexToRgba(backgroundColor, opacity);

  // Handler for object selection
  function handleSelectObject(objectId: string, shiftKey?: boolean) {
    if (shiftKey) {
      toggleSelection(objectId);
    } else {
      selectObjects([objectId]);
    }
  }

  return (
    <div {...getRootProps()} className="relative w-full h-full">
      <input {...getInputProps()} />

      {/* Drag-over overlay - shows when dragging image over canvas */}
      {isImageDragActive && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-blue-500 border-dashed flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-lg shadow-xl">
            <p className="text-lg font-semibold text-gray-900">Drop image here to upload</p>
          </div>
        </div>
      )}

      {/* Upload progress overlay - shows during upload */}
      {isImageUploading && (
        <div className="absolute inset-0 z-50 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-lg shadow-xl">
            <p className="text-sm font-medium text-gray-900 mb-2">Uploading image...</p>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${imageUploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">{imageUploadProgress}%</p>
          </div>
        </div>
      )}

      <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      draggable={isDraggable}
      x={panX}
      y={panY}
      scaleX={zoom}
      scaleY={zoom}
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onMouseDown={handleStageMouseDown}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleCursorMove();
        handleDragSelectMouseMove();
      }}
      onMouseUp={(e) => {
        handleMouseUp(e);
        handleDragSelectMouseUp();
      }}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: cursorStyle,
        touchAction: 'none', // Prevent default touch behaviors like page zoom
      }}
    >
      {/* Background Layer - Infinite canvas feel */}
      <Layer listening={false}>
        <Rect
          x={-10000}
          y={-10000}
          width={20000}
          height={20000}
          fill={bgColorWithOpacity}
        />
      </Layer>

      {/* Objects Layer (shapes and preview) */}
      <Layer>
        {/* Render all canvas objects with collaboration overlays */}
        <StageObjects
          objects={objects}
          selectedIds={selectedIds}
          onSelectObject={handleSelectObject}
          dragStates={dragStates}
          remoteSelections={remoteSelections}
          remoteResizes={remoteResizes}
          editStates={editStates}
          projectId={projectId}
          stageRef={stageRef}
        />

        {/* Render preview shapes for creation and selection */}
        <StagePreviewShapes
          previewShape={previewShape}
          selectionRect={selectionRect}
          selectedIds={selectedIds}
          objects={objects}
          isGroupDragging={isGroupDragging}
          handleGroupDragStart={handleGroupDragStart}
          handleGroupDragMove={handleGroupDragMove}
          handleGroupDragEnd={handleGroupDragEnd}
        />
      </Layer>

      {/* Cursors Layer - Render other users' cursors */}
      <Layer listening={false}>
        {cursors.map((cursor) => (
          <Cursor
            key={cursor.userId}
            x={cursor.x}
            y={cursor.y}
            username={cursor.username}
            color={cursor.color}
          />
        ))}
      </Layer>
    </Stage>
    </div>
  );
}
