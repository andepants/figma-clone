/**
 * Create Batch Tool
 *
 * AI tool for creating multiple objects sequentially with pattern support.
 * Handles complex commands like "create 30 blue squares in a circle".
 *
 * Features:
 * - Sequential creation (prevents system overload)
 * - Pattern support (circle, spiral, grid, wave, hexagon, scatter)
 * - Position tracking (each object knows about previous ones)
 * - Graceful error handling (partial success reporting)
 * - Progress tracking via intermediate results
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import {
  generateCirclePattern,
  generateSpiralPattern,
  generateWavePattern,
  generateHexPattern,
  generateScatterPattern,
  Position,
} from "../utils/pattern-generator";
import * as logger from "firebase-functions/logger";

/**
 * Schema for batch creation parameters
 */
const CreateBatchSchema = z.object({
  // Object properties
  type: z
    .enum(["rectangle", "circle", "text", "line"])
    .describe("Type of objects to create"),
  count: z
    .number()
    .min(2)
    .max(100)
    .describe("Number of objects to create (2-100)"),

  // Shape dimensions
  width: z
    .number()
    .min(1)
    .max(5000)
    .optional()
    .describe("Width for rectangles/text (default: 100)"),
  height: z
    .number()
    .min(1)
    .max(5000)
    .optional()
    .describe("Height for rectangles (default: 100)"),
  radius: z
    .number()
    .min(1)
    .max(2500)
    .optional()
    .describe("Radius for circles (default: 50)"),
  text: z.string().optional().describe("Text content for text objects"),
  fontSize: z.number().optional().describe("Font size for text (default: 24)"),

  // Appearance
  fill: z
    .string()
    .default("#3b82f6")
    .describe("Fill color (hex or name, default: blue)"),
  stroke: z.string().optional().describe("Stroke color (hex or name)"),
  strokeWidth: z.number().optional().describe("Stroke width in pixels"),

  // Pattern arrangement
  pattern: z
    .enum(["circle", "spiral", "grid", "wave", "hexagon", "scatter", "line"])
    .describe(
      "Arrangement pattern: circle, spiral, grid, wave, hexagon, scatter, line"
    ),

  // Pattern-specific parameters
  centerX: z
    .number()
    .optional()
    .describe("Center X (default: viewport center)"),
  centerY: z
    .number()
    .optional()
    .describe("Center Y (default: viewport center)"),
  circleRadius: z
    .number()
    .optional()
    .describe("Radius of circular arrangement (default: 200)"),
  spacing: z
    .number()
    .optional()
    .describe("Spacing between objects (default: 20)"),
  columns: z.number().optional().describe("Columns for grid/hex (auto if not set)"),
  amplitude: z.number().optional().describe("Wave height (default: 100)"),
  frequency: z.number().optional().describe("Wave cycles (default: 2)"),

  // Naming
  namePrefix: z
    .string()
    .optional()
    .describe('Name prefix (e.g., "Square" -> "Square 1", "Square 2")'),
});

/**
 * Tool for creating multiple objects in patterns
 *
 * Handles bulk creation operations sequentially to prevent crashes
 * and provide progressive visual feedback.
 */
