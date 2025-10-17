/**
 * Export Feature Types
 *
 * Type definitions for canvas export functionality.
 * Supports configurable export options for format, scale, and scope.
 */

import type { Timestamp } from 'firebase/firestore'

/**
 * Export format type
 * Currently only PNG supported, designed for future expansion
 */
export type ExportFormat = 'png'; // Future: 'svg' | 'jpg' | 'pdf'

/**
 * Export scale/resolution multiplier
 */
export type ExportScale = 1 | 2 | 3;

/**
 * Export scope (what to export)
 */
export type ExportScope = 'selection' | 'all';

/**
 * Export options interface
 * @interface ExportOptions
 * @property {ExportFormat} format - File format (currently PNG only)
 * @property {ExportScale} scale - Resolution multiplier (1x, 2x, 3x)
 * @property {ExportScope} scope - What to export (selection or all objects)
 */
export interface ExportOptions {
  format: ExportFormat;
  scale: ExportScale;
  scope: ExportScope;
}

/**
 * Export record metadata
 * Stored in Firestore at /users/{userId}/exports/{exportId}
 */
export interface ExportRecord {
  /** Unique export ID (same as document ID) */
  id: string
  /** User ID who created the export */
  userId: string
  /** Original filename (e.g., 'canvasicons-2025-10-17-14-30-45.png') */
  filename: string
  /** Timestamp when export was created */
  createdAt: Timestamp
  /** Storage path in Firebase Storage (e.g., 'exports/user123/export456.png') */
  storagePath: string
  /** Download URL from Firebase Storage */
  storageUrl: string
  /** Base64 data URL for quick preview (optional, can be large) */
  dataUrl?: string
  /** Export metadata */
  metadata: {
    /** Export format (currently always 'png') */
    format: ExportFormat
    /** Resolution multiplier (1x, 2x, 3x) */
    scale: ExportScale
    /** What was exported (selection or all objects) */
    scope: ExportScope
    /** Number of objects exported */
    objectCount: number
    /** Exported image width in pixels */
    width: number
    /** Exported image height in pixels */
    height: number
  }
}

/**
 * Export record creation input
 * Omits server-generated fields (id, createdAt)
 */
export type CreateExportInput = Omit<ExportRecord, 'id' | 'createdAt'>
