/**
 * Canvas Object Builder
 *
 * Provides utilities for building canvas objects with proper type-specific
 * properties and validation. Used by both single and batch create operations.
 *
 * This module handles:
 * - Type-specific property validation
 * - Default value assignment
 * - Object structure building
 *
 * @module objectBuilder
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Parameters for building a canvas object
 * Matches the frontend CanvasObject types
 */
export interface BuildObjectParams {
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'image' | 'group';
  position: { x: number; y: number };

  // Dimension-based properties (rectangle, text, image)
  dimensions?: { width: number; height: number };

  // Circle-specific
  radius?: number;

  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;

  // Line-specific
  points?: [number, number, number, number];

  // Image-specific
  imageUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  storageType?: 'dataURL' | 'storage';
  storagePath?: string;

  // Visual properties
  appearance: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };

  // Transform properties
  rotation?: number;

  // Hierarchy properties
  parentId?: string | null;
  isCollapsed?: boolean;

  // Metadata
  name?: string;
  userId: string;
}

/**
 * Build a canvas object with all required and type-specific properties
 *
 * @param params - Object building parameters
 * @param objectId - Optional object ID (generates UUID if not provided)
 * @param timestamp - Optional timestamp (uses Date.now() if not provided)
 * @returns Complete canvas object ready for RTDB
 * @throws Error if required type-specific properties are missing
 *
 * @example
 * const obj = buildCanvasObject({
 *   type: 'rectangle',
 *   position: { x: 100, y: 100 },
 *   dimensions: { width: 200, height: 150 },
 *   appearance: { fill: '#3b82f6' },
 *   userId: 'user-456',
 * });
 */
export function buildCanvasObject(
  params: BuildObjectParams,
  objectId?: string,
  timestamp?: number
): Record<string, unknown> {
  // Validate required userId parameter
  if (!params.userId || params.userId.trim().length === 0) {
    throw new Error('userId is required and cannot be empty');
  }

  const id = objectId || uuidv4();
  const now = timestamp || Date.now();

  // Build base object with common properties
  const canvasObject: Record<string, unknown> = {
    id,
    type: params.type,
    x: params.position.x,
    y: params.position.y,
    createdBy: params.userId,
    createdAt: now,
    updatedAt: now,
    name: params.name || `${params.type}_${now}`,
    visible: true,
    locked: false,
    aiGenerated: true, // Mark as AI-generated

    // Transform properties (defaults matching frontend expectations)
    rotation: params.rotation || 0,
    opacity: params.appearance.opacity !== undefined ? params.appearance.opacity : 1,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
  };

  // Add hierarchy properties if provided
  if (params.parentId !== undefined) {
    canvasObject.parentId = params.parentId;
  }
  if (params.isCollapsed !== undefined) {
    canvasObject.isCollapsed = params.isCollapsed;
  }

  // Add type-specific properties
  addTypeSpecificProperties(canvasObject, params);

  // Add optional appearance properties
  addAppearanceProperties(canvasObject, params.appearance);

  return canvasObject;
}

/**
 * Add type-specific properties to canvas object
 *
 * @param canvasObject - The object being built
 * @param params - Build parameters
 * @throws Error if required properties for the type are missing
 */
function addTypeSpecificProperties(
  canvasObject: Record<string, unknown>,
  params: BuildObjectParams
): void {
  switch (params.type) {
    case 'rectangle':
      addRectangleProperties(canvasObject, params);
      break;

    case 'circle':
      addCircleProperties(canvasObject, params);
      break;

    case 'text':
      addTextProperties(canvasObject, params);
      break;

    case 'line':
      addLineProperties(canvasObject, params);
      break;

    case 'image':
      addImageProperties(canvasObject, params);
      break;

    case 'group':
      // Groups don't need type-specific properties beyond base
      break;
  }
}

/**
 * Add rectangle-specific properties
 */
function addRectangleProperties(
  canvasObject: Record<string, unknown>,
  params: BuildObjectParams
): void {
  if (!params.dimensions) {
    throw new Error('Rectangle requires dimensions (width, height)');
  }
  canvasObject.width = params.dimensions.width;
  canvasObject.height = params.dimensions.height;
  canvasObject.fill = params.appearance.fill || '#cccccc';
}

