/**
 * Fast Path Pattern Matching
 *
 * Bypasses LLM for simple, unambiguous commands using regex patterns.
 * Provides instant response for common operations.
 *
 * Target: 30% of commands use fast path
 * Expected savings: -500-800ms per matched command
 */

import * as logger from 'firebase-functions/logger';

interface FastPathMatch {
  toolName: string;
  parameters: Record<string, any>;
}

/**
 * Color map for fast color resolution
 */
const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  gray: '#6b7280',
  grey: '#6b7280',
  black: '#000000',
  white: '#ffffff',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
};

/**
 * Shape type normalization
 */
const SHAPE_MAP: Record<string, string> = {
  square: 'rectangle',
  box: 'rectangle',
  rect: 'rectangle',
  rectangle: 'rectangle',
  circle: 'circle',
  oval: 'circle',
  text: 'text',
  line: 'line',
};

/**
 * Direction map for movement
 */
const DIRECTION_MAP: Record<string, {x: number; y: number}> = {
  left: {x: -100, y: 0},
  right: {x: 100, y: 0},
  up: {x: 0, y: -100},
  down: {x: 0, y: 100},
};

/**
 * Try to match command to a fast path pattern
 *
 * @param command - User's natural language command
 * @returns Match result or null if no match/ambiguous
 */
export function tryFastPath(command: string): FastPathMatch | null {
  const lowerCommand = command.toLowerCase().trim();

  try {
    // Pattern 1: "create [color] [shape]"
    // Examples: "create blue circle", "make red square"
    const createMatch = lowerCommand.match(
      /^(?:create|make|add)\s+(?:a\s+)?(\w+)\s+(\w+)$/
    );
    if (createMatch) {
      const [, color, shape] = createMatch;
      const normalizedShape = SHAPE_MAP[shape];
      const fillColor = COLOR_MAP[color];

      if (normalizedShape && fillColor) {
        logger.info('Fast path: create shape', {color, shape, normalizedShape});

        if (normalizedShape === 'rectangle') {
          return {
            toolName: 'createRectangle',
            parameters: {
              fill: fillColor,
              width: 200,
              height: 200,
            },
          };
        } else if (normalizedShape === 'circle') {
          return {
            toolName: 'createCircle',
            parameters: {
              fill: fillColor,
              radius: 50,
            },
          };
        } else if (normalizedShape === 'text') {
          return {
            toolName: 'createText',
            parameters: {
              text: 'Text',
              fill: fillColor,
              fontSize: 24,
            },
          };
        }
      }
    }

    // Pattern 2: "delete selected" / "remove selected"
    const deleteMatch = lowerCommand.match(
      /^(?:delete|remove)\s+(?:the\s+)?selected(?:\s+(?:objects?|shapes?))?$/
    );
    if (deleteMatch) {
      logger.info('Fast path: delete selected');
      return {
        toolName: 'deleteObjects',
        parameters: {
          objectIds: [], // Will be populated from selectedObjectIds
        },
      };
    }

    // Pattern 3: "move [direction]" / "move it [direction]"
    const moveMatch = lowerCommand.match(
      /^move(?:\s+it|\s+them|\s+that)?\s+(left|right|up|down)$/
    );
    if (moveMatch) {
      const [, direction] = moveMatch;
      const offset = DIRECTION_MAP[direction];

      if (offset) {
        logger.info('Fast path: move direction', {direction, offset});
        return {
          toolName: 'moveObject',
          parameters: {
            deltaX: offset.x,
            deltaY: offset.y,
            // objectId will be determined from context (last created or selected)
          },
        };
      }
    }

    // Pattern 4: "make it bigger" / "make it smaller"
    const resizeMatch = lowerCommand.match(
      /^make(?:\s+it|\s+them|\s+that)?\s+(bigger|larger|smaller)$/
    );
    if (resizeMatch) {
      const [, size] = resizeMatch;
      const scale = size === 'bigger' || size === 'larger' ? 1.5 : 0.67;

      logger.info('Fast path: resize', {size, scale});
      return {
        toolName: 'resizeObject',
        parameters: {
          scale,
          // objectId will be determined from context
        },
      };
    }

    // No match found - fall back to LLM
    return null;
  } catch (error) {
    logger.warn('Fast path matching error, falling back to LLM', {error});
    return null;
  }
}

/**
 * Check if command is too complex for fast path
 *
 * @param command - User's command
 * @returns True if command should bypass fast path
 */
export function isTooComplex(command: string): boolean {
  const lowerCommand = command.toLowerCase();

  // Multiple operations (and, then, also)
  if (/\b(and|then|also)\b/.test(lowerCommand)) {
    return true;
  }

  // Numbers suggesting batch operations
  if (/\b\d{2,}\b/.test(lowerCommand)) {
    return true;
  }

  // Complex layout terms
  if (/(grid|spiral|circle|pattern|arrange|align|distribute)/.test(lowerCommand)) {
    return true;
  }

  // Conditional or query language
  if (/(if|when|all|every|find)/.test(lowerCommand)) {
    return true;
  }

  return false;
}
