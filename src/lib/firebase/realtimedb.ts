/**
 * Firebase Realtime Database Module
 *
 * Exports Realtime Database instance and commonly used functions.
 * Used for real-time cursor positions and presence with 50ms throttle.
 */

import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  push,
  type DatabaseReference,
} from 'firebase/database'
import { realtimeDb } from './config'

// Re-export realtimeDb instance
export { realtimeDb }

// Re-export commonly used Realtime Database functions
export {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  push,
}

// Re-export types
export type { DatabaseReference }
