# Right Properties Panel Implementation Plan

**Status:** Planning
**Priority:** High
**Estimated Duration:** 8-12 hours
**Last Updated:** 2025-01-14

---

## Overview

Implement a comprehensive properties panel (similar to Figma) on the right side of the canvas that displays and allows editing of selected shape properties including Position, Rotation, Layout (Dimensions), Appearance, and Fill.

---

## Current State Analysis

### Existing Data Model (canvas.types.ts)
```typescript
interface Rectangle {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
```

### Missing Properties (Available in Konva)
Based on Konva.js documentation, we can access:
- ✅ Position: `x`, `y`, `absolutePosition()`
- ✅ Dimensions: `width`, `height`
- ❌ Rotation: `rotation()` (degrees)
- ❌ Scale: `scaleX()`, `scaleY()`
- ❌ Skew: `skewX()`, `skewY()`
- ❌ Opacity: `opacity()` (0-1)
- ❌ Corner Radius: `cornerRadius()` (for rectangles)
- ❌ Stroke: `stroke`, `strokeWidth`, `strokeEnabled`
- ❌ Shadow: `shadowColor`, `shadowBlur`, `shadowOffset`, `shadowOpacity`

---

## Phase 1: Data Model Extension

### Task 1.1a: Create Shared VisualProperties Interface
**File:** `src/types/canvas.types.ts`
**Duration:** 15 minutes

**Requirements:**
- Create generic visual properties applicable to ALL shape types
- Maintain backward compatibility with existing shapes
- Include proper JSDoc documentation

**Implementation:**
```typescript
/**
 * Visual properties shared by all canvas objects
 * These properties are optional for backward compatibility
 * @interface VisualProperties
 */
export interface VisualProperties {
  // Transform properties (all shapes)
  rotation?: number;           // Degrees: 0-360
  opacity?: number;            // 0-1, default 1
  scaleX?: number;             // Scale factor, default 1
  scaleY?: number;             // Scale factor, default 1
  skewX?: number;              // Skew angle in degrees
  skewY?: number;              // Skew angle in degrees

  // Stroke properties (all shapes)
  stroke?: string;             // Color
  strokeWidth?: number;        // Pixels
  strokeEnabled?: boolean;     // Toggle stroke on/off

  // Shadow properties (all shapes)
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  shadowEnabled?: boolean;
}
```

**Edge Cases:**
- ✅ Ensure rotation value wraps correctly (0-360)
- ✅ Clamp opacity between 0 and 1
- ✅ Validate scale factors (allow negative for flipping)
- ✅ Handle undefined properties with sensible defaults
- ✅ Support all shape types (rectangle, circle, text)

**Tests:**
```typescript
// tests/types/canvas.types.test.ts
describe('VisualProperties', () => {
  it('should accept all visual properties', () => {...});
  it('should work with optional properties', () => {...});
  it('should validate rotation range', () => {...});
  it('should validate opacity range', () => {...});
  it('should support negative scale for flipping', () => {...});
});
```

---

### Task 1.1b: Create Shape-Specific Property Interfaces
**File:** `src/types/canvas.types.ts`
**Duration:** 15 minutes

**Requirements:**
- Define properties unique to each shape type
- Keep interfaces focused and minimal
- Support future shape type extensions

**Implementation:**
```typescript
/**
 * Rectangle-specific properties
 * @interface RectangleProperties
 */
export interface RectangleProperties {
  cornerRadius?: number | [number, number, number, number]; // Uniform or per-corner [TL, TR, BR, BL]
  lockAspectRatio?: boolean;   // Maintain aspect ratio when resizing
}

/**
 * Circle-specific properties
 * @interface CircleProperties
 */
export interface CircleProperties {
  // Future: arc angles, segments, etc.
  // Circles always maintain aspect ratio, no lock needed
}

/**
 * Text-specific properties
 * @interface TextProperties
 */
export interface TextProperties {
  fontWeight?: number | string;  // 400, 700, 'bold', etc.
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;        // In pixels
  lineHeight?: number;           // Line height multiplier (1.5 = 150%)
}
```

**Edge Cases:**
- ✅ Rectangle: Handle array cornerRadius with 4 values
- ✅ Rectangle: Validate cornerRadius doesn't exceed min(width, height) / 2
- ✅ Circle: Always maintain 1:1 aspect ratio
- ✅ Text: Handle auto-height based on content
- ✅ All: Ensure properties don't conflict across types

**Tests:**
```typescript
describe('Shape-Specific Properties', () => {
  describe('RectangleProperties', () => {
    it('should support uniform corner radius', () => {...});
    it('should support per-corner radius array', () => {...});
    it('should validate corner radius max value', () => {...});
  });

  describe('CircleProperties', () => {
    it('should maintain aspect ratio automatically', () => {...});
  });

  describe('TextProperties', () => {
    it('should support font weight variations', () => {...});
    it('should validate text alignment values', () => {...});
  });
});
```

---

### Task 1.1c: Update Rectangle Interface
**File:** `src/types/canvas.types.ts`
**Duration:** 10 minutes

**Requirements:**
- Extend BaseCanvasObject with shared and specific properties
- Maintain existing required properties
- Ensure backward compatibility

**Implementation:**
```typescript
/**
 * Rectangle shape object
 * @interface Rectangle
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends RectangleProperties
 */
export interface Rectangle extends BaseCanvasObject, VisualProperties, RectangleProperties {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
}
```

**Edge Cases:**
- ✅ Old rectangles without new properties still work
- ✅ New properties are truly optional
- ✅ TypeScript properly types discriminated union

---

### Task 1.1d: Update Circle Interface
**File:** `src/types/canvas.types.ts`
**Duration:** 10 minutes

**Requirements:**
- Extend BaseCanvasObject with shared and specific properties
- Support radius-based dimensions
- Ensure visual properties work with circles

**Implementation:**
```typescript
/**
 * Circle shape object
 * @interface Circle
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends CircleProperties
 */
export interface Circle extends BaseCanvasObject, VisualProperties, CircleProperties {
  type: 'circle';
  radius: number;
  fill: string;
}
```

**Edge Cases:**
- ✅ Radius must be positive (minimum 1)
- ✅ Diameter = radius * 2 for display
- ✅ Position is center-based, not top-left
- ✅ Rotation has no visual effect (unless stroke/gradient applied)
- ✅ Scale affects both X and Y equally

---

### Task 1.1e: Update Text Interface
**File:** `src/types/canvas.types.ts`
**Duration:** 15 minutes

**Requirements:**
- Extend BaseCanvasObject with shared and specific properties
- Support text-specific dimensions
- Handle text box width (optional)

**Implementation:**
```typescript
/**
 * Text shape object
 * @interface Text
 * @extends BaseCanvasObject
 * @extends VisualProperties
 * @extends TextProperties
 */
export interface Text extends BaseCanvasObject, VisualProperties, TextProperties {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width?: number;  // Text box width (optional, for wrapping)
  // Height is auto-calculated based on content + fontSize
}
```

**Edge Cases:**
- ✅ Text without width property = auto-width
- ✅ Text with width property = wrapped text box
- ✅ Height is always calculated, never set manually
- ✅ Empty content should have minimum height
- ✅ fontSize must be positive (minimum 1)

---

### Task 1.1f: Add Type Guards for Property Checking
**File:** `src/types/canvas.types.ts`
**Duration:** 20 minutes

**Requirements:**
- Create type guards for shape-specific property detection
- Enable safe property access in components
- Support TypeScript type narrowing

**Implementation:**
```typescript
/**
 * Type guard: Check if shape has dimensional properties (width, height)
 */
export function hasDimensions(shape: CanvasObject): shape is Rectangle | Text {
  return shape.type === 'rectangle' || shape.type === 'text';
}

/**
 * Type guard: Check if shape has radius property
 */
export function hasRadius(shape: CanvasObject): shape is Circle {
  return shape.type === 'circle';
}

/**
 * Type guard: Check if shape supports corner radius
 */
export function hasCornerRadius(shape: CanvasObject): shape is Rectangle {
  return shape.type === 'rectangle';
}

/**
 * Type guard: Check if shape supports aspect ratio lock
 */
export function supportsAspectRatioLock(shape: CanvasObject): boolean {
  return shape.type === 'rectangle' || shape.type === 'text';
}

/**
 * Type guard: Check if shape is text with text-specific properties
 */
export function isTextShape(shape: CanvasObject): shape is Text {
  return shape.type === 'text';
}
```

**Edge Cases:**
- ✅ Handle unknown shape types gracefully (future-proofing)
- ✅ Return false for null/undefined shapes
- ✅ Ensure type narrowing works in all contexts
- ✅ Support future shape types without breaking

**Tests:**
```typescript
describe('Type Guards', () => {
  it('should correctly identify shapes with dimensions', () => {...});
  it('should correctly identify circles with radius', () => {...});
  it('should correctly identify corner radius support', () => {...});
  it('should correctly identify aspect ratio lock support', () => {...});
  it('should handle unknown shape types', () => {...});
  it('should enable TypeScript type narrowing', () => {...});
});
```

---

### Task 1.2: Create Property Validation Utilities
**File:** `src/lib/utils/validation.ts`
**Duration:** 30 minutes

**Requirements:**
- Utility functions to validate and clamp property values
- Ensure all inputs are sanitized before updating state
- Provide helpful error messages

**Implementation:**
```typescript
/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number;

/**
 * Normalize rotation to 0-360 range
 */
export function normalizeRotation(degrees: number): number;

/**
 * Validate and clamp opacity (0-1)
 */
export function validateOpacity(opacity: number): number;

/**
 * Validate corner radius (non-negative)
 */
export function validateCornerRadius(
  radius: number | [number, number, number, number]
): number | [number, number, number, number];

/**
 * Parse color string (hex, rgb, rgba, named)
 */
export function validateColor(color: string): string | null;

/**
 * Validate dimensions (positive numbers)
 */
export function validateDimensions(width: number, height: number): {
  width: number;
  height: number;
  isValid: boolean;
};
```

**Edge Cases:**
- ✅ Handle negative numbers
- ✅ Handle NaN and Infinity
- ✅ Handle null/undefined inputs
- ✅ Validate color formats (hex, rgb, rgba, hsl, named)
- ✅ Round to appropriate precision (2 decimal places)

**Tests:**
```typescript
// tests/lib/utils/validation.test.ts
describe('Validation Utils', () => {
  describe('clamp', () => {
    it('should clamp value within range', () => {...});
    it('should handle negative ranges', () => {...});
    it('should handle NaN and Infinity', () => {...});
  });

  describe('normalizeRotation', () => {
    it('should normalize positive angles', () => {...});
    it('should normalize negative angles', () => {...});
    it('should handle angles > 360', () => {...});
  });

  // ... more tests for each function
});
```

---

### Task 1.3: Update Rectangle Component
**File:** `src/features/canvas-core/shapes/Rectangle.tsx`
**Duration:** 30 minutes

**Requirements:**
- Apply all new visual properties from data model
- Ensure properties sync with Konva node
- Maintain backward compatibility (default values)

**Implementation:**
```typescript
export const Rectangle = memo(function Rectangle({
  rectangle,
  isSelected,
  onSelect,
  remoteDragState
}: RectangleProps) {
  // ... existing code ...

  return (
    <Rect
      x={displayX}
      y={displayY}
      width={rectangle.width}
      height={rectangle.height}
      fill={rectangle.fill}

      // New properties with defaults
      rotation={rectangle.rotation ?? 0}
      opacity={rectangle.opacity ?? 1}
      cornerRadius={rectangle.cornerRadius ?? 0}
      scaleX={rectangle.scaleX ?? 1}
      scaleY={rectangle.scaleY ?? 1}
      skewX={rectangle.skewX ?? 0}
      skewY={rectangle.skewY ?? 0}

      // Stroke properties
      stroke={rectangle.stroke ?? getStroke()}
      strokeWidth={rectangle.strokeWidth ?? getStrokeWidth()}
      strokeEnabled={rectangle.strokeEnabled ?? true}

      // Shadow properties
      shadowColor={rectangle.shadowColor}
      shadowBlur={rectangle.shadowBlur ?? 0}
      shadowOffsetX={rectangle.shadowOffsetX ?? 0}
      shadowOffsetY={rectangle.shadowOffsetY ?? 0}
      shadowOpacity={rectangle.shadowOpacity ?? 1}
      shadowEnabled={rectangle.shadowEnabled ?? false}

      // ... rest of props ...
    />
  );
});
```

