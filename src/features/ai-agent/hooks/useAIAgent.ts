/**
 * useAIAgent Hook
 *
 * Custom hook for sending AI commands to Firebase Functions and managing
 * command processing state. Encapsulates all AI agent API logic.
 */

import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { auth } from '@/lib/firebase/config';
import { useAIStore } from '@/stores';
import { useCanvasStore } from '@/stores';
import { v4 as uuidv4 } from 'uuid';
import { generateThreadId } from '@/lib/utils/threadId';
import { PUBLIC_PLAYGROUND_ID } from '@/config/constants';
import { cropAppIcon } from '@/lib/utils/appIconCrop';
import { isImageShape } from '@/types/canvas.types';
import { toast } from 'sonner';

/**
 * Response from processAICommand Firebase Function
 * @interface ProcessAICommandResponse
 * @property {boolean} success - Whether command succeeded
 * @property {string} message - Human-readable result message
 * @property {any[]} [actions] - List of actions performed
 * @property {string} [error] - Error message if command failed
 */
interface ProcessAICommandResponse {
  success: boolean;
  message: string;
  actions?: Array<{tool: string; params: Record<string, unknown>; result?: Record<string, unknown>}>;
  error?: string;
}

/**
 * Input for processAICommand Firebase Function
 * @interface ProcessAICommandInput
 * @property {string} command - User's natural language command
 * @property {string} canvasId - Current canvas ID
 * @property {object} canvasState - Current canvas state for context
 * @property {string} [threadId] - Thread ID for conversation persistence (optional)
 */
interface ProcessAICommandInput {
  command: string;
  canvasId: string;
  canvasState: {
    objects: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size?: { width?: number; height?: number; radius?: number };
      name?: string;
      visible?: boolean;
      locked?: boolean;
    }>;
    selectedObjectIds: string[];
    canvasSize: { width: number; height: number };
    /** User's current viewport (camera position and zoom) - optional */
    viewport?: {
      camera: { x: number; y: number };
      zoom: number;
    };
  };
  /** Thread ID for conversation persistence - optional */
  threadId?: string;
}

/**
 * useAIAgent hook return value
 * @interface UseAIAgentReturn
 * @property {function} sendCommand - Send command to AI agent
 * @property {boolean} isProcessing - Whether command is being processed
 * @property {string | null} error - Current error message
 * @property {function} clearError - Clear error message
 */
