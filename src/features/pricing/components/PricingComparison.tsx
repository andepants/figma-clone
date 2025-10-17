/**
 * @fileoverview Feature comparison table for pricing page.
 *
 * UX Principles:
 * - Progressive Disclosure: Table collapsed by default, expands on click
 * - Visual Hierarchy: Clear separation between tiers with column headers
 * - Reduce Cognitive Load: Check marks for included features, dash for excluded
 * - Accessibility: Semantic table structure with proper headers
 *
 * Features:
 * - Collapsible section with chevron indicator
 * - Responsive: Horizontal scroll on mobile for table
 * - Clear visual distinction between Free and Founders columns
 * - Hover states on table rows
 *
 * @example
 * <PricingComparison />
 */

import { useState } from 'react';
import { Check, Minus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    description?: string;
    free: boolean;
    founders: boolean;
  }[];
}

const comparisonData: ComparisonFeature[] = [
  {
    category: 'Collaboration',
    features: [
      {
        name: 'Join public projects',
        description: 'Collaborate on community-shared projects',
        free: true,
        founders: true,
      },
      {
        name: 'Real-time collaboration',
        description: 'See changes from teammates instantly',
        free: true,
        founders: true,
      },
      {
        name: 'Create your own projects',
        description: 'Start new projects from scratch or templates',
        free: false,
        founders: true,
      },
      {
        name: 'Private projects',
        description: 'Keep projects visible only to you and collaborators',
        free: false,
        founders: true,
      },
      {
        name: 'Unlimited projects',
        description: 'No limit on number of projects you can create',
        free: false,
        founders: true,
      },
    ],
  },
  {
    category: 'Design Tools',
    features: [
      {
        name: 'All editing tools',
        description: 'Shapes, text, lines, images, and more',
        free: true,
        founders: true,
      },
      {
        name: 'Templates',
        description: 'Pre-made templates for app icons, feature graphics, screenshots',
        free: false,
        founders: true,
      },
      {
        name: 'Layers panel',
        description: 'Organize and manage canvas objects',
        free: true,
        founders: true,
      },
      {
        name: 'Properties panel',
        description: 'Fine-tune colors, sizes, and styles',
        free: true,
        founders: true,
      },
    ],
  },
  {
    category: 'Export & Files',
    features: [
      {
        name: 'High-res PNG export',
        description: 'Export at 1x, 2x, or 3x resolution',
        free: true,
        founders: true,
      },
      {
        name: 'SVG export',
        description: 'Vector format for scalable graphics',
        free: true,
        founders: true,
      },
      {
        name: 'Batch export',
        description: 'Export multiple objects at once (coming soon)',
        free: false,
        founders: true,
      },
    ],
  },
  {
    category: 'Support',
    features: [
      {
        name: 'Community support',
        description: 'Help from community forum',
        free: true,
        founders: true,
      },
      {
        name: 'Priority email support',
        description: 'Get help within 24 hours',
        free: false,
        founders: true,
      },
      {
        name: 'Lifetime founders price',
        description: 'Lock in $9.99/year forever',
        free: false,
        founders: true,
      },
    ],
  },
];

/**
 * Feature comparison table showing Free vs Founders tier differences
 * @returns Collapsible comparison table
 */
export function PricingComparison() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-12 px-4 bg-gray-50" data-testid="pricing-comparison">
      <div className="max-w-5xl mx-auto">
        {/* Section Header with Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-8 group"
          aria-expanded={isExpanded}
          data-testid="comparison-toggle"
        >
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Compare Features
            </h2>
            <p className="text-gray-600 mt-2">
              See what's included in each plan
            </p>
          </div>
          <ChevronDown
            className={cn(
              'w-6 h-6 text-gray-500 transition-transform',
              isExpanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {/* Comparison Table */}
        {isExpanded && (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 pr-4 font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900 w-32">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-600 w-32 bg-blue-50 rounded-t-lg">
                    Founders
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((category) => (
                  <>
                    {/* Category Header */}
                    <tr key={category.category} className="border-t border-gray-200">
                      <td
                        colSpan={3}
                        className="py-3 px-0 text-sm font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {category.category}
                      </td>
                    </tr>

                    {/* Category Features */}
                    {category.features.map((feature, index) => (
                      <tr
                        key={`${category.category}-${index}`}
                        className="border-t border-gray-100 hover:bg-white transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <div>
                            <div className="font-medium text-gray-900">{feature.name}</div>
                            {feature.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {feature.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {feature.free ? (
                            <Check
                              className="w-5 h-5 text-green-500 inline-block"
                              aria-label="Included"
                            />
                          ) : (
                            <Minus
                              className="w-5 h-5 text-gray-300 inline-block"
                              aria-label="Not included"
                            />
                          )}
                        </td>
                        <td className="text-center py-3 px-4 bg-blue-50">
                          {feature.founders ? (
                            <Check
                              className="w-5 h-5 text-green-500 inline-block"
                              aria-label="Included"
                            />
                          ) : (
                            <Minus
                              className="w-5 h-5 text-gray-300 inline-block"
                              aria-label="Not included"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
