/**
 * Type definitions for AI Canvas Agent functions
 */

/**
 * Request payload for processAICommand callable function
 */
export interface ProcessAICommandRequest {
  /** Natural language command from user */
  command: string;

  /** Canvas document ID */
  canvasId: string;

  /** Current canvas state for context */
  canvasState: {
    /** All canvas objects */
    objects: CanvasObject[];

    /** Currently selected object IDs */
    selectedObjectIds: string[];

    /** Canvas dimensions */
    canvasSize: {
      width: number;
      height: number;
    };

    /** User's current viewport (camera position and zoom) - optional for backward compatibility */
    viewport?: {
      camera: { x: number; y: number };
      zoom: number;
    };
  };

  /** Thread ID for conversation persistence - optional, will be generated if not provided */
  threadId?: string;
}

/**
 * Response from processAICommand callable function
 */
export interface ProcessAICommandResponse {
  /** Whether command was processed successfully */
  success: boolean;

  /** Human-readable message about what was done */
  message: string;

  /** Actions taken (tool calls made) */
  actions?: AIAction[];

  /** Error message if success=false */
  error?: string;
}

/**
 * Simplified canvas object for AI context
 */
export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  name?: string;
  locked?: boolean;
  visible?: boolean;
  parentId?: string | null;
  /** Whether this object was created by AI */
  aiGenerated?: boolean;
  /** Timestamp when object was created (for AI context prioritization) */
  createdAt?: number;
}

/**
 * Canvas state structure
 */
export interface CanvasState {
  objects: CanvasObject[];
  selectedObjectIds: string[];
  canvasSize: {
    width: number;
    height: number;
  };
  /** User's current viewport (optional) */
  viewport?: {
    camera: { x: number; y: number };
    zoom: number;
  };
  /** Internal field: viewport bounds calculated from viewport data */
  _viewportBounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    centerX: number;
    centerY: number;
  };
}

/**
 * AI action/tool call result
 */
export interface AIAction {
  /** Tool name that was called */
  tool: string;

  /** Parameters passed to tool */
  params: Record<string, unknown>;

  /** Result of tool execution */
  result?: Record<string, unknown>;

  /** Error if tool failed */
  error?: string;
}