interface UseAIAgentReturn {
  sendCommand: (command: string) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * useAIAgent hook parameters
 * @interface UseAIAgentParams
 * @property {string} [projectId] - Current project ID (optional, used to block certain features in playground)
 */
interface UseAIAgentParams {
  projectId?: string;
}

/**
 * Hook for interacting with AI canvas agent
 * Sends commands to Firebase Function and manages state
 * @param {UseAIAgentParams} params - Hook parameters
 * @returns {UseAIAgentReturn} AI agent interface
 */
export function useAIAgent({ projectId }: UseAIAgentParams = {}): UseAIAgentReturn {
  const { isProcessing, setProcessing, addCommand, updateCommand } = useAIStore();
  const { objects, selectedIds, zoom, panX, panY, createProcessedImage } = useCanvasStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Send natural language command to AI agent
   * Creates command entry, sends to backend, updates state
   * Blocks image generation commands in public playground
   * @param {string} command - User's natural language command
   */
  const sendCommand = useCallback(
    async (command: string) => {
      if (isProcessing || !command.trim()) return;

      // Block image generation commands in public playground
      const isPlayground = projectId === PUBLIC_PLAYGROUND_ID;
      const isImageGeneration = command.trim().toLowerCase().startsWith('/icon') ||
                                 command.trim().toLowerCase().startsWith('/feature');

      if (isPlayground && isImageGeneration) {
        const errorMsg = 'Image generation is disabled in the public playground. Create your own project to use /icon and /feature commands.';
        setError(errorMsg);

        // Add failed command to history
        const commandId = uuidv4();
        addCommand({
          id: commandId,
          command,
          timestamp: Date.now(),
          status: 'error',
          error: errorMsg,
        });

        return;
      }

      // Handle /crop-appicon command client-side
      const isCropAppIconCommand = command.trim().toLowerCase().startsWith('/crop-appicon');

      if (isCropAppIconCommand) {
        // Validate selection
        if (selectedIds.length === 0) {
          const errorMsg = 'Please select an image to crop';
          setError(errorMsg);

          const commandId = uuidv4();
          addCommand({
            id: commandId,
            command,
            timestamp: Date.now(),
            status: 'error',
            error: errorMsg,
          });

          toast.error('No selection', {
            description: errorMsg,
            duration: 3000,
          });

          return;
        }

        if (selectedIds.length > 1) {
          const errorMsg = 'Please select only one image to crop';
          setError(errorMsg);

          const commandId = uuidv4();
          addCommand({
            id: commandId,
            command,
            timestamp: Date.now(),
            status: 'error',
            error: errorMsg,
          });

          toast.error('Multiple selections', {
            description: errorMsg,
            duration: 3000,
          });

          return;
        }

        // Get selected object
        const selectedObject = objects.find(obj => obj.id === selectedIds[0]);

        if (!selectedObject) {
          const errorMsg = 'Selected object not found';
          setError(errorMsg);

          const commandId = uuidv4();
          addCommand({
            id: commandId,
            command,
            timestamp: Date.now(),
            status: 'error',
            error: errorMsg,
          });

          toast.error('Object not found', {
            description: errorMsg,
            duration: 3000,
          });

          return;
        }

        if (!isImageShape(selectedObject)) {
          const errorMsg = 'Selected object is not an image. Please select a DALL-E generated app icon image.';
          setError(errorMsg);

          const commandId = uuidv4();
          addCommand({
            id: commandId,
            command,
            timestamp: Date.now(),
            status: 'error',
            error: errorMsg,
          });

          toast.error('Invalid selection', {
            description: errorMsg,
            duration: 3000,
          });

          return;
        }

        // All validation passed - execute crop workflow
        setProcessing(true);
        setError(null);

        const commandId = uuidv4();
        addCommand({
          id: commandId,
          command,
          timestamp: Date.now(),
          status: 'pending',
        });

        try {
          const userId = auth.currentUser?.uid;
          const canvasId = projectId || 'main';

          if (!userId) {
            throw new Error('User not authenticated');
          }

          const result = await cropAppIcon(
            selectedObject,
            canvasId,
            userId,
            createProcessedImage
          );

          if (result.success) {
            updateCommand(commandId, {
              status: 'success',
              response: 'App icon cropped and background removed successfully! New image created next to original.',
            });
          } else {
            throw new Error(result.error || 'Failed to crop app icon');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error('App icon crop error:', err);

          setError(errorMessage);
          updateCommand(commandId, {
            status: 'error',
            error: errorMessage,
          });
        } finally {
          setProcessing(false);
        }

        return;
      }

      setProcessing(true);
      setError(null);

      // Create command entry
      const commandId = uuidv4();
      addCommand({
        id: commandId,
        command,
        timestamp: Date.now(),
        status: 'pending',
      });

      try {
        // Get Firebase Function
        const processAICommand = httpsCallable<
          ProcessAICommandInput,
          ProcessAICommandResponse
        >(functions, 'processAICommand');

        // Generate thread ID for conversation persistence
        const userId = auth.currentUser?.uid || null;
        // Use projectId for canvas identification (defaults to 'main' for legacy support)
        const canvasId = projectId || 'main';
        const threadId = generateThreadId(userId, canvasId);

        // Prepare canvas state with proper type handling
        const canvasState = {
          objects: objects.map((obj) => {
            // Base properties for all objects
            const baseProps = {
              id: obj.id,
              type: obj.type,
              position: { x: obj.x, y: obj.y },
              name: obj.name,
              visible: obj.visible,
              locked: obj.locked,
            };

            // Add size based on object type
            if (obj.type === 'rectangle' || obj.type === 'text') {
              return {
                ...baseProps,
                size: { width: obj.width, height: obj.height },
              };
            } else if (obj.type === 'circle') {
              return {
                ...baseProps,
                size: { radius: obj.radius },
              };
            } else if (obj.type === 'line') {
              return {
                ...baseProps,
                size: { width: obj.width },
              };
            }

            return baseProps;
          }),
          selectedObjectIds: selectedIds,
          canvasSize: { width: 5000, height: 5000 }, // Standard canvas size
          // NEW: Include viewport data for spatial awareness
          viewport: {
            camera: { x: -panX / zoom, y: -panY / zoom }, // Convert pan to camera position
            zoom,
          },
        };

        // Call Firebase Function
        const result = await processAICommand({
          command,
          canvasId, // Must match the canvas ID in CanvasPage.tsx subscription
          canvasState,
          threadId, // NEW: Include thread ID for conversation persistence
        });

        // Handle response
        if (result.data.success) {
          updateCommand(commandId, {
            status: 'success',
            response: result.data.message,
          });
        } else {
          throw new Error(result.data.error || 'Command failed');
        }
      } catch (err: unknown) {
        console.error('❌ AI command error:', err);

        // Type guard for Firebase error
        const isFirebaseError = (e: unknown): e is {message?: string; code?: string; details?: unknown; stack?: string} => {
          return typeof e === 'object' && e !== null;
        };

        const error = isFirebaseError(err) ? err : {message: String(err)};

        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          stack: error.stack,
          fullError: JSON.stringify(error, null, 2),
        });

        // Extract detailed error info
        let errorMessage = error.message || 'Unknown error occurred';

        // Add code if available (e.g., 'internal', 'unauthenticated', etc.)
        if (error.code) {
          errorMessage = `[${error.code}] ${errorMessage}`;
        }

        // Add details if available
        if (error.details) {
          errorMessage += ` (Details: ${JSON.stringify(error.details)})`;
        }

        console.error('Final error message:', errorMessage);

        setError(errorMessage);
        updateCommand(commandId, {
          status: 'error',
          error: errorMessage,
        });
      } finally {
        setProcessing(false);
      }
    },
    [isProcessing, objects, selectedIds, zoom, panX, panY, setProcessing, addCommand, updateCommand, projectId, createProcessedImage]
  );

  return {
    sendCommand,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
