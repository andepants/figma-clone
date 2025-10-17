/**
 * PricingTeaser Component
 *
 * Landing page pricing teaser showing Free and Pro tiers.
 * Simplified version of full pricing page - shows enough to make decision.
 *
 * UX Principles:
 * - Progressive disclosure: Basic tiers on landing, full details on pricing page
 * - Visual hierarchy: Pro tier more prominent (blue background, shadow)
 * - Reduce cognitive load: Only 2 options (Free vs Pro)
 *
 * @param onOpenAuth - Callback to open auth modal with specified mode
 *
 * @example
 * <PricingTeaser onOpenAuth={openAuthModal} />
 */

import { Check, X } from 'lucide-react';

interface PricingTeaserProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export function PricingTeaser({ onOpenAuth }: PricingTeaserProps) {

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free, upgrade when you're ready to create your own projects
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="border-2 border-gray-200 rounded-lg p-8 bg-white">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Free</h3>

            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">$0</p>
              <p className="text-gray-500">Forever free</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">Join public projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">Export high-res files</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">All editing tools</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-400">Create your own projects</span>
              </li>
            </ul>

            <button
              onClick={() => onOpenAuth('signup')}
              className="block w-full text-center py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              Sign Up Free
            </button>
          </div>

          {/* Pro Tier - Highlighted */}
          <div className="border-2 border-blue-500 rounded-lg p-8 bg-blue-50 relative">
            {/* "Best Value" badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              🎯 Best Value
            </div>

            <h3 className="text-2xl font-bold mb-2 text-gray-900">Pro</h3>

            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">
                $10
                <span className="text-lg font-normal text-gray-600">/year</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Less than $1/month
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">Everything in Free</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">
                  <strong>Unlimited projects</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">Public & private projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-700">All templates</span>
              </li>
            </ul>

            <button
              onClick={() => onOpenAuth('signup')}
              className="block w-full text-center py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Get Started - $10
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
