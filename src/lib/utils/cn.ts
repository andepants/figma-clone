/**
 * Class Name Utility
 *
 * Merges Tailwind CSS class names with proper precedence handling.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges class names using clsx and tailwind-merge
 *
 * This utility intelligently merges Tailwind classes, ensuring that
 * later classes override earlier ones (e.g., "p-4 p-2" becomes "p-2").
 *
 * @param {...ClassValue[]} inputs - Class names to merge
 * @returns {string} Merged class name string
 *
 * @example
 * ```typescript
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 * cn("text-red-500", someCondition && "text-blue-500") // Conditionally applies classes
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
