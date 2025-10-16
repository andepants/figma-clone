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
  actions?: any[];
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
 * Hook for interacting with AI canvas agent
 * Sends commands to Firebase Function and manages state
 * @returns {UseAIAgentReturn} AI agent interface
 */
export function useAIAgent(): UseAIAgentReturn {
  const { isProcessing, setProcessing, addCommand, updateCommand } = useAIStore();
  const { objects, selectedIds, zoom, panX, panY } = useCanvasStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Send natural language command to AI agent
   * Creates command entry, sends to backend, updates state
   * @param {string} command - User's natural language command
   */
  const sendCommand = useCallback(
    async (command: string) => {
      if (isProcessing || !command.trim()) return;

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
        const canvasId = 'main';
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
          console.log('✅ AI command success:', result.data.message);
        } else {
          throw new Error(result.data.error || 'Command failed');
        }
      } catch (err: any) {
        console.error('❌ AI command error:', err);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          details: err.details,
          stack: err.stack,
          fullError: JSON.stringify(err, null, 2),
        });

        // Extract detailed error info
        let errorMessage = err.message || 'Unknown error occurred';

        // Add code if available (e.g., 'internal', 'unauthenticated', etc.)
        if (err.code) {
          errorMessage = `[${err.code}] ${errorMessage}`;
        }

        // Add details if available
        if (err.details) {
          errorMessage += ` (Details: ${JSON.stringify(err.details)})`;
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
    [isProcessing, objects, selectedIds, zoom, panX, panY, setProcessing, addCommand, updateCommand]
  );

  return {
    sendCommand,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
