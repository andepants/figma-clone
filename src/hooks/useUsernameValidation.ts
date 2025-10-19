/**
 * Username Validation Hook
 *
 * Custom React hook for real-time username validation and availability checking.
 * Provides debounced validation with format checking and Firebase availability lookup.
 *
 * Features:
 * - Format validation (3-20 chars, alphanumeric + underscores only)
 * - Debounced availability checking (500ms)
 * - Real-time visual feedback states
 * - Instagram-style validation UX
 *
 * @example
 * const { isValid, isChecking, isAvailable, validationMessage, validationState } = useUsernameValidation(username);
 */

import { useState, useEffect } from 'react';
import { validateUsername } from '@/types/subscription.types';
import { isUsernameAvailable } from '@/lib/firebase/usersService';

/**
 * Validation state for UI feedback
 */
export type ValidationState =
  | 'idle'        // No input yet or empty
  | 'checking'    // Checking availability
  | 'available'   // Valid and available
  | 'taken'       // Valid but taken
  | 'invalid';    // Format invalid

/**
 * Return type for useUsernameValidation hook
 */
export interface UsernameValidationResult {
  /** Whether username format is valid */
  isValid: boolean;
  /** Whether availability check is in progress */
  isChecking: boolean;
  /** Whether username is available (null if not checked yet) */
  isAvailable: boolean | null;
  /** User-facing validation message */
  validationMessage: string;
  /** Current validation state for UI styling */
  validationState: ValidationState;
}

/**
 * Hook for username validation and availability checking
 *
 * @param username - Username to validate
 * @param debounceMs - Debounce delay in milliseconds (default: 500ms)
 * @returns Validation result with state and messages
 */
export function useUsernameValidation(
  username: string,
  debounceMs: number = 500
): UsernameValidationResult {
  const [isValid, setIsValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('idle');

  useEffect(() => {
    // Reset state if username is empty
    if (!username || username.trim().length === 0) {
      setIsValid(false);
      setIsChecking(false);
      setIsAvailable(null);
      setValidationMessage('');
      setValidationState('idle');
      return;
    }

    // Step 1: Validate username format immediately
    const formatValidation = validateUsername(username);

    if (!formatValidation.valid) {
      setIsValid(false);
      setIsChecking(false);
      setIsAvailable(null);
      setValidationMessage(formatValidation.error || 'Invalid username');
      setValidationState('invalid');
      return;
    }

    // Format is valid, now check availability with debounce
    setIsValid(true);
    setIsChecking(true);
    setValidationMessage('Checking availability...');
    setValidationState('checking');

    // Debounce the availability check
    const timeoutId = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username);

        setIsChecking(false);
        setIsAvailable(available);

        if (available) {
          setValidationMessage(`✓ ${username} is available`);
          setValidationState('available');
        } else {
          setValidationMessage(`✗ ${username} is taken`);
          setValidationState('taken');
        }
      } catch (error) {
        // Handle error gracefully
        setIsChecking(false);
        setIsAvailable(null);
        setValidationMessage('Unable to check availability');
        setValidationState('invalid');
        console.error('Error checking username availability:', error);
      }
    }, debounceMs);

    // Cleanup: Cancel pending check if username changes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [username, debounceMs]);

  return {
    isValid,
    isChecking,
    isAvailable,
    validationMessage,
    validationState,
  };
}
