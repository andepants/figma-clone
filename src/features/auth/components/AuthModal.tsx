/**
 * AuthModal Component
 *
 * Modal dialog for user authentication. Supports both login and signup modes
 * with toggle functionality between modes.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useAuth } from '../hooks/useAuth';
import type { AuthMode } from '@/types';

/**
 * Props for AuthModal component
 * @interface AuthModalProps
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {() => void} onClose - Callback when modal should close
 * @property {AuthMode} [initialMode='login'] - Initial authentication mode
 */
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

/**
 * Authentication modal with login/signup mode switching
 * @param {AuthModalProps} props - Component props
 * @returns {JSX.Element} Auth modal dialog
 */
export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  /**
   * Sync mode with initialMode when modal opens or initialMode changes
   */
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  /**
   * Toggles between login and signup modes
   */
  function toggleMode() {
    setMode(isLogin ? 'signup' : 'login');
  }

  /**
   * Handles successful authentication
   * Closes modal and redirects to intended destination or projects page
   */
  function handleSuccess() {
    onClose();
    // Small delay to let modal close gracefully
    setTimeout(() => {
      // Check for stored return URL from protected route redirect
      const returnUrl = sessionStorage.getItem('returnUrl');

      if (returnUrl) {
        // Clear the stored URL and redirect to it
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else {
        // Default to projects page
        navigate('/projects');
      }
    }, 150);
  }

  /**
   * Handles login submission
   */
  async function handleLogin(email: string, password: string) {
    await login(email, password);
  }

  /**
   * Handles signup submission
   */
  async function handleSignup(email: string, password: string, username: string) {
    await signup(email, password, username);
  }

  /**
   * Handles Google sign-in
   */
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      handleSuccess();
    } catch (error) {
      // Error is already handled by useAuth hook
      console.error('Google sign-in failed:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {isLogin
              ? 'Log in to continue to your canvas'
              : 'Sign up to start collaborating'}
          </DialogDescription>
        </DialogHeader>

        {/* Google Sign-In Button */}
        <div className="py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">Or continue with email</span>
            </div>
          </div>

          {/* Render appropriate form based on mode */}
          {isLogin ? (
            <LoginForm onSubmit={handleLogin} onSuccess={handleSuccess} />
          ) : (
            <SignupForm onSubmit={handleSignup} onSuccess={handleSuccess} />
          )}
        </div>

        {/* Mode toggle button */}
        <div className="flex items-center justify-center border-t pt-4">
          <p className="text-sm text-neutral-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <Button
            variant="link"
            onClick={toggleMode}
            className="ml-1 p-0 h-auto font-semibold text-primary-500"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
