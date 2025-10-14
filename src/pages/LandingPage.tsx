/**
 * Landing Page
 *
 * Entry point for unauthenticated users.
 * Displays app information and provides authentication access.
 * Features hero section, feature list, and professional layout.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Square, Twitter } from 'lucide-react';
import { AuthModal } from '@/features/auth/components';
import { useAuth } from '@/features/auth/hooks';
import { useSEO } from '@/hooks/useSEO';
import type { AuthMode } from '@/types';

function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Update SEO for landing page
  useSEO({
    title: 'CollabCanvas - Real-time Collaborative Design Tool | Figma Alternative',
    description: 'Free real-time collaborative canvas for design teams. Create, share, and collaborate on designs instantly with multiplayer editing, cursor tracking, and live presence. A modern Figma alternative built with React and Firebase.',
    keywords: 'collaborative design tool, real-time canvas, figma alternative, design collaboration, multiplayer design, web design tool, vector graphics editor, UI design tool, wireframing tool, prototyping tool',
    url: 'https://collabcanvas.app/',
    type: 'website',
  });

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
      {/* Navigation Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <Square className="w-6 h-6 text-primary-500" aria-hidden="true" />
            <span className="font-bold text-lg text-neutral-900">CollabCanvas</span>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <button
                onClick={handleGoToCanvas}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-3 py-2"
              >
                Open Canvas
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-500 rounded px-3 py-2"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="text-sm font-medium bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <article className="text-center max-w-6xl w-full">
          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Real-time Collaborative Design Tool
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
            Create, design, and collaborate with your team in real-time. A free, open-source alternative to Figma with live cursors, instant sync, and multiplayer editing.
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
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" aria-label="Key Features">
            {/* Feature 1: Real-time Collaboration */}
            <article className="p-6 rounded-lg bg-white border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-primary-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Real-time Collaboration
              </h2>
              <p className="text-neutral-600">
                See changes instantly as your team works together. Live cursors, presence indicators, and instant synchronization across all users.
              </p>
            </article>

            {/* Feature 2: High Performance */}
            <article className="p-6 rounded-lg bg-white border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <Zap className="w-12 h-12 text-primary-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                High Performance Canvas
              </h2>
              <p className="text-neutral-600">
                Built with Konva.js for smooth 60 FPS rendering. Handle hundreds of objects with optimized layers and throttled updates under 150ms.
              </p>
            </article>

            {/* Feature 3: Simple Interface */}
            <article className="p-6 rounded-lg bg-white border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <Square className="w-12 h-12 text-primary-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Figma-Inspired Design
              </h2>
              <p className="text-neutral-600">
                Intuitive interface with familiar tools. Create shapes, text, and complex designs with keyboard shortcuts and a minimalist toolbar.
              </p>
            </article>
          </section>

          {/* Additional SEO Content */}
          <section className="max-w-3xl mx-auto text-left space-y-8 px-6" aria-label="About CollabCanvas">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">Why Choose CollabCanvas?</h2>
              <p className="text-neutral-600 leading-relaxed">
                CollabCanvas is a free, open-source design tool built for modern teams. Whether you're prototyping interfaces,
                creating wireframes, or collaborating on visual designs, CollabCanvas provides a seamless real-time experience
                similar to Figma but with transparent architecture and full control over your data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">Built with Modern Technology</h2>
              <p className="text-neutral-600 leading-relaxed">
                Powered by React 19, Firebase Realtime Database, and Konva.js canvas rendering. Our architecture prioritizes
                performance with vertical slice design, Zustand state management, and optimized real-time synchronization.
                Every interaction is designed to feel instant and responsive.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">Perfect for Teams & Individuals</h2>
              <p className="text-neutral-600 leading-relaxed">
                Start designing immediately with no installation required. Share your canvas with teammates and see their cursors,
                selections, and edits in real-time. Perfect for remote teams, design reviews, brainstorming sessions, and
                collaborative design workflows.
              </p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto text-center text-sm text-neutral-600">
          <div className="mb-2 flex items-center justify-center gap-6">
            <a
              href="https://github.com/andepants/figma-clone"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 underline focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            >
              View on GitHub
            </a>
            <a
              href="https://x.com/andrewsheim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-2 py-1"
              aria-label="Follow on X (Twitter)"
            >
              <Twitter className="w-4 h-4" aria-hidden="true" />
              <span>Follow on X</span>
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
