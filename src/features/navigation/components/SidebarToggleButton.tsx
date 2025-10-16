/**
 * Sidebar Toggle Button Component
 *
 * Figma-style button for toggling left sidebar visibility.
 * Shows sidebar layout icon that changes based on sidebar state.
 */

import { useUIStore } from '@/stores';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';

/**
 * Sidebar layout icon component
 *
 * Visual representation of sidebar layout.
 * Shows two panels: narrow left panel and wider right panel.
 * Left panel opacity changes based on sidebar state.
 */
function SidebarIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="3"
        y="3"
        width="7"
        height="18"
        rx="2"
        fill="currentColor"
        opacity={isOpen ? '1' : '0.3'}
      />
    </svg>
  );
}

/**
 * Sidebar toggle button component
 *
 * Renders a button that toggles the left sidebar.
 * Button states:
 * - Default: Transparent background
 * - Hover: Light gray background
 * - Icon shows filled left panel when open, faded when closed
 *
 * @example
 * ```tsx
 * <SidebarToggleButton />
 * ```
 */
export function SidebarToggleButton() {
  const { leftSidebarOpen, toggleLeftSidebar } = useUIStore();
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const toggleShortcut = isMac ? '⇧⌘\\' : 'Shift+Ctrl+\\';

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleLeftSidebar}
            className="
              flex items-center justify-center rounded-lg p-2
              bg-transparent text-neutral-700
              hover:bg-neutral-200
              transition-all duration-150
            "
            aria-label={leftSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <SidebarIcon isOpen={leftSidebarOpen} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">Toggle sidebar ({toggleShortcut})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
