/**
 * useAIAgent Hook
 *
 * Custom hook for sending AI commands to Firebase Functions and managing
 * command processing state. Encapsulates all AI agent API logic.
 */

import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { useAIStore } from '@/stores';
import { useCanvasStore } from '@/stores';
import { v4 as uuidv4 } from 'uuid';

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
  };
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
  const { objects, selectedIds } = useCanvasStore();
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
        };

        // Call Firebase Function
        const result = await processAICommand({
          command,
          canvasId: 'main', // Must match the canvas ID in CanvasPage.tsx subscription
          canvasState,
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
        const errorMessage = err.message || 'Unknown error occurred';
        setError(errorMessage);
        updateCommand(commandId, {
          status: 'error',
          error: errorMessage,
        });
      } finally {
        setProcessing(false);
      }
    },
    [isProcessing, objects, selectedIds, setProcessing, addCommand, updateCommand]
  );

  return {
    sendCommand,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
