/**
 * @fileoverview Pricing tier cards with visual hierarchy.
 *
 * UX Principles:
 * - Visual Hierarchy: Pro tier most prominent (blue border, shadow, highlighted background)
 * - Reduce Cognitive Load: Only 2 options (Free vs Pro)
 * - Progressive Disclosure: Features shown with Check/X icons for quick scanning
 * - Immediate Feedback: Hover states on CTA buttons
 *
 * Features:
 * - Free tier: Gray border, white background, outline CTA
 * - Pro tier: Blue border, blue-50 background, filled CTA, "Best Value" badge
 * - Responsive: Side-by-side on desktop (md+), stacked on mobile
 * - Emphasized features: Bold text for key selling points
 *
 * @example
 * <PricingTiers />
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { redirectToCheckout } from '@/lib/stripe/checkout';

interface PricingFeature {
  text: string;
  included: boolean;
  emphasized?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  period?: string;
  originalPrice?: number;
  savings?: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    description: 'Perfect for trying out Canvas Icons',
    features: [
      { text: 'Join public projects', included: true },
      { text: 'All editing tools', included: true },
      { text: 'Export high-res files (PNG, SVG)', included: true },
      { text: 'Real-time collaboration', included: true },
      { text: 'Create your own projects', included: false },
      { text: 'Private projects', included: false },
    ],
    cta: 'Sign Up Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    period: 'year',
    description: 'Everything you need to create amazing designs',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited projects', included: true, emphasized: true },
      { text: 'Public & private projects', included: true },
      { text: 'All templates (icons, graphics, screenshots)', included: true },
      { text: 'Priority email support', included: true },
    ],
    cta: 'Get Started - $10',
    highlighted: true,
    badge: '🎯 Best Value',
  },
];

/**
 * Pricing tiers component with Free and Pro options
 * @returns Pricing tier cards
 */
export function PricingTiers() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFreeCTA = () => {
    // For Phase 2, just navigate to projects (will trigger auth if needed)
    navigate('/projects');
  };

  const handleProCTA = async () => {
    // Phase 5 - Stripe checkout integration
    if (!currentUser) {
      // User must sign in/up first
      navigate('/projects'); // Will redirect to auth
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceId = import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID;

      if (!priceId) {
        throw new Error('Stripe configuration missing. Please check environment variables.');
      }

      await redirectToCheckout(priceId, currentUser.email || '');
      // User will be redirected to Stripe, so this code won't continue
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start checkout. Please try again or contact support.'
      );
      setLoading(false);
    }
  };

  return (
    <section id="pricing-tiers" className="py-12 px-4" data-testid="pricing-tiers">
      <div className="max-w-5xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
            data-testid="checkout-error"
          >
            <p className="font-semibold">Payment Error</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm underline hover:no-underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              data-testid={`pricing-tier-${tier.id}`}
              className={cn(
                'rounded-lg p-8 relative',
                tier.highlighted
                  ? 'border-2 border-blue-500 bg-blue-50 shadow-xl'
                  : 'border-2 border-gray-200 bg-white'
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              {/* Tier Name */}
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {tier.name}
              </h2>

              {/* Price */}
              <div className="mb-6">
                {tier.price === null ? (
                  <>
                    <p className="text-4xl font-bold text-gray-900">$0</p>
                    <p className="text-gray-500">Forever free</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-gray-900">
                      ${tier.price}
                      <span className="text-lg font-normal text-gray-600">
                        /{tier.period}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Less than $1/month
                    </p>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6">{tier.description}</p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span
                      className={cn(
                        feature.included ? 'text-gray-700' : 'text-gray-400',
                        feature.emphasized && 'font-semibold'
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {tier.id === 'free' ? (
                <button
                  onClick={handleFreeCTA}
                  data-testid="cta-free"
                  className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {tier.cta}
                </button>
              ) : (
                <button
                  onClick={handleProCTA}
                  disabled={loading}
                  data-testid="cta-pro"
                  className={cn(
                    'w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    loading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-700 hover:shadow-lg'
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    tier.cta
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
