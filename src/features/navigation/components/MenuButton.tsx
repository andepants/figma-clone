/**
 * Menu Button Component
 *
 * Figma-style menu button with dropdown for navigation and user actions.
 * Features a logo button that opens a dropdown menu with "Back to home" and "Log out".
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks';

/**
 * Menu button component
 *
 * Renders a button with grid icon and dropdown menu (Figma-style).
 * Button states:
 * - Default: Transparent background
 * - Hover: Light gray background
 * - Active/Open: Blue background with white icon
 *
 * Dropdown options:
 * - Back to home: Navigate to landing page
 * - Log out: Sign out current user
 *
 * @example
 * ```tsx
 * <MenuButton />
 * ```
 */
export function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            flex items-center justify-center rounded-lg p-2
            transition-all duration-150
            ${
              isOpen
                ? 'bg-[#0ea5e9] text-white'
                : 'bg-transparent text-neutral-700 hover:bg-neutral-200'
            }
          `}
          aria-label="Menu"
        >
          <LayoutGrid size={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={handleBackToHome}>
          Back to home
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
