/**
 * Toolbar Divider Component
 *
 * A vertical line separator for toolbar sections.
 * Provides visual separation between tool groups.
 */

/**
 * Toolbar Divider
 *
 * Renders a vertical line to separate toolbar sections.
 *
 * @example
 * ```tsx
 * <ToolbarDivider />
 * ```
 */
export function ToolbarDivider() {
  return (
    <div
      className="mx-1 w-px h-8 bg-neutral-200"
      role="separator"
      aria-orientation="vertical"
    />
  );
}
