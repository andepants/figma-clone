/**
 * Zoom Dropdown Component
 *
 * Displays current zoom percentage and provides zoom controls:
 * - Text input for exact zoom percentage (auto-selected when opened)
 * - Zoom in/out buttons
 * - Zoom to fit
 * - Preset zoom levels (50%, 100%, 200%)
 * - Keyboard shortcut hints
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useCanvasStore } from '@/stores';

/**
 * ZoomDropdown Component
 *
 * Provides zoom control dropdown with current percentage display and preset options.
 *
 * @example
 * ```tsx
 * <ZoomDropdown />
 * ```
 */
export function ZoomDropdown() {
  const { zoom, zoomIn, zoomOut, zoomToFit, zoomTo } = useCanvasStore();

  // Calculate current zoom percentage
  const zoomPercentage = Math.round(zoom * 100);

  // Track dropdown open state for auto-select
  const [isOpen, setIsOpen] = useState(false);

  // Track input value separately from store for validation
  const [inputValue, setInputValue] = useState(String(zoomPercentage));

  // Ref for input element to auto-select on open
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when zoom changes externally
  useEffect(() => {
    setInputValue(String(zoomPercentage));
  }, [zoomPercentage]);

  // Auto-select input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Multiple strategies to ensure focus works reliably:

      // Strategy 1: Immediate attempt (sometimes works)
      inputRef.current.focus();
      inputRef.current.select();

      // Strategy 2: After current event loop (handles most cases)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);

      // Strategy 3: After animation frame (handles delayed rendering)
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });

      // Strategy 4: Double RAF (handles complex rendering)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        });
      });

      // Strategy 5: Final attempt after Radix animations complete (150ms)
      setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 150);
    }
  }, [isOpen]);

  /**
   * Handle zoom input change
   * Validates input to only allow numbers
   */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    // Allow empty string for clearing
    if (value === '') {
      setInputValue('');
      return;
    }

    // Only allow digits
    if (!/^\d+$/.test(value)) {
      return;
    }

    setInputValue(value);
  }

  /**
   * Handle zoom input submit (Enter key or blur)
   * Validates and applies zoom value
   */
  function handleInputSubmit() {
    const value = parseInt(inputValue, 10);

    // Validate: must be a number
    if (isNaN(value)) {
      // Reset to current zoom on invalid input
      setInputValue(String(zoomPercentage));
      return;
    }

    // Clamp to valid range (10% - 500%)
    const clampedValue = Math.max(10, Math.min(500, value));

    // Only apply if value actually changed
    const currentPercentage = Math.round(zoom * 100);
    if (clampedValue !== currentPercentage) {
      // Apply zoom
      zoomTo(clampedValue);
    }

    // Update input to clamped value if it was out of range
    if (clampedValue !== value) {
      setInputValue(String(clampedValue));
    }

    // Close dropdown
    setIsOpen(false);
  }

  /**
   * Handle input blur
   * Only submit if dropdown is still open (prevents double-submit on menu item click)
   */
  function handleInputBlur() {
    // Use setTimeout to check if a menu item was clicked
    // If menu item is clicked, dropdown will close first
    setTimeout(() => {
      if (isOpen) {
        handleInputSubmit();
      }
    }, 100);
  }

  /**
   * Handle input key down
   * Submit on Enter, close on Escape
   */
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(String(zoomPercentage));
      setIsOpen(false);
    }
    // Prevent arrow keys from triggering menu item navigation
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.stopPropagation();
    }
  }

  /**
   * Handle mouse down on input wrapper
   * Prevents dropdown from closing when clicking input
   */
  function handleInputWrapperMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
  }

  /**
   * Handle input click
   * Re-select text if already focused
   */
  function handleInputClick() {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <span className="font-mono">{zoomPercentage}%</span>
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48"
        onCloseAutoFocus={(e) => e.preventDefault()}
        // Disable focus trap loop so our input can receive focus
        onInteractOutside={(e) => {
          // Allow interactions outside
          const target = e.target as HTMLElement;
          // Don't close if clicking the input
          if (inputRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        {/* Zoom Input */}
        <div className="px-2 py-1.5" onMouseDown={handleInputWrapperMouseDown}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              onClick={handleInputClick}
              onFocus={(e) => {
                // Always select all text when focused
                e.target.select();
              }}
              className="w-full px-2 py-1 text-xs font-mono border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
              aria-label="Zoom percentage"
              autoComplete="off"
              spellCheck="false"
              tabIndex={0}
              autoFocus
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 pointer-events-none">
              %
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Zoom In */}
        <DropdownMenuItem onClick={zoomIn} className="text-xs">
          <ZoomIn className="w-3.5 h-3.5 mr-1.5" />
          <span>Zoom in</span>
          <span className="ml-auto text-[11px] text-gray-400">⌘+</span>
        </DropdownMenuItem>

        {/* Zoom Out */}
        <DropdownMenuItem onClick={zoomOut} className="text-xs">
          <ZoomOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Zoom out</span>
          <span className="ml-auto text-[11px] text-gray-400">⌘-</span>
        </DropdownMenuItem>

        {/* Zoom to Fit */}
        <DropdownMenuItem onClick={zoomToFit} className="text-xs">
          <Maximize className="w-3.5 h-3.5 mr-1.5" />
          <span>Zoom to fit</span>
          <span className="ml-auto text-[11px] text-gray-400">⇧1</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Preset: 50% */}
        <DropdownMenuItem onClick={() => zoomTo(50)} className="text-xs">
          Zoom to 50%
        </DropdownMenuItem>

        {/* Preset: 100% */}
        <DropdownMenuItem onClick={() => zoomTo(100)} className="text-xs">
          <span>Zoom to 100%</span>
          <span className="ml-auto text-[11px] text-gray-400">⌘0</span>
        </DropdownMenuItem>

        {/* Preset: 200% */}
        <DropdownMenuItem onClick={() => zoomTo(200)} className="text-xs">
          Zoom to 200%
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
