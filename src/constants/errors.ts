/**
 * Error Catalog - Type-safe error constants for CanvasIcons
 *
 * @see _docs/ux/error-catalog.md for full error documentation
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';
export type VisualTreatment = 'inline' | 'modal' | 'banner' | 'toast' | 'full-page';

export interface ErrorConfig {
  code: string;
  userMessage: string;
  technicalMessage: string;
  recovery: string;
  visualTreatment: VisualTreatment;
  preserveInput: boolean;
  severity: ErrorSeverity;
}

/**
 * Authentication Error Codes
 */
export const AUTH_ERRORS = {
  WRONG_PASSWORD: 'auth/wrong-password',
  USER_NOT_FOUND: 'auth/user-not-found',
  EMAIL_EXISTS: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_EMAIL: 'auth/invalid-email',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  SESSION_EXPIRED: 'auth/session-expired',
  NETWORK_ERROR: 'auth/network-request-failed',
} as const;

/**
 * Payment Error Codes
 */
export const PAYMENT_ERRORS = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  EXPIRED_CARD: 'expired_card',
  INVALID_CARD: 'invalid_card_number',
  INVALID_CVC: 'invalid_cvc',
  PROCESSING_ERROR: 'processing_error',
  RATE_LIMIT: 'rate_limit',
  INCOMPLETE: 'incomplete_payment',
  WEBHOOK_FAILED: 'webhook_verification_failed',
  SUBSCRIPTION_ERROR: 'subscription_create_failed',
} as const;

/**
 * Permission Error Codes
 */
export const PERMISSION_ERRORS = {
  FREE_TIER_LIMIT: 'free_tier_create_limit',
  ACCESS_DENIED: 'project_access_denied',
  NOT_FOUND: 'project_not_found',
  OBJECT_LOCKED: 'object_locked',
  AUTH_REQUIRED: 'auth_required',
} as const;

/**
 * Network Error Codes
 */
export const NETWORK_ERRORS = {
  OFFLINE: 'network_offline',
  TIMEOUT: 'network_timeout',
  SLOW_CONNECTION: 'slow_connection',
  FIREBASE_UNAVAILABLE: 'firebase_unavailable',
} as const;

/**
 * Validation Error Codes
 */
export const VALIDATION_ERRORS = {
  PROJECT_NAME_EMPTY: 'project_name_required',
  PROJECT_NAME_TOO_LONG: 'project_name_too_long',
  USERNAME_INVALID: 'username_invalid',
  USERNAME_TAKEN: 'username_exists',
  EXPORT_NO_OBJECTS: 'export_no_objects',
  EXPORT_NO_SELECTION: 'export_no_selection',
  FILE_TOO_LARGE: 'file_too_large',
  INVALID_COLOR: 'invalid_color_format',
} as const;

/**
 * Complete Error Catalog
 */
