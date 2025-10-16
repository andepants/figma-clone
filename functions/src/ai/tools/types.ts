/**
 * Type definitions for canvas tools
 */

import {CanvasObject} from "../../types";
import {ViewportBounds} from "../utils/viewport-calculator";

/**
 * Context provided to all canvas tools
 */
export interface CanvasToolContext {
  /** Canvas document ID */
  canvasId: string;

  /** Authenticated user ID */
  userId: string;

  /** Current canvas objects for context */
  currentObjects: CanvasObject[];

  /** Canvas dimensions */
  canvasSize: {
    width: number;
    height: number;
  };

  /** Currently selected object IDs */
  selectedObjectIds: string[];

  /** Viewport bounds for spatial awareness (optional) */
  viewportBounds?: ViewportBounds;

  /** Last created object IDs from conversation memory (optional) */
  lastCreatedObjectIds?: string[];
}

/**
 * Result returned by tool execution
 */
export interface ToolResult {
  /** Whether operation succeeded */
  success: boolean;

  /** Human-readable message about what was done */
  message: string;

  /** IDs of objects created (if any) */
  objectsCreated?: string[];

  /** IDs of objects modified (if any) */
  objectsModified?: string[];

  /** IDs of objects deleted (if any) */
  objectsDeleted?: string[];

  /** Error message if success=false */
  error?: string;

  /** Additional data (e.g., new object details) */
  data?: any;
}
