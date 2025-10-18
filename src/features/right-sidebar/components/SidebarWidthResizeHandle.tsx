/**
 * SidebarWidthResizeHandle Component
 *
 * Draggable handle on left edge of right sidebar for resizing width.
 * Supports mouse drag and double-click reset.
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 240;

/**
 * SidebarWidthResizeHandle Component
 *
 * Provides draggable handle for resizing sidebar width.
 * - Mouse drag: Click and drag to resize horizontally
 * - Double-click: Reset to default 240px width
 * - Clamping: Limits resize to 240-480px range
 *
 * @returns {JSX.Element} Resize handle on left edge of sidebar
 */
export function SidebarWidthResizeHandle() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const { rightSidebarWidth, setRightSidebarWidth, setIsResizingRightSidebar } = useUIStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsResizingRightSidebar(true);
    setDragStartX(e.clientX);
    setDragStartWidth(rightSidebarWidth);
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    setRightSidebarWidth(DEFAULT_WIDTH); // Reset to default
  };

  // Global mouse move and mouse up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate how much the mouse moved from the initial drag position
      // Moving left (negative deltaX) increases width
      // Moving right (positive deltaX) decreases width
      const deltaX = e.clientX - dragStartX;
      const newWidth = dragStartWidth - deltaX; // Subtract because we're resizing from right edge

      // Clamp to min/max range
      const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setRightSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingRightSidebar(false);
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup on unmount or when dragging stops
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartWidth, setRightSidebarWidth, setIsResizingRightSidebar]);

  return (
    <div
      data-sidebar-width-resize-handle
      className={cn(
        "absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 cursor-ew-resize transition-all z-20",
        isDragging && "w-1.5 bg-blue-500"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="separator"
      aria-label="Resize sidebar width"
      aria-valuenow={rightSidebarWidth}
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
    />
  );
}
