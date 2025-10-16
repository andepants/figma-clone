/**
 * Export Feature Types
 *
 * Type definitions for canvas export functionality.
 * Supports configurable export options for format, scale, and scope.
 */

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