**Edge Cases:**
- ✅ Handle undefined properties gracefully
- ✅ Ensure defaults don't break existing shapes
- ✅ Test with old data model (no new properties)
- ✅ Verify rotation center (offset/pivot point)

**Tests:**
```typescript
// tests/features/canvas-core/shapes/Rectangle.test.tsx
describe('Rectangle Component', () => {
  it('should render with minimal properties', () => {...});
  it('should apply rotation correctly', () => {...});
  it('should apply opacity correctly', () => {...});
  it('should apply corner radius (uniform)', () => {...});
  it('should apply corner radius (per-corner)', () => {...});
  it('should handle backward compatibility', () => {...});
});
```

---

## Phase 1.5: Shape Property Detection Utilities

### Task 1.5.1: Create Shape Property Detection Utilities
**File:** `src/lib/utils/shape-properties.ts`
**Duration:** 45 minutes

**Requirements:**
- Create utilities to get normalized dimensions for any shape type
- Provide shape-specific property extraction
- Enable safe property access across all shape types
- Support future shape extensions

**Implementation:**
```typescript
/**
 * Shape Property Detection Utilities
 *
 * Provides helper functions to work with different shape types
 * in a type-safe and normalized way.
 */

import type { CanvasObject, Rectangle, Circle, Text } from '@/types/canvas.types';
import { hasDimensions, hasRadius, hasCornerRadius, supportsAspectRatioLock, isTextShape } from '@/types/canvas.types';

/**
 * Get normalized dimensions for any shape type
 * Returns { width, height } or null if shape doesn't have dimensions
 *
 * - Rectangle/Text: Returns width and height directly
 * - Circle: Returns diameter as both width and height
 */
export function getNormalizedDimensions(shape: CanvasObject): {
  width: number;
  height: number;
} | null {
  if (hasDimensions(shape)) {
    // Text with auto-width returns calculated width
    if (isTextShape(shape) && !shape.width) {
      // Calculate text width based on content (rough estimate)
      const estimatedWidth = shape.content.length * shape.fontSize * 0.6;
      return { width: estimatedWidth, height: shape.fontSize * 1.2 };
    }
    return { width: shape.width, height: shape.height ?? 0 };
  }

  if (hasRadius(shape)) {
    const diameter = shape.radius * 2;
    return { width: diameter, height: diameter };
  }

  return null;
}

/**
 * Get the display name for a shape's dimension property
 * Used for UI labels
 */
export function getDimensionLabels(shape: CanvasObject): {
  primary: string;
  secondary?: string;
} {
  if (hasRadius(shape)) {
    return { primary: 'Radius', secondary: 'Diameter' };
  }
  if (hasDimensions(shape)) {
    return { primary: 'Width', secondary: 'Height' };
  }
  return { primary: 'Size' };
}

/**
 * Get shape-specific properties for display in properties panel
 * Returns an object with all relevant properties for the shape type
 */
export function getShapeSpecificProperties(shape: CanvasObject): Record<string, any> {
  switch (shape.type) {
    case 'rectangle':
      return {
        width: shape.width,
        height: shape.height,
        cornerRadius: shape.cornerRadius ?? 0,
        lockAspectRatio: shape.lockAspectRatio ?? false,
      };

    case 'circle':
      return {
        radius: shape.radius,
        diameter: shape.radius * 2,
        // Circles always maintain aspect ratio
        lockAspectRatio: true,
      };

    case 'text':
      return {
        content: shape.content,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        width: shape.width ?? null,  // null = auto-width
        fontWeight: shape.fontWeight ?? 400,
        fontStyle: shape.fontStyle ?? 'normal',
        textAlign: shape.textAlign ?? 'left',
      };

    default:
      return {};
  }
}

/**
 * Check if a property is applicable to a given shape type
 * Used to conditionally render property controls
 */
export function isPropertyApplicable(
  shape: CanvasObject,
  property: string
): boolean {
  const propertyMap: Record<string, (shape: CanvasObject) => boolean> = {
    width: hasDimensions,
    height: hasDimensions,
    radius: hasRadius,
    cornerRadius: hasCornerRadius,
    lockAspectRatio: supportsAspectRatioLock,
    content: isTextShape,
    fontSize: isTextShape,
    fontFamily: isTextShape,
    fontWeight: isTextShape,
    fontStyle: isTextShape,
    textAlign: isTextShape,
    textDecoration: isTextShape,
    letterSpacing: isTextShape,
    lineHeight: isTextShape,
  };

  const checker = propertyMap[property];
  return checker ? checker(shape) : true; // Default to true for common properties
}

/**
 * Get minimum dimension constraints for a shape type
 */
export function getMinimumDimensions(shapeType: CanvasObject['type']): {
  min: number;
  label: string;
} {
  switch (shapeType) {
    case 'rectangle':
      return { min: 1, label: 'Minimum size: 1×1 px' };
    case 'circle':
      return { min: 1, label: 'Minimum radius: 1 px (2 px diameter)' };
    case 'text':
      return { min: 1, label: 'Minimum font size: 1 px' };
    default:
      return { min: 1, label: 'Minimum size: 1 px' };
  }
}

/**
 * Validate and clamp dimension update for a shape
 * Returns validated value or null if invalid
 */
export function validateDimensionUpdate(
  shape: CanvasObject,
  property: 'width' | 'height' | 'radius',
  value: number
): number | null {
  const min = getMinimumDimensions(shape.type).min;
  const max = 10000; // Maximum canvas dimension

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  // Validate property is applicable to this shape
  if (!isPropertyApplicable(shape, property)) {
    return null;
  }

  // Clamp to valid range
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate aspect ratio for a shape
 * Returns null if shape doesn't support aspect ratio
 */
export function getAspectRatio(shape: CanvasObject): number | null {
  if (hasRadius(shape)) {
    return 1; // Circles always 1:1
  }

  if (hasDimensions(shape)) {
    if (shape.height === 0) return null;
    return shape.width / shape.height;
  }

  return null;
}

/**
 * Apply aspect ratio lock to dimension change
 * Returns updated dimensions maintaining aspect ratio
 */
export function applyAspectRatioLock(
  shape: CanvasObject,
  changedProperty: 'width' | 'height' | 'radius',
  newValue: number
): { width?: number; height?: number; radius?: number } | null {
  if (!supportsAspectRatioLock(shape)) {
    return null;
  }

  const aspectRatio = getAspectRatio(shape);
  if (!aspectRatio) return null;

  if (hasRadius(shape)) {
    // Circles: radius change affects diameter
    return { radius: newValue };
  }

  if (hasDimensions(shape)) {
    if (changedProperty === 'width') {
      return {
        width: newValue,
        height: newValue / aspectRatio,
      };
    } else if (changedProperty === 'height') {
      return {
        width: newValue * aspectRatio,
        height: newValue,
      };
    }
  }

  return null;
}
```

**Edge Cases:**
- ✅ Handle unknown shape types (return safe defaults)
- ✅ Handle shapes with missing optional properties
- ✅ Handle text with auto-width (no width property)
- ✅ Handle zero/negative dimensions gracefully
- ✅ Handle division by zero in aspect ratio calculations
- ✅ Handle NaN and Infinity values
- ✅ Support future shape types without breaking existing code
- ✅ Handle concurrent property updates
- ✅ Handle properties that don't exist on certain shapes

**Tests:**
```typescript
// tests/lib/utils/shape-properties.test.ts
describe('Shape Property Detection Utilities', () => {
  describe('getNormalizedDimensions', () => {
    it('should return width and height for rectangles', () => {
      const rect: Rectangle = { type: 'rectangle', width: 100, height: 50, ... };
      expect(getNormalizedDimensions(rect)).toEqual({ width: 100, height: 50 });
    });

    it('should return diameter for circles', () => {
      const circle: Circle = { type: 'circle', radius: 50, ... };
      expect(getNormalizedDimensions(circle)).toEqual({ width: 100, height: 100 });
    });

    it('should handle text with explicit width', () => {
      const text: Text = { type: 'text', width: 200, fontSize: 16, ... };
      expect(getNormalizedDimensions(text)).toHaveProperty('width', 200);
    });

    it('should estimate width for text without explicit width', () => {
      const text: Text = { type: 'text', content: 'Hello', fontSize: 16, ... };
      const dims = getNormalizedDimensions(text);
      expect(dims).not.toBeNull();
      expect(dims!.width).toBeGreaterThan(0);
    });
  });

  describe('getDimensionLabels', () => {
    it('should return Width/Height for rectangles', () => {...});
    it('should return Radius/Diameter for circles', () => {...});
  });

  describe('isPropertyApplicable', () => {
    it('should allow cornerRadius only for rectangles', () => {
      const rect: Rectangle = { type: 'rectangle', ... };
      const circle: Circle = { type: 'circle', ... };
      expect(isPropertyApplicable(rect, 'cornerRadius')).toBe(true);
      expect(isPropertyApplicable(circle, 'cornerRadius')).toBe(false);
    });

    it('should allow fontSize only for text', () => {...});
    it('should allow radius only for circles', () => {...});
  });

  describe('validateDimensionUpdate', () => {
    it('should clamp values to min/max range', () => {...});
    it('should reject NaN values', () => {...});
    it('should reject Infinity values', () => {...});
    it('should reject invalid property for shape type', () => {...});
  });

  describe('getAspectRatio', () => {
    it('should return 1 for circles', () => {...});
    it('should calculate ratio for rectangles', () => {...});
    it('should handle zero height gracefully', () => {...});
  });

  describe('applyAspectRatioLock', () => {
    it('should maintain aspect ratio for rectangles', () => {...});
    it('should handle circle radius changes', () => {...});
    it('should return null for shapes without aspect ratio support', () => {...});
  });
});
```

---

## Phase 2: Properties Panel Feature Structure

### Task 2.1: Create Feature Directory Structure
**File:** Multiple files
**Duration:** 10 minutes

**Directory Structure:**
```
src/features/properties-panel/
├── components/
│   ├── PropertiesPanel.tsx          # Main container
│   ├── PropertySection.tsx          # Collapsible section wrapper
│   ├── PositionSection.tsx          # Position & alignment
│   ├── RotationSection.tsx          # Rotation & flip controls
│   ├── LayoutSection.tsx            # Width, height, constraints
│   ├── AppearanceSection.tsx        # Opacity, corner radius
│   ├── FillSection.tsx              # Fill color & pattern
│   ├── StrokeSection.tsx            # Stroke properties (future)
│   └── index.ts                     # Barrel export
├── hooks/
│   ├── usePropertyUpdate.ts         # Update shape properties
│   ├── useSelectedShape.ts          # Get currently selected shape
│   └── index.ts
├── utils/
│   ├── propertyCalculations.ts      # Calculate derived values
│   └── index.ts
└── index.ts                          # Feature barrel export
```

---

### Task 2.2: Create Base UI Components

**Overview:** Break down UI component creation into smaller, testable increments

---

#### Task 2.2a: NumberInput - Basic Input Field
**File:** `src/components/ui/number-input.tsx`
**Duration:** 20 minutes

**Requirements:**
- Create basic numeric input with validation
- Handle integer and decimal inputs
- Show current value

**Implementation:**
```typescript
interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;        // Decimal places
  unit?: string;             // Display unit (px, deg, %)
  disabled?: boolean;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 0,
  unit,
  disabled,
  className
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState(value.toString());

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInternalValue(e.target.value);
  }

  function handleBlur() {
    const numValue = parseFloat(internalValue);
    if (isNaN(numValue)) {
      setInternalValue(value.toString());
      return;
    }

    let clamped = numValue;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);

    const rounded = Number(clamped.toFixed(precision));
    onChange(rounded);
    setInternalValue(rounded.toString());
  }

  return (
    <input
      type="text"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
    />
  );
}
```

**Edge Cases:**
- ✅ Handle keyboard input (numbers, decimals, negative)
- ✅ Handle paste events with non-numeric data
- ✅ Validate during blur, not during typing
- ✅ Preserve cursor position during editing

**Tests:**
```typescript
describe('NumberInput - Basic', () => {
  it('should render with initial value', () => {...});
  it('should allow typing numbers', () => {...});
  it('should allow typing decimals', () => {...});
  it('should validate on blur', () => {...});
  it('should handle invalid input gracefully', () => {...});
});
```

---

#### Task 2.2b: NumberInput - Increment/Decrement Buttons
**File:** `src/components/ui/number-input.tsx`
**Duration:** 15 minutes

