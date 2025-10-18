/**
 * AccountModal Component
 *
 * Shows user account information and subscription management.
 * For free users: Upgrade CTA with benefits
 * For paid users: Subscription info and manage subscription button
 *
 * Features:
 * - Displays username, email, and subscription status
 * - Free users see upgrade benefits and pricing
 * - Paid users see manage subscription button (opens Stripe portal)
 * - Handles dynamic pricing (founders vs. pro)
 * - Reuses upgrade logic from ProjectsPage
 *
 * @component
 */

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';
import { useSubscription } from '@/hooks/useSubscription';
import { redirectToCheckout } from '@/lib/stripe/checkout';
import { getFoundersDealConfig } from '@/lib/firebase';

interface AccountModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Close modal callback */
  onClose: () => void;
}

/**
 * Account modal component
 *
 * Shows user account details and subscription management options.
 * Modal appearance and actions vary based on subscription status.
 */
export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { currentUser } = useAuth();
  const { userProfile, subscription, isPaid, badge } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [paidUserCount, setPaidUserCount] = useState<number>(0);

  // Fetch founders deal config to determine pricing
  useEffect(() => {
    async function fetchFoundersDealConfig() {
      try {
        const config = await getFoundersDealConfig();
        const paidUsers = config.spotsTotal - config.spotsRemaining;
        setPaidUserCount(paidUsers);
      } catch (error) {
        console.error('Failed to fetch founders deal config:', error);
        setPaidUserCount(0);
      }
    }

    if (isOpen) {
      fetchFoundersDealConfig();
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const showFoundersOffer = paidUserCount < 10;

  /**
   * Handle upgrade button click
   * Redirects to Stripe checkout with appropriate price tier
   */
  const handleUpgrade = async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);

      // Determine price ID based on paid user count
      const priceId = showFoundersOffer
        ? import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID // $10/year (founders - first 10 users)
        : import.meta.env.VITE_STRIPE_FOUNDERS_PRICE_ID60; // $60/year (after 10 users)

      await redirectToCheckout(priceId, currentUser.email!, currentUser.uid);
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to start upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle manage subscription button click
   * Opens Stripe Customer Portal in new tab
   */
  const handleManageSubscription = () => {
    const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL;

    if (!portalUrl) {
      alert('Stripe portal URL not configured. Please contact support.');
      return;
    }

    window.open(portalUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Account</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="space-y-4 mb-6">
            {/* Username */}
            {userProfile?.username && (
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Username
                </label>
                <p className="text-base text-gray-900">{userProfile.username}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Email
              </label>
              <p className="text-base text-gray-900">{currentUser.email}</p>
            </div>

            {/* Subscription Status */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Subscription
              </label>
              <div className="flex items-center gap-2">
                <p className="text-base text-gray-900 capitalize">
                  {subscription?.status || 'Free'}
                </p>
                {badge && (
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      badge.color === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : badge.color === 'green'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {badge.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions - Different for free vs. paid users */}
          {!isPaid ? (
            // Free user: Upgrade section
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Upgrade to Pro</h3>
              </div>

              <ul className="text-sm text-gray-700 mb-4 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>DALL-E 3 image generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>App store ready graphics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Less than {showFoundersOffer ? '$1' : '$5'}/month</span>
                </li>
              </ul>

              {/* Pricing */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-900">
                    {showFoundersOffer ? '$10' : '$60'}
                  </span>
                  <span className="text-sm text-blue-700">/year</span>
                  {showFoundersOffer && (
                    <span className="ml-auto text-xs text-blue-600 font-semibold">
                      Founders Deal
                    </span>
                  )}
                </div>
                {showFoundersOffer && (
                  <p className="text-xs text-blue-700 mt-1">
                    Limited spots available • First 10 users only
                  </p>
                )}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Upgrade Now'}
              </button>
            </div>
          ) : (
            // Paid user: Manage subscription section
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Manage your subscription, update payment methods, or cancel anytime.
              </p>

              <button
                onClick={handleManageSubscription}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Subscription
              </button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Opens Stripe customer portal in new tab
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
