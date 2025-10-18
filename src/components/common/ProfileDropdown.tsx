/**
 * ProfileDropdown Component
 *
 * Displays user profile information in a dropdown menu.
 * Shows username and logout button.
 *
 * @example
 * ```tsx
 * <ProfileDropdown
 *   username="john.doe"
 *   onLogout={handleLogout}
 * />
 * ```
 */

import { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';

/**
 * ProfileDropdown component props
 */
interface ProfileDropdownProps {
  /** Username to display */
  username: string;
  /** Logout callback */
  onLogout: () => void;
}

/**
 * Profile dropdown component with username and logout action.
 * Displays a user icon that opens a dropdown menu when clicked.
 *
 * @param {ProfileDropdownProps} props - Component props
 * @returns {JSX.Element} ProfileDropdown component
 */
export function ProfileDropdown({ username, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Handle logout click
   */
  function handleLogout() {
    setIsOpen(false);
    onLogout();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <User className="w-5 h-5 text-gray-700" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Username Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {username}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
