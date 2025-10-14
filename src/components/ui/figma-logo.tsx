/**
 * Figma Logo Component
 *
 * SVG icon representing the Figma logo with its distinctive four-circle pattern.
 * Used in the menu button to match Figma's branding.
 */

/**
 * Props for FigmaLogo component
 * @interface FigmaLogoProps
 * @property {number} [size] - Size of the logo in pixels (default: 20)
 * @property {string} [className] - Additional CSS classes
 */
interface FigmaLogoProps {
  size?: number;
  className?: string;
}

/**
 * Figma logo icon component
 *
 * Renders the Figma logo as an SVG with four circles arranged in a grid pattern.
 * The logo adapts to the current text color (currentColor).
 *
 * @param {FigmaLogoProps} props - Component props
 * @returns {JSX.Element} Figma logo SVG
 *
 * @example
 * ```tsx
 * <FigmaLogo size={24} className="text-blue-500" />
 * ```
 */
export function FigmaLogo({ size = 20, className = '' }: FigmaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top-left circle */}
      <circle cx="5" cy="5" r="3" fill="currentColor" opacity="0.9" />

      {/* Top-right circle */}
      <circle cx="15" cy="5" r="3" fill="currentColor" opacity="0.7" />

      {/* Bottom-left circle */}
      <circle cx="5" cy="15" r="3" fill="currentColor" opacity="0.7" />

      {/* Bottom-right circle */}
      <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
