/**
 * Framer Motion Transition Presets
 *
 * Reusable transition configurations for consistent timing across animations.
 */

import { Transition } from 'framer-motion';

/**
 * Spring transition (bouncy, natural feel)
 * Use for interactive elements like buttons, cards
 */
export const spring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30
};

/**
 * Soft spring (gentle bounce)
 * Use for larger elements like modals
 */
export const softSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20
};

/**
 * Smooth transition (no bounce)
 * Use for opacity, color changes
 */
export const smooth: Transition = {
  duration: 0.3,
  ease: 'easeInOut'
};

/**
 * Fast transition
 * Use for quick feedback (hover states)
 */
export const fast: Transition = {
  duration: 0.15,
  ease: 'easeOut'
};

/**
 * Slow transition
 * Use for page transitions, large content changes
 */
export const slow: Transition = {
  duration: 0.6,
  ease: 'easeInOut'
};

/**
 * Ease out expo (Figma-style easing)
 * Smooth deceleration curve
 */
export const easeOutExpo: number[] = [0.22, 1, 0.36, 1];

/**
 * Ease in out cubic
 * Balanced acceleration/deceleration
 */
export const easeInOutCubic: number[] = [0.65, 0, 0.35, 1];

/**
 * Ease out cubic
 * Quick start, smooth end
 */
export const easeOutCubic: number[] = [0.33, 1, 0.68, 1];

/**
 * Custom bounce spring
 * More pronounced bounce effect
 */
export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
  mass: 0.8
};
