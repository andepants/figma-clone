/**
 * Create Card Tool
 *
 * AI tool for creating card layouts (title, image placeholder, description).
 * Automatically creates card background, title, image area, and description text.
 *
 * Use this tool when:
 * - "Make a card layout with title and description"
 * - "Create a product card with image, title, price"
 * - "Build a profile card with photo and bio"
 *
 * Best Practice: Composite tool that creates a structured card layout.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import {validateViewportBounds} from "../utils/viewport-validator.js";
import {adjustToViewport} from "../utils/viewport-adjuster.js";
import {getBatchZIndexes} from "../utils/zindex-calculator.js";
import {getSpacing} from "../utils/spacing-calculator.js";
import * as logger from "firebase-functions/logger";

/**
 * Schema for card creation parameters
 */
const CreateCardSchema = z.object({
  // Card content
  title: z.string().default("Card Title").describe("Card title text"),
  description: z
    .string()
    .default("Card description goes here")
    .describe("Card description/body text"),
  includeImage: z
    .boolean()
    .default(true)
    .describe("Include an image placeholder area"),

  // Positioning
  x: z
    .number()
    .optional()
    .describe("X position of card top-left (defaults to viewport center)"),
  y: z
    .number()
    .optional()
    .describe("Y position of card top-left (defaults to viewport center)"),

  // Dimensions
  width: z.number().default(300).describe("Card width in pixels"),
  imageHeight: z
    .number()
    .default(180)
    .describe("Image area height in pixels (if includeImage=true)"),

  // Styling
  cardBgColor: z.string().default("#ffffff").describe("Card background color"),
  cardBorderColor: z.string().default("#e5e7eb").describe("Card border color"),
  titleColor: z.string().default("#1f2937").describe("Title text color"),
  descriptionColor: z.string().default("#6b7280").describe("Description text color"),
  imageBgColor: z
    .string()
    .default("#d1d5db")
    .describe("Image placeholder background color"),

  // Typography
  titleSize: z.number().default(20).describe("Title font size"),
  descriptionSize: z.number().default(14).describe("Description font size"),

  // Spacing
  padding: z.number().default(8).describe("Internal padding in pixels (default: 8px - card-internal spacing)"),

  // Naming
  namePrefix: z.string().optional().describe("Prefix for object names (e.g., 'ProductCard')"),
});

/**
 * Tool for creating card layouts
 *
 * Examples:
 * - "Create a card with title and description" → Basic card
 * - "Make a product card with image" → Card with image area
 * - "Build a profile card" → Custom styling
 */
export class CreateCardTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createCard",
      "Create a card layout with title, optional image area, and description. " +
        "Automatically creates card background, title text, image placeholder, and description text with proper spacing. " +
        "Examples: 'create a card with title and description', 'make a product card', 'build a profile card'. " +
        "Returns a grouped set of objects.",
      CreateCardSchema,
      context
    );
  }

  /**
   * Execute card creation
   *
   * @param input - Card creation parameters
   * @returns Tool result with created object IDs
   */
  async execute(input: z.infer<typeof CreateCardSchema>): Promise<ToolResult> {
    try {
      // Validate viewport bounds
      const validatedBounds = validateViewportBounds(this.context.viewportBounds);

      // Use smart spacing for cards
      const internalPadding = getSpacing('card-internal'); // 8px internal padding

      // Calculate card dimensions
      const imageHeight = input.includeImage ? input.imageHeight : 0;
      const titleHeight = 30;
      const descriptionHeight = 60;
      const totalHeight =
        imageHeight + titleHeight + descriptionHeight + internalPadding * 2;

      // Determine initial position (default to viewport center)
      let startX = input.x ?? (validatedBounds.centerX - input.width / 2);
      let startY = input.y ?? (validatedBounds.centerY - totalHeight / 2);

      // ALWAYS adjust to viewport (even if coordinates explicitly provided)
      const viewportAdjustment = adjustToViewport(
        startX,
        startY,
        input.width,
        totalHeight,
        validatedBounds,
        'rectangle'
      );

      if (viewportAdjustment.wasAdjusted) {
        logger.info('Adjusted card position to viewport', {
          original: { x: startX, y: startY },
          adjusted: { x: viewportAdjustment.x, y: viewportAdjustment.y },
          reason: 'Card was outside viewport bounds'
        });
      }

      startX = viewportAdjustment.x;
      startY = viewportAdjustment.y;

      const createdIds: string[] = [];
      const namePrefix = input.namePrefix || "Card";
      let currentY = startY;

      // Calculate total objects: bg + (image + imageText if includeImage) + title + description
      const totalObjects = 1 + (input.includeImage ? 2 : 0) + 2;
      const zIndexes = getBatchZIndexes(this.context.currentObjects, totalObjects);
      let zIndexCounter = 0;

      logger.info("Creating card", {
        title: input.title,
        includeImage: input.includeImage,
        position: {x: startX, y: startY},
        totalObjects,
        startingZIndex: zIndexes[0],
      });

      // Create card background
      const bgId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: startX, y: startY},
        dimensions: {width: input.width, height: totalHeight},
        appearance: {
          fill: input.cardBgColor,
          stroke: input.cardBorderColor,
          strokeWidth: 1,
        },
        name: `${namePrefix} Background`,
        userId: this.context.userId,
        zIndex: zIndexes[zIndexCounter++],
      });
      createdIds.push(bgId);

      // Create image placeholder if requested
      if (input.includeImage) {
        const imageId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {x: startX, y: currentY},
          dimensions: {width: input.width, height: input.imageHeight},
          appearance: {fill: input.imageBgColor, strokeWidth: 0},
          name: `${namePrefix} Image`,
          userId: this.context.userId,
          zIndex: zIndexes[zIndexCounter++],
        });
        createdIds.push(imageId);

        // Add "Image" text in center of placeholder
        const imageTextId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "text",
          position: {
            x: startX + input.width / 2 - 25,
            y: currentY + input.imageHeight / 2 - 8,
          },
          text: "Image",
          fontSize: 14,
          appearance: {fill: "#9ca3af"},
          name: `${namePrefix} Image Label`,
          userId: this.context.userId,
          zIndex: zIndexes[zIndexCounter++],
        });
        createdIds.push(imageTextId);

        currentY += input.imageHeight;
      }

      currentY += internalPadding; // Use smart internal padding

      // Create title
      const titleId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {x: startX + internalPadding, y: currentY},
        text: input.title,
        fontSize: input.titleSize,
        appearance: {fill: input.titleColor},
        name: `${namePrefix} Title`,
        userId: this.context.userId,
        zIndex: zIndexes[zIndexCounter++],
      });
      createdIds.push(titleId);
      currentY += titleHeight;

      // Create description
      const descriptionId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {x: startX + internalPadding, y: currentY},
        text: input.description,
        fontSize: input.descriptionSize,
        appearance: {fill: input.descriptionColor},
        name: `${namePrefix} Description`,
        userId: this.context.userId,
        zIndex: zIndexes[zIndexCounter++],
      });
      createdIds.push(descriptionId);

      // Update context memory
      this.context.lastCreatedObjectIds = createdIds;

      const message = `Created card with ${input.includeImage ? "image, " : ""}title, and description at (${Math.round(startX)}, ${Math.round(startY)})`;

      return {
        success: true,
        message,
        objectsCreated: createdIds,
        data: {
          title: input.title,
          includeImage: input.includeImage,
          objectCount: createdIds.length,
          position: {x: startX, y: startY},
          dimensions: {width: input.width, height: totalHeight},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create card",
      };
    }
  }
}
