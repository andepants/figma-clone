/**
 * Fast Path Tool Executor
 *
 * Executes matched fast path tools directly without LLM invocation.
 * Provides instant response for simple commands.
 */

import * as logger from 'firebase-functions/logger';
import {CanvasState, ProcessAICommandResponse} from '../../types';
import {getDatabase} from '../../services/firebase-admin';

interface FastPathMatch {
  toolName: string;
  parameters: Record<string, unknown>;
}

/**
 * Execute a fast path matched tool
 *
 * @param match - Matched tool and parameters
 * @param canvasId - Canvas identifier
 * @param userId - User identifier
 * @param canvasState - Current canvas state
 * @returns Response matching ProcessAICommandResponse
 */
export async function executeFastPathTool(
  match: FastPathMatch,
  canvasId: string,
  userId: string,
  canvasState: CanvasState
): Promise<ProcessAICommandResponse> {
  const startTime = Date.now();

  try {
    const {toolName, parameters} = match;
    const canvasRef = getDatabase().ref(`canvases/${canvasId}/objects`);

    logger.info('Executing fast path tool', {toolName, parameters});

    switch (toolName) {
      case 'createRectangle': {
        const newObject = {
          id: generateObjectId(),
          type: 'rectangle',
          x: getViewportCenterX(canvasState),
          y: getViewportCenterY(canvasState),
          width: typeof parameters.width === 'number' ? parameters.width : 200,
          height: typeof parameters.height === 'number' ? parameters.height : 200,
          fill: typeof parameters.fill === 'string' ? parameters.fill : '#3b82f6',
          stroke: '#000000',
          strokeWidth: 0,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          name: generateLayerName('rectangle', canvasState.objects),
          aiGenerated: true,
          createdAt: Date.now(),
          createdBy: userId,
        };

        await canvasRef.child(newObject.id).set(newObject);

        const responseTime = Date.now() - startTime;
        logger.info('Fast path: rectangle created', {
          id: newObject.id,
          responseTime: `${responseTime}ms`,
        });

        return {
          success: true,
          message: `Created a ${parameters.fill} rectangle`,
          actions: [
            {
              tool: 'createRectangle',
              params: parameters,
              result: {success: true},
            },
          ],
        };
      }

      case 'createCircle': {
        const newObject = {
          id: generateObjectId(),
          type: 'circle',
          x: getViewportCenterX(canvasState),
          y: getViewportCenterY(canvasState),
          radius: typeof parameters.radius === 'number' ? parameters.radius : 50,
          fill: typeof parameters.fill === 'string' ? parameters.fill : '#3b82f6',
          stroke: '#000000',
          strokeWidth: 0,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          name: generateLayerName('circle', canvasState.objects),
          aiGenerated: true,
          createdAt: Date.now(),
          createdBy: userId,
        };

        await canvasRef.child(newObject.id).set(newObject);

        const responseTime = Date.now() - startTime;
        logger.info('Fast path: circle created', {
          id: newObject.id,
          responseTime: `${responseTime}ms`,
        });

        return {
          success: true,
          message: `Created a ${parameters.fill} circle`,
          actions: [
            {
              tool: 'createCircle',
              params: parameters,
              result: {success: true},
            },
          ],
        };
      }

      case 'createText': {
        const newObject = {
          id: generateObjectId(),
          type: 'text',
          x: getViewportCenterX(canvasState),
          y: getViewportCenterY(canvasState),
          text: typeof parameters.text === 'string' ? parameters.text : 'Text',
          fontSize: typeof parameters.fontSize === 'number' ? parameters.fontSize : 24,
          fill: typeof parameters.fill === 'string' ? parameters.fill : '#000000',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          align: 'left',
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 1,
          name: generateLayerName('text', canvasState.objects),
          aiGenerated: true,
          createdAt: Date.now(),
          createdBy: userId,
        };

        await canvasRef.child(newObject.id).set(newObject);

        const responseTime = Date.now() - startTime;
        logger.info('Fast path: text created', {
          id: newObject.id,
          responseTime: `${responseTime}ms`,
        });

        return {
          success: true,
          message: `Created text: "${parameters.text}"`,
          actions: [
            {
              tool: 'createText',
              params: parameters,
              result: {success: true},
            },
          ],
        };
      }

      case 'deleteObjects': {
        // Delete selected objects
        const selectedIds = canvasState.selectedObjectIds || [];

        if (selectedIds.length === 0) {
          return {
            success: false,
            message: 'No objects selected to delete',
            actions: [],
          };
        }

        // Delete each selected object
        const updates: Record<string, null> = {};
        for (const id of selectedIds) {
          updates[id] = null;
        }

        await canvasRef.update(updates);

        const responseTime = Date.now() - startTime;
        logger.info('Fast path: objects deleted', {
          count: selectedIds.length,
          responseTime: `${responseTime}ms`,
        });

        return {
          success: true,
          message: `Deleted ${selectedIds.length} object${selectedIds.length > 1 ? 's' : ''}`,
          actions: [
            {
              tool: 'deleteObjects',
              params: {objectIds: selectedIds},
              result: {success: true},
            },
          ],
        };
      }

      case 'moveObject': {
        // Move last created or selected object
        const targetId = getTargetObjectId(canvasState);

        if (!targetId) {
          return {
            success: false,
            message: 'No object to move',
            actions: [],
          };
        }

        const targetObject = canvasState.objects.find((obj) => obj.id === targetId);
        if (!targetObject) {
          return {
            success: false,
            message: 'Object not found',
            actions: [],
          };
        }

        const deltaX = typeof parameters.deltaX === 'number' ? parameters.deltaX : 0;
        const deltaY = typeof parameters.deltaY === 'number' ? parameters.deltaY : 0;
        const newX = targetObject.x + deltaX;
        const newY = targetObject.y + deltaY;

        await canvasRef.child(targetId).update({
          x: newX,
          y: newY,
        });

        const responseTime = Date.now() - startTime;
        logger.info('Fast path: object moved', {
          id: targetId,
          deltaX: parameters.deltaX,
          deltaY: parameters.deltaY,
          responseTime: `${responseTime}ms`,
        });

        return {
          success: true,
          message: 'Moved object',
          actions: [
            {
              tool: 'moveObject',
              params: {objectId: targetId, ...parameters},
              result: {success: true},
            },
          ],
        };
      }

      case 'resizeObject': {
        // Resize last created or selected object
        const targetId = getTargetObjectId(canvasState);

        if (!targetId) {
          return {
            success: false,
            message: 'No object to resize',
            actions: [],
          };
        }

        const targetObject = canvasState.objects.find((obj) => obj.id === targetId);
        if (!targetObject) {
          return {
            success: false,
            message: 'Object not found',
            actions: [],
          };
        }

        const scale = typeof parameters.scale === 'number' ? parameters.scale : 1.5;
        const updates: Record<string, number> = {};

        if ('width' in targetObject && targetObject.width) {
          updates.width = targetObject.width * scale;
        }
        if ('height' in targetObject && targetObject.height) {
          updates.height = targetObject.height * scale;
        }
        if ('radius' in targetObject && targetObject.radius) {
          updates.radius = targetObject.radius * scale;
        }

        await canvasRef.child(targetId).update(updates);

        const responseTime = Date.now() - startTime;
        logger.info('Fast path: object resized', {
          id: targetId,
          scale,
          responseTime: `${responseTime}ms`,
        });

        return {
          success: true,
          message: `Made object ${scale > 1 ? 'bigger' : 'smaller'}`,
          actions: [
            {
              tool: 'resizeObject',
              params: {objectId: targetId, scale},
              result: {success: true},
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown fast path tool: ${toolName}`);
    }
  } catch (error) {
    logger.error('Fast path execution error', {error});
    throw error;
  }
}

/**
 * Generate unique object ID
 */
function generateObjectId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate layer name with auto-increment
 */
function generateLayerName(type: string, objects: {type?: string; name?: string}[]): string {
  const existingNames = objects
    .filter((obj) => obj.type === type)
    .map((obj) => obj.name || '');

  let counter = 1;
  let name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${counter}`;

  while (existingNames.includes(name)) {
    counter++;
    name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${counter}`;
  }

  return name;
}

/**
 * Get viewport center X coordinate
 */
function getViewportCenterX(canvasState: CanvasState): number {
  if (canvasState.viewport) {
    return canvasState.viewport.camera.x;
  }
  return canvasState.canvasSize.width / 2;
}

/**
 * Get viewport center Y coordinate
 */
function getViewportCenterY(canvasState: CanvasState): number {
  if (canvasState.viewport) {
    return canvasState.viewport.camera.y;
  }
  return canvasState.canvasSize.height / 2;
}

/**
 * Get target object ID for move/resize operations
 * Priority: last selected > last AI created
 */
function getTargetObjectId(canvasState: CanvasState): string | null {
  // Priority 1: Selected object
  if (canvasState.selectedObjectIds && canvasState.selectedObjectIds.length > 0) {
    return canvasState.selectedObjectIds[0];
  }

  // Priority 2: Last AI-created object
  const aiObjects = canvasState.objects
    .filter((obj) => obj.aiGenerated)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (aiObjects.length > 0) {
    return aiObjects[0].id;
  }

  return null;
}
