/**
 * Navigation Header Component
 *
 * Provides menu button and sidebar toggle as separate components.
 * Features tooltips and keyboard shortcuts.
 * Inspired by modern design tools like Figma.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

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
 * Menu button component
 *
 * Displays layers icon with dropdown menu.
 * Features "Back to home" and "Log out" options.
 *
 * @example
 * ```tsx
 * <MenuButton />
 * ```
 */
export function MenuButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  /**
   * Handle navigation to home page
   */
  function handleBackToHome() {
    navigate('/');
  }

  /**
   * Handle user logout
   * Signs out the user and redirects to home
   */
  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch {
      // Silently fail - error handled by auth system
    }
  }

  return (
    <TooltipProvider delayDuration={500}>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center justify-center p-2 rounded-lg',
                  'transition-colors duration-150',
                  'border border-neutral-300 bg-white shadow-sm',
                  isMenuOpen
                    ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
                aria-label="Menu"
              >
                <Layers size={20} />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <p>Menu</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={handleBackToHome}>
            Back to home
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

/**
 * Sidebar toggle button component
 *
 * Toggles left sidebar visibility with keyboard shortcut.
 * Shows different states when sidebar is open/closed.
 *
 * @example
 * ```tsx
 * <SidebarToggleButton />
 * ```
 */
export function SidebarToggleButton() {
  const { leftSidebarOpen, toggleLeftSidebar } = useUIStore();
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const minimizeShortcut = isMac ? '⇧⌘\\' : 'Shift+Ctrl+\\';

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleLeftSidebar}
            className={cn(
              'flex items-center justify-center p-2 rounded-lg',
              'transition-colors duration-150',
              'border border-neutral-300 bg-white shadow-sm',
              'text-neutral-700 hover:bg-neutral-100'
            )}
            aria-label={leftSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <SidebarIcon isOpen={leftSidebarOpen} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <div className="flex items-center gap-2">
            <span>Minimize UI</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-neutral-700 rounded border border-neutral-600">
              {minimizeShortcut}
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Legacy combined component (deprecated - use MenuButton and SidebarToggleButton separately)
 * @deprecated
 */
export function NavigationHeader() {
  return (
    <div className="flex items-center gap-2">
      <MenuButton />
      <SidebarToggleButton />
    </div>
  );
}
