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
    question: "What happens when I sign up for free?",
    answer:
      "You can immediately join any public project and start collaborating. You will have access to all editing tools, real-time collaboration, and can export high-resolution files. The only limitation is that you cannot create your own projects but you can contribute to unlimited public projects.",
  },
  {
    question: "What if the Founders deal sells out?",
    answer:
      "Once all 10 Founders spots are claimed, the deal closes permanently. Future pricing will be $90/year or $10/month for the Pro tier. If you are on the fence, we recommend securing your spot now and you will lock in $9.99/year forever.",
  },
  {
    question: "Can I upgrade from Free to Founders later?",
    answer:
      "Yes, but only if spots are still available. The Founders deal is limited to the first 10 users. Once sold out, you can upgrade to Pro tier at regular pricing ($90/year or $10/month).",
  },
  {
    question: "Do I need to know design to use Canvas Icons?",
    answer:
      "Not at all! Canvas Icons is built for developers and non-designers. We provide templates for app icons, feature graphics, and screenshots just customize colors, text, and shapes. If you can drag and drop, you can create professional graphics.",
  },
  {
    question: "How does real-time collaboration work?",
    answer:
      "When you join a project, you see cursors, selections, and changes from all team members in real-time (synced within 150ms). It feels like Google Docs for design. Free users can collaborate on public projects, while Founders users can invite teammates to private projects.",
  },
  {
    question: "What file formats can I export?",
    answer:
      "You can export PNG files at 1x, 2x, or 3x resolution for perfect quality on any device. SVG export is also available for vector graphics. We are working on batch export and additional formats (JPG, WebP) for Founders users.",
  },
  {
    question: "Is the Founders price really lifetime?",
    answer:
      "Yes! Once you claim a Founders spot at $9.99/year, that price is locked in forever. Even if we raise prices to $90/year later, you will continue paying $9.99/year as long as your subscription is active. This is our way of rewarding early supporters.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your Founders subscription anytime from your account settings. You will retain access until the end of your current billing period. If you cancel and rejoin later, you will need to pay current pricing (no longer $9.99/year).",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) through Stripe. We do not currently support PayPal, cryptocurrency, or bank transfers but may add these options based on demand.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes! If you are not satisfied within the first 30 days, we offer a full refund with no questions asked. Just email support@canvasicons.app with your request.",
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
    <section className="py-16 px-4" data-testid="pricing-faq">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12" data-testid="faq-header">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about pricing and plans
          </p>
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
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a
            href="mailto:support@canvasicons.app"
            className="inline-block px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
