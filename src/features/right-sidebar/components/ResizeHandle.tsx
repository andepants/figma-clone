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
  const { aiPanelHeight, setAIPanelHeight } = useUIStore();
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
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
      const y = e.clientY - rect.top;
      // Calculate percentage from bottom (AI panel height)
      const percentage = ((rect.height - y) / rect.height) * 100;
      // Clamp to 20-80% range
      const clampedPercentage = Math.min(80, Math.max(20, percentage));

      setAIPanelHeight(clampedPercentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup on unmount or when dragging stops
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setAIPanelHeight]);

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