**Requirements:**
- Add up/down buttons for incrementing
- Support step increments
- Respect min/max boundaries

**Implementation:**
```typescript
// Add to NumberInput component
function handleIncrement() {
  const newValue = value + step;
  const clamped = max !== undefined ? Math.min(max, newValue) : newValue;
  onChange(Number(clamped.toFixed(precision)));
}

function handleDecrement() {
  const newValue = value - step;
  const clamped = min !== undefined ? Math.max(min, newValue) : newValue;
  onChange(Number(clamped.toFixed(precision)));
}

return (
  <div className="flex items-center">
    <input ... />
    <div className="flex flex-col">
      <button onClick={handleIncrement}>↑</button>
      <button onClick={handleDecrement}>↓</button>
    </div>
  </div>
);
```

**Edge Cases:**
- ✅ Disable buttons at min/max boundaries
- ✅ Handle rapid clicking
- ✅ Apply step correctly with decimal precision

**Tests:**
```typescript
describe('NumberInput - Increment/Decrement', () => {
  it('should increment by step on up button click', () => {...});
  it('should decrement by step on down button click', () => {...});
  it('should not exceed max value', () => {...});
  it('should not go below min value', () => {...});
  it('should disable up button at max', () => {...});
  it('should disable down button at min', () => {...});
});
```

---

#### Task 2.2c: NumberInput - Keyboard Support
**File:** `src/components/ui/number-input.tsx`
**Duration:** 15 minutes

**Requirements:**
- Support Arrow Up/Down keys
- Support Page Up/Down for larger increments
- Support mouse wheel scrolling

**Implementation:**
```typescript
function handleKeyDown(e: React.KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    handleIncrement();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    handleDecrement();
  } else if (e.key === 'PageUp') {
    e.preventDefault();
    onChange(value + step * 10);
  } else if (e.key === 'PageDown') {
    e.preventDefault();
    onChange(value - step * 10);
  }
}

function handleWheel(e: React.WheelEvent) {
  if (document.activeElement === inputRef.current) {
    e.preventDefault();
    if (e.deltaY < 0) handleIncrement();
    else handleDecrement();
  }
}
```

**Edge Cases:**
- ✅ Only respond to wheel when focused
- ✅ Prevent page scroll on wheel
- ✅ Handle held-down keys (no repeat)

**Tests:**
```typescript
describe('NumberInput - Keyboard', () => {
  it('should increment on arrow up key', () => {...});
  it('should decrement on arrow down key', () => {...});
  it('should increment by 10× step on page up', () => {...});
  it('should increment on wheel up when focused', () => {...});
  it('should not respond to wheel when not focused', () => {...});
});
```

---

#### Task 2.2d: NumberInput - Unit Display
**File:** `src/components/ui/number-input.tsx`
**Duration:** 10 minutes

**Requirements:**
- Display unit suffix (px, deg, %, etc.)
- Don't interfere with input editing
- Show unit visually separate from value

**Implementation:**
```typescript
return (
  <div className="relative">
    <input ... />
    {unit && (
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
        {unit}
      </span>
    )}
  </div>
);
```

**Tests:**
```typescript
describe('NumberInput - Unit Display', () => {
  it('should display unit suffix', () => {...});
  it('should not interfere with input', () => {...});
  it('should handle long unit strings', () => {...});
});
```

---

#### Task 2.2e: ColorPicker - Swatch Button
**File:** `src/components/ui/color-picker.tsx`
**Duration:** 20 minutes

**Requirements:**
- Create color swatch button
- Show current color
- Open popover on click

**Implementation:**
```typescript
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showAlpha?: boolean;
  presets?: string[];
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  disabled,
  className
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "w-8 h-8 rounded border-2 border-gray-300",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverContent>
        {/* Color picker content */}
      </PopoverContent>
    </Popover>
  );
}
```

**Tests:**
```typescript
describe('ColorPicker - Swatch', () => {
  it('should render with initial color', () => {...});
  it('should open popover on click', () => {...});
  it('should close popover on outside click', () => {...});
  it('should be disabled when disabled prop is true', () => {...});
});
```

---

#### Task 2.2f: ColorPicker - Hex Input
**File:** `src/components/ui/color-picker.tsx`
**Duration:** 15 minutes

**Requirements:**
- Hex color input field
- Validate hex format
- Support 3, 6, and 8 character hex

**Implementation:**
```typescript
function validateHex(hex: string): boolean {
  return /^#[0-9A-F]{3}$|^#[0-9A-F]{6}$|^#[0-9A-F]{8}$/i.test(hex);
}

function normalizeHex(hex: string): string {
  // Convert 3-char to 6-char hex
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

// Inside ColorPicker
<input
  type="text"
  value={value}
  onChange={(e) => {
    const hex = e.target.value;
    if (validateHex(hex)) {
      onChange(normalizeHex(hex));
    }
  }}
  placeholder="#000000"
  className="font-mono text-sm"
/>
```

