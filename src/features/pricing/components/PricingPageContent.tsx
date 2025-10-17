/**
 * PricingPageContent Component
 *
 * Full pricing page layout for free users.
 * Composes Hero, Benefits, and FAQ sections.
 */

import { PricingHero } from './PricingHero';
import { BenefitsList } from './BenefitsList';
import { PricingFAQ } from './PricingFAQ';

interface PricingPageContentProps {
  onUpgrade: () => void;
  isLoading?: boolean;
  showFoundersOffer: boolean;
}

/**
 * Container component that composes all pricing sections.
 * Shows hero, benefits, FAQ, and bottom CTA.
 * Used on Projects page for free users.
 *
 * @example
 * ```tsx
 * <PricingPageContent
 *   onUpgrade={handleUpgrade}
 *   isLoading={false}
 *   showFoundersOffer={paidUserCount < 10}
 * />
 * ```
 */
export function PricingPageContent({ onUpgrade, isLoading = false, showFoundersOffer }: PricingPageContentProps) {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <PricingHero
        onUpgrade={onUpgrade}
        isLoading={isLoading}
        showFoundersOffer={showFoundersOffer}
      />

      {/* Benefits Section */}
      <BenefitsList />

      {/* FAQ Section */}
      <PricingFAQ />

      {/* Bottom CTA */}
      <div className="py-16 px-6 text-center bg-gradient-to-t from-white to-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to get started?
        </h2>
        <button
          onClick={onUpgrade}
          disabled={isLoading}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Upgrade to Continue'}
        </button>
        <p className="mt-4 text-gray-600">
          From {showFoundersOffer ? '$10' : '$60'}/year • Cancel anytime
        </p>
      </div>
    </div>
  );
}
