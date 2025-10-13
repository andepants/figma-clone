/**
 * Landing Page
 *
 * Entry point for unauthenticated users.
 * Displays app information and provides authentication access.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '@/features/auth/components';
import { useAuth } from '@/features/auth/hooks';
import type { AuthMode } from '@/types';

function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  /**
   * Opens auth modal in specified mode
   */
  function openAuthModal(mode: AuthMode) {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }

  /**
   * Closes auth modal
   */
  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  /**
   * Navigate to canvas if user is authenticated
   */
  function handleGoToCanvas() {
    if (currentUser) {
      navigate('/canvas');
    } else {
      openAuthModal('login');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-neutral-900 mb-6">CollabCanvas</h1>
        <p className="text-lg text-neutral-600 mb-10">
          A real-time collaborative canvas application built with React, Firebase, and Konva.
          Create, collaborate, and bring your ideas to life.
        </p>

        {/* Auth CTAs */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleGoToCanvas}
            className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            {currentUser ? 'Go to Canvas' : 'Get Started'}
          </button>
          {!currentUser && (
            <button
              onClick={() => openAuthModal('login')}
              className="bg-white text-neutral-700 border border-neutral-300 px-8 py-3 rounded-lg hover:bg-neutral-50 transition-colors font-semibold"
            >
              Log In
            </button>
          )}
        </div>

        {/* User greeting if logged in */}
        {currentUser && (
          <p className="mt-6 text-neutral-600">
            Welcome back, {currentUser.username || currentUser.email}!
          </p>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </div>
  )
}

export default LandingPage
