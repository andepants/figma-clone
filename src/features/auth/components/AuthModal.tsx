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
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  /**
   * Toggles between login and signup modes
   */
  function toggleMode() {
    setMode(isLogin ? 'signup' : 'login');
  }

  /**
   * Handles successful authentication
   * Closes modal and redirects to projects page
   */
  function handleSuccess() {
    onClose();
    // Small delay to let modal close gracefully
    setTimeout(() => {
      navigate('/projects');
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

        {/* Render appropriate form based on mode */}
        <div className="py-4">
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
