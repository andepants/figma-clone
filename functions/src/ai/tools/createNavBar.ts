/**
 * Create NavBar Tool
 *
 * AI tool for creating navigation bar layouts with menu items.
 * Automatically creates background bar and evenly spaced menu items.
 *
 * Use this tool when:
 * - "Build a navigation bar with Home, About, Contact"
 * - "Create a navbar with 4 menu items"
 * - "Make a top menu with Logo and links"
 *
 * Best Practice: Composite tool that creates multiple objects in a structured layout.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import * as logger from "firebase-functions/logger";

/**
 * Schema for navbar creation parameters
 */
const CreateNavBarSchema = z.object({
  // Menu items
  menuItems: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe("Menu item labels (e.g., ['Home', 'About', 'Services', 'Contact'])"),

  // Positioning
  x: z
    .number()
    .optional()
    .describe("X position of navbar top-left (defaults to viewport left)"),
  y: z
    .number()
    .optional()
    .describe("Y position of navbar top (defaults to viewport top)"),

  // Dimensions
  width: z.number().default(1200).describe("Navbar width in pixels"),
  height: z.number().default(60).describe("Navbar height in pixels"),

  // Styling
  bgFill: z.string().default("#1f2937").describe("Navbar background color"),
  textColor: z.string().default("#ffffff").describe("Menu item text color"),
  fontSize: z.number().default(16).describe("Menu item font size"),

  // Spacing
  itemSpacing: z
    .number()
    .default(40)
    .describe("Horizontal spacing between menu items"),

  // Options
  includeLogo: z
    .boolean()
    .default(false)
    .describe("Include a logo placeholder on the left"),
  logoText: z.string().default("Logo").describe("Logo text (if includeLogo=true)"),

  // Naming
  namePrefix: z.string().optional().describe("Prefix for object names (e.g., 'Navbar')"),
});

/**
 * Tool for creating navigation bars
 *
 * Examples:
 * - "Create a navbar with Home, About, Contact" → menuItems=['Home', 'About', 'Contact']
 * - "Build a navigation with 5 items" → menuItems=[...] (LLM suggests defaults)
 */
export class CreateNavBarTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createNavBar",
      "Create a navigation bar with menu items. " +
        "Automatically creates background bar and evenly spaced text items. " +
        "Examples: 'create navbar with Home, About, Contact', 'build navigation with 4 menu items'. " +
        "Returns a set of objects that can be styled further.",
      CreateNavBarSchema,
      context
    );
  }

  /**
   * Execute navbar creation
   *
   * @param input - Navbar creation parameters
   * @returns Tool result with created object IDs
   */
  async execute(input: z.infer<typeof CreateNavBarSchema>): Promise<ToolResult> {
    try {
      // Calculate positioning
      const startX =
        input.x ??
        (this.context.viewportBounds?.minX ||
          this.context.canvasSize.width / 2 - input.width / 2);
      const startY =
        input.y ?? (this.context.viewportBounds?.minY || 50);

      const createdIds: string[] = [];
      const namePrefix = input.namePrefix || "NavBar";

      logger.info("Creating navbar", {
        menuItems: input.menuItems,
        position: {x: startX, y: startY},
        width: input.width,
      });

      // Create background bar
      const bgId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: startX, y: startY},
        dimensions: {width: input.width, height: input.height},
        appearance: {fill: input.bgFill, strokeWidth: 0},
        name: `${namePrefix} Background`,
        userId: this.context.userId,
      });
      createdIds.push(bgId);

      // Calculate menu item positions
      let menuStartX = startX + 30; // Left padding

      // Create logo if requested
      if (input.includeLogo) {
        const logoId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "text",
          position: {x: menuStartX, y: startY + (input.height - input.fontSize - 4) / 2},
          text: input.logoText,
          fontSize: input.fontSize + 4, // Logo slightly larger
          appearance: {fill: input.textColor},
          name: `${namePrefix} Logo`,
          userId: this.context.userId,
        });
        createdIds.push(logoId);

        // Adjust menu start position
        menuStartX += input.logoText.length * 12 + 60; // Logo width + gap
      }

      // Create menu items
      for (let i = 0; i < input.menuItems.length; i++) {
        const itemText = input.menuItems[i];

        const itemId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "text",
          position: {
            x: menuStartX + i * (input.itemSpacing + itemText.length * 8),
            y: startY + (input.height - input.fontSize) / 2,
          },
          text: itemText,
          fontSize: input.fontSize,
          appearance: {fill: input.textColor},
          name: `${namePrefix} Item - ${itemText}`,
          userId: this.context.userId,
        });
        createdIds.push(itemId);
      }

      // Update context memory
      this.context.lastCreatedObjectIds = createdIds;

      const message = `Created navbar with ${input.menuItems.length} menu items at (${Math.round(startX)}, ${Math.round(startY)})`;

      return {
        success: true,
        message,
        objectsCreated: createdIds,
        data: {
          menuItems: input.menuItems,
          includeLogo: input.includeLogo,
          objectCount: createdIds.length,
          position: {x: startX, y: startY},
          dimensions: {width: input.width, height: input.height},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create navbar",
      };
    }
  }
}
