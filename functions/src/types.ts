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
  };
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
}

/**
 * AI action/tool call result
 */
export interface AIAction {
  /** Tool name that was called */
  tool: string;

  /** Parameters passed to tool */
  params: Record<string, any>;

  /** Result of tool execution */
  result?: any;

  /** Error if tool failed */
  error?: string;
}
