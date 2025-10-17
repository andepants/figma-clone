/**
 * Landing Page
 *
 * Entry point for unauthenticated users.
 * Displays app information and provides authentication access.
 * Features hero section, feature list, and professional layout.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Square, Twitter } from 'lucide-react';
import { AuthModal } from '@/features/auth/components';
import { useAuth } from '@/features/auth/hooks';
import { useSEO } from '@/hooks/useSEO';
import { HeroSection, FeaturesSection, PricingTeaser, FAQSection } from '@/components/landing';
import type { AuthMode } from '@/types';

function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Update SEO for landing page
  useSEO({
    title: 'Canvas Icons - Design App Icons & Graphics That Convert | $10/year',
    description: 'Create professional app icons, feature graphics, and screenshots with real-time collaboration. Start free or upgrade to Pro for $10/year.',
    keywords: 'app icon design, feature graphic, app store screenshot, collaborative design, figma alternative, icon maker, graphic design tool',
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


  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <Square className="w-6 h-6 text-primary-500" aria-hidden="true" />
            <span className="font-bold text-lg text-neutral-900">Canvas Icons</span>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <button
                onClick={() => navigate('/projects')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-3 py-2"
              >
                Go to Projects
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
      <main className="flex-1">
        <HeroSection onOpenAuth={openAuthModal} />

        {/* Features Section */}
        <FeaturesSection />

        {/* Pricing Teaser */}
        <PricingTeaser onOpenAuth={openAuthModal} />

        {/* FAQ Section */}
        <FAQSection />

        {/* Additional SEO Content */}
        <section className="max-w-3xl mx-auto text-left space-y-8 px-6 pb-16" aria-label="About Canvas Icons">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Why Choose Canvas Icons?</h2>
            <p className="text-neutral-600 leading-relaxed">
              Canvas Icons is a free, open-source design tool built for modern teams. Whether you're prototyping interfaces,
              creating wireframes, or collaborating on visual designs, Canvas Icons provides a seamless real-time experience
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
            &copy; {new Date().getFullYear()} Canvas Icons. All rights reserved.
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
