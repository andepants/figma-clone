/**
 * Get Canvas State Tool
 *
 * AI tool for querying current canvas state with optional filters.
 * Allows LLM to inspect canvas objects before performing operations.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult} from "./types";
import {CanvasToolContext} from "./types";

/**
 * Schema for canvas state query parameters
 */
const GetCanvasStateSchema = z.object({
  filter: z.object({
    type: z.enum(["rectangle", "circle", "text", "line"])
      .optional()
      .describe("Filter by object type"),
    selected: z.boolean()
      .optional()
      .describe("Filter by selection state (true = only selected, false = only unselected)"),
    color: z.string()
      .optional()
      .describe("Filter by fill color (hex or color name)"),
  }).optional().describe("Optional filters to apply to object list"),
});

/**
 * Tool for querying canvas state
 *
 * Returns filtered list of canvas objects with essential properties.
 * Useful for commands like "move all rectangles" or "how many red shapes?"
 */
export class GetCanvasStateTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "getCanvasState",
      "Query the current canvas state to inspect objects. " +
      "Returns list of objects with their properties. " +
      "Can filter by type (rectangle/circle/text/line), selection state, or color. " +
      "Use this before performing bulk operations or answering questions about the canvas.",
      GetCanvasStateSchema,
      context
    );
  }

  /**
   * Execute canvas state query
   *
   * @param input - Query filters
   * @returns Tool result with filtered object list
   */
  async execute(
    input: z.infer<typeof GetCanvasStateSchema>
  ): Promise<ToolResult> {
    try {
      let objects = [...this.context.currentObjects];

      // Apply filters if provided
      const filter = input.filter;
      if (filter) {
        // Filter by type
        if (filter.type) {
          objects = objects.filter(obj => obj.type === filter.type);
        }

        // Filter by selection state
        if (filter.selected !== undefined) {
          const selectedSet = new Set(this.context.selectedObjectIds || []);
          objects = objects.filter(obj =>
            filter.selected ?
              selectedSet.has(obj.id) :
              !selectedSet.has(obj.id)
          );
        }

        // Filter by color
        if (filter.color) {
          const normalizedColor = filter.color.toLowerCase();
          objects = objects.filter(obj => {
            const objColor = (obj.fill || "").toLowerCase();
            return objColor === normalizedColor ||
                   objColor === `#${normalizedColor.replace("#", "")}`;
          });
        }
      }

      // Limit to 100 objects to prevent oversized responses
      const limitedObjects = objects.slice(0, 100);
      const wasLimited = objects.length > 100;

      // Format object data for LLM consumption
      const formattedObjects = limitedObjects.map(obj => {
        const base: any = {
          id: obj.id,
          type: obj.type,
          name: obj.name || `Unnamed ${obj.type}`,
          position: {x: obj.x, y: obj.y},
          fill: obj.fill,
        };

        // Add type-specific properties
        if (obj.type === "rectangle" || obj.type === "text") {
          base.size = {width: obj.width, height: obj.height};
        } else if (obj.type === "circle") {
          base.radius = obj.radius;
        }
        // Note: Line objects use x, y for start point
        // and width, height to represent end point offset

        // Add rotation if present
        if (obj.rotation) {
          base.rotation = obj.rotation;
        }

        return base;
      });

      // Build result message
      const filterDesc = input.filter ?
        ` (filtered by: ${Object.entries(input.filter)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")})` :
        "";

      const limitWarning = wasLimited ?
        ` Note: Limited to first 100 of ${objects.length} total objects.` :
        "";

      return {
        success: true,
        message: `Found ${formattedObjects.length} objects${filterDesc}.${limitWarning}`,
        data: {
          objects: formattedObjects,
          count: formattedObjects.length,
          totalCount: objects.length,
          wasLimited,
          filters: input.filter || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to query canvas state",
      };
    }
  }
}
