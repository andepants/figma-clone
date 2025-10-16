/**
 * Context Menu Component
 *
 * Reusable right-click context menu with keyboard shortcuts display.
 * Positions itself near mouse click, prevents overflow off-screen.
 * Closes on click-away, Escape key, or action selection.
 *
 * @module ContextMenu
 */

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Context menu item configuration
 */
export interface ContextMenuItem {
  /** Item type - action shows clickable item, separator shows divider line */
  type?: 'action' | 'separator';
  /** Display text for action items */
  label?: string;
  /** Keyboard shortcut to display (e.g., '⌘C', 'Del') */
  shortcut?: string;
  /** Click handler for action items */
  onClick?: () => void;
  /** Whether item is disabled (grayed out, not clickable) */
  disabled?: boolean;
  /** Red text for destructive actions (e.g., Delete) */
  danger?: boolean;
}

/**
 * Context menu component props
 */
export interface ContextMenuProps {
  /** X coordinate for menu position (clientX from mouse event) */
  x: number;
  /** Y coordinate for menu position (clientY from mouse event) */
  y: number;
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * Context Menu Component
 *
 * Displays a dropdown menu at the specified coordinates with the provided items.
 * Automatically adjusts position to stay on screen.
 * Handles click-away and Escape key to close.
 *
 * @example
 * ```tsx
 * <ContextMenu
 *   x={100}
 *   y={200}
 *   items={[
 *     { label: 'Copy', shortcut: '⌘C', onClick: handleCopy },
 *     { type: 'separator' },
 *     { label: 'Delete', shortcut: 'Del', onClick: handleDelete, danger: true },
 *   ]}
 *   onClose={handleClose}
 * />
 * ```
 */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate adjusted position to prevent overflow
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if menu overflows right edge
    if (rect.right > viewportWidth) {
      menu.style.left = `${Math.max(0, viewportWidth - rect.width - 8)}px`;
    }

    // Adjust vertical position if menu overflows bottom edge
    if (rect.bottom > viewportHeight) {
      menu.style.top = `${Math.max(0, viewportHeight - rect.height - 8)}px`;
    }
  }, []);

  // Close on click-away
  useEffect(() => {
    function handleClickAway(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    // Add listener with slight delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickAway);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  /**
   * Handle action item click
   */
  function handleItemClick(item: ContextMenuItem) {
    if (item.disabled || !item.onClick) return;

    item.onClick();
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] bg-white border border-gray-200 rounded shadow-lg py-1"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        // Render separator
        if (item.type === 'separator') {
          return (
            <div
              key={`separator-${index}`}
              className="h-px bg-gray-200 my-1"
            />
          );
        }

        // Render action item
        return (
          <button
            key={item.label || index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={cn(
              'w-full px-3 py-1.5 text-left text-sm flex items-center justify-between gap-6',
              'transition-colors',
              item.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-100',
            )}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span
                className={cn(
                  'text-xs font-mono',
                  item.disabled
                    ? 'text-gray-300'
                    : 'text-gray-400',
                )}
              >
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
