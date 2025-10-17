/**
 * Onboarding Types
 *
 * Type definitions for user onboarding flow (3-5 steps for new paid users).
 *
 * @see _docs/database/firestore-schema.md
 */

export type OnboardingStep =
  | 'welcome'
  | 'create_first_project'
  | 'explore_tools'
  | 'export_file'
  | 'share_project';

export interface OnboardingConfig {
  steps: OnboardingStep[];
  currentStep: number;
  canSkip: boolean;
  completedSteps: OnboardingStep[];
}

/**
 * Onboarding step metadata
 */
export interface StepMetadata {
  id: OnboardingStep;
  title: string;
  description: string;
  action: string;
  icon: string;
  estimatedTime: string; // "30 seconds", "1 minute", etc.
}

export const ONBOARDING_STEPS: Record<OnboardingStep, StepMetadata> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to CanvasIcons',
    description: 'Create professional app icons in minutes with real-time collaboration',
    action: 'Get Started',
    icon: '👋',
    estimatedTime: '30 seconds',
  },
  create_first_project: {
    id: 'create_first_project',
    title: 'Create Your First Project',
    description: 'Choose from templates optimized for iOS and Android app icons',
    action: 'Create Project',
    icon: '📁',
    estimatedTime: '1 minute',
  },
  explore_tools: {
    id: 'explore_tools',
    title: 'Explore the Toolbar',
    description: 'Learn the basics: shapes, text, and layers',
    action: 'Try Tools',
    icon: '🛠️',
    estimatedTime: '2 minutes',
  },
  export_file: {
    id: 'export_file',
    title: 'Export Your Design',
    description: 'Download App Store-ready PNG files at 1x, 2x, or 3x resolution',
    action: 'Export',
    icon: '💾',
    estimatedTime: '1 minute',
  },
  share_project: {
    id: 'share_project',
    title: 'Share & Collaborate',
    description: 'Make your project public or invite collaborators in real-time',
    action: 'Share',
    icon: '🔗',
    estimatedTime: '30 seconds',
  },
};

/**
 * Default onboarding config for new paid users
 */
export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  steps: [
    'welcome',
    'create_first_project',
    'explore_tools',
    'export_file',
    'share_project',
  ],
  currentStep: 0,
  canSkip: true,
  completedSteps: [],
};

/**
 * Helper functions
 */
export function getNextStep(
  config: OnboardingConfig
): OnboardingStep | null {
  if (config.currentStep >= config.steps.length - 1) {
    return null; // Onboarding complete
  }
  return config.steps[config.currentStep + 1];
}

export function getPreviousStep(
  config: OnboardingConfig
): OnboardingStep | null {
  if (config.currentStep <= 0) {
    return null; // Already at first step
  }
  return config.steps[config.currentStep - 1];
}

export function markStepComplete(
  config: OnboardingConfig,
  step: OnboardingStep
): OnboardingConfig {
  return {
    ...config,
    completedSteps: [...config.completedSteps, step],
    currentStep: config.currentStep + 1,
  };
}

export function isOnboardingComplete(config: OnboardingConfig): boolean {
  return config.completedSteps.length === config.steps.length;
}

export function getProgressPercentage(config: OnboardingConfig): number {
  return Math.round(
    (config.completedSteps.length / config.steps.length) * 100
  );
}
