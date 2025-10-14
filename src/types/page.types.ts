/**
 * Page settings types for canvas page configuration
 * Used in the default right panel layout when no shape is selected
 */

/**
 * Page settings interface for canvas background and export configuration
 */
export interface PageSettings {
  /** Background color in hex format (e.g., '#FFFFFF') */
  backgroundColor: string;

  /** Opacity percentage (0-100) */
  opacity: number;

  /** Whether to include page background in exports */
  showInExports: boolean;
}
