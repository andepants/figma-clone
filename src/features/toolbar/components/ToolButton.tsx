/**
 * Tool Button Component
 *
 * Reusable button component for toolbar items.
 * Supports active, disabled, loading, and hover states with consistent styling.
 */

import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';

interface ToolButtonProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Button label for accessibility */
  label: string;
  /** Tooltip text with optional keyboard shortcut */
  tooltip: string;
  /** Click handler */
  onClick: () => void;
  /** Whether button is in active state */
  isActive?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether button is in loading state (shows spinner) */
  loading?: boolean;
  /** Optional custom className for special styling (e.g., danger colors) */
  variant?: 'default' | 'danger';
}

/**
 * Tool Button
 *
 * Renders a toolbar button with icon, tooltip, and consistent styling.
 * Handles active, disabled, loading, and hover states automatically.
 * Shows a spinning loader when in loading state.
 *
 * @example
 * ```tsx
 * <ToolButton
 *   icon={Square}
 *   label="Rectangle tool"
 *   tooltip="Rectangle (R)"
 *   onClick={() => setActiveTool('rectangle')}
 *   isActive={activeTool === 'rectangle'}
 * />
 * ```
 */
export function ToolButton({
  icon: Icon,
  label,
  tooltip,
  onClick,
  isActive = false,
  disabled = false,
  loading = false,
  variant = 'default',
}: ToolButtonProps) {
  // Mobile: h-11 w-11 (44px - Apple touch target guideline)
  // Desktop (md+): h-10 w-10 (40px - more compact)
  const baseClasses = 'group relative flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-md transition-all duration-150 ease-out';

  // Button is disabled if explicitly disabled OR if loading
  const isDisabled = disabled || loading;

  const variantClasses = {
    default: isActive
      ? 'bg-primary-500 text-white'
      : isDisabled
      ? 'text-neutral-300 cursor-not-allowed opacity-50'
      : 'text-neutral-700 hover:bg-neutral-100 hover:scale-105 active:scale-95',
    danger: isDisabled
      ? 'text-neutral-300 cursor-not-allowed opacity-50'
      : 'text-red-500 hover:bg-red-50 hover:scale-105 active:scale-95',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={isDisabled}
          className={`${baseClasses} ${variantClasses[variant]}`}
          aria-label={label}
          aria-pressed={isActive}
          aria-disabled={isDisabled}
          aria-busy={loading}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Icon size={20} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-sm">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
