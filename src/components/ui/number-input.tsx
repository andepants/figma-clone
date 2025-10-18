/**
 * Number Input Component
 *
 * A specialized input component for numeric values with:
 * - Increment/decrement buttons
 * - Keyboard support (arrow keys, page up/down, mouse wheel)
 * - Min/max validation
 * - Precision control
 * - Optional unit display
 */

import * as React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberInputProps {
  /** Current numeric value (null/undefined will be treated as 0) */
  value: number | null | undefined;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Increment/decrement step size (default: 1) */
  step?: number;
  /** Number of decimal places (default: 0) */
  precision?: number;
  /** Display unit (e.g., 'px', 'deg', '%') */
  unit?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
      precision = 0,
      unit,
      disabled,
      className,
      placeholder,
    },
    ref
  ) => {
    // Normalize null/undefined to 0 for display
    const safeValue = value ?? 0;

    const [internalValue, setInternalValue] = React.useState(safeValue.toFixed(precision));
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Sync internal value when external value changes
    React.useEffect(() => {
      if (!isFocused) {
        setInternalValue(safeValue.toFixed(precision));
      }
    }, [safeValue, precision, isFocused]);

    /**
     * Validate and clamp a numeric value
     */
    function validateAndClamp(numValue: number): number {
      let result = numValue;

      // Apply min/max constraints
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);

      // Round to precision
      const multiplier = Math.pow(10, precision);
      result = Math.round(result * multiplier) / multiplier;

      return result;
    }

    /**
     * Handle input change (typing)
     */
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      setInternalValue(e.target.value);
    }

    /**
     * Handle blur - validate and update
     */
    function handleBlur() {
      setIsFocused(false);

      const numValue = parseFloat(internalValue);

      // Handle invalid input - restore original value
      if (isNaN(numValue) || !isFinite(numValue)) {
        setInternalValue(safeValue.toFixed(precision));
        return;
      }

      // Validate and update
      const validated = validateAndClamp(numValue);
      onChange(validated);
      setInternalValue(validated.toFixed(precision));
    }

    /**
     * Handle focus
     */
    function handleFocus() {
      setIsFocused(true);
      // Select all text on focus for easy editing
      inputRef.current?.select();
    }

    /**
     * Increment value
     */
    function handleIncrement() {
      const newValue = validateAndClamp(safeValue + step);
      onChange(newValue);
    }

    /**
     * Decrement value
     */
    function handleDecrement() {
      const newValue = validateAndClamp(safeValue - step);
      onChange(newValue);
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        const newValue = validateAndClamp(safeValue + step * 10);
        onChange(newValue);
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        const newValue = validateAndClamp(safeValue - step * 10);
        onChange(newValue);
      } else if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    }

    /**
     * Handle mouse wheel
     */
    function handleWheel(e: React.WheelEvent<HTMLInputElement>) {
      // Only respond to wheel when focused
      if (document.activeElement === inputRef.current) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleIncrement();
        } else {
          handleDecrement();
        }
      }
    }

    // Check if at boundaries
    const isAtMin = min !== undefined && safeValue <= min;
    const isAtMax = max !== undefined && safeValue >= max;

    return (
      <div className={cn('relative flex items-center', className)}>
        {/* Input field */}
        <input
          ref={(node) => {
            // Support both forwarded ref and local ref
            inputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type="text"
          inputMode="decimal"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex h-7 w-full rounded-md border border-input bg-transparent px-1.5 py-1 text-xs',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'text-right', // Right-align numbers
            unit && 'pr-6' // Extra padding for unit
          )}
        />

        {/* Unit label */}
        {unit && (
          <span
            className={cn(
              'absolute right-6 text-[10px] text-muted-foreground pointer-events-none',
              disabled && 'opacity-50'
            )}
          >
            {unit}
          </span>
        )}

        {/* Increment/Decrement buttons */}
        <div className="flex flex-col ml-1">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || isAtMax}
            className={cn(
              'h-3 w-4 flex items-center justify-center',
              'rounded-sm border border-input bg-background',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'transition-colors'
            )}
            aria-label="Increment"
          >
            <ChevronUp className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || isAtMin}
            className={cn(
              'h-3 w-4 flex items-center justify-center',
              'rounded-sm border border-input bg-background',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'transition-colors'
            )}
            aria-label="Decrement"
          >
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
