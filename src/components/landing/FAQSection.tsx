/**
 * FAQ Section Component
 *
 * Displays frequently asked questions with collapsible answers.
 * Includes refund policy and cancellation information.
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is your refund policy?',
    answer: (
      <>
        We offer a <strong>100% money-back guarantee</strong> at any time, for any reason.
        If you're unhappy with your subscription, simply email{' '}
        <a
          href="mailto:andrewsheim@gmail.com"
          className="text-primary-600 hover:text-primary-700 underline"
        >
          andrewsheim@gmail.com
        </a>
        {' '}and you'll receive a full refund. No questions asked.
      </>
    ),
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! You can cancel your subscription at any time with zero risk. There are no contracts, commitments, or cancellation fees. If you decide the service isn\'t for you, canceling is simple and immediate.',
  },
  {
    question: 'What features do I get with the Pro Plan?',
    answer: 'The Pro Plan ($10/year) includes unlimited projects, unlimited storage, unlimited AI canvas operations, priority support, and all future premium features.',
  },
  {
    question: 'How does the free tier work?',
    answer: 'The free tier lets you explore Canvas Icons with limited features. You get access to basic canvas tools and can create a limited number of projects. Upgrade to Pro Plan for unlimited access.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. All data is stored securely in Firebase with enterprise-grade security. Your designs are private by default, and you have full control over sharing and collaboration settings.',
  },
  {
    question: 'Can I use Canvas Icons for commercial projects?',
    answer: 'Absolutely! Canvas Icons can be used for personal and commercial projects. Any designs you create are 100% yours to use however you like.',
  },
];

export function FAQSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  /**
   * Toggle FAQ item expansion
   */
  function toggleItem(index: number) {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  return (
    <section className="py-20 px-6 bg-white" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="faq-heading" className="text-3xl font-bold text-neutral-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-neutral-600">
            Everything you need to know about Canvas Icons
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
                aria-expanded={expandedIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-base font-semibold text-neutral-900 pr-4">
                  {item.question}
                </span>
                <ChevronRight
                  className={cn(
                    'h-5 w-5 text-neutral-500 transition-transform flex-shrink-0',
                    expandedIndex === index && 'rotate-90'
                  )}
                  aria-hidden="true"
                />
              </button>
              {expandedIndex === index && (
                <div
                  id={`faq-answer-${index}`}
                  className="px-6 py-4 pt-0 text-neutral-700 leading-relaxed"
                  role="region"
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary-50 border border-primary-100 rounded-lg text-center">
          <p className="text-neutral-700 mb-2">
            <strong>Still have questions?</strong>
          </p>
          <p className="text-neutral-600">
            Reach out to{' '}
            <a
              href="mailto:andrewsheim@gmail.com"
              className="text-primary-600 hover:text-primary-700 underline font-medium"
            >
              andrewsheim@gmail.com
            </a>
            {' '}and I'll be happy to help!
          </p>
        </div>
      </div>
    </section>
  );
}
