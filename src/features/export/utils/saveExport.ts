/**
 * Save Export to Firebase Utilities
 *
 * Handles uploading exports to Firebase Storage and Firestore.
 */

import {
  uploadExportToStorage,
  createExportRecord,
} from '@/lib/firebase'
import type { CreateExportInput } from '@/features/export/types'
import type { ExportResult } from '@/lib/utils/export'

/**
 * Save export to Firebase Storage and Firestore
 *
 * 1. Uploads PNG to Storage (/exports/{userId}/{exportId}.png)
 * 2. Saves metadata to Firestore (/users/{userId}/exports/{exportId})
 *
 * @param userId - Current user ID
 * @param exportResult - Export result from exportCanvasToPNG
 * @returns Promise resolving to export ID
 *
 * @throws Error if upload or save fails
 *
 * @example
 * ```ts
 * const exportId = await saveExportToFirebase('user123', exportResult)
 * console.log('Export saved:', exportId)
 * ```
 */
export async function saveExportToFirebase(
  userId: string,
  exportResult: ExportResult
): Promise<string> {
  const isDev = import.meta.env.DEV

  if (isDev) console.log('Saving export to Firebase...', exportResult.filename)

  // Generate unique export ID
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Upload PNG to Storage
  if (isDev) console.log('Uploading to Storage...')
  const { url: storageUrl, storagePath } = await uploadExportToStorage(
    exportResult.dataUrl,
    userId,
    exportId
  )
  if (isDev) console.log('Storage upload complete:', storageUrl)

  // Save metadata to Firestore
  if (isDev) console.log('Saving metadata to Firestore...')
  const exportData: CreateExportInput = {
    userId,
    filename: exportResult.filename,
    storagePath,
    storageUrl,
    dataUrl: exportResult.dataUrl, // Store for quick preview
    metadata: exportResult.metadata,
  }

  const savedExportId = await createExportRecord(exportData)
  if (isDev) console.log('Firestore save complete:', savedExportId)

  return savedExportId
}
