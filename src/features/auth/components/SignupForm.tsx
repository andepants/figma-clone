/**
 * SignupForm Component
 *
 * Form for user registration with username, email, and password fields.
 * Includes validation for minimum username/password lengths.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Props for SignupForm component
 * @interface SignupFormProps
 * @property {(email: string, password: string, username: string) => Promise<void>} onSubmit - Callback for form submission
 * @property {() => void} [onSuccess] - Optional callback on successful signup
 */
interface SignupFormProps {
  onSubmit: (email: string, password: string, username: string) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * Signup form with username, email, and password fields
 * @param {SignupFormProps} props - Component props
 * @returns {JSX.Element} Signup form
 */
export function SignupForm({ onSubmit, onSuccess }: SignupFormProps) {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [validationErrors, setValidationErrors] = React.useState<{
    username?: string;
    password?: string;
  }>({});

  /**
   * Validates form fields
   * @returns {boolean} True if form is valid
   */
  function validateForm(): boolean {
    const errors: { username?: string; password?: string } = {};

    if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * Handles form submission
   * @param {React.FormEvent<HTMLFormElement>} e - Form event
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onSubmit(email, password, username);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles field blur to show validation errors
   */
  function handleBlur() {
    validateForm();
  }

  const isFormValid = username.trim().length >= 3 && email && password.length >= 6;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username field */}
      <div className="space-y-2">
        <Label htmlFor="signup-username">Username</Label>
        <Input
          id="signup-username"
          type="text"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={handleBlur}
          disabled={loading}
          required
          autoComplete="username"
          className={validationErrors.username ? 'border-error-500' : ''}
        />
        {validationErrors.username && (
          <p className="text-xs text-error-600">{validationErrors.username}</p>
        )}
      </div>

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          autoComplete="email"
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handleBlur}
          disabled={loading}
          required
          autoComplete="new-password"
          className={validationErrors.password ? 'border-error-500' : ''}
        />
        {validationErrors.password && (
          <p className="text-xs text-error-600">{validationErrors.password}</p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="text-sm text-error-600 bg-error-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading || !isFormValid}
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  );
}
