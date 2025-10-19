/**
 * Stage Objects Component
 *
 * Renders all canvas objects and their overlays:
 * - Canvas objects (rectangles, circles, text, lines, images)
 * - Remote selection overlays
 * - Remote resize overlays
 *
 * Performance optimizations:
 * - Viewport culling: Only renders objects visible in current viewport
 * - Reduces render count from 500 to ~50-100 objects for significant FPS improvement
 */

import { useMemo, memo, useEffect } from 'react';
import type Konva from 'konva';
import { Rectangle, Circle, TextShape, Line, ImageShape } from '../../shapes';
import { SelectionOverlay, RemoteResizeOverlay } from '@/features/collaboration/components';
import type { ResizeStateWithObject } from '@/features/collaboration/hooks/useRemoteResizes';
import type { EditState } from '@/lib/firebase/textEditingService';
import type {
  Rectangle as RectangleType,
  Circle as CircleType,
  Text as TextType,
  Line as LineType,
  ImageObject,
  CanvasObject,
  DragState,
} from '@/types';
import { filterVisibleObjects } from '@/lib/utils/viewport';

/**
 * Remote selection interface
 */
interface RemoteSelection {
  userId: string;
  objectIds: string[];
  username: string;
  color: string;
}

/**
 * StageObjects component props
 * @interface StageObjectsProps
 * @property {CanvasObject[]} objects - All canvas objects
 * @property {string[]} selectedIds - Currently selected object IDs
 * @property {(id: string, shiftKey?: boolean) => void} onSelectObject - Object selection handler
 * @property {Map<string, DragState>} dragStates - Remote drag states (objectId -> DragState)
 * @property {RemoteSelection[]} remoteSelections - Remote user selections
 * @property {ResizeStateWithObject[]} remoteResizes - Remote user resize operations
 * @property {Record<string, EditState>} editStates - Text edit states
 * @property {string} projectId - Project/canvas ID
 * @property {React.RefObject<Konva.Stage | null>} stageRef - Konva stage reference for viewport culling
 */
