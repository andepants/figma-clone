/**
 * HeroSection Component
 *
 * Landing page hero section with clear value proposition and visual hierarchy.
 * Features primary and secondary CTAs, responsive design, and user-aware messaging.
 *
 * UX Principles:
 * - Visual hierarchy: Largest text = most important (value prop)
 * - Progressive disclosure: Show features below, not overwhelm in hero
 * - Immediate feedback: CTA buttons have clear hover/focus states
 *
 * @param onOpenAuth - Callback to open auth modal with specified mode
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';

interface HeroSectionProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export function HeroSection({ onOpenAuth }: HeroSectionProps) {
  const { currentUser } = useAuth();

  return (
    <section className="relative pt-32 pb-20 px-4">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" />

      <div className="container mx-auto max-w-6xl text-center">
        {/* Primary value prop - largest text */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Design App Icons & Graphics
          <br />
          <span className="text-blue-600">That Convert</span>
        </h1>

        {/* Supporting copy - medium text */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Professional templates. Real-time collaboration. Export-ready files.
          <br />
          <span className="font-semibold">From $10/year.</span>
        </p>

        {/* CTA buttons - visual hierarchy (primary vs secondary) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {currentUser ? (
            /* Authenticated user - show "Go to Projects" */
            <Link
              to="/projects"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Projects
            </Link>
          ) : (
            /* Unauthenticated user - show "Get Started" */
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Social proof - smallest text, subtle */}
        <p className="mt-8 text-sm text-gray-500">
          Trusted by indie developers and design teams
        </p>
      </div>
    </section>
  );
}
