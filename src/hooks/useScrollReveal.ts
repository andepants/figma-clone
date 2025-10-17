/**
 * useScrollReveal Hook
 *
 * Triggers animations when elements enter the viewport.
 * Uses Intersection Observer for performance.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface UseScrollRevealOptions {
  /**
   * Trigger animation only once (default: true)
   */
  triggerOnce?: boolean;

  /**
   * Percentage of element that must be visible (0-1, default: 0.1)
   */
  threshold?: number;

  /**
   * Root margin for early/late triggering (default: '-100px 0px')
   */
  rootMargin?: string;
}

interface UseScrollRevealReturn {
  /**
   * Ref to attach to the element you want to animate
   */
  ref: (node?: Element | null) => void;

  /**
   * Animation controls (use with variants)
   */
  controls: AnimationControls;

  /**
   * Whether element is in view
   */
  inView: boolean;
}

/**
 * Hook for scroll-triggered animations
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, controls } = useScrollReveal();
 *
 *   return (
 *     <motion.div
 *       ref={ref}
 *       initial="hidden"
 *       animate={controls}
 *       variants={fadeInUp}
 *     >
 *       Content reveals on scroll
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useScrollReveal(
  options: UseScrollRevealOptions = {}
): UseScrollRevealReturn {
  const {
    triggerOnce = true,
    threshold = 0.1,
    rootMargin = '-100px 0px'
  } = options;

  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce,
    threshold,
    rootMargin
  });

  useEffect(() => {
    if (inView) {
      controls.start('show');
    } else if (!triggerOnce) {
      controls.start('hidden');
    }
  }, [controls, inView, triggerOnce]);

  return { ref, controls, inView };
}

/**
 * Alternative hook using ref callback pattern
 * Use when you need more control over the ref
 */
export function useScrollRevealWithRef(
  options: UseScrollRevealOptions = {}
): Omit<UseScrollRevealReturn, 'ref'> & { setRef: (node: Element | null) => void } {
  const {
    triggerOnce = true,
    threshold = 0.1,
    rootMargin = '-100px 0px'
  } = options;

  const controls = useAnimation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(false);

  const setRef = useCallback((node: Element | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const isInView = entry.isIntersecting;
          setInView(isInView);

          if (isInView) {
            controls.start('show');
            if (triggerOnce) {
              observerRef.current?.disconnect();
            }
          } else if (!triggerOnce) {
            controls.start('hidden');
          }
        },
        {
          threshold,
          rootMargin
        }
      );

      observerRef.current.observe(node);
    }
  }, [controls, threshold, rootMargin, triggerOnce]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { setRef, controls, inView };
}
