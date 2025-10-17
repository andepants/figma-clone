/**
 * AccessDenied Component
 *
 * Shown when user tries to access a resource they don't have permission for.
 * Provides clear messaging and navigation options.
 *
 * Used for:
 * - Private projects without permission
 * - Expired subscription trying to access paid features
 */

import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  /** Title of the access denied message */
  title?: string;

  /** Description explaining why access was denied */
  description?: string;

  /** Optional custom icon */
  icon?: React.ReactNode;

  /** Show "Go Back" button */
  showBackButton?: boolean;

  /** Show "Go to Projects" button */
  showProjectsButton?: boolean;

  /** Show "View Pricing" button */
  showUpgradeButton?: boolean;
}

/**
 * Access denied component for unauthorized access attempts.
 * Shows clear messaging and navigation options.
 */
export function AccessDenied({
  title = 'Access Denied',
  description = "You don't have permission to view this resource.",
  icon,
  showBackButton = true,
  showProjectsButton = true,
  showUpgradeButton = false,
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {icon || (
            <div className="p-4 bg-red-50 rounded-full">
              <Lock className="w-12 h-12 text-red-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">{description}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}

          {showProjectsButton && (
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to My Projects
            </button>
          )}

          {showUpgradeButton && (
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Upgrade Options
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Specific variant for private project access denial
 */
export function PrivateProjectAccessDenied({
  projectName,
}: {
  projectName?: string;
}) {
  return (
    <AccessDenied
      title="Private Project"
      description={
        projectName
          ? `"${projectName}" is a private project. You need permission from the owner to access it.`
          : 'This is a private project. You need permission from the owner to access it.'
      }
      showBackButton={true}
      showProjectsButton={true}
      showUpgradeButton={false}
    />
  );
}

/**
 * Specific variant for subscription required
 */
export function SubscriptionRequiredAccessDenied() {
  return (
    <AccessDenied
      title="Subscription Required"
      description="This feature requires an active subscription. Upgrade to continue accessing premium features."
      showBackButton={true}
      showProjectsButton={true}
      showUpgradeButton={true}
    />
  );
}
