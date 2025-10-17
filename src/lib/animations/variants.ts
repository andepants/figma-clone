/**
 * Framer Motion Animation Variants
 *
 * Reusable animation variants for consistent motion design across the app.
 * All variants follow Figma-quality easing and timing principles.
 */

import { Variants } from 'framer-motion';

/**
 * Fade in from below on scroll
 * Use with scroll reveal animations
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 50
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // easeOutExpo
    }
  }
};

/**
 * Fade in from left
 * Use for sidebar or panel entries
 */
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -50
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

/**
 * Fade in from right
 * Use for modal or notification entries
 */
export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 50
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

/**
 * Stagger children animation
 * Apply to parent container to stagger child animations
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

/**
 * Scale in with spring
 * Use for modal, dialog, or popover entries
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }
};

/**
 * Slide down from top
 * Use for dropdown menus or notifications
 */
export const slideDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

/**
 * Slide up from bottom
 * Use for bottom sheets or mobile menus
 */
export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

/**
 * Simple fade in/out
 * Use for overlays or backdrops
 */
export const fade: Variants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Expand width from left
 * Use for progress bars or loading indicators
 */
export const expandWidth: Variants = {
  hidden: {
    width: 0
  },
  show: {
    width: '100%',
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

/**
 * Collapse width to left
 * Exit animation for progress bars
 */
export const collapseWidth: Variants = {
  hidden: {
    width: '100%'
  },
  show: {
    width: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};