**Edge Cases:**
- ✅ Validate hex format (#RGB, #RRGGBB, #RRGGBBAA)
- ✅ Handle lowercase and uppercase
- ✅ Normalize 3-char to 6-char hex
- ✅ Handle invalid inputs gracefully

**Tests:**
```typescript
describe('ColorPicker - Hex Input', () => {
  it('should accept valid 6-char hex', () => {...});
  it('should accept valid 3-char hex', () => {...});
  it('should accept 8-char hex with alpha', () => {...});
  it('should reject invalid hex', () => {...});
  it('should normalize 3-char to 6-char', () => {...});
});
```

---

#### Task 2.2g: ColorPicker - Visual Picker
**File:** `src/components/ui/color-picker.tsx`
**Duration:** 30 minutes

**Requirements:**
- Hue slider (0-360)
- Saturation/lightness square
- Connect to color value

**Implementation:**
```typescript
// Consider using a library like react-colorful for this
import { HexColorPicker } from 'react-colorful';

<PopoverContent>
  <HexColorPicker color={value} onChange={onChange} />
  {/* ... rest of content */}
</PopoverContent>
```

**Alternative: Custom implementation**
```typescript
// Simplified version - full implementation more complex
function HSLtoHex(h: number, s: number, l: number): string {
  // Convert HSL to RGB to Hex
  // ... implementation
}

<div className="w-48 h-48 relative" style={{ background: `hsl(${hue}, 100%, 50%)` }}>
  {/* Saturation/lightness overlay */}
</div>
<input
  type="range"
  min="0"
  max="360"
  value={hue}
  onChange={(e) => setHue(Number(e.target.value))}
/>
```

**Tests:**
```typescript
describe('ColorPicker - Visual Picker', () => {
  it('should update color on hue change', () => {...});
  it('should update color on saturation/lightness change', () => {...});
  it('should display current color correctly', () => {...});
});
```

---

#### Task 2.2h: ColorPicker - Preset Colors
**File:** `src/components/ui/color-picker.tsx`
**Duration:** 15 minutes

**Requirements:**
- Display grid of preset colors
- Click to select preset
- Support custom presets

**Implementation:**
```typescript
const defaultPresets = [
  '#000000', '#FFFFFF', '#F44336', '#E91E63',
  // ... more colors
];

<div className="grid grid-cols-6 gap-1 mt-2">
  {(presets || defaultPresets).map((preset) => (
    <button
      key={preset}
      onClick={() => onChange(preset)}
      className="w-6 h-6 rounded border hover:border-gray-400"
      style={{ backgroundColor: preset }}
      title={preset}
    />
  ))}
</div>
```

**Edge Cases:**
- ✅ Handle custom preset arrays
- ✅ Highlight currently selected preset
- ✅ Support empty presets array

**Tests:**
```typescript
describe('ColorPicker - Presets', () => {
  it('should display default presets', () => {...});
  it('should display custom presets', () => {...});
  it('should select preset on click', () => {...});
  it('should highlight current color if in presets', () => {...});
});
```

---

### Task 2.3: Create PropertySection Component
**File:** `src/features/properties-panel/components/PropertySection.tsx`
**Duration:** 20 minutes

**Requirements:**
- Collapsible section with header
- Smooth expand/collapse animation
- Section title and optional icon
- Persistent collapsed state (localStorage)

**Implementation:**
```typescript
interface PropertySectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  storageKey?: string;        // For persisting collapsed state
}

export function PropertySection({
  title,
  icon,
  defaultOpen = true,
  children,
  storageKey
}: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (!storageKey) return defaultOpen;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : defaultOpen;
  });

  // Save state to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isOpen));
    }
  }, [isOpen, storageKey]);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="px-3 py-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
```

**Tests:**
```typescript
// tests/features/properties-panel/components/PropertySection.test.tsx
describe('PropertySection', () => {
  it('should render open by default', () => {...});
  it('should toggle on header click', () => {...});
  it('should persist state to localStorage', () => {...});
  it('should restore state from localStorage', () => {...});
});
```

---

## Phase 2.5: Conditional Section Rendering

### Task 2.5.1: Create Section Visibility Logic
**File:** `src/features/properties-panel/utils/section-visibility.ts`
**Duration:** 30 minutes

**Requirements:**
- Determine which sections should be visible for each shape type
- Support future shape types
- Enable conditional rendering in PropertiesPanel

**Implementation:**
```typescript
/**
 * Section Visibility Logic
 *
 * Determines which property sections should be shown
 * based on the selected shape type.
 */

import type { CanvasObject } from '@/types/canvas.types';

export interface SectionVisibility {
  position: boolean;      // X, Y coordinates and alignment
  rotation: boolean;      // Rotation angle and flip
  layout: boolean;        // Dimensions (width/height/radius)
  appearance: boolean;    // Opacity and shape-specific appearance
  fill: boolean;          // Fill color
  stroke: boolean;        // Stroke properties (future)
  text: boolean;          // Text-specific properties
  effects: boolean;       // Shadow and effects (future)
}

/**
 * Get section visibility for a given shape
 * Returns which sections should be displayed in the properties panel
 */
export function getSectionVisibility(shape: CanvasObject | null): SectionVisibility {
  // No selection - hide all sections
  if (!shape) {
    return {
      position: false,
      rotation: false,
      layout: false,
      appearance: false,
      fill: false,
      stroke: false,
      text: false,
      effects: false,
    };
  }

  // Common sections for all shapes
  const commonSections = {
    position: true,         // All shapes have position
    rotation: true,         // All shapes can be rotated
    fill: true,             // All shapes have fill
    stroke: true,           // All shapes can have stroke (future)
    effects: true,          // All shapes can have effects (future)
  };

  // Shape-specific visibility
  switch (shape.type) {
    case 'rectangle':
      return {
        ...commonSections,
        layout: true,           // Show width × height
        appearance: true,       // Show opacity + corner radius
        text: false,            // No text properties
      };

    case 'circle':
      return {
        ...commonSections,
        layout: true,           // Show radius/diameter
        appearance: true,       // Show opacity only (no corner radius)
        text: false,            // No text properties
      };

    case 'text':
      return {
        ...commonSections,
        layout: true,           // Show text box width
        appearance: true,       // Show opacity
        text: true,             // Show font, alignment, etc.
      };

    default:
      // Unknown shape type - show common sections only
      return {
        ...commonSections,
        layout: true,
        appearance: true,
        text: false,
      };
  }
}

/**
 * Get section visibility for specific section
 * Useful for individual section checks
 */
export function isSectionVisible(
  shape: CanvasObject | null,
  section: keyof SectionVisibility
): boolean {
  const visibility = getSectionVisibility(shape);
  return visibility[section];
}

/**
 * Get list of visible section names
 * Useful for rendering order or debugging
 */
export function getVisibleSectionNames(shape: CanvasObject | null): string[] {
  const visibility = getSectionVisibility(shape);
  return Object.entries(visibility)
    .filter(([_, isVisible]) => isVisible)
    .map(([name, _]) => name);
}
```

**Edge Cases:**
- ✅ Handle null/undefined shape (no selection)
- ✅ Handle unknown shape types (future-proofing)
- ✅ Handle partial shape data (missing type property)
- ✅ Support adding new sections without breaking existing code
- ✅ Support adding new shape types without breaking existing code

**Tests:**
```typescript
// tests/features/properties-panel/utils/section-visibility.test.ts
describe('Section Visibility Logic', () => {
  describe('getSectionVisibility', () => {
    it('should show all sections for rectangle', () => {
      const rect: Rectangle = { type: 'rectangle', ... };
      const visibility = getSectionVisibility(rect);
      expect(visibility.position).toBe(true);
      expect(visibility.layout).toBe(true);
      expect(visibility.appearance).toBe(true);
      expect(visibility.text).toBe(false);
    });

    it('should show appropriate sections for circle', () => {
      const circle: Circle = { type: 'circle', ... };
      const visibility = getSectionVisibility(circle);
      expect(visibility.layout).toBe(true);
      expect(visibility.appearance).toBe(true);
      expect(visibility.text).toBe(false);
    });

    it('should show text sections for text shape', () => {
      const text: Text = { type: 'text', ... };
      const visibility = getSectionVisibility(text);
      expect(visibility.text).toBe(true);
      expect(visibility.layout).toBe(true);
    });

    it('should hide all sections when no shape selected', () => {
      const visibility = getSectionVisibility(null);
      expect(Object.values(visibility).every(v => v === false)).toBe(true);
    });

    it('should handle unknown shape types gracefully', () => {
      const unknown = { type: 'polygon' } as any;
      const visibility = getSectionVisibility(unknown);
      expect(visibility.position).toBe(true); // Common sections still visible
    });
  });

  describe('isSectionVisible', () => {
    it('should return correct visibility for individual section', () => {
      const rect: Rectangle = { type: 'rectangle', ... };
      expect(isSectionVisible(rect, 'appearance')).toBe(true);
      expect(isSectionVisible(rect, 'text')).toBe(false);
    });
  });

  describe('getVisibleSectionNames', () => {
    it('should return list of visible section names', () => {
      const rect: Rectangle = { type: 'rectangle', ... };
      const names = getVisibleSectionNames(rect);
      expect(names).toContain('position');
      expect(names).toContain('layout');
      expect(names).not.toContain('text');
    });
  });
});
```

---

### Task 2.5.2: Update PropertiesPanel to Use Conditional Rendering
**File:** `src/features/properties-panel/components/PropertiesPanel.tsx`
**Duration:** 15 minutes

**Requirements:**
- Import and use section visibility logic
- Only render sections that should be visible
- Maintain clean component structure

**Implementation:**
```typescript
import { getSectionVisibility } from '../utils/section-visibility';

export function PropertiesPanel() {
  const { selectedId } = useCanvasStore();
  const shape = useSelectedShape();
  const visibility = getSectionVisibility(shape);

  if (!selectedId || !shape) {
    return <EmptyState />;
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
      {/* Shape Type Header */}
      <ShapeHeader shape={shape} />

      {/* Conditionally Rendered Sections */}
      <div className="divide-y divide-gray-200">
        {visibility.position && <PositionSection />}
        {visibility.rotation && <RotationSection />}
        {visibility.layout && <LayoutSection />}
        {visibility.appearance && <AppearanceSection />}
        {visibility.fill && <FillSection />}
        {visibility.text && <TextPropertiesSection />}
        {/* Future: stroke, effects sections */}
      </div>
    </div>
  );
}
```

**Edge Cases:**
- ✅ Handle rapid shape type changes
- ✅ Handle shape deletion while panel open
- ✅ Maintain scroll position when sections change
- ✅ Animate section appearance/disappearance (optional)

**Tests:**
```typescript
describe('PropertiesPanel - Conditional Rendering', () => {
  it('should show position section for all shapes', () => {...});
  it('should show appearance section for rectangle', () => {...});
  it('should hide text section for non-text shapes', () => {...});
  it('should update sections when shape type changes', () => {...});
  it('should handle switching from text to rectangle', () => {...});
});
```

---

## Phase 3: Position Section

### Task 3.1: Create PositionSection Component
**File:** `src/features/properties-panel/components/PositionSection.tsx`
**Duration:** 1.5 hours

**Requirements:**
- Display and edit X, Y coordinates
- Alignment buttons (9-point grid)
- Update shape position in real-time
- Show position relative to canvas origin

**UI Layout:**
```
┌─────────────────────────────┐
│ Position                  ▼ │
├─────────────────────────────┤
│ Alignment                   │
│  ┌───┬───┬───┐              │
│  │TL │ T │TR │              │
│  ├───┼───┼───┤              │
│  │ L │ C │ R │              │
│  ├───┼───┼───┤              │
│  │BL │ B │BR │              │
│  └───┴───┴───┘              │
│                             │
│ Position                    │
│  X  [  1234  ]  Y  [ 5678 ] │
└─────────────────────────────┘
```

**Implementation:**
```typescript
export function PositionSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;

  function handleXChange(x: number) {
    updateShapeProperty(shape.id, { x });
  }

  function handleYChange(y: number) {
    updateShapeProperty(shape.id, { y });
  }

  function handleAlign(alignment: AlignmentType) {
    const stage = getStage(); // Need access to stage
    const canvasBounds = {
      width: stage.width(),
      height: stage.height()
    };

    const newPosition = calculateAlignmentPosition(
      shape,
      alignment,
      canvasBounds
    );

    updateShapeProperty(shape.id, newPosition);
  }

  return (
    <PropertySection title="Position" icon={<Move />}>
      {/* Alignment Grid */}
      <div className="mb-3">
        <Label className="text-xs text-gray-600 mb-2">Alignment</Label>
        <div className="grid grid-cols-3 gap-1">
          <IconButton onClick={() => handleAlign('top-left')} icon={<AlignTopLeft />} />
          <IconButton onClick={() => handleAlign('top')} icon={<AlignTop />} />
          <IconButton onClick={() => handleAlign('top-right')} icon={<AlignTopRight />} />
          <IconButton onClick={() => handleAlign('left')} icon={<AlignLeft />} />
          <IconButton onClick={() => handleAlign('center')} icon={<AlignCenter />} />
          <IconButton onClick={() => handleAlign('right')} icon={<AlignRight />} />
          <IconButton onClick={() => handleAlign('bottom-left')} icon={<AlignBottomLeft />} />
          <IconButton onClick={() => handleAlign('bottom')} icon={<AlignBottom />} />
          <IconButton onClick={() => handleAlign('bottom-right')} icon={<AlignBottomRight />} />
        </div>
      </div>

      {/* X, Y Position */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs text-gray-600 mb-1">X</Label>
          <NumberInput
            value={Math.round(shape.x)}
            onChange={handleXChange}
            step={1}
            precision={0}
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-gray-600 mb-1">Y</Label>
          <NumberInput
            value={Math.round(shape.y)}
            onChange={handleYChange}
            step={1}
            precision={0}
          />
        </div>
      </div>
    </PropertySection>
  );
}
```

**Alignment Calculation Logic:**
```typescript
// src/features/properties-panel/utils/propertyCalculations.ts
type AlignmentType =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

export function calculateAlignmentPosition(
  shape: CanvasObject,
  alignment: AlignmentType,
  canvasBounds: { width: number; height: number }
): { x: number; y: number } {
  const shapeWidth = 'width' in shape ? shape.width : 0;
  const shapeHeight = 'height' in shape ? shape.height : 0;

  const alignments = {
    'top-left': { x: 0, y: 0 },
    'top': { x: (canvasBounds.width - shapeWidth) / 2, y: 0 },
    'top-right': { x: canvasBounds.width - shapeWidth, y: 0 },
    'left': { x: 0, y: (canvasBounds.height - shapeHeight) / 2 },
    'center': {
      x: (canvasBounds.width - shapeWidth) / 2,
      y: (canvasBounds.height - shapeHeight) / 2
    },
    'right': {
      x: canvasBounds.width - shapeWidth,
      y: (canvasBounds.height - shapeHeight) / 2
    },
    'bottom-left': { x: 0, y: canvasBounds.height - shapeHeight },
    'bottom': {
      x: (canvasBounds.width - shapeWidth) / 2,
      y: canvasBounds.height - shapeHeight
    },
    'bottom-right': {
      x: canvasBounds.width - shapeWidth,
      y: canvasBounds.height - shapeHeight
    },
  };

  return alignments[alignment];
}
```

**Edge Cases:**
- ✅ Handle shapes larger than canvas (clamp to visible area)
- ✅ Handle negative coordinates
- ✅ Account for rotation when aligning (use bounding box)
- ✅ Account for scale when aligning
- ✅ Handle zoom and pan (align relative to viewport or canvas?)
- ✅ Validate position inputs (handle NaN, Infinity)
- ✅ Debounce position updates (avoid too many Firebase writes)

**Tests:**
```typescript
// tests/features/properties-panel/components/PositionSection.test.tsx
describe('PositionSection', () => {
  it('should display current position', () => {...});
  it('should update X coordinate', () => {...});
  it('should update Y coordinate', () => {...});
  it('should align to top-left', () => {...});
  it('should align to center', () => {...});
  it('should align to bottom-right', () => {...});
  it('should handle rotated shapes', () => {...});
  it('should handle scaled shapes', () => {...});
});

// tests/features/properties-panel/utils/propertyCalculations.test.ts
describe('calculateAlignmentPosition', () => {
  it('should calculate center alignment', () => {...});
  it('should calculate all 9 alignments', () => {...});
  it('should handle shapes with rotation', () => {...});
});
```

---

## Phase 4: Rotation Section

### Task 4.1: Create RotationSection Component
**File:** `src/features/properties-panel/components/RotationSection.tsx`
**Duration:** 1 hour

**Requirements:**
- Display and edit rotation angle (0-360°)
- Flip horizontal and flip vertical buttons
- Visual rotation indicator
- Support negative rotation (normalize to 0-360)

**UI Layout:**
```
┌─────────────────────────────┐
│ Rotation                  ▼ │
├─────────────────────────────┤
│  ∠  [   45°  ]   ↻  ⟲       │
│                             │
│  [Flip H]  [Flip V]         │
└─────────────────────────────┘
```

**Implementation:**
```typescript
export function RotationSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;

  const rotation = shape.rotation ?? 0;

  function handleRotationChange(degrees: number) {
    const normalized = normalizeRotation(degrees);
    updateShapeProperty(shape.id, { rotation: normalized });
  }

  function handleFlipHorizontal() {
    const currentScaleX = shape.scaleX ?? 1;
    updateShapeProperty(shape.id, { scaleX: -currentScaleX });
  }

  function handleFlipVertical() {
    const currentScaleY = shape.scaleY ?? 1;
    updateShapeProperty(shape.id, { scaleY: -currentScaleY });
  }

  function handleRotate90() {
    const newRotation = normalizeRotation(rotation + 90);
    updateShapeProperty(shape.id, { rotation: newRotation });
  }

  function handleRotateNeg90() {
    const newRotation = normalizeRotation(rotation - 90);
    updateShapeProperty(shape.id, { rotation: newRotation });
  }

  return (
    <PropertySection title="Rotation" icon={<RotateCw />}>
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs text-gray-600">°</Label>
        <NumberInput
          value={rotation}
          onChange={handleRotationChange}
          min={0}
          max={360}
          step={1}
          precision={1}
          unit="°"
          className="flex-1"
        />
        <IconButton onClick={handleRotateNeg90} icon={<RotateCcw />} tooltip="Rotate -90°" />
        <IconButton onClick={handleRotate90} icon={<RotateCw />} tooltip="Rotate +90°" />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlipHorizontal}
          className="flex-1"
        >
          <FlipHorizontal className="w-4 h-4 mr-1" />
          Flip H
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlipVertical}
          className="flex-1"
        >
          <FlipVertical className="w-4 h-4 mr-1" />
          Flip V
        </Button>
      </div>
    </PropertySection>
  );
}
```

**Edge Cases:**
- ✅ Normalize rotation to 0-360 range
- ✅ Handle negative rotation values
- ✅ Handle rotation > 360
- ✅ Preserve rotation center (offset point)
- ✅ Handle flipped shapes (negative scale)
- ✅ Handle both flipped and rotated shapes
- ✅ Update rotation transform correctly in Konva

**Tests:**
```typescript
// tests/features/properties-panel/components/RotationSection.test.tsx
describe('RotationSection', () => {
  it('should display current rotation', () => {...});
  it('should update rotation angle', () => {...});
  it('should normalize rotation to 0-360', () => {...});
  it('should rotate +90 degrees', () => {...});
  it('should rotate -90 degrees', () => {...});
  it('should flip horizontally', () => {...});
  it('should flip vertically', () => {...});
  it('should handle already flipped shapes', () => {...});
});
```

---

## Phase 5: Layout Section (Dimensions)

**Overview:** Create adaptive layout section that works for all shape types (Rectangle, Circle, Text)

---

### Task 5.1a: Create useShapeDimensions Hook
**File:** `src/features/properties-panel/hooks/useShapeDimensions.ts`
**Duration:** 30 minutes

**Requirements:**
- Provide normalized dimension access for any shape type
- Return appropriate dimension labels (W/H vs Radius)
- Handle dimension updates for different shape types
- Use the shape property detection utilities

**Implementation:**
```typescript
import type { CanvasObject } from '@/types/canvas.types';
import {
  getNormalizedDimensions,
  getDimensionLabels,
  validateDimensionUpdate,
  getAspectRatio,
  applyAspectRatioLock,
  hasDimensions,
  hasRadius
} from '@/lib/utils/shape-properties';
import { usePropertyUpdate } from './usePropertyUpdate';

interface ShapeDimensionsReturn {
  // Normalized values
  width: number | null;
  height: number | null;
  radius: number | null;
  diameter: number | null;

  // Labels for UI
  primaryLabel: string;    // "Width", "Radius", etc.
  secondaryLabel?: string; // "Height", "Diameter", etc.

  // Update functions
  updateWidth: (value: number) => void;
  updateHeight: (value: number) => void;
  updateRadius: (value: number) => void;

  // Aspect ratio support
  hasAspectRatioLock: boolean;
  supportsAspectRatioLock: boolean;
  toggleAspectRatioLock: () => void;
}

export function useShapeDimensions(shape: CanvasObject | null): ShapeDimensionsReturn {
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) {
    return {
      width: null,
      height: null,
      radius: null,
      diameter: null,
      primaryLabel: 'Width',
      secondaryLabel: 'Height',
      updateWidth: () => {},
      updateHeight: () => {},
      updateRadius: () => {},
      hasAspectRatioLock: false,
      supportsAspectRatioLock: false,
      toggleAspectRatioLock: () => {},
    };
  }

  const dimensions = getNormalizedDimensions(shape);
  const labels = getDimensionLabels(shape);
  const aspectRatio = getAspectRatio(shape);

  // Get lock state
  const hasLock = hasDimensions(shape)
    ? (shape.lockAspectRatio ?? false)
    : hasRadius(shape); // Circles always locked

  // Dimension update handlers
  function updateWidth(newWidth: number) {
    if (!hasDimensions(shape)) return;

    const validated = validateDimensionUpdate(shape, 'width', newWidth);
    if (validated === null) return;

    if (hasLock && aspectRatio) {
      const updates = applyAspectRatioLock(shape, 'width', validated);
      if (updates) {
        updateShapeProperty(shape.id, updates);
      }
    } else {
      updateShapeProperty(shape.id, { width: validated });
    }
  }

  function updateHeight(newHeight: number) {
    if (!hasDimensions(shape)) return;

    const validated = validateDimensionUpdate(shape, 'height', newHeight);
    if (validated === null) return;

    if (hasLock && aspectRatio) {
      const updates = applyAspectRatioLock(shape, 'height', validated);
      if (updates) {
        updateShapeProperty(shape.id, updates);
      }
    } else {
      updateShapeProperty(shape.id, { height: validated });
    }
  }

  function updateRadius(newRadius: number) {
    if (!hasRadius(shape)) return;

    const validated = validateDimensionUpdate(shape, 'radius', newRadius);
    if (validated === null) return;

    updateShapeProperty(shape.id, { radius: validated });
  }

  function toggleAspectRatioLock() {
    if (!hasDimensions(shape)) return; // Circles always locked
    updateShapeProperty(shape.id, { lockAspectRatio: !hasLock });
  }

  return {
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    radius: hasRadius(shape) ? shape.radius : null,
    diameter: hasRadius(shape) ? shape.radius * 2 : null,
    primaryLabel: labels.primary,
    secondaryLabel: labels.secondary,
    updateWidth,
    updateHeight,
    updateRadius,
    hasAspectRatioLock: hasLock,
    supportsAspectRatioLock: hasDimensions(shape),
    toggleAspectRatioLock,
  };
}
```

**Edge Cases:**
- ✅ Handle null/undefined shape
- ✅ Handle circles (radius-based, always locked)
- ✅ Handle rectangles (width/height-based, optional lock)
- ✅ Handle text (width optional, height calculated)
- ✅ Handle validation failures gracefully
- ✅ Handle aspect ratio calculations with zero values

**Tests:**
```typescript
describe('useShapeDimensions', () => {
  it('should return width and height for rectangle', () => {...});
  it('should return radius and diameter for circle', () => {...});
  it('should handle aspect ratio lock for rectangle', () => {...});
  it('should always lock aspect ratio for circle', () => {...});
  it('should validate dimension updates', () => {...});
  it('should reject invalid values', () => {...});
});
```

---

### Task 5.1b: Create Dimension Input Components
**File:** `src/features/properties-panel/components/DimensionInput.tsx`
**Duration:** 20 minutes

**Requirements:**
- Adaptive dimension input that works for all shape types
- Show appropriate labels (W/H, Radius, etc.)
- Support both single and dual inputs

**Implementation:**
```typescript
interface DimensionInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function DimensionInput({
  label,
  value,
  onChange,
  min = 1,
  max = 10000,
  disabled
}: DimensionInputProps) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-1">
        <Label className="text-xs text-gray-500 w-4">{label}</Label>
        <NumberInput
          value={Math.round(value)}
          onChange={onChange}
          min={min}
          max={max}
          step={1}
          precision={0}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
```

---

### Task 5.1c: Create LayoutSection - Rectangle Support
**File:** `src/features/properties-panel/components/LayoutSection.tsx`
**Duration:** 30 minutes

**Requirements:**
- Display width and height inputs
- Show aspect ratio lock toggle
- Handle aspect ratio calculations

**Implementation:**
```typescript
import { useShapeDimensions } from '../hooks/useShapeDimensions';
import { hasDimensions } from '@/types/canvas.types';

export function LayoutSection() {
  const shape = useSelectedShape();
  const dimensions = useShapeDimensions(shape);

  if (!shape) return null;

  // Render for rectangles and text
  if (hasDimensions(shape)) {
    return (
      <PropertySection title="Layout" icon={<Maximize2 />}>
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Dimensions</Label>
          <div className="flex gap-2 items-center">
            <DimensionInput
              label="W"
              value={dimensions.width!}
              onChange={dimensions.updateWidth}
            />

            <DimensionInput
              label="H"
              value={dimensions.height!}
              onChange={dimensions.updateHeight}
            />

            {dimensions.supportsAspectRatioLock && (
              <IconButton
                onClick={dimensions.toggleAspectRatioLock}
                icon={dimensions.hasAspectRatioLock ? <Lock /> : <Unlock />}
                variant={dimensions.hasAspectRatioLock ? "default" : "ghost"}
                tooltip={dimensions.hasAspectRatioLock ? "Unlock aspect ratio" : "Lock aspect ratio"}
              />
            )}
          </div>
        </div>
      </PropertySection>
    );
  }

  return null;
}
```

**Edge Cases:**
- ✅ Handle minimum dimensions (1×1)
- ✅ Handle aspect ratio precision
- ✅ Handle zero/negative inputs
- ✅ Handle very large dimensions

---

### Task 5.1d: Extend LayoutSection - Circle Support
**File:** `src/features/properties-panel/components/LayoutSection.tsx`
**Duration:** 20 minutes

**Requirements:**
- Display radius input
- Show diameter as read-only info
- Handle radius-specific constraints

**Implementation:**
```typescript
import { hasRadius } from '@/types/canvas.types';

export function LayoutSection() {
  const shape = useSelectedShape();
  const dimensions = useShapeDimensions(shape);

  if (!shape) return null;

  // Render for circles
  if (hasRadius(shape)) {
    return (
      <PropertySection title="Layout" icon={<Maximize2 />}>
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Dimensions</Label>

          {/* Radius Input */}
          <DimensionInput
            label="R"
            value={dimensions.radius!}
            onChange={dimensions.updateRadius}
          />

          {/* Diameter Display (read-only) */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Diameter:</span>
            <span className="font-mono">{Math.round(dimensions.diameter!)}</span>
            <span>px</span>
          </div>

          {/* Info: Circles always maintain aspect ratio */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Circles always maintain 1:1 ratio</span>
          </div>
        </div>
      </PropertySection>
    );
  }

  // ... rectangle rendering from previous task
}
```

**Edge Cases:**
- ✅ Handle minimum radius (1)
- ✅ Show diameter correctly (radius × 2)
- ✅ Handle radius precision
- ✅ Disable aspect ratio toggle for circles

---

### Task 5.1e: Extend LayoutSection - Text Support
**File:** `src/features/properties-panel/components/LayoutSection.tsx`
**Duration:** 20 minutes

**Requirements:**
- Display text box width (optional)
- Show height as calculated/auto
- Support auto-width mode

**Implementation:**
```typescript
import { isTextShape } from '@/types/canvas.types';

export function LayoutSection() {
  const shape = useSelectedShape();
  const dimensions = useShapeDimensions(shape);

  if (!shape) return null;

  // Render for text
  if (isTextShape(shape)) {
    const hasFixedWidth = shape.width !== undefined;

    return (
      <PropertySection title="Layout" icon={<Maximize2 />}>
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Dimensions</Label>

          {/* Width Input (optional) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500">Text Box Width</Label>
              <button
                onClick={() => {
                  // Toggle auto-width
                  if (hasFixedWidth) {
                    updateShapeProperty(shape.id, { width: undefined });
                  } else {
                    updateShapeProperty(shape.id, { width: 200 }); // Default width
                  }
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                {hasFixedWidth ? 'Auto' : 'Fixed'}
              </button>
            </div>

            {hasFixedWidth ? (
              <DimensionInput
                label="W"
                value={dimensions.width!}
                onChange={dimensions.updateWidth}
              />
            ) : (
              <div className="text-xs text-gray-400 italic">
                Auto-width (wraps to content)
              </div>
            )}
          </div>

          {/* Height Display (always calculated) */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Height:</span>
            <span className="font-mono">{Math.round(dimensions.height!)}</span>
            <span>px (auto-calculated)</span>
          </div>
        </div>
      </PropertySection>
    );
  }

  // ... circle and rectangle rendering
}
```

**Edge Cases:**
- ✅ Handle auto-width text (no width property)
- ✅ Handle fixed-width text (with width property)
- ✅ Calculate height based on content and fontSize
- ✅ Handle multi-line text wrapping
- ✅ Handle empty text content

**Tests:**
```typescript
describe('LayoutSection', () => {
  describe('Rectangle', () => {
    it('should display width and height', () => {...});
    it('should update width independently', () => {...});
    it('should update height independently', () => {...});
    it('should maintain aspect ratio when locked', () => {...});
    it('should toggle aspect ratio lock', () => {...});
  });

  describe('Circle', () => {
    it('should display radius input', () => {...});
    it('should show diameter', () => {...});
    it('should update radius', () => {...});
    it('should always maintain 1:1 aspect ratio', () => {...});
    it('should not show aspect ratio toggle', () => {...});
  });

  describe('Text', () => {
    it('should display text box width when fixed', () => {...});
    it('should show auto-width mode', () => {...});
    it('should toggle between auto and fixed width', () => {...});
    it('should show auto-calculated height', () => {...});
    it('should not allow manual height adjustment', () => {...});
  });

  describe('Edge Cases', () => {
    it('should enforce minimum dimensions', () => {...});
    it('should handle aspect ratio precision', () => {...});
    it('should handle switching shape types', () => {...});
    it('should handle very large dimensions', () => {...});
    it('should handle zero/negative inputs', () => {...});
  });
});
```

---

## Phase 6: Appearance Section

### Task 6.1: Create AppearanceSection Component
**File:** `src/features/properties-panel/components/AppearanceSection.tsx`
**Duration:** 1 hour

**Requirements:**
- Opacity slider (0-100%)
- Corner radius input (rectangles only)
- Support per-corner radius (advanced, optional)
- Visibility toggle (future)

**UI Layout:**
```
┌─────────────────────────────┐
│ Appearance                ▼ │
├─────────────────────────────┤
│ Opacity                     │
│  ●————————○  100%           │
│                             │
│ Corner radius               │
│  ┌─┐ [   0   ]              │
└─────────────────────────────┘
```

**Implementation:**
```typescript
export function AppearanceSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;

  const opacity = (shape.opacity ?? 1) * 100; // Convert to percentage
  const cornerRadius = shape.type === 'rectangle' ? (shape.cornerRadius ?? 0) : null;

  function handleOpacityChange(value: number) {
    const opacityDecimal = value / 100;
    const clamped = validateOpacity(opacityDecimal);
    updateShapeProperty(shape.id, { opacity: clamped });
  }

  function handleCornerRadiusChange(radius: number) {
    const validated = validateCornerRadius(radius);
    updateShapeProperty(shape.id, { cornerRadius: validated });
  }

  return (
    <PropertySection title="Appearance" icon={<Eye />}>
      {/* Opacity Slider (all shapes) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-600">Opacity</Label>
          <span className="text-xs text-gray-500">{Math.round(opacity)}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={([value]) => handleOpacityChange(value)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Corner Radius (rectangles only) */}
      {hasCornerRadius(shape) && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Corner radius</Label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-gray-400 rounded flex items-center justify-center">
              <div className="w-4 h-4 border border-gray-400" style={{ borderRadius: `${Math.min(cornerRadius ?? 0, 8)}px` }} />
            </div>
            <NumberInput
              value={typeof cornerRadius === 'number' ? cornerRadius : (cornerRadius?.[0] ?? 0)}
              onChange={handleCornerRadiusChange}
              min={0}
              max={500}
              step={1}
              precision={0}
              className="flex-1"
            />
          </div>

          {/* Shape-specific notes */}
          <div className="text-xs text-gray-400">
            Max: {Math.min(shape.width, shape.height) / 2} px
          </div>
        </div>
      )}
    </PropertySection>
  );
}
```

**Edge Cases:**
- ✅ Clamp opacity between 0 and 1 (display as 0-100%)
- ✅ Validate corner radius is non-negative
- ✅ Handle corner radius larger than shape dimensions (clamp)
- ✅ Support per-corner radius (future enhancement)
- ✅ Update visual preview in real-time
- ✅ Debounce opacity updates during slider drag

**Tests:**
```typescript
// tests/features/properties-panel/components/AppearanceSection.test.tsx
describe('AppearanceSection', () => {
  it('should display current opacity', () => {...});
  it('should update opacity', () => {...});
  it('should clamp opacity to 0-100%', () => {...});
  it('should display corner radius for rectangles', () => {...});
  it('should not display corner radius for circles', () => {...});
  it('should update corner radius', () => {...});
  it('should validate corner radius', () => {...});
});
```

---

## Phase 7: Fill Section

### Task 7.1: Create FillSection Component
**File:** `src/features/properties-panel/components/FillSection.tsx`
**Duration:** 1.5 hours

**Requirements:**
- Color picker for fill color
- Opacity slider within fill (future: separate from shape opacity)
- Solid color support (Phase 1)
- Pattern/gradient support (Phase 2, future)
- Color history/presets

**UI Layout:**
```
┌─────────────────────────────┐
│ Fill                      ▼ │
├─────────────────────────────┤
│  [■] D9D9D9        100  %   │
│                             │
│  [+]                        │
└─────────────────────────────┘
```

**Implementation:**
```typescript
export function FillSection() {
  const shape = useSelectedShape();
  const { updateShapeProperty } = usePropertyUpdate();

  if (!shape) return null;
  if (!('fill' in shape)) return null;

  const fill = shape.fill;

  // Color history stored in localStorage
  const [colorHistory, setColorHistory] = useLocalStorage<string[]>('color-history', []);

  function handleFillChange(color: string) {
    updateShapeProperty(shape.id, { fill: color });

    // Add to color history (max 10 recent colors)
    setColorHistory((prev) => {
      const updated = [color, ...prev.filter(c => c !== color)].slice(0, 10);
      return updated;
    });
  }

  // Preset colors (common palette)
  const presetColors = [
    '#000000', '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  ];

  return (
    <PropertySection title="Fill" icon={<Palette />}>
      <div className="space-y-3">
        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <ColorPicker
            value={fill}
            onChange={handleFillChange}
            presets={presetColors}
          />
          <span className="text-xs text-gray-600 flex-1 truncate">
            {fill.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">100%</span>
        </div>

        {/* Recent Colors */}
        {colorHistory.length > 0 && (
          <div>
            <Label className="text-xs text-gray-600 mb-2">Recent</Label>
            <div className="flex gap-1 flex-wrap">
              {colorHistory.map((color) => (
                <button
                  key={color}
                  onClick={() => handleFillChange(color)}
                  className="w-6 h-6 rounded border border-gray-300 hover:border-gray-400"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PropertySection>
  );
}
```

**Edge Cases:**
- ✅ Validate hex color format
- ✅ Support various color formats (hex, rgb, hsl, named)
- ✅ Handle transparent/alpha colors
- ✅ Update color picker when external value changes
- ✅ Persist color history across sessions
- ✅ Handle invalid color inputs gracefully

**Tests:**
```typescript
// tests/features/properties-panel/components/FillSection.test.tsx
describe('FillSection', () => {
  it('should display current fill color', () => {...});
  it('should update fill color', () => {...});
  it('should show preset colors', () => {...});
  it('should add to color history', () => {...});
  it('should limit color history to 10', () => {...});
  it('should persist color history', () => {...});
  it('should validate color format', () => {...});
});
```

---

## Phase 8: Main Properties Panel Container

### Task 8.1: Create PropertiesPanel Component
**File:** `src/features/properties-panel/components/PropertiesPanel.tsx`
**Duration:** 1 hour

**Requirements:**
- Fixed right sidebar (300px width)
- Show all sections when shape is selected
- Show empty state when no selection
- Smooth slide-in animation
- Collapsible sections with persistent state

**Implementation:**
```typescript
export function PropertiesPanel() {
  const { selectedId } = useCanvasStore();
  const shape = useSelectedShape();

  if (!selectedId || !shape) {
    return (
      <div className="fixed right-0 top-16 bottom-0 w-[300px] bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-400 px-4">
          <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a shape to view properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
      {/* Shape Name/Type Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          {shape.type === 'rectangle' && <Square className="w-4 h-4 text-gray-600" />}
          {shape.type === 'circle' && <Circle className="w-4 h-4 text-gray-600" />}
          {shape.type === 'text' && <Type className="w-4 h-4 text-gray-600" />}
          <span className="font-medium text-sm capitalize">{shape.type}</span>
        </div>
      </div>

      {/* Property Sections */}
      <div className="divide-y divide-gray-200">
        <PositionSection />
        <RotationSection />
        <LayoutSection />
        <AppearanceSection />
        <FillSection />
      </div>
    </div>
  );
}
```

**Edge Cases:**
- ✅ Handle no selection state
- ✅ Handle shape deletion while panel is open
- ✅ Handle rapid selection changes
- ✅ Scroll to section when it's expanded
- ✅ Persist section collapsed states
- ✅ Handle mobile/small screens (responsive)

**Tests:**
```typescript
// tests/features/properties-panel/components/PropertiesPanel.test.tsx
describe('PropertiesPanel', () => {
  it('should show empty state when nothing selected', () => {...});
  it('should show properties when shape selected', () => {...});
  it('should display shape type in header', () => {...});
  it('should render all property sections', () => {...});
  it('should handle shape deletion', () => {...});
  it('should update when selection changes', () => {...});
});
```

---

## Phase 9: Property Update Hook

### Task 9.1: Create usePropertyUpdate Hook
**File:** `src/features/properties-panel/hooks/usePropertyUpdate.ts`
**Duration:** 45 minutes

**Requirements:**
- Centralized property update logic
- Optimistic local updates
- Debounced Firebase sync
- Validation before update
- Batch multiple property updates

**Implementation:**
```typescript
interface UsePropertyUpdateReturn {
  updateShapeProperty: (id: string, updates: Partial<CanvasObject>) => void;
  updateShapeProperties: (id: string, updates: Partial<CanvasObject>[]) => void;
  isUpdating: boolean;
  error: Error | null;
}

export function usePropertyUpdate(): UsePropertyUpdateReturn {
  const { updateObject } = useCanvasStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounced Firebase update (500ms)
  const debouncedFirebaseUpdate = useMemo(
    () => debounce(async (id: string, updates: Partial<CanvasObject>) => {
      try {
        setIsUpdating(true);
        await updateCanvasObject('main', id, updates);
        setError(null);
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to sync changes');
      } finally {
        setIsUpdating(false);
      }
    }, 500),
    []
  );

  function updateShapeProperty(id: string, updates: Partial<CanvasObject>) {
    // Validate updates
    const validated = validatePropertyUpdates(updates);

    // Optimistic local update
    updateObject(id, validated);

    // Debounced Firebase sync
    debouncedFirebaseUpdate(id, validated);
  }

  function updateShapeProperties(id: string, updatesList: Partial<CanvasObject>[]) {
    // Merge all updates
    const merged = Object.assign({}, ...updatesList);
    updateShapeProperty(id, merged);
  }

  return {
    updateShapeProperty,
    updateShapeProperties,
    isUpdating,
    error,
  };
}
```

**Validation Function:**
```typescript
function validatePropertyUpdates(updates: Partial<CanvasObject>): Partial<CanvasObject> {
  const validated: Partial<CanvasObject> = {};

  // Validate each property
  if ('x' in updates) validated.x = updates.x;
  if ('y' in updates) validated.y = updates.y;

  if ('width' in updates && updates.width) {
    validated.width = Math.max(1, updates.width);
  }
  if ('height' in updates && updates.height) {
    validated.height = Math.max(1, updates.height);
  }

  if ('rotation' in updates && typeof updates.rotation === 'number') {
    validated.rotation = normalizeRotation(updates.rotation);
  }

  if ('opacity' in updates && typeof updates.opacity === 'number') {
    validated.opacity = validateOpacity(updates.opacity);
  }

  if ('cornerRadius' in updates) {
    validated.cornerRadius = validateCornerRadius(updates.cornerRadius);
  }

  if ('fill' in updates && updates.fill) {
    const validColor = validateColor(updates.fill);
    if (validColor) validated.fill = validColor;
  }

  // Add more validations as needed...

  return validated;
}
```

**Edge Cases:**
- ✅ Handle invalid property values
- ✅ Handle multiple rapid updates (debounce)
- ✅ Handle Firebase errors gracefully
- ✅ Prevent updating deleted shapes
- ✅ Batch multiple property changes
- ✅ Cancel pending updates on unmount

**Tests:**
```typescript
// tests/features/properties-panel/hooks/usePropertyUpdate.test.ts
describe('usePropertyUpdate', () => {
  it('should update shape property optimistically', () => {...});
  it('should debounce Firebase updates', () => {...});
  it('should validate property updates', () => {...});
  it('should handle update errors', () => {...});
  it('should batch multiple updates', () => {...});
  it('should cancel pending updates on unmount', () => {...});
});
```

---

## Phase 10: Integration & Real-Time Sync

### Task 10.1: Update Firebase Service
**File:** `src/lib/firebase/index.ts`
**Duration:** 30 minutes

**Requirements:**
- Ensure all new properties sync correctly
- Update Firestore schema documentation
- Test real-time updates with new properties

**Edge Cases:**
- ✅ Handle partial property updates
- ✅ Ensure backward compatibility with old data
- ✅ Handle concurrent edits gracefully
- ✅ Throttle high-frequency updates appropriately

---

### Task 10.2: Add Properties Panel to Main Layout
**File:** `src/pages/CanvasPage.tsx` (or main layout)
**Duration:** 15 minutes

**Requirements:**
- Add PropertiesPanel component to layout
- Position panel on the right side
- Adjust canvas area to account for panel width
- Ensure panel doesn't overlap toolbar

**Implementation:**
```typescript
export function CanvasPage() {
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Canvas (adjust for right panel) */}
      <div className="absolute top-16 left-0 right-[300px] bottom-0">
        <CanvasStage />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
```

---

## Phase 11: Testing & Edge Cases

### Task 11.1: Integration Tests
**File:** `tests/features/properties-panel/integration.test.tsx`
**Duration:** 2 hours

**Test Scenarios:**
1. **Complete workflow**: Select shape → Edit properties → Verify updates
2. **Real-time sync**: Edit in one tab → Verify updates in another
3. **Multi-property updates**: Change multiple properties simultaneously
4. **Validation**: Enter invalid values → Verify clamping/rejection
5. **Undo/Redo**: Edit properties → Undo → Redo (future)
6. **Performance**: Rapid property changes → No lag or errors

**Implementation:**
```typescript
describe('Properties Panel Integration', () => {
  describe('Complete workflow', () => {
    it('should update position when changed', async () => {...});
    it('should update rotation when changed', async () => {...});
    it('should update dimensions when changed', async () => {...});
    it('should maintain aspect ratio when locked', async () => {...});
    it('should update opacity when changed', async () => {...});
    it('should update fill color when changed', async () => {...});
  });

  describe('Real-time sync', () => {
    it('should sync position changes across tabs', async () => {...});
    it('should sync rotation changes across tabs', async () => {...});
    it('should sync dimension changes across tabs', async () => {...});
  });

  describe('Edge cases', () => {
    it('should handle very large dimensions', async () => {...});
    it('should handle very small dimensions', async () => {...});
    it('should handle rapid property changes', async () => {...});
    it('should handle shape deletion while editing', async () => {...});
  });
});
```

---

### Task 11.2: Cross-Shape Type Testing
**File:** `tests/features/properties-panel/cross-shape.test.tsx`
**Duration:** 2 hours

**Requirements:**
- Test each section with all applicable shape types
- Verify shape-specific properties display correctly
- Test switching between different shape types
- Ensure edge cases handled for each shape type

**Test Scenarios:**
```typescript
describe('Properties Panel - All Shape Types', () => {
  describe('Rectangle Properties', () => {
    let rectangle: Rectangle;

    beforeEach(() => {
      rectangle = createRectangle({ width: 100, height: 50, fill: '#ff0000' });
    });

    it('should show all applicable sections', () => {
      const { container } = renderPropertiesPanel(rectangle);
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('Rotation')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Fill')).toBeInTheDocument();
    });

    it('should display width and height controls', () => {
      renderPropertiesPanel(rectangle);
      expect(screen.getByLabelText('W')).toHaveValue('100');
      expect(screen.getByLabelText('H')).toHaveValue('50');
    });

    it('should support aspect ratio lock', () => {
      renderPropertiesPanel(rectangle);
      const lockButton = screen.getByRole('button', { name: /lock aspect ratio/i });
      expect(lockButton).toBeInTheDocument();
    });

    it('should show corner radius control', () => {
      renderPropertiesPanel(rectangle);
      expect(screen.getByLabelText(/corner radius/i)).toBeInTheDocument();
    });

    it('should not show text-specific controls', () => {
      renderPropertiesPanel(rectangle);
      expect(screen.queryByLabelText(/font size/i)).not.toBeInTheDocument();
    });

    it('should update width independently when unlocked', async () => {
      renderPropertiesPanel(rectangle);
      const widthInput = screen.getByLabelText('W');
      await userEvent.clear(widthInput);
      await userEvent.type(widthInput, '200');
      await userEvent.tab(); // Blur

      expect(updateShapeProperty).toHaveBeenCalledWith(
        rectangle.id,
        expect.objectContaining({ width: 200 })
      );
      expect(updateShapeProperty).not.toHaveBeenCalledWith(
        rectangle.id,
        expect.objectContaining({ height: expect.any(Number) })
      );
    });

    it('should maintain aspect ratio when locked', async () => {
      rectangle.lockAspectRatio = true;
      renderPropertiesPanel(rectangle);

      const widthInput = screen.getByLabelText('W');
      await userEvent.clear(widthInput);
      await userEvent.type(widthInput, '200');
      await userEvent.tab();

      expect(updateShapeProperty).toHaveBeenCalledWith(
        rectangle.id,
        expect.objectContaining({
          width: 200,
          height: 100, // Maintains 2:1 ratio
        })
      );
    });
  });

  describe('Circle Properties', () => {
    let circle: Circle;

    beforeEach(() => {
      circle = createCircle({ radius: 50, fill: '#00ff00' });
    });

    it('should show appropriate sections', () => {
      renderPropertiesPanel(circle);
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('Rotation')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Fill')).toBeInTheDocument();
    });

    it('should display radius control instead of width/height', () => {
      renderPropertiesPanel(circle);
      expect(screen.getByLabelText('R')).toHaveValue('50');
      expect(screen.queryByLabelText('W')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('H')).not.toBeInTheDocument();
    });

    it('should show diameter information', () => {
      renderPropertiesPanel(circle);
      expect(screen.getByText(/diameter/i)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // 2 * radius
    });

    it('should indicate 1:1 ratio is always maintained', () => {
      renderPropertiesPanel(circle);
      expect(screen.getByText(/always maintain 1:1 ratio/i)).toBeInTheDocument();
    });

    it('should not show aspect ratio toggle', () => {
      renderPropertiesPanel(circle);
      expect(screen.queryByRole('button', { name: /lock aspect ratio/i })).not.toBeInTheDocument();
    });

    it('should not show corner radius control', () => {
      renderPropertiesPanel(circle);
      expect(screen.queryByLabelText(/corner radius/i)).not.toBeInTheDocument();
    });

    it('should update radius correctly', async () => {
      renderPropertiesPanel(circle);
      const radiusInput = screen.getByLabelText('R');
      await userEvent.clear(radiusInput);
      await userEvent.type(radiusInput, '75');
      await userEvent.tab();

      expect(updateShapeProperty).toHaveBeenCalledWith(
        circle.id,
        expect.objectContaining({ radius: 75 })
      );
    });

    it('should update diameter display when radius changes', async () => {
      const { rerender } = renderPropertiesPanel(circle);

      // Update circle radius
      circle.radius = 75;
      rerender();

      expect(screen.getByText('150')).toBeInTheDocument(); // 2 * 75
    });
  });

  describe('Text Properties', () => {
    let text: Text;

    beforeEach(() => {
      text = createText({
        content: 'Hello World',
        fontSize: 16,
        fontFamily: 'Inter',
        fill: '#0000ff'
      });
    });

    it('should show all applicable sections', () => {
      renderPropertiesPanel(text);
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('Rotation')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Fill')).toBeInTheDocument();
      expect(screen.getByText(/text properties/i)).toBeInTheDocument();
    });

    it('should show auto-width mode by default', () => {
      renderPropertiesPanel(text);
      expect(screen.getByText(/auto-width/i)).toBeInTheDocument();
    });

    it('should show fixed width when width is set', () => {
      text.width = 200;
      renderPropertiesPanel(text);
      expect(screen.getByLabelText('W')).toHaveValue('200');
    });

    it('should toggle between auto and fixed width', async () => {
      renderPropertiesPanel(text);
      const toggleButton = screen.getByRole('button', { name: /fixed/i });
      await userEvent.click(toggleButton);

      expect(updateShapeProperty).toHaveBeenCalledWith(
        text.id,
        expect.objectContaining({ width: expect.any(Number) })
      );
    });

    it('should show auto-calculated height', () => {
      renderPropertiesPanel(text);
      expect(screen.getByText(/auto-calculated/i)).toBeInTheDocument();
    });

    it('should not allow manual height editing', () => {
      renderPropertiesPanel(text);
      const heightInput = screen.queryByLabelText('H');
      expect(heightInput).not.toBeInTheDocument();
    });

    it('should not show corner radius', () => {
      renderPropertiesPanel(text);
      expect(screen.queryByLabelText(/corner radius/i)).not.toBeInTheDocument();
    });
  });

  describe('Shape Type Switching', () => {
    it('should update sections when switching from rectangle to circle', () => {
      const rectangle = createRectangle({ width: 100, height: 100 });
      const { rerender } = renderPropertiesPanel(rectangle);

      // Verify rectangle controls
      expect(screen.getByLabelText('W')).toBeInTheDocument();
      expect(screen.getByLabelText('H')).toBeInTheDocument();
      expect(screen.getByLabelText(/corner radius/i)).toBeInTheDocument();

      // Switch to circle
      const circle = createCircle({ radius: 50 });
      rerender(<PropertiesPanel selectedShape={circle} />);

      // Verify circle controls
      expect(screen.getByLabelText('R')).toBeInTheDocument();
      expect(screen.queryByLabelText('W')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('H')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/corner radius/i)).not.toBeInTheDocument();
    });

    it('should preserve common properties when switching types', () => {
      const rectangle = createRectangle({ x: 100, y: 200, fill: '#ff0000', opacity: 0.5 });
      const { rerender } = renderPropertiesPanel(rectangle);

      const circle = createCircle({ x: 100, y: 200, fill: '#ff0000', opacity: 0.5, radius: 50 });
      rerender(<PropertiesPanel selectedShape={circle} />);

      // Position preserved
      expect(screen.getByLabelText('X')).toHaveValue('100');
      expect(screen.getByLabelText('Y')).toHaveValue('200');

      // Fill preserved
      expect(screen.getByRole('button', { name: /color/i })).toHaveStyle({ backgroundColor: '#ff0000' });

      // Opacity preserved
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should clear shape-specific properties when switching', () => {
      const rectangle = createRectangle({ width: 100, height: 50, cornerRadius: 10 });
      const { rerender } = renderPropertiesPanel(rectangle);

      const circle = createCircle({ radius: 50 });
      rerender(<PropertiesPanel selectedShape={circle} />);

      // Corner radius should not appear
      expect(screen.queryByLabelText(/corner radius/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases - All Shape Types', () => {
    it('should handle shapes with missing optional properties', () => {
      const minimumRect: Rectangle = {
        id: '1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        createdBy: 'user1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // No optional properties
      };

      expect(() => renderPropertiesPanel(minimumRect)).not.toThrow();
      expect(screen.getByText('Position')).toBeInTheDocument();
    });

    it('should handle very small dimensions', async () => {
      const rectangle = createRectangle({ width: 1, height: 1 });
      renderPropertiesPanel(rectangle);

      const widthInput = screen.getByLabelText('W');
      await userEvent.clear(widthInput);
      await userEvent.type(widthInput, '0');
      await userEvent.tab();

      // Should enforce minimum of 1
      expect(updateShapeProperty).toHaveBeenCalledWith(
        rectangle.id,
        expect.objectContaining({ width: 1 })
      );
    });

    it('should handle very large dimensions', async () => {
      const rectangle = createRectangle({ width: 100, height: 100 });
      renderPropertiesPanel(rectangle);

      const widthInput = screen.getByLabelText('W');
      await userEvent.clear(widthInput);
      await userEvent.type(widthInput, '99999');
      await userEvent.tab();

      // Should clamp to max (10000)
      expect(updateShapeProperty).toHaveBeenCalledWith(
        rectangle.id,
        expect.objectContaining({ width: 10000 })
      );
    });

    it('should handle invalid numeric input', async () => {
      const rectangle = createRectangle({ width: 100, height: 100 });
      renderPropertiesPanel(rectangle);

      const widthInput = screen.getByLabelText('W');
      await userEvent.clear(widthInput);
      await userEvent.type(widthInput, 'abc');
      await userEvent.tab();

      // Should reject and restore original value
      expect(widthInput).toHaveValue('100');
    });
  });
});
```

**Tests Pass Criteria:**
- ✅ All sections render correctly for each shape type
- ✅ Shape-specific properties shown/hidden appropriately
- ✅ Dimension controls adapt to shape type
- ✅ Aspect ratio behavior correct for each type
- ✅ Property updates work for all shape types
- ✅ Switching between shape types preserves common properties
- ✅ Edge cases handled gracefully

---

### Task 11.3: Edge Case Documentation
**File:** `_docs/plan/right-layout-edge-cases.md`
**Duration:** 30 minutes

**Document all edge cases:**

#### Position Edge Cases
- Shapes positioned outside visible canvas area
- Negative coordinates
- Coordinates beyond canvas bounds
- Alignment of rotated shapes
- Alignment of scaled shapes

#### Rotation Edge Cases
- Rotation values < 0 (normalize to 0-360)
- Rotation values > 360 (normalize)
- Rotation center/pivot point
- Rotation combined with scale
- Rotation combined with flip

#### Dimensions Edge Cases
- Zero or negative dimensions (enforce minimum 1x1)
- Very large dimensions (> 10000px)
- Aspect ratio with extreme ratios (1:1000)
- Dimension changes with rotation
- Dimension changes with scale

#### Opacity Edge Cases
- Opacity < 0 (clamp to 0)
- Opacity > 1 (clamp to 1)
- Opacity with transparency in fill color

#### Corner Radius Edge Cases
- Radius larger than shape dimensions (clamp to min(width, height)/2)
- Negative radius (clamp to 0)
- Per-corner radius with different values
- Corner radius with rotation

#### Fill Edge Cases
- Invalid hex colors (show error, don't update)
- Transparent colors (#RRGGBBAA format)
- Named colors (CSS color names)
- RGB/RGBA/HSL formats

---

## Phase 12: Performance Optimization

### Task 12.1: Optimize Re-renders
**Duration:** 1 hour

**Optimization Strategies:**
1. **Memoize property sections**: Use React.memo to prevent unnecessary re-renders
2. **Debounce input changes**: Debounce NumberInput onChange (100ms)
3. **Throttle slider updates**: Throttle Slider onChange (50ms)
4. **Optimize selector usage**: Use specific Zustand selectors to minimize re-renders
5. **Lazy load color picker**: Only load picker component when popover opens

**Implementation:**
```typescript
// Memoize sections
export const PositionSection = memo(PositionSectionComponent);
export const RotationSection = memo(RotationSectionComponent);
// ... etc

// Debounced number input
const debouncedOnChange = useMemo(
  () => debounce(onChange, 100),
  [onChange]
);

// Optimized store selector
const selectedId = useCanvasStore((state) => state.selectedId);
const shape = useCanvasStore(
  (state) => state.objects.find(obj => obj.id === selectedId),
  shallow
);
```

**Performance Targets:**
- Properties panel renders in < 16ms (60 FPS)
- Input changes feel instant (< 100ms perceived latency)
- No dropped frames during property updates
- Memory usage stays consistent (no leaks)

---

### Task 12.2: Add Performance Monitoring
**File:** `src/features/properties-panel/utils/monitoring.ts`
**Duration:** 30 minutes

**Monitoring:**
```typescript
// Log render times in development
if (process.env.NODE_ENV === 'development') {
  console.time('PropertiesPanel render');
  // ... render logic
  console.timeEnd('PropertiesPanel render');
}

// Monitor update frequency
const updateMetrics = {
  count: 0,
  lastUpdate: Date.now()
};

function trackUpdate() {
  updateMetrics.count++;
  const now = Date.now();
  const elapsed = now - updateMetrics.lastUpdate;

  if (elapsed > 1000) {
    console.log(`Updates per second: ${updateMetrics.count}`);
    updateMetrics.count = 0;
    updateMetrics.lastUpdate = now;
  }
}
```

---

## Phase 13: Documentation & Polish

### Task 13.1: Component Documentation
**Duration:** 1 hour

**Documentation Requirements:**
- JSDoc comments for all components
- Props documentation with examples
- Usage examples in Storybook (optional)
- Architecture decision record (ADR)

---

### Task 13.2: User Documentation
**File:** `_docs/features/properties-panel.md`
**Duration:** 30 minutes

**Content:**
- Feature overview
- Keyboard shortcuts (future)
- Tips and tricks
- Known limitations
- Troubleshooting

---

## Phase 14: Accessibility & UX Polish

### Task 14.1: Keyboard Navigation
**Duration:** 1.5 hours

**Requirements:**
- Tab through all inputs sequentially
- Enter to confirm changes
- Escape to cancel editing
- Arrow keys in number inputs
- Keyboard shortcuts for common actions (future)

**Implementation:**
```typescript
// Keyboard shortcut examples
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Cmd/Ctrl + D: Duplicate selected shape
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      duplicateShape();
    }

    // Delete: Remove selected shape
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteShape();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### Task 14.2: Accessibility Audit
**Duration:** 1 hour

**Checklist:**
- ✅ All inputs have labels (visible or aria-label)
- ✅ Color picker has keyboard support
- ✅ Focus indicators are visible
- ✅ Screen reader announcements for value changes
- ✅ Proper ARIA roles and attributes
- ✅ High contrast mode support

---

### Task 14.3: Visual Polish
**Duration:** 1 hour

**Enhancements:**
- Smooth transitions on section expand/collapse
- Hover states on all interactive elements
- Focus states for keyboard navigation
- Loading states during Firebase sync
- Error states for validation failures
- Success feedback for updates (optional toast)

---

## Phase 15: Final Testing & Deployment

### Task 15.1: Cross-Browser Testing
**Duration:** 1 hour

**Test on:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

**Test scenarios:**
- All property updates work correctly
- Color picker works on all browsers
- Number inputs work on mobile
- Keyboard shortcuts work
- Real-time sync works

---

### Task 15.2: Performance Testing
**Duration:** 1 hour

**Test scenarios:**
- Rapidly change properties (no lag)
- Select and edit 100+ shapes in sequence
- Test with slow network (throttled to 3G)
- Test with high latency (500ms+)
- Monitor memory usage over time

**Performance Metrics:**
- Properties panel loads in < 100ms
- Property updates feel instant (< 100ms)
- No memory leaks after 1000 updates
- Firebase writes stay within rate limits

---

### Task 15.3: User Acceptance Testing
**Duration:** 2 hours

**Test with real users:**
- Can users find and use all property controls?
- Are the controls intuitive and easy to understand?
- Are there any confusing behaviors or UX issues?
- Are error messages clear and helpful?
- Does the panel feel responsive and performant?

**Collect feedback and iterate**

---

## Summary & Checklist

### Phase Checklist

#### Core Type System & Utilities
- [x] **Phase 1: Data Model Extension (1.5 hours)** ✅ COMPLETE
  - [x] Task 1.1a: Create Shared VisualProperties Interface (15 min)
  - [x] Task 1.1b: Create Shape-Specific Property Interfaces (15 min)
  - [x] Task 1.1c: Update Rectangle Interface (10 min)
  - [x] Task 1.1d: Update Circle Interface (10 min)
  - [x] Task 1.1e: Update Text Interface (15 min)
  - [x] Task 1.1f: Add Type Guards for Property Checking (20 min)
  - [x] Task 1.2: Create Property Validation Utilities (30 min)
  - [x] Task 1.3: Update Rectangle Component (30 min)

- [x] **Phase 1.5: Shape Property Detection Utilities (45 minutes)** ✅ COMPLETE
  - [x] Task 1.5.1: Create Shape Property Detection Utilities (45 min)

#### UI Foundation
- [x] **Phase 2: Properties Panel Structure (3 hours)** ✅ COMPLETE
  - [x] Task 2.1: Create Feature Directory Structure (10 min)
  - [x] Task 2.2a-d: NumberInput Component (with all features) (60 min)
  - [x] Task 2.2e-h: ColorPicker Component (with all features) (60 min)
  - [x] Task 2.3: Create PropertySection Component (20 min)

- [x] **Phase 2.5: Conditional Section Rendering (45 minutes)** ✅ COMPLETE
  - [x] Task 2.5.1: Create Section Visibility Logic (30 min)
  - [x] Task 2.5.2: Update PropertiesPanel to Use Conditional Rendering (15 min)

#### Property Sections
- [x] **Phase 3: Position Section (1.5 hours)** ✅ COMPLETE
  - [x] Task 3.1: Create PositionSection Component (simplified without alignment grid)

- [x] **Phase 4: Rotation Section (1 hour)** ✅ COMPLETE
  - [x] Task 4.1: Create RotationSection Component (1 hour)

- [x] **Phase 5: Layout Section (2 hours)** ✅ COMPLETE
  - [x] Task 5.1a: Create useShapeDimensions Hook (30 min)
  - [x] Task 5.1c-e: Create LayoutSection - All Shape Support (Rectangle, Circle, Text)

- [x] **Phase 6: Appearance Section (1 hour)** ✅ COMPLETE
  - [x] Task 6.1: Create AppearanceSection Component (1 hour)

- [x] **Phase 7: Fill Section (1.5 hours)** ✅ COMPLETE
  - [x] Task 7.1: Create FillSection Component (1.5 hours)

#### Integration & State Management
- [x] **Phase 8: Main Container (1 hour)** ✅ COMPLETE
  - [x] Task 8.1: Create PropertiesPanel Component (1 hour)

- [x] **Phase 9: Property Update Hook (45 minutes)** ✅ COMPLETE
  - [x] Task 9.1: Create usePropertyUpdate Hook (45 min)
  - [x] Task 9.2: Create useSelectedShape Hook (15 min)

- [x] **Phase 10: Integration (45 minutes)** ✅ COMPLETE
  - [x] Task 10.2: Add Properties Panel to Main Layout (integrated into CanvasPage)

#### Quality & Testing
- [ ] **Phase 11: Testing & Edge Cases (5 hours)**
  - [ ] Task 11.1: Integration Tests (2 hours)
  - [ ] Task 11.2: Cross-Shape Type Testing (2 hours)
  - [ ] Task 11.3: Edge Case Documentation (30 min)

- [ ] **Phase 12: Performance (1.5 hours)**
  - [ ] Task 12.1: Optimize Re-renders (1 hour)
  - [ ] Task 12.2: Add Performance Monitoring (30 min)

- [ ] **Phase 13: Documentation (1.5 hours)**
  - [ ] Task 13.1: Component Documentation (1 hour)
  - [ ] Task 13.2: User Documentation (30 min)

- [ ] **Phase 14: Accessibility (3.5 hours)**
  - [ ] Task 14.1: Keyboard Navigation (1.5 hours)
  - [ ] Task 14.2: Accessibility Audit (1 hour)
  - [ ] Task 14.3: Visual Polish (1 hour)

- [ ] **Phase 15: Final Testing (4 hours)**
  - [ ] Task 15.1: Cross-Browser Testing (1 hour)
  - [ ] Task 15.2: Performance Testing (1 hour)
  - [ ] Task 15.3: User Acceptance Testing (2 hours)

**Total Estimated Time:** ~28-30 hours (increased from 24 due to comprehensive shape type support and smaller task breakdown)

### Key Decisions

1. **Data Model**: Generic VisualProperties interface + shape-specific interfaces for ALL shape types (Rectangle, Circle, Text)
2. **Shape Type Support**: Full first-class support for Rectangle, Circle, and Text shapes with adaptive UI
3. **Type System**: Type guards and property detection utilities for safe cross-shape operations
4. **Conditional Rendering**: Section visibility logic determines which controls show for each shape type
5. **State Management**: Use existing Zustand canvasStore, add property update hook with shape-aware validation
6. **Real-time Sync**: Debounce Firebase updates (500ms), optimistic local updates
7. **Validation**: Centralized shape-aware validation in utils, applied before state updates
8. **UI Framework**: Use shadcn/ui components, custom NumberInput and ColorPicker with granular implementation
9. **Performance**: React.memo, debounce inputs (100ms), throttle sliders (50ms), optimize selectors
10. **Accessibility**: Full keyboard support, ARIA labels, screen reader friendly
11. **Testing**: Comprehensive cross-shape type testing ensures all shape types work correctly

### Future Enhancements (Out of Scope)

- [ ] Stroke properties section
- [ ] Shadow properties section
- [ ] Blend modes and advanced effects
- [ ] Multi-select property editing
- [ ] Property animation/transitions
- [ ] Custom property presets
- [ ] Undo/Redo support
- [ ] Property search/filter
- [ ] Keyboard shortcut customization
- [ ] Mobile-optimized properties panel

---

## Risk Assessment

### High Risk
- **Real-time sync complexity**: Multiple users editing same property simultaneously
  - *Mitigation*: Last-write-wins with timestamp, debounce updates

- **Performance with rapid updates**: Too many Firebase writes
  - *Mitigation*: Debounce (500ms), throttle (50ms), batch updates

### Medium Risk
- **Backward compatibility**: Old shapes without new properties
  - *Mitigation*: Optional properties, default values, migration script

- **Browser compatibility**: Color picker, number inputs
  - *Mitigation*: Test on all major browsers, provide fallbacks

### Low Risk
- **UI/UX confusion**: Users not finding controls
  - *Mitigation*: Follow Figma patterns, user testing, documentation

---

## Success Criteria

### Functional
- ✅ All property sections render correctly
- ✅ Property changes update shape in real-time
- ✅ Property changes sync to Firebase
- ✅ Remote users see property changes
- ✅ Validation prevents invalid inputs
- ✅ Edge cases handled gracefully

### Performance
- ✅ Properties panel loads in < 100ms
- ✅ Property updates feel instant (< 100ms perceived)
- ✅ No frame drops during editing
- ✅ Memory usage stays stable

### Quality
- ✅ 100% test coverage for critical paths
- ✅ All edge cases documented and tested
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Works on all major browsers

### User Experience
- ✅ Intuitive and easy to use
- ✅ Clear visual feedback
- ✅ Helpful error messages
- ✅ Keyboard accessible

---

**END OF PLAN**
