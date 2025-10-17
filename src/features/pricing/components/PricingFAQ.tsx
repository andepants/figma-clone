/**
 * @fileoverview FAQ section for pricing page with collapsible accordion.
 *
 * UX Principles:
 * - Progressive Disclosure: Collapsible Q&A items (one open at a time)
 * - Error Resilience: Answer common objections and concerns
 * - Reduce Cognitive Load: Plain language, no jargon
 * - Accessibility: Keyboard navigation, ARIA labels, focus management
 *
 * Features:
 * - Accordion-style FAQ (only one answer visible at a time)
 * - Smooth expand/collapse animations
 * - Chevron indicator rotates when expanded
 * - Hover states for interactive feel
 * - Keyboard accessible (Enter/Space to toggle)
 *
 * @example
 * <PricingFAQ />
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I get added to a project?",
    answer:
      "Ask the project owner to share your username with them. They can add you as a collaborator in project settings. Once added, you'll see the project in your \"Public Projects You're In\" section.",
  },
  {
    question: "What happens when I upgrade?",
    answer:
      "You'll unlock the ability to create unlimited private projects, generate icons and feature graphics, and access all premium features. Your upgrade is instant.",
  },
  {
    question: "Can I get a refund anytime?",
    answer:
      "Yes! We offer a 100% money-back satisfaction guarantee. If you're not happy for any reason, you can get a full refund at any time—no questions asked. Just email andrewsheim@gmail.com and we'll process your refund immediately.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Absolutely! You can cancel with one click from your account settings. Your access continues until the end of your billing period, and you won't be charged again.",
  },
  {
    question: "Is the founders pricing limited?",
    answer:
      "Yes, founders pricing at $10/year is only available for the first 10 users. After that, the price increases to $60/year (still less than $5/month).",
  },
];

/**
 * FAQ accordion component for pricing page
 * @returns FAQ section with collapsible items
 */
export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 bg-gray-50" data-testid="pricing-faq">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12" data-testid="faq-header">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Questions?
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleItem(index)}
                className="w-full text-left px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-semibold text-gray-900 pr-8">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200",
                    openIndex === index && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Answer Panel */}
              {openIndex === index && (
                <div
                  id={`faq-answer-${index}`}
                  className="px-6 py-4 bg-gray-50 border-t border-gray-200"
                >
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Still have questions?{' '}
            <a
              href="mailto:andrewsheim@gmail.com"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Email us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
