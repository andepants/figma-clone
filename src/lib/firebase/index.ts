/**
 * Firebase Barrel Export
 *
 * Central export point for all Firebase services and utilities.
 * Import Firebase functionality from this file throughout the app.
 */

// Export Firebase app and core services
export { app, auth, firestore, realtimeDb, storage } from './config'

// Export authentication utilities
export {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  getAuthErrorMessage,
  type User,
} from './auth'

// Export Firestore utilities
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type DocumentData,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
  type Unsubscribe,
} from './firestore'

// Export Realtime Database utilities
export {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  push,
  type DatabaseReference,
} from './realtimedb'

// Export Realtime Canvas Service (migrated from Firestore)
export {
  subscribeToCanvasObjects,
  addCanvasObject,
  updateCanvasObject,
  throttledUpdateCanvasObject,
  removeCanvasObject,
  clearAllCanvasObjects,
  getAllCanvasObjects,
  batchUpdateCanvasObjects,
  syncZIndexes,
} from './realtimeCanvasService'

// Export Cursor Service
export {
  updateCursor,
  removeCursor,
  subscribeToCursors,
  throttledUpdateCursor,
  cleanupStaleCursors,
  type CursorData,
  type CursorWithUser,
} from './cursorService'

// Export Presence Service
export {
  setOnline,
  setOffline,
  subscribeToPresence,
  type PresenceData,
  type PresenceWithUser,
} from './presenceService'

// Export Drag State Service
export {
  startDragging,
  updateDragPosition,
  throttledUpdateDragPosition,
  endDragging,
  checkDragLock,
  subscribeToDragStates,
  cleanupStaleDragStates,
  startGroupDragging,
  updateGroupDragPositions,
  throttledUpdateGroupDragPositions,
  endGroupDragging,
} from './dragStateService'

// Export Selection Service
export {
  updateSelection,
  clearSelection,
  subscribeToSelections,
  setOnlineWithSelectionCleanup,
} from './selectionService'

// Export Resize Service
export {
  startResizing,
  updateResizePosition,
  throttledUpdateResizePosition,
  endResizing,
  subscribeToResizeStates,
} from './resizeService'

// Export Text Editing Service
export {
  startEditing,
  updateEditHeartbeat,
  updateLiveText,
  throttledUpdateLiveText,
  endEditing,
  checkEditLock,
  subscribeToEditStates,
  cleanupStaleEditStates,
  type EditState,
  type EditStateMap,
} from './textEditingService'

// Export Storage Service
export {
  createImageRef,
  uploadImageToStorage,
  deleteImageFromStorage,
  getImageDownloadURL,
  createExportRef,
  uploadExportToStorage,
  deleteExportFromStorage,
  type UploadProgressCallback,
  type UploadResult,
} from './storage'

// Export Projects Service
export {
  createProject,
  getProject,
  getUserProjects,
  getPublicProjects,
  getPublicProjectsForUser,
  updateProject,
  deleteProject,
  subscribeToProject,
  subscribeToUserProjects,
  canUserAccessProject,
  canUserModifyProject,
  generateProjectId,
  createDefaultProject,
} from './projectsService'

// Export Users Service
export {
  createUser,
  getUser,
  isUsernameAvailable,
  updateLastLogin,
  updateUser,
  deleteUser,
  updateSubscription,
  upgradeToPaidTier,
  downgradeToFreeTier,
  hasActivePaidSubscription,
  updateOnboarding,
  completeOnboardingStep,
  skipOnboarding,
  resetOnboarding,
  subscribeToUser,
  getSubscriptionTierCounts,
  getFoundersUsers,
} from './usersService'

// Export Exports Service
export {
  createExportRecord,
  getExportRecord,
  getUserExportRecords,
  deleteExportRecord,
  deleteAllExportRecords,
} from './exportsService'
export type { ExportRecord, CreateExportInput } from '@/features/export/types'

// Export Config Service
export {
  getFoundersDealConfig,
  updateFoundersDealConfig,
  decrementFoundersSpots,
  subscribeToFoundersDeal,
  isFoundersDealAvailable,
  initializeFoundersDealConfig,
  type FoundersDealConfig,
} from './configService'
