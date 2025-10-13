/**
 * LoginForm Component
 *
 * Form for user login with email and password fields.
 * Handles form validation and submission state.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Props for LoginForm component
 * @interface LoginFormProps
 * @property {(email: string, password: string) => Promise<void>} onSubmit - Callback for form submission
 * @property {() => void} [onSuccess] - Optional callback on successful login
 */
interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * Login form with email and password fields
 * @param {LoginFormProps} props - Component props
 * @returns {JSX.Element} Login form
 */
export function LoginForm({ onSubmit, onSuccess }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  /**
   * Handles form submission
   * @param {React.FormEvent<HTMLFormElement>} e - Form event
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(email, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
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
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          autoComplete="current-password"
        />
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
        disabled={loading || !email || !password}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