export const ERROR_CATALOG: Record<string, ErrorConfig> = {
  // Authentication Errors
  [AUTH_ERRORS.WRONG_PASSWORD]: {
    code: AUTH_ERRORS.WRONG_PASSWORD,
    userMessage: 'Incorrect password. Please try again.',
    technicalMessage: 'Firebase Auth: wrong-password',
    recovery: 'Try again or reset password',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [AUTH_ERRORS.USER_NOT_FOUND]: {
    code: AUTH_ERRORS.USER_NOT_FOUND,
    userMessage: 'No account found with this email. Would you like to sign up?',
    technicalMessage: 'Firebase Auth: user-not-found',
    recovery: 'Go to sign up',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [AUTH_ERRORS.EMAIL_EXISTS]: {
    code: AUTH_ERRORS.EMAIL_EXISTS,
    userMessage: 'An account with this email already exists. Try signing in instead.',
    technicalMessage: 'Firebase Auth: email-already-in-use',
    recovery: 'Go to sign in',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [AUTH_ERRORS.WEAK_PASSWORD]: {
    code: AUTH_ERRORS.WEAK_PASSWORD,
    userMessage: 'Password must be at least 8 characters with letters and numbers.',
    technicalMessage: 'Firebase Auth: weak-password',
    recovery: 'Enter a stronger password',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [AUTH_ERRORS.INVALID_EMAIL]: {
    code: AUTH_ERRORS.INVALID_EMAIL,
    userMessage: 'Please enter a valid email address.',
    technicalMessage: 'Firebase Auth: invalid-email',
    recovery: 'Correct email format',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [AUTH_ERRORS.TOO_MANY_REQUESTS]: {
    code: AUTH_ERRORS.TOO_MANY_REQUESTS,
    userMessage: 'Too many failed attempts. Please try again in 5 minutes or reset your password.',
    technicalMessage: 'Firebase Auth: too-many-requests',
    recovery: 'Wait 5 minutes or reset password',
    visualTreatment: 'banner',
    preserveInput: true,
    severity: 'warning',
  },
  [AUTH_ERRORS.SESSION_EXPIRED]: {
    code: AUTH_ERRORS.SESSION_EXPIRED,
    userMessage: 'Your session has expired. Please sign in again.',
    technicalMessage: 'Firebase Auth: session-expired',
    recovery: 'Sign in again',
    visualTreatment: 'modal',
    preserveInput: false,
    severity: 'warning',
  },
  [AUTH_ERRORS.NETWORK_ERROR]: {
    code: AUTH_ERRORS.NETWORK_ERROR,
    userMessage: 'Connection error. Check your internet and try again.',
    technicalMessage: 'Firebase Auth: network-request-failed',
    recovery: 'Retry',
    visualTreatment: 'banner',
    preserveInput: true,
    severity: 'error',
  },

  // Payment Errors
  [PAYMENT_ERRORS.CARD_DECLINED]: {
    code: PAYMENT_ERRORS.CARD_DECLINED,
    userMessage: 'Your card was declined. Please try a different payment method.',
    technicalMessage: 'Stripe: card_declined',
    recovery: 'Try different card',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.INSUFFICIENT_FUNDS]: {
    code: PAYMENT_ERRORS.INSUFFICIENT_FUNDS,
    userMessage: 'Your card has insufficient funds. Please use a different card.',
    technicalMessage: 'Stripe: insufficient_funds',
    recovery: 'Try different card',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.EXPIRED_CARD]: {
    code: PAYMENT_ERRORS.EXPIRED_CARD,
    userMessage: 'Your card has expired. Please use a different card.',
    technicalMessage: 'Stripe: expired_card',
    recovery: 'Enter valid card',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.INVALID_CARD]: {
    code: PAYMENT_ERRORS.INVALID_CARD,
    userMessage: 'Invalid card number. Please check and try again.',
    technicalMessage: 'Stripe: invalid_card_number',
    recovery: 'Re-enter card number',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.INVALID_CVC]: {
    code: PAYMENT_ERRORS.INVALID_CVC,
    userMessage: 'Invalid security code (CVC). Please check your card.',
    technicalMessage: 'Stripe: invalid_cvc',
    recovery: 'Re-enter CVC',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.PROCESSING_ERROR]: {
    code: PAYMENT_ERRORS.PROCESSING_ERROR,
    userMessage: 'Payment failed to process. Please try again or contact support.',
    technicalMessage: 'Stripe: processing_error',
    recovery: 'Retry or contact support',
    visualTreatment: 'modal',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.RATE_LIMIT]: {
    code: PAYMENT_ERRORS.RATE_LIMIT,
    userMessage: 'Too many payment attempts. Please wait a moment and try again.',
    technicalMessage: 'Stripe: rate_limit',
    recovery: 'Wait 30 seconds',
    visualTreatment: 'banner',
    preserveInput: true,
    severity: 'warning',
  },
  [PAYMENT_ERRORS.INCOMPLETE]: {
    code: PAYMENT_ERRORS.INCOMPLETE,
    userMessage: 'Please complete all required fields to continue.',
    technicalMessage: 'Stripe: incomplete_payment',
    recovery: 'Fill missing fields',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [PAYMENT_ERRORS.WEBHOOK_FAILED]: {
    code: PAYMENT_ERRORS.WEBHOOK_FAILED,
    userMessage: 'Payment successful but verification pending. Check back in a minute.',
    technicalMessage: 'Webhook signature verification failed',
    recovery: 'Refresh page in 60 seconds',
    visualTreatment: 'banner',
    preserveInput: false,
    severity: 'warning',
  },
  [PAYMENT_ERRORS.SUBSCRIPTION_ERROR]: {
    code: PAYMENT_ERRORS.SUBSCRIPTION_ERROR,
    userMessage: 'Failed to activate subscription. Your card was not charged. Please try again.',
    technicalMessage: 'Stripe: subscription creation failed',
    recovery: 'Retry payment',
    visualTreatment: 'modal',
    preserveInput: true,
    severity: 'error',
  },

  // Permission Errors
  [PERMISSION_ERRORS.FREE_TIER_LIMIT]: {
    code: PERMISSION_ERRORS.FREE_TIER_LIMIT,
    userMessage: 'Free accounts can\'t create projects. Upgrade to CanvasIcons Founders ($9.99/year) to create unlimited projects.',
    technicalMessage: 'User subscription status: free, action: create_project denied',
    recovery: 'Upgrade to Founders',
    visualTreatment: 'modal',
    preserveInput: false,
    severity: 'info',
  },
  [PERMISSION_ERRORS.ACCESS_DENIED]: {
    code: PERMISSION_ERRORS.ACCESS_DENIED,
    userMessage: 'You don\'t have access to this project. Request access from the owner or browse public projects.',
    technicalMessage: 'User not in project.collaborators array',
    recovery: 'Browse public projects',
    visualTreatment: 'full-page',
    preserveInput: false,
    severity: 'error',
  },
  [PERMISSION_ERRORS.NOT_FOUND]: {
    code: PERMISSION_ERRORS.NOT_FOUND,
    userMessage: 'Project not found. It may have been deleted or made private.',
    technicalMessage: 'Firestore: No document at /projects/{id}',
    recovery: 'Go to dashboard',
    visualTreatment: 'full-page',
    preserveInput: false,
    severity: 'error',
  },
  [PERMISSION_ERRORS.OBJECT_LOCKED]: {
    code: PERMISSION_ERRORS.OBJECT_LOCKED,
    userMessage: 'This object is locked. Unlock it first to make changes.',
    technicalMessage: 'Canvas object property: locked = true',
    recovery: 'Unlock from layers panel',
    visualTreatment: 'toast',
    preserveInput: false,
    severity: 'info',
  },
  [PERMISSION_ERRORS.AUTH_REQUIRED]: {
    code: PERMISSION_ERRORS.AUTH_REQUIRED,
    userMessage: 'Sign in to access this feature.',
    technicalMessage: 'Protected route accessed without authentication',
    recovery: 'Sign in',
    visualTreatment: 'modal',
    preserveInput: false,
    severity: 'warning',
  },

  // Network Errors
  [NETWORK_ERRORS.OFFLINE]: {
    code: NETWORK_ERRORS.OFFLINE,
    userMessage: 'You\'re offline. Changes will sync when you reconnect.',
    technicalMessage: 'navigator.onLine = false',
    recovery: 'Auto-retry when online',
    visualTreatment: 'banner',
    preserveInput: true,
    severity: 'warning',
  },
  [NETWORK_ERRORS.TIMEOUT]: {
    code: NETWORK_ERRORS.TIMEOUT,
    userMessage: 'Request timed out. Please check your connection and try again.',
    technicalMessage: 'Request exceeded 30s timeout',
    recovery: 'Retry',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [NETWORK_ERRORS.SLOW_CONNECTION]: {
    code: NETWORK_ERRORS.SLOW_CONNECTION,
    userMessage: 'Slow connection detected. Some features may be delayed.',
    technicalMessage: 'RTT > 2000ms',
    recovery: 'Continue',
    visualTreatment: 'toast',
    preserveInput: true,
    severity: 'info',
  },
  [NETWORK_ERRORS.FIREBASE_UNAVAILABLE]: {
    code: NETWORK_ERRORS.FIREBASE_UNAVAILABLE,
    userMessage: 'Service temporarily unavailable. Please try again in a moment.',
    technicalMessage: 'Firebase RTDB/Firestore connection error',
    recovery: 'Auto-retry',
    visualTreatment: 'banner',
    preserveInput: true,
    severity: 'error',
  },

  // Validation Errors
  [VALIDATION_ERRORS.PROJECT_NAME_EMPTY]: {
    code: VALIDATION_ERRORS.PROJECT_NAME_EMPTY,
    userMessage: 'Project name is required.',
    technicalMessage: 'Validation: name.length === 0',
    recovery: 'Enter project name',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [VALIDATION_ERRORS.PROJECT_NAME_TOO_LONG]: {
    code: VALIDATION_ERRORS.PROJECT_NAME_TOO_LONG,
    userMessage: 'Project name must be 100 characters or less.',
    technicalMessage: 'Validation: name.length > 100',
    recovery: 'Shorten project name',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [VALIDATION_ERRORS.USERNAME_INVALID]: {
    code: VALIDATION_ERRORS.USERNAME_INVALID,
    userMessage: 'Username must be 3-20 characters (letters, numbers, underscores only).',
    technicalMessage: 'Validation: !usernameRegex.test(username)',
    recovery: 'Enter valid username',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [VALIDATION_ERRORS.USERNAME_TAKEN]: {
    code: VALIDATION_ERRORS.USERNAME_TAKEN,
    userMessage: 'This username is already taken. Please choose another.',
    technicalMessage: 'Firestore: username exists in users collection',
    recovery: 'Try different username',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
  [VALIDATION_ERRORS.EXPORT_NO_OBJECTS]: {
    code: VALIDATION_ERRORS.EXPORT_NO_OBJECTS,
    userMessage: 'Canvas is empty. Add objects before exporting.',
    technicalMessage: 'Canvas objects.length === 0',
    recovery: 'Add objects',
    visualTreatment: 'inline',
    preserveInput: false,
    severity: 'info',
  },
  [VALIDATION_ERRORS.EXPORT_NO_SELECTION]: {
    code: VALIDATION_ERRORS.EXPORT_NO_SELECTION,
    userMessage: 'No objects selected. Select objects or export entire canvas.',
    technicalMessage: 'selectedIds.length === 0 and scope === \'selection\'',
    recovery: 'Select objects or change to Export All',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'info',
  },
  [VALIDATION_ERRORS.FILE_TOO_LARGE]: {
    code: VALIDATION_ERRORS.FILE_TOO_LARGE,
    userMessage: 'File size exceeds 10MB. Try reducing canvas size or resolution.',
    technicalMessage: 'Export file size > 10MB',
    recovery: 'Reduce scale or canvas size',
    visualTreatment: 'modal',
    preserveInput: true,
    severity: 'error',
  },
  [VALIDATION_ERRORS.INVALID_COLOR]: {
    code: VALIDATION_ERRORS.INVALID_COLOR,
    userMessage: 'Invalid color format. Use hex (#000000) or rgb(0,0,0).',
    technicalMessage: 'Validation: !colorRegex.test(value)',
    recovery: 'Enter valid color',
    visualTreatment: 'inline',
    preserveInput: true,
    severity: 'error',
  },
};

/**
 * Helper function to get error config by code
 */
export function getErrorConfig(code: string): ErrorConfig | undefined {
  return ERROR_CATALOG[code];
}

/**
 * Helper function to check if code is a known error
 */
export function isKnownError(code: string): boolean {
  return code in ERROR_CATALOG;
}

/**
 * Type guard for error severity
 */
export function isErrorSeverity(value: string): value is ErrorSeverity {
  return ['error', 'warning', 'info'].includes(value);
}
