/**
 * useTextShapeState Hook
 *
 * Manages state logic for TextShape component including:
 * - Animation state
 * - Hover state
 * - Refs management
 * - Selection animations
 * - Display text calculation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type Konva from 'konva';
import type { Text as TextType } from '@/types';
import type { EditState } from '@/lib/firebase';
import { applyTextTransform } from '../../utils';

/**
 * Props for useTextShapeState hook
 */
interface UseTextShapeStateProps {
  /** Text object data */
  text: TextType;
  /** Whether text is currently selected */
  isSelected: boolean;
  /** Whether text is currently being edited locally */
  isEditing: boolean;
  /** Remote edit state from another user */
  editState?: EditState;
  /** Current user ID */
  currentUserId?: string;
}

/**
 * useTextShapeState hook
 *
 * Manages local state and refs for TextShape component.
 * Handles animations, hover effects, and display text calculation.
 *
 * @param {UseTextShapeStateProps} props - Hook props
 * @returns State values and refs
 */
export function useTextShapeState({
  text,
  isSelected,
  isEditing,
  editState,
  currentUserId,
}: UseTextShapeStateProps) {
  // Hover state for preview interaction
  const [isHovered, setIsHovered] = useState(false);

  // Refs for animation and editing
  const shapeRef = useRef<Konva.Text>(null);
  const animationRef = useRef<Konva.Tween | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  /**
   * Update stage ref when component mounts or text node changes
   */
  useEffect(() => {
    if (shapeRef.current) {
      stageRef.current = shapeRef.current.getStage();
    }
  }, []);

  /**
   * Animate selection changes
   * Smoothly transitions with a subtle scale pulse when selection state changes
   * Skip animation when text is being edited (text is invisible during edit)
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    // Check if node is attached to a layer before animating
    if (!node.getLayer()) return;

    // Cancel any previous animation to prevent buildup
    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }

    // Don't animate during editing (text is hidden anyway)
    if (isEditing) return;

    // Animate selection change
    if (isSelected) {
      // Animate to selected state (subtle scale pulse for Figma-style feedback)
      node.to({
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 0.1,
        onFinish: () => {
          // Return to normal scale
          node.to({
            scaleX: 1,
            scaleY: 1,
            duration: 0.1,
          });
        },
      });
    }
  }, [isSelected, isEditing]);

  /**
   * Determine if this text is being edited by a remote user
   */
  const isRemoteEditing = !!(editState && editState.userId !== currentUserId);

  /**
   * Get the text content to display
   * If another user is editing, show their live text
   * Otherwise show the persisted text (with transforms)
   */
  const getDisplayText = useCallback(() => {
    // If being edited by another user and we have live text, show it
    if (isRemoteEditing && editState.liveText !== undefined) {
      return editState.liveText;
    }

    // Otherwise show persisted text (transformed)
    return applyTextTransform(text.text, text.textTransform);
  }, [isRemoteEditing, editState, text.text, text.textTransform]);

  return {
    // State
    isHovered,
    setIsHovered,
    isRemoteEditing,

    // Refs
    shapeRef,
    animationRef,
    stageRef,

    // Computed values
    getDisplayText,
  };
}