/**
 * Add circle-specific properties
 */
function addCircleProperties(
  canvasObject: Record<string, unknown>,
  params: BuildObjectParams
): void {
  if (!params.radius) {
    throw new Error('Circle requires radius');
  }
  canvasObject.radius = params.radius;
  canvasObject.fill = params.appearance.fill || '#cccccc';
}

/**
 * Add text-specific properties
 */
function addTextProperties(
  canvasObject: Record<string, unknown>,
  params: BuildObjectParams
): void {
  if (!params.text) {
    throw new Error('Text requires text content');
  }
  if (!params.dimensions) {
    throw new Error('Text requires dimensions (width, height)');
  }
  canvasObject.text = params.text;
  canvasObject.fontSize = params.fontSize || 24;
  canvasObject.fontFamily = params.fontFamily || 'Inter';
  canvasObject.width = params.dimensions.width;
  canvasObject.height = params.dimensions.height;
  canvasObject.fill = params.appearance.fill || '#000000';
}

/**
 * Add line-specific properties
 */
function addLineProperties(
  canvasObject: Record<string, unknown>,
  params: BuildObjectParams
): void {
  if (!params.points) {
    throw new Error('Line requires points array [x1, y1, x2, y2]');
  }
  canvasObject.points = params.points;
  // Calculate width (length) from points
  const [x1, y1, x2, y2] = params.points;
  canvasObject.width = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  canvasObject.stroke = params.appearance.stroke || '#000000';
  canvasObject.strokeWidth = params.appearance.strokeWidth || 2;
}

/**
 * Add image-specific properties
 */
function addImageProperties(
  canvasObject: Record<string, unknown>,
  params: BuildObjectParams
): void {
  if (!params.imageUrl) {
    throw new Error('Image requires imageUrl');
  }
  if (!params.dimensions) {
    throw new Error('Image requires dimensions (width, height)');
  }
  if (!params.naturalWidth || !params.naturalHeight) {
    throw new Error('Image requires naturalWidth and naturalHeight');
  }
  if (!params.fileName) {
    throw new Error('Image requires fileName');
  }
  if (params.fileSize === undefined) {
    throw new Error('Image requires fileSize');
  }
  if (!params.mimeType) {
    throw new Error('Image requires mimeType');
  }
  if (!params.storageType) {
    throw new Error('Image requires storageType');
  }

  // Use 'src' to match ImageObject interface (not 'imageUrl')
  canvasObject.src = params.imageUrl;
  canvasObject.width = params.dimensions.width;
  canvasObject.height = params.dimensions.height;
  canvasObject.naturalWidth = params.naturalWidth;
  canvasObject.naturalHeight = params.naturalHeight;
  canvasObject.fileName = params.fileName;
  canvasObject.fileSize = params.fileSize;
  canvasObject.mimeType = params.mimeType;
  canvasObject.storageType = params.storageType;
  canvasObject.lockAspectRatio = true; // Default to locked for images

  // Stroke properties (images don't need stroke by default)
  canvasObject.strokeWidth = 0;
  canvasObject.strokeEnabled = false;

  // Shadow properties (disabled by default)
  canvasObject.shadowColor = 'black';
  canvasObject.shadowBlur = 0;
  canvasObject.shadowOffsetX = 0;
  canvasObject.shadowOffsetY = 0;
  canvasObject.shadowOpacity = 1;
  canvasObject.shadowEnabled = false;

  // Optional: storagePath (only for 'storage' type)
  if (params.storagePath) {
    canvasObject.storagePath = params.storagePath;
  }
}

/**
 * Add appearance properties to canvas object
 *
 * @param canvasObject - The object being built
 * @param appearance - Appearance properties
 */
function addAppearanceProperties(
  canvasObject: Record<string, unknown>,
  appearance: BuildObjectParams['appearance']
): void {
  if (appearance.stroke) {
    canvasObject.stroke = appearance.stroke;
  }
  if (appearance.strokeWidth !== undefined) {
    canvasObject.strokeWidth = appearance.strokeWidth;
  }
  if (appearance.opacity !== undefined) {
    canvasObject.opacity = appearance.opacity;
  }
}
