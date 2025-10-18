/**
 * PricingHero Component
 *
 * Hero section with main CTA for upgrading.
 * Includes lock icon, headline, and prominent upgrade button.
 *
 * Design: Apple-inspired, clean, centered, ample whitespace
 */

import { Lock } from 'lucide-react';

interface PricingHeroProps {
  onUpgrade: () => void;
  isLoading?: boolean;
  showFoundersOffer: boolean; // Hide after 10 users
}

/**
 * Hero section for pricing page with main conversion CTA.
 * Displays lock icon, headline, subheadline, and upgrade button.
 * Shows founders pricing badge when available.
 *
 * @example
 * ```tsx
 * <PricingHero
 *   onUpgrade={handleUpgrade}
 *   isLoading={false}
 *   showFoundersOffer={true}
 * />
 * ```
 */
export function PricingHero({ onUpgrade, isLoading = false, showFoundersOffer }: PricingHeroProps) {
  return (
    <div className="text-center py-16 px-6 bg-gradient-to-b from-white to-gray-50">
      {/* Lock Icon */}
      <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
        <Lock className="w-10 h-10 text-blue-600" />
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 px-2">
        Upgrade to Create Projects
      </h1>

      {/* Subheadline */}
      <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-2">
        Free users can join and collaborate on public projects.
        Upgrade to create unlimited projects of your own.
      </p>

      {/* CTA Button */}
      <button
        onClick={onUpgrade}
        disabled={isLoading}
        className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Upgrade to Continue'}
      </button>

      {/* Pricing */}
      <p className="mt-4 text-gray-600">
        From {showFoundersOffer ? '$10' : '$60'}/year • Cancel anytime
      </p>

      {/* Founders Badge (if applicable) */}
      {showFoundersOffer && (
        <div className="mt-4 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
          ⚡ Founders Pricing - First 10 Users Only
        </div>
      )}
    </div>
  );
}
