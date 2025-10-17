/**
 * Stage Objects Component
 *
 * Renders all canvas objects and their overlays:
 * - Canvas objects (rectangles, circles, text, lines, images)
 * - Remote selection overlays
 * - Remote resize overlays
 */

import type Konva from 'konva';
import { Rectangle, Circle, TextShape, Line, ImageShape } from '../../shapes';
import { SelectionOverlay, RemoteResizeOverlay } from '@/features/collaboration/components';
import type { DragStateWithObject } from '@/features/collaboration/hooks/useDragStates';
import type { ResizeStateWithObject } from '@/features/collaboration/hooks/useRemoteResizes';
import type { EditState } from '@/lib/firebase/textEditingService';
import type {
  Rectangle as RectangleType,
  Circle as CircleType,
  Text as TextType,
  Line as LineType,
  ImageObject,
  CanvasObject,
} from '@/types';

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
 * @property {DragStateWithObject[]} dragStates - Remote drag states
 * @property {RemoteSelection[]} remoteSelections - Remote user selections
 * @property {ResizeStateWithObject[]} remoteResizes - Remote user resize operations
 * @property {Record<string, EditState>} editStates - Text edit states
 * @property {string} projectId - Project/canvas ID
 */
interface StageObjectsProps {
  objects: CanvasObject[];
  selectedIds: string[];
  onSelectObject: (id: string, shiftKey?: boolean) => void;
  dragStates: DragStateWithObject[];
  remoteSelections: RemoteSelection[];
  remoteResizes: ResizeStateWithObject[];
  editStates: Record<string, EditState>;
  projectId: string;
}

/**
 * StageObjects component
 * Renders all canvas objects and their collaboration overlays
 * @param {StageObjectsProps} props - Component props
 * @returns {JSX.Element} Canvas objects and overlays
 */
export function StageObjects({
  objects,
  selectedIds,
  onSelectObject,
  dragStates,
  remoteSelections,
  remoteResizes,
  editStates,
  projectId,
}: StageObjectsProps) {
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
      {/* Render all objects in z-index order (array order = render order) */}
      {objects.map((obj) => {
        // Find if this object is being dragged by another user
        const remoteDragState = dragStates.find((state) => state.objectId === obj.id);

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

      {/* Render remote selection overlays (supports multi-select) */}
      {remoteSelections.flatMap((selection) => {
        // For each user selection, render overlays for all their selected objects
        return selection.objectIds.map((objectId) => {
          const object = objects.find((obj) => obj.id === objectId);
          if (!object) return null;

          // Check if this object is being actively dragged by another user
          const isBeingDragged = dragStates.some((state) => state.objectId === objectId);

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
}
