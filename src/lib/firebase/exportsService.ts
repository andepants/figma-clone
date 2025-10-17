/**
 * Firebase Exports Service
 *
 * Manages export metadata in Firestore.
 * Collection path: /users/{userId}/exports/{exportId}
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from './config'
import type { ExportRecord, CreateExportInput } from '@/features/export/types'

/**
 * Get exports collection reference for a user
 */
function getExportsCollection(userId: string) {
  return collection(firestore, 'users', userId, 'exports')
}

/**
 * Create a new export record
 *
 * @param exportData - Export metadata (without id/createdAt)
 * @returns Promise resolving to export ID
 */
export async function createExportRecord(exportData: CreateExportInput): Promise<string> {
  const exportsCol = getExportsCollection(exportData.userId)
  const newExportRef = doc(exportsCol)
  const exportId = newExportRef.id

  const exportRecord: Omit<ExportRecord, 'createdAt'> & { createdAt: unknown } = {
    ...exportData,
    id: exportId,
    createdAt: serverTimestamp(),
  }

  await setDoc(newExportRef, exportRecord)
  return exportId
}

/**
 * Get a single export record
 *
 * @param userId - User ID
 * @param exportId - Export ID
 * @returns Promise resolving to export record or null if not found
 */
export async function getExportRecord(
  userId: string,
  exportId: string
): Promise<ExportRecord | null> {
  const exportsCol = getExportsCollection(userId)
  const exportRef = doc(exportsCol, exportId)
  const exportDoc = await getDoc(exportRef)

  if (!exportDoc.exists()) {
    return null
  }

  return exportDoc.data() as ExportRecord
}

/**
 * Get all export records for a user
 * Sorted by creation date (newest first)
 *
 * @param userId - User ID
 * @param limitCount - Maximum number of records to return (default: 50)
 * @returns Promise resolving to array of export records
 */
export async function getUserExportRecords(
  userId: string,
  limitCount: number = 50
): Promise<ExportRecord[]> {
  const exportsCol = getExportsCollection(userId)
  const exportsQuery = query(
    exportsCol,
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  )

  const querySnapshot = await getDocs(exportsQuery)
  return querySnapshot.docs.map(doc => doc.data() as ExportRecord)
}

/**
 * Delete a single export record
 *
 * @param userId - User ID
 * @param exportId - Export ID
 * @returns Promise resolving when deletion completes
 */
export async function deleteExportRecord(userId: string, exportId: string): Promise<void> {
  const exportsCol = getExportsCollection(userId)
  const exportRef = doc(exportsCol, exportId)
  await deleteDoc(exportRef)
}

/**
 * Delete all export records for a user
 *
 * @param userId - User ID
 * @returns Promise resolving to number of deleted records
 */
export async function deleteAllExportRecords(userId: string): Promise<number> {
  const exports = await getUserExportRecords(userId, 1000) // Get all (reasonable limit)

  // Delete all records in parallel
  await Promise.all(
    exports.map(exp => deleteExportRecord(userId, exp.id))
  )

  return exports.length
}
