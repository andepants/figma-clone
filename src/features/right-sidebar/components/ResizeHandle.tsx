/**
 * ResizeHandle Component
 *
 * Draggable divider between properties and AI sections.
 * Supports mouse drag, double-click reset, and keyboard control.
 */

import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

/**
 * ResizeHandle Component
 *
 * Provides draggable divider for resizing properties/AI split.
 * - Mouse drag: Click and drag to resize
 * - Double-click: Reset to default 60/40 split
 * - Clamping: Limits resize to 20-80% range
 *
 * @returns {JSX.Element} Resize handle divider
 */
export function ResizeHandle() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPercentage, setDragStartPercentage] = useState(0);
  const { aiPanelHeight, setAIPanelHeight, setIsResizingAIPanel } = useUIStore();
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsResizingAIPanel(true);
    setDragStartY(e.clientY);
    setDragStartPercentage(aiPanelHeight);
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    setAIPanelHeight(40); // Reset to default
  };

  // Global mouse move and mouse up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (!sidebar) return;

      const rect = sidebar.getBoundingClientRect();
      // Calculate how much the mouse moved from the initial drag position
      const deltaY = e.clientY - dragStartY;
      // Convert pixel movement to percentage change (negative because moving up increases AI height)
      const deltaPercentage = -(deltaY / rect.height) * 100;
      // Apply the delta to the starting percentage
      const newPercentage = dragStartPercentage + deltaPercentage;
      // Clamp to 20-80% range
      const clampedPercentage = Math.min(80, Math.max(20, newPercentage));

      setAIPanelHeight(clampedPercentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingAIPanel(false);
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup on unmount or when dragging stops
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartY, dragStartPercentage, setAIPanelHeight, setIsResizingAIPanel]);

  /**
   * Keyboard handler for arrow key resize
   * - Arrow Up: Increase AI height by 5% (max 80%)
   * - Arrow Down: Decrease AI height by 5% (min 20%)
   * - Home: Reset to default 40%
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Arrow up increases AI height by 5%
      setAIPanelHeight(Math.min(80, aiPanelHeight + 5));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Arrow down decreases AI height by 5%
      setAIPanelHeight(Math.max(20, aiPanelHeight - 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      // Home key resets to default 40%
      setAIPanelHeight(40);
    }
  };

  return (
    <div
      ref={handleRef}
      data-resize-handle
      className={cn(
        "h-1 bg-gray-200 hover:bg-blue-500 cursor-ns-resize transition-colors",
        isDragging && "bg-blue-500"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      role="separator"
      aria-label="Resize properties and AI sections"
      aria-valuenow={100 - aiPanelHeight}
      tabIndex={0}
    />
  );
}
