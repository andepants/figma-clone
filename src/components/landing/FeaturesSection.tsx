/**
 * FeaturesSection Component
 *
 * Landing page features section highlighting 4 key value propositions.
 * Shows benefits (not just features) to increase conversion.
 *
 * UX Principles:
 * - Progressive disclosure: Show features before asking to pay
 * - Visual hierarchy: Icons → titles → descriptions → benefits
 * - Reduce cognitive load: Only 4 features, not overwhelming
 *
 * @example
 * <FeaturesSection />
 */

interface Feature {
  icon: string;
  title: string;
  description: string;
  benefit: string; // User benefit, not technical feature
}

const features: Feature[] = [
  {
    icon: '📱',
    title: 'App Icon Templates',
    description: 'iOS & Android icon templates with proper sizing',
    benefit: 'Ship faster with pre-sized templates'
  },
  {
    icon: '🎨',
    title: 'Feature Graphics',
    description: 'App Store screenshots and feature graphics',
    benefit: 'Increase downloads with professional graphics'
  },
  {
    icon: '🤝',
    title: 'Real-time Collaboration',
    description: 'Work together with your team, see changes instantly',
    benefit: 'No more emailing design files back and forth'
  },
  {
    icon: '💾',
    title: 'High-Res Export',
    description: 'Export PNG, SVG, and retina files (up to 3x)',
    benefit: 'Perfect quality for any device or platform'
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Everything You Need for App Graphics
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From idea to App Store-ready assets in minutes, not hours
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Icon */}
              <div className="text-5xl mb-4" aria-hidden="true">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">
                {feature.description}
              </p>

              {/* User benefit - emphasized */}
              <p className="text-sm font-medium text-blue-600">
                → {feature.benefit}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
