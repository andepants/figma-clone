/**
 * BenefitsList Component
 *
 * Grid of benefits with icons.
 * Design: Clean, scannable, icon + title + description
 */

import { Infinity as InfinityIcon, DollarSign, Sparkles, Zap, Smartphone, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: InfinityIcon,
    title: 'Unlimited Projects',
    description: 'Create as many projects as you need. No limits.',
  },
  {
    icon: DollarSign,
    title: 'Less than $1/month',
    description: 'Just $10/year. The best value in design tools.',
  },
  {
    icon: Sparkles,
    title: 'DALL-E 3 Image Generation',
    description: 'Generate stunning images with AI directly on your canvas.',
  },
  {
    icon: Zap,
    title: 'Unlimited AI Generation',
    description: 'No caps on AI operations. Generate as much as you want.',
  },
  {
    icon: Smartphone,
    title: 'App Store Ready Graphics',
    description: 'Generate feature graphics and app icons optimized for stores.',
  },
  {
    icon: XCircle,
    title: 'Cancel Anytime',
    description: 'No commitment. Cancel with one click, no questions asked.',
  },
];

/**
 * Grid of benefit cards showcasing all premium features.
 * Displays icons, titles, and descriptions in a scannable format.
 *
 * @example
 * ```tsx
 * <BenefitsList />
 * ```
 */
export function BenefitsList() {
  // All benefits shown
  const displayBenefits = benefits;

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayBenefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
