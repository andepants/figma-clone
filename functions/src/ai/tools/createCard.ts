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
  padding: z.number().default(20).describe("Internal padding in pixels"),

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
      // Calculate card height based on content
      const imageHeight = input.includeImage ? input.imageHeight : 0;
      const titleHeight = 30;
      const descriptionHeight = 60;
      const totalHeight =
        imageHeight + titleHeight + descriptionHeight + input.padding * 2;

      // Calculate positioning (center card)
      const startX =
        input.x ??
        (this.context.viewportBounds?.centerX ||
          this.context.canvasSize.width / 2) -
          input.width / 2;
      const startY =
        input.y ??
        (this.context.viewportBounds?.centerY ||
          this.context.canvasSize.height / 2) -
          totalHeight / 2;

      const createdIds: string[] = [];
      const namePrefix = input.namePrefix || "Card";
      let currentY = startY;

      logger.info("Creating card", {
        title: input.title,
        includeImage: input.includeImage,
        position: {x: startX, y: startY},
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
        });
        createdIds.push(imageTextId);

        currentY += input.imageHeight;
      }

      currentY += input.padding;

      // Create title
      const titleId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {x: startX + input.padding, y: currentY},
        text: input.title,
        fontSize: input.titleSize,
        appearance: {fill: input.titleColor},
        name: `${namePrefix} Title`,
        userId: this.context.userId,
      });
      createdIds.push(titleId);
      currentY += titleHeight;

      // Create description
      const descriptionId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "text",
        position: {x: startX + input.padding, y: currentY},
        text: input.description,
        fontSize: input.descriptionSize,
        appearance: {fill: input.descriptionColor},
        name: `${namePrefix} Description`,
        userId: this.context.userId,
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
