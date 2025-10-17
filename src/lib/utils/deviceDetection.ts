/**
 * Device Detection Utilities
 *
 * Provides functions to detect touch capability and mobile devices.
 * Used for optimizing UI interactions based on device type.
 */

/**
 * Detects if the current device has touch capability.
 * Checks for both touch events and pointer support.
 *
 * @returns True if the device supports touch input
 *
 * @example
 * if (isTouchDevice()) {
 *   // Show touch-optimized UI
 * }
 */
export function isTouchDevice(): boolean {
  // Check if touch events are supported
  if ('ontouchstart' in window) {
    return true;
  }

  // Check if the device has touch points (modern API)
  if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) {
    return true;
  }

  // Fallback check for older browsers (IE/Edge)
  const legacyNavigator = navigator as Navigator & { msMaxTouchPoints?: number };
  if (legacyNavigator.msMaxTouchPoints && legacyNavigator.msMaxTouchPoints > 0) {
    return true;
  }

  return false;
}

/**
 * Detects if the current device is likely a mobile device based on screen size.
 * Uses a breakpoint of 768px (tablet/mobile boundary).
 *
 * @returns True if the screen width is less than 768px
 *
 * @example
 * if (isMobile()) {
 *   // Adjust layout for mobile
 * }
 */
export function isMobile(): boolean {
  // Check if window is defined (SSR safety)
  if (typeof window === 'undefined') {
    return false;
  }

  // Use 768px as the mobile/tablet breakpoint (matches Tailwind's md breakpoint)
  return window.innerWidth < 768;
}

/**
 * Detects if the device is running iOS (iPhone, iPad, iPod).
 * Checks user agent string and specific iOS platform indicators.
 *
 * @returns True if the device is running iOS
 *
 * @example
 * if (isIOS()) {
 *   // Apply iOS-specific fixes
 * }
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  // Check for iOS in user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOSUserAgent = /iphone|ipad|ipod/.test(userAgent);

  // iPadOS 13+ reports as Mac, so check for touch + Mac
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return isIOSUserAgent || isIPadOS;
}
