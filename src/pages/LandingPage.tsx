/**
 * Landing Page
 *
 * Entry point for unauthenticated users.
 * Displays app information and provides authentication access.
 * Features hero section, feature list, and professional layout.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Square } from 'lucide-react';
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-6xl w-full">
          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            CollabCanvas
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
            Real-time collaborative design canvas. Create together, instantly.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <button
              onClick={handleGoToCanvas}
              className="bg-primary-500 text-white px-8 py-4 rounded-lg hover:bg-primary-600 hover:shadow-lg transition-all duration-150 font-semibold text-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={currentUser ? 'Go to Canvas' : 'Get Started with CollabCanvas'}
            >
              {currentUser ? 'Go to Canvas' : 'Get Started'}
            </button>
            {!currentUser && (
              <button
                onClick={() => openAuthModal('login')}
                className="bg-white text-neutral-700 border border-neutral-300 px-8 py-4 rounded-lg hover:bg-neutral-50 hover:shadow transition-all duration-150 font-semibold text-lg focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                aria-label="Log in to CollabCanvas"
              >
                Log In
              </button>
            )}
          </div>

          {/* User greeting if logged in */}
          {currentUser && (
            <p className="mb-12 text-neutral-600 text-lg">
              Welcome back, {currentUser.username || currentUser.email}!
            </p>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1: Real-time Collaboration */}
            <div className="p-6 rounded-lg bg-white border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-primary-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Real-time Collaboration
              </h2>
              <p className="text-neutral-600">
                See changes instantly as your team works together
              </p>
            </div>

            {/* Feature 2: High Performance */}
            <div className="p-6 rounded-lg bg-white border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <Zap className="w-12 h-12 text-primary-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Blazing Fast
              </h2>
              <p className="text-neutral-600">
                Smooth 60 FPS canvas with 100+ objects
              </p>
            </div>

            {/* Feature 3: Simple Interface */}
            <div className="p-6 rounded-lg bg-white border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <Square className="w-12 h-12 text-primary-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Easy to Use
              </h2>
              <p className="text-neutral-600">
                Intuitive Figma-inspired design tools
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto text-center text-sm text-neutral-600">
          <div className="mb-2">
            <a
              href="https://github.com/andepants/figma-clone"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 underline focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            >
              View on GitHub
            </a>
          </div>
          <p>
            Built with React, Konva, and Firebase
          </p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} CollabCanvas. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </div>
  );
}

export default LandingPage;