export class CreateBatchTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createBatch",
      "Create multiple objects in a pattern (circle, spiral, grid, wave, hexagon, scatter, or line). " +
        "Use this for commands like 'create 30 blue squares in a circle' or 'make a spiral of 20 circles'. " +
        "Supports 2-100 objects. Objects are created sequentially to prevent system overload.",
      CreateBatchSchema,
      context
    );
  }

  /**
   * Execute batch creation
   *
   * Creates objects sequentially with position tracking and error handling.
   *
   * @param input - Validated batch creation parameters
   * @returns Tool result with created object IDs and stats
   */
  async execute(
    input: z.infer<typeof CreateBatchSchema>
  ): Promise<ToolResult> {
    try {
      // Validate color
      if (!this.isValidColor(input.fill)) {
        return {
          success: false,
          error: `Invalid fill color: ${input.fill}`,
          message: "Batch creation failed",
        };
      }

      if (input.stroke && !this.isValidColor(input.stroke)) {
        return {
          success: false,
          error: `Invalid stroke color: ${input.stroke}`,
          message: "Batch creation failed",
        };
      }

      // Validate type-specific requirements
      if (input.type === "text" && !input.text) {
        return {
          success: false,
          error: "Text content required for text objects",
          message: "Batch creation failed",
        };
      }

      // Determine center point
      const centerX =
        input.centerX ??
        (this.context.viewportBounds?.centerX ||
          this.context.canvasSize.width / 2);
      const centerY =
        input.centerY ??
        (this.context.viewportBounds?.centerY ||
          this.context.canvasSize.height / 2);

      logger.info("Generating pattern positions", {
        pattern: input.pattern,
        count: input.count,
        center: {x: centerX, y: centerY},
      });

      // Generate positions based on pattern
      const positions = this.generatePositions(
        input.pattern,
        input.count,
        centerX,
        centerY,
        input
      );

      logger.info("Pattern positions generated", {
        pattern: input.pattern,
        count: positions.length,
      });

      // Create objects sequentially
      const createdIds: string[] = [];
      const errors: Array<{index: number; error: string}> = [];

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];

        try {
          // Generate name
          const name = input.namePrefix
            ? `${input.namePrefix} ${i + 1}`
            : undefined;

          // Create object based on type
          let objectId: string;

          switch (input.type) {
            case "rectangle":
              objectId = await createCanvasObject({
                canvasId: this.context.canvasId,
                type: "rectangle",
                position: {x: pos.x, y: pos.y},
                dimensions: {
                  width: input.width || 100,
                  height: input.height || 100,
                },
                appearance: {
                  fill: input.fill,
                  stroke: input.stroke,
                  strokeWidth: input.strokeWidth,
                },
                name,
                userId: this.context.userId,
              });
              break;

            case "circle":
              objectId = await createCanvasObject({
                canvasId: this.context.canvasId,
                type: "circle",
                position: {x: pos.x, y: pos.y},
                radius: input.radius || 50,
                appearance: {
                  fill: input.fill,
                  stroke: input.stroke,
                  strokeWidth: input.strokeWidth,
                },
                name,
                userId: this.context.userId,
              });
              break;

            case "text":
              objectId = await createCanvasObject({
                canvasId: this.context.canvasId,
                type: "text",
                position: {x: pos.x, y: pos.y},
                text: input.text || "",
                fontSize: input.fontSize || 24,
                appearance: {
                  fill: input.fill,
                },
                name,
                userId: this.context.userId,
              });
              break;

            default:
              throw new Error(`Unsupported type: ${input.type}`);
          }

          createdIds.push(objectId);

          // Update context with newly created object for position awareness
          this.context.lastCreatedObjectIds = createdIds;
        } catch (error) {
          logger.error(`Failed to create object ${i + 1}`, {error});
          errors.push({
            index: i,
            error: String(error),
          });
        }
      }

      // Determine success status
      const success = createdIds.length > 0;
      const allSucceeded = errors.length === 0;

      let message: string;
      if (allSucceeded) {
        message = `Created ${createdIds.length} ${input.type}s in ${input.pattern} pattern`;
      } else if (success) {
        message =
          `Created ${createdIds.length} of ${input.count} ${input.type}s ` +
          `in ${input.pattern} pattern (${errors.length} failed)`;
      } else {
        message = `Failed to create ${input.type}s in ${input.pattern} pattern`;
      }

      return {
        success,
        message,
        objectsCreated: createdIds,
        data: {
          pattern: input.pattern,
          requested: input.count,
          created: createdIds.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Batch creation failed",
      };
    }
  }

  /**
   * Generate positions based on pattern type
   *
   * @param pattern - Pattern type
   * @param count - Number of positions
   * @param centerX - Center X coordinate
   * @param centerY - Center Y coordinate
   * @param params - Additional pattern parameters
   * @returns Array of positions
   */
  private generatePositions(
    pattern: string,
    count: number,
    centerX: number,
    centerY: number,
    params: z.infer<typeof CreateBatchSchema>
  ): Position[] {
    switch (pattern) {
      case "circle":
        return generateCirclePattern(
          count,
          centerX,
          centerY,
          params.circleRadius || 200
        );

      case "spiral":
        return generateSpiralPattern(
          count,
          centerX,
          centerY,
          params.circleRadius || 50,
          params.spacing || 30
        );

      case "grid": {
        const cols = params.columns || Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const spacing = params.spacing || 20;
        const positions: Position[] = [];

        // Calculate dimensions
        const objectWidth = params.width || params.radius || 100;
        const objectHeight =
          params.height || params.radius || (params.type === "circle" ? params.radius || 100 : 100);
        const cellWidth = objectWidth + spacing;
        const cellHeight = objectHeight + spacing;

        // Calculate starting position to center grid
        const gridWidth = cols * cellWidth - spacing;
        const gridHeight = rows * cellHeight - spacing;
        const startX = centerX - gridWidth / 2;
        const startY = centerY - gridHeight / 2;

        for (let i = 0; i < count; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          positions.push({
            x: Math.round(startX + col * cellWidth + objectWidth / 2),
            y: Math.round(startY + row * cellHeight + objectHeight / 2),
          });
        }

        return positions;
      }

      case "wave": {
        const spacing = params.spacing || 40;
        const amplitude = params.amplitude || 100;
        const frequency = params.frequency || 2;
        const totalWidth = (count - 1) * spacing;
        const startX = centerX - totalWidth / 2;

        return generateWavePattern(
          count,
          startX,
          centerY,
          spacing,
          amplitude,
          frequency
        );
      }

      case "hexagon": {
        const cols = params.columns || Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const spacing = params.spacing || 80;

        const allPositions = generateHexPattern(
          rows,
          cols,
          centerX,
          centerY,
          spacing
        );

        // Return only the requested count
        return allPositions.slice(0, count);
      }

      case "scatter": {
        // Scatter within viewport or default bounds
        const bounds = this.context.viewportBounds;
        const minX = bounds?.minX ?? centerX - 400;
        const minY = bounds?.minY ?? centerY - 300;
        const maxX = bounds?.maxX ?? centerX + 400;
        const maxY = bounds?.maxY ?? centerY + 300;
        const minDistance = params.spacing || 50;

        return generateScatterPattern(
          count,
          minX,
          minY,
          maxX,
          maxY,
          minDistance
        );
      }

      case "line": {
        const spacing = params.spacing || 50;
        const totalLength = (count - 1) * spacing;
        const startX = centerX - totalLength / 2;
        const positions: Position[] = [];

        for (let i = 0; i < count; i++) {
          positions.push({
            x: Math.round(startX + i * spacing),
            y: centerY,
          });
        }

        return positions;
      }

      default:
        throw new Error(`Unknown pattern: ${pattern}`);
    }
  }
}
