/**
 * UpgradePromptModal Component
 *
 * Modal that prompts free users to upgrade when they try to access paid features.
 * Shows feature-specific messaging and clear upgrade path.
 *
 * Design principles:
 * - Not pushy - clear value proposition
 * - Easy to dismiss
 * - Single clear CTA ("View Pricing")
 * - Shows what user gets with upgrade
 *
 * @see _docs/ux/user-flows.md - Flow 3: Free → Paid Upgrade
 */

import { useNavigate } from 'react-router-dom';
import { X, Lock, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradePromptModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Close modal callback */
  onClose: () => void;

  /** Feature being gated */
  feature: 'create_projects' | 'private_projects' | 'templates';

  /** Optional custom upgrade callback (defaults to navigate to /pricing) */
  onUpgrade?: () => void;
}

/**
 * Feature-specific upgrade messaging
 */
const FEATURE_MESSAGES = {
  create_projects: {
    title: 'Upgrade to Create Projects',
    description:
      'Free users can join and collaborate on public projects. Upgrade to create unlimited projects of your own.',
    icon: Lock,
    benefits: [
      'Create unlimited projects',
      'Public and private projects',
      'All templates (icons, graphics, screenshots)',
      'Priority support',
    ],
  },
  private_projects: {
    title: 'Upgrade for Private Projects',
    description:
      'Keep your work private and share only with your team. Available on paid plans.',
    icon: Lock,
    benefits: [
      'Private projects',
      'Invite-only collaboration',
      'Unlimited projects',
      'All templates',
    ],
  },
  templates: {
    title: 'Upgrade to Access All Templates',
    description:
      'Get access to professional templates for app icons, feature graphics, and more.',
    icon: Sparkles,
    benefits: [
      'iOS & Android icon templates',
      'Feature graphics templates',
      'Screenshot templates',
      'Regular template updates',
    ],
  },
};

/**
 * Modal that prompts users to upgrade to access paid features.
 * Shows feature-specific messaging and benefits.
 */
export function UpgradePromptModal({
  isOpen,
  onClose,
  feature,
  onUpgrade,
}: UpgradePromptModalProps) {
  const navigate = useNavigate();
  const { badge } = useSubscription();

  if (!isOpen) return null;

  const message = FEATURE_MESSAGES[feature];
  const Icon = message.icon;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {message.title}
              </h2>
              {badge && (
                <p className="text-sm text-gray-500 mt-1">
                  Current plan: {badge.text}
                </p>
              )}
            </div>
          </div>
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
          {/* Description */}
          <p className="text-gray-600 mb-6">{message.description}</p>

          {/* Benefits List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              What you'll get:
            </h3>
            <ul className="space-y-2">
              {message.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Highlight */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-900">$10</span>
              <span className="text-sm text-blue-700">/year</span>
              <span className="text-xs text-blue-600 ml-auto">
                Founders Deal
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Less than $1/month • Limited spots available
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline upgrade prompt component (non-modal version)
 * Can be used in empty states or as fallback content
 */
export function InlineUpgradePrompt({
  feature,
  onUpgrade,
}: Pick<UpgradePromptModalProps, 'feature' | 'onUpgrade'>) {
  const navigate = useNavigate();
  const message = FEATURE_MESSAGES[feature];
  const Icon = message.icon;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 bg-blue-50 rounded-full mb-4">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {message.title}
      </h3>

      <p className="text-gray-600 mb-6 max-w-md">{message.description}</p>

      <button
        onClick={handleUpgrade}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Upgrade to Continue
      </button>

      <p className="text-sm text-gray-500 mt-4">
        From $10/year (first 10 users) • Cancel anytime
      </p>
    </div>
  );
}
