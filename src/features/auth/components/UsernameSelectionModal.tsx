/**
 * UsernameSelectionModal Component
 *
 * Modal for Google sign-in users to select their username.
 * Triggered when a user signs in with Google for the first time.
 * Provides real-time username validation and availability checking.
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';

/**
 * Props for UsernameSelectionModal component
 * @interface UsernameSelectionModalProps
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {string} suggestedUsername - Pre-filled username from Google profile
 * @property {(username: string) => Promise<void>} onSubmit - Callback when username is selected
 * @property {boolean} [loading] - Loading state during submission
 */
interface UsernameSelectionModalProps {
  isOpen: boolean;
  suggestedUsername: string;
  onSubmit: (username: string) => Promise<void>;
  loading?: boolean;
}

/**
 * Username selection modal for Google sign-in users
 * @param {UsernameSelectionModalProps} props - Component props
 * @returns {JSX.Element} Username selection modal dialog
 */
export function UsernameSelectionModal({
  isOpen,
  suggestedUsername,
  onSubmit,
  loading = false,
}: UsernameSelectionModalProps) {
  const [username, setUsername] = React.useState(suggestedUsername);
  const [error, setError] = React.useState('');

  // Real-time username validation with availability check
  const {
    isValid: isUsernameValid,
    isAvailable: isUsernameAvailable,
    validationMessage: usernameValidationMessage,
    validationState: usernameValidationState,
  } = useUsernameValidation(username);

  // Update username when suggestedUsername changes
  React.useEffect(() => {
    setUsername(suggestedUsername);
  }, [suggestedUsername]);

  /**
   * Handles form submission
   * @param {React.FormEvent<HTMLFormElement>} e - Form event
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    // Validate username
    if (!isUsernameValid || !isUsernameAvailable) {
      setError('Please choose a valid and available username');
      return;
    }

    try {
      await onSubmit(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set username');
    }
  }

  // Form is valid if username is valid AND available
  const isFormValid = isUsernameValid && isUsernameAvailable === true;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Choose Your Username</DialogTitle>
          <DialogDescription>
            Pick a unique username for your Canvas Icons account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Username field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
              autoFocus
              className={cn(
                usernameValidationState === 'available' &&
                  'border-green-500 focus:border-green-500',
                (usernameValidationState === 'taken' ||
                  usernameValidationState === 'invalid') &&
                  'border-red-500 focus:border-red-500'
              )}
            />
            {/* Real-time username validation feedback */}
            {usernameValidationMessage && (
              <p
                className={cn(
                  'text-xs',
                  usernameValidationState === 'available' && 'text-green-600',
                  (usernameValidationState === 'taken' ||
                    usernameValidationState === 'invalid') &&
                    'text-red-600',
                  usernameValidationState === 'checking' && 'text-gray-500'
                )}
              >
                {usernameValidationMessage}
              </p>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="text-sm text-error-600 bg-error-50 p-3 rounded-md">{error}</div>
          )}

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
            {loading ? 'Setting username...' : 'Continue'}
          </Button>

          {/* Info text */}
          <p className="text-xs text-center text-gray-500">
            You can change this later in your account settings
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
