/**
 * Menu Button Component
 *
 * Figma-style menu button with dropdown for navigation and user actions.
 * Features a logo button that opens a dropdown menu with "Back to home" and "Log out".
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { FigmaLogo } from '@/components/ui/figma-logo';
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
 * Renders a button with Figma logo and dropdown menu.
 * Button states:
 * - Default: Gray text on transparent background
 * - Hover: Light gray background
 * - Active/Open: Blue background with white text
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
    } catch (error) {
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            flex items-center gap-1.5 rounded-lg px-3 py-2
            transition-all duration-150
            ${
              isOpen
                ? 'bg-[#0ea5e9] text-white'
                : 'bg-transparent text-neutral-700 hover:bg-neutral-200'
            }
          `}
          aria-label="Menu"
        >
          <FigmaLogo size={20} />
          <ChevronDown
            size={16}
            className={`
              transition-transform duration-200
              ${isOpen ? 'rotate-180' : 'rotate-0'}
            `}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleBackToHome}>
          Back to home
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
