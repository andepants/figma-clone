/**
 * Firestore Config Service
 *
 * Manages application configuration stored in Firestore.
 * Primarily used for founders deal tracking and dynamic pricing.
 *
 * @see _docs/plans/stripe-enhanced.md
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './config';

/**
 * Founders Deal Configuration
 *
 * Stored at /config/founders-deal in Firestore
 */
export interface FoundersDealConfig {
  spotsTotal: number;
  spotsRemaining: number;
  priceId: string; // Stripe price ID
  active: boolean;
}

/**
 * Get founders deal configuration
 *
 * @returns Founders deal config or default fallback
 */
export async function getFoundersDealConfig(): Promise<FoundersDealConfig> {
  const configRef = doc(firestore, 'config', 'founders-deal');
  const configSnap = await getDoc(configRef);

  if (!configSnap.exists()) {
    // Return default config if not found
    return {
      spotsTotal: 10,
      spotsRemaining: 7,
      priceId: '',
      active: true,
    };
  }

  return configSnap.data() as FoundersDealConfig;
}

/**
 * Update founders deal configuration
 *
 * ADMIN ONLY: Called when initializing or managing the founders deal.
 *
 * @param config - Founders deal configuration
 */
export async function updateFoundersDealConfig(
  config: FoundersDealConfig
): Promise<void> {
  const configRef = doc(firestore, 'config', 'founders-deal');
  await setDoc(configRef, config, { merge: true });
}

/**
 * Decrement remaining founders spots
 *
 * Called after successful founders tier purchase.
 *
 * @throws Error if no spots remaining
 */
export async function decrementFoundersSpots(): Promise<void> {
  const configRef = doc(firestore, 'config', 'founders-deal');
  const configSnap = await getDoc(configRef);

  if (!configSnap.exists()) {
    throw new Error('Founders deal config not found');
  }

  const config = configSnap.data() as FoundersDealConfig;

  if (config.spotsRemaining <= 0) {
    throw new Error('No founders spots remaining');
  }

  await updateDoc(configRef, {
    spotsRemaining: config.spotsRemaining - 1,
  });
}

/**
 * Subscribe to real-time founders deal updates
 *
 * Use this in components to show live spot count updates.
 *
 * @param callback - Function called with updated config
 * @returns Unsubscribe function
 */
export function subscribeToFoundersDeal(
  callback: (config: FoundersDealConfig) => void
): Unsubscribe {
  const configRef = doc(firestore, 'config', 'founders-deal');

  return onSnapshot(configRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as FoundersDealConfig);
    } else {
      // Return default if not found
      callback({
        spotsTotal: 10,
        spotsRemaining: 7,
        priceId: '',
        active: true,
      });
    }
  });
}

/**
 * Check if founders deal is still available
 *
 * @returns True if spots remaining and deal is active
 */
export async function isFoundersDealAvailable(): Promise<boolean> {
  const config = await getFoundersDealConfig();
  return config.active && config.spotsRemaining > 0;
}

/**
 * Initialize founders deal config (run once in development)
 *
 * Sets up the initial config document with default values.
 * The price ID should be updated manually or via admin panel.
 */
export async function initializeFoundersDealConfig(): Promise<void> {
  const config: FoundersDealConfig = {
    spotsTotal: 10,
    spotsRemaining: 10,
    priceId: '', // Must be set after creating Stripe product
    active: true,
  };

  const configRef = doc(firestore, 'config', 'founders-deal');
  await setDoc(configRef, config);

  console.log('✅ Founders deal config initialized:', config);
}