interface StageObjectsProps {
  objects: CanvasObject[];
  selectedIds: string[];
  onSelectObject: (id: string, shiftKey?: boolean) => void;
  dragStates: Map<string, DragState>;
  remoteSelections: RemoteSelection[];
  remoteResizes: ResizeStateWithObject[];
  editStates: Record<string, EditState>;
  projectId: string;
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * StageObjects component
 * Renders all canvas objects and their collaboration overlays
 *
 * Performance optimizations:
 * - Memoized with React.memo to prevent re-renders on unrelated state changes
 * - Custom comparison function checks props by reference (shallow equality)
 *
 * @param {StageObjectsProps} props - Component props
 * @returns {JSX.Element} Canvas objects and overlays
 */
export const StageObjects = memo(
  function StageObjects({
  objects,
  selectedIds,
  onSelectObject,
  dragStates,
  remoteSelections,
  remoteResizes,
  editStates,
  projectId,
  stageRef,
}: StageObjectsProps) {
    // Debug: Log objects being rendered
    useEffect(() => {
      console.log('[StageObjects] Rendering', objects.length, 'objects');
    }, [objects]);
  // Get viewport state for culling dependencies
  /**
   * Filter objects to only those visible in viewport
   * Performance optimization: Reduces render count from 500 to ~50-100 objects
   * Dependencies: objects, stageRef.current (re-filter when objects change)
   * Note: stageRef.current contains viewport info (zoom, position) which changes frequently,
   * so we rely on objects changing to trigger re-filtering rather than viewport changes
   */
  const visibleObjects = useMemo(() => {
    const filtered = filterVisibleObjects(objects, stageRef.current);
    if (process.env.NODE_ENV === 'development') {
      console.log('[StageObjects] Viewport culling:', objects.length, 'total →', filtered.length, 'visible');
    }
    return filtered;
  }, [objects, stageRef]);

  /**
   * Set of visible object IDs for O(1) lookup
   * Used to filter remote selection overlays to only visible objects
   */
  const visibleObjectIds = useMemo(
    () => new Set(visibleObjects.map(o => o.id)),
    [visibleObjects]
  );

  /**
   * Handle object selection
   * @param {string} objectId - Object ID
   * @param {Konva.KonvaEventObject<MouseEvent>} e - Mouse event
   */
  function handleSelect(objectId: string, e: Konva.KonvaEventObject<MouseEvent>) {
    onSelectObject(objectId, e.evt.shiftKey);
  }

  return (
    <>
      {/* Render only visible objects in z-index order (array order = render order) */}
      {visibleObjects.map((obj) => {
        // Find if this object is being dragged by another user (O(1) Map lookup)
        const remoteDragState = dragStates.get(obj.id);

        // Render based on type
        if (obj.type === 'rectangle') {
          return (
            <Rectangle
              key={obj.id}
              rectangle={obj as RectangleType}
              isSelected={selectedIds.includes(obj.id)}
              isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(obj.id, e)}
              remoteDragState={remoteDragState}
              projectId={projectId}
            />
          );
        } else if (obj.type === 'circle') {
          return (
            <Circle
              key={obj.id}
              circle={obj as CircleType}
              isSelected={selectedIds.includes(obj.id)}
              isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(obj.id, e)}
              remoteDragState={remoteDragState}
              projectId={projectId}
            />
          );
        } else if (obj.type === 'text') {
          // Find if this object is being edited by another user
          const editState = editStates[obj.id];

          return (
            <TextShape
              key={obj.id}
              text={obj as TextType}
              isSelected={selectedIds.includes(obj.id)}
              isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(obj.id, e)}
              remoteDragState={remoteDragState}
              editState={editState}
            />
          );
        } else if (obj.type === 'line') {
          return (
            <Line
              key={obj.id}
              line={obj as LineType}
              isSelected={selectedIds.includes(obj.id)}
              isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(obj.id, e)}
              remoteDragState={remoteDragState}
              projectId={projectId}
            />
          );
        } else if (obj.type === 'image') {
          return (
            <ImageShape
              key={obj.id}
              image={obj as ImageObject}
              isSelected={selectedIds.includes(obj.id)}
              isInMultiSelect={selectedIds.length > 1 && selectedIds.includes(obj.id)}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(obj.id, e)}
              remoteDragState={remoteDragState}
              projectId={projectId}
            />
          );
        }

        // Skip unknown types (e.g., 'group' which is container-only)
        return null;
      })}

      {/* Render remote selection overlays (supports multi-select) - only for visible objects */}
      {remoteSelections.flatMap((selection) => {
        // For each user selection, render overlays for all their selected objects
        return selection.objectIds
          .filter(id => visibleObjectIds.has(id)) // Only render overlays for visible objects
          .map((objectId) => {
            const object = objects.find((obj) => obj.id === objectId);
            if (!object) return null;

            // Check if this object is being actively dragged by another user (O(1) Map lookup)
            const isBeingDragged = dragStates.has(objectId);

            // Skip overlay for rectangles/circles/images being dragged (object is already visible)
            // Keep overlay for text shapes (dashed border is helpful even when dragging)
            if (isBeingDragged && (object.type === 'rectangle' || object.type === 'circle' || object.type === 'image')) {
              return null;
            }

            return (
              <SelectionOverlay
                key={`selection-${selection.userId}-${objectId}`}
                object={object}
                selection={selection}
                showBadge={false} // Can enable on hover if needed
              />
            );
          });
      })}

      {/* Render remote resize overlays - show other users' resize operations */}
      {remoteResizes.map((resizeState) => (
        <RemoteResizeOverlay
          key={`resize-${resizeState.userId}-${resizeState.objectId}`}
          resizeState={resizeState}
        />
      ))}
    </>
  );
  },
  (prev, next) => {
    // Custom comparison function for React.memo
    // Only re-render if props actually change (reference equality check)
    return (
      prev.objects === next.objects &&
      prev.selectedIds === next.selectedIds &&
      prev.dragStates === next.dragStates &&
      prev.remoteSelections === next.remoteSelections &&
      prev.remoteResizes === next.remoteResizes &&
      prev.editStates === next.editStates &&
      prev.projectId === next.projectId &&
      prev.stageRef === next.stageRef &&
      prev.onSelectObject === next.onSelectObject
    );
  }
);
