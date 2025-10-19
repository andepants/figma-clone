/**
 * Find Objects Tool
 *
 * AI tool for finding canvas objects using semantic criteria.
 * Enables commands like "find all blue circles" or "the largest rectangle".
 *
 * Use this tool when:
 * - User references objects by properties ("blue rectangles", "small circles")
 * - Need to select multiple objects matching criteria
 * - Want to find specific objects before operating on them
 *
 * Best Practice: This tool only FINDS objects, it doesn't modify them.
 * Use the returned object IDs with other tools (move, resize, update, etc.)
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {CanvasObject} from "../../types";
import * as logger from "firebase-functions/logger";

/**
 * Schema for object finding parameters
 */
const FindObjectsSchema = z.object({
  // Type filter
  type: z
    .enum(["rectangle", "circle", "text", "line", "image"])
    .optional()
    .describe("Filter by object type"),

  // Color filters
  fill: z
    .string()
    .optional()
    .describe("Filter by fill color (hex like #ff0000 or color name like 'blue')"),
  stroke: z
    .string()
    .optional()
    .describe("Filter by stroke color (hex like #000000 or color name)"),

  // Size filters
  minWidth: z.number().optional().describe("Minimum width in pixels"),
  maxWidth: z.number().optional().describe("Maximum width in pixels"),
  minHeight: z.number().optional().describe("Minimum height in pixels"),
  maxHeight: z.number().optional().describe("Maximum height in pixels"),
  minRadius: z.number().optional().describe("Minimum radius in pixels (for circles)"),
  maxRadius: z.number().optional().describe("Maximum radius in pixels (for circles)"),

  // Selection filter
  selected: z
    .boolean()
    .optional()
    .describe("Filter by selection state (true = only selected, false = only unselected)"),

  // Name filter
  nameContains: z
    .string()
    .optional()
    .describe("Filter by name containing this text (case-insensitive)"),

  // Position filters
  inViewport: z
    .boolean()
    .optional()
    .describe("Filter to objects currently in user's viewport"),

  // Sorting and limiting
  sortBy: z
    .enum(["size", "position", "name", "createdAt"])
    .optional()
    .describe("Sort results by: size (largest first), position (top-left first), name, or createdAt (newest first)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum number of results to return (default: all matching)"),
  first: z
    .boolean()
    .optional()
    .describe("Return only the first matching object (e.g., 'the blue circle')"),
});

/**
 * Tool for finding objects by semantic criteria
 *
 * Examples:
 * - "Find all blue circles" → findObjects({type: 'circle', fill: 'blue'})
 * - "Find the largest rectangle" → findObjects({type: 'rectangle', sortBy: 'size', first: true})
 * - "Find all selected text" → findObjects({type: 'text', selected: true})
 */
export class FindObjectsTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "findObjects",
      "Find canvas objects using semantic criteria (color, type, size, name, selection state). " +
        "Returns object IDs that can be used with other tools. " +
        "Examples: 'all blue circles', 'the largest rectangle', 'selected text', 'objects in viewport'. " +
        "Use this before operating on objects referenced by properties rather than IDs.",
      FindObjectsSchema,
      context
    );
  }

  /**
   * Execute object finding
   *
   * @param input - Search criteria
   * @returns Tool result with matching object IDs
   */
  async execute(
    input: z.infer<typeof FindObjectsSchema>
  ): Promise<ToolResult> {
    try {
      let objects = [...this.context.currentObjects];
      const filters: string[] = [];

      // Filter by type
      if (input.type) {
        objects = objects.filter((obj) => obj.type === input.type);
        filters.push(`type=${input.type}`);
      }

      // Filter by fill color
      if (input.fill) {
        const normalizedFill = this.normalizeColor(input.fill);
        objects = objects.filter((obj) => {
          if (!obj.fill) return false;
          const objFill = this.normalizeColor(obj.fill);
          return objFill === normalizedFill;
        });
        filters.push(`fill=${input.fill}`);
      }

      // Filter by stroke color
      if (input.stroke) {
        const normalizedStroke = this.normalizeColor(input.stroke);
        objects = objects.filter((obj) => {
          if (!obj.stroke) return false;
          const objStroke = this.normalizeColor(obj.stroke);
          return objStroke === normalizedStroke;
        });
        filters.push(`stroke=${input.stroke}`);
      }

      // Filter by selection state
      if (input.selected !== undefined) {
        const selectedSet = new Set(this.context.selectedObjectIds || []);
        objects = objects.filter((obj) =>
          input.selected ? selectedSet.has(obj.id) : !selectedSet.has(obj.id)
        );
        filters.push(`selected=${input.selected}`);
      }

      // Filter by name
      if (input.nameContains) {
        const searchTerm = input.nameContains.toLowerCase();
        objects = objects.filter((obj) =>
          (obj.name || "").toLowerCase().includes(searchTerm)
        );
        filters.push(`name contains '${input.nameContains}'`);
      }

      // Filter by size (width/height)
      if (input.minWidth !== undefined) {
        objects = objects.filter(
          (obj) => (obj.width || 0) >= input.minWidth!
        );
        filters.push(`minWidth=${input.minWidth}`);
      }
      if (input.maxWidth !== undefined) {
        objects = objects.filter(
          (obj) => (obj.width || 0) <= input.maxWidth!
        );
        filters.push(`maxWidth=${input.maxWidth}`);
      }
      if (input.minHeight !== undefined) {
        objects = objects.filter(
          (obj) => (obj.height || 0) >= input.minHeight!
        );
        filters.push(`minHeight=${input.minHeight}`);
      }
      if (input.maxHeight !== undefined) {
        objects = objects.filter(
          (obj) => (obj.height || 0) <= input.maxHeight!
        );
        filters.push(`maxHeight=${input.maxHeight}`);
      }

      // Filter by radius (circles)
      if (input.minRadius !== undefined) {
        objects = objects.filter(
          (obj) => obj.type === "circle" && (obj.radius || 0) >= input.minRadius!
        );
        filters.push(`minRadius=${input.minRadius}`);
      }
      if (input.maxRadius !== undefined) {
        objects = objects.filter(
          (obj) => obj.type === "circle" && (obj.radius || 0) <= input.maxRadius!
        );
        filters.push(`maxRadius=${input.maxRadius}`);
      }

      // Filter by viewport
      if (input.inViewport && this.context.viewportBounds) {
        const vp = this.context.viewportBounds;
        objects = objects.filter((obj) => {
          // Check if object center is in viewport
          return (
            obj.x >= vp.minX &&
            obj.x <= vp.maxX &&
            obj.y >= vp.minY &&
            obj.y <= vp.maxY
          );
        });
        filters.push("in viewport");
      }

      // Sort objects
      if (input.sortBy) {
        switch (input.sortBy) {
          case "size":
            objects.sort((a, b) => {
              const sizeA = this.getObjectSize(a);
              const sizeB = this.getObjectSize(b);
              return sizeB - sizeA; // Largest first
            });
            break;

          case "position":
            objects.sort((a, b) => {
              // Top-left first (y then x)
              if (a.y !== b.y) return a.y - b.y;
              return a.x - b.x;
            });
            break;

          case "name":
            objects.sort((a, b) => {
              const nameA = (a.name || "").toLowerCase();
              const nameB = (b.name || "").toLowerCase();
              return nameA.localeCompare(nameB);
            });
            break;

          case "createdAt":
            objects.sort((a, b) => {
              const timeA = a.createdAt || 0;
              const timeB = b.createdAt || 0;
              return timeB - timeA; // Newest first
            });
            break;
        }
        filters.push(`sortBy=${input.sortBy}`);
      }

      // Apply limit
      if (input.limit !== undefined) {
        objects = objects.slice(0, input.limit);
      }

      // Return first only if requested
      if (input.first) {
        objects = objects.slice(0, 1);
      }

      const objectIds = objects.map((obj) => obj.id);
      const objectDescriptions = objects.map(
        (obj) =>
          obj.name || `${obj.type} at (${Math.round(obj.x)}, ${Math.round(obj.y)})`
      );

      logger.info("Found objects", {
        filters,
        count: objectIds.length,
        first: input.first,
      });

      // Build message
      let message: string;
      if (objectIds.length === 0) {
        // No results - provide helpful diagnostic
        const totalObjects = this.context.currentObjects.length;
        message = `❌ No objects found matching criteria: ${filters.join(", ")}. ` +
                 `Canvas has ${totalObjects} total objects. ` +
                 `Try: 1) Removing some filters, 2) Checking color spelling, or 3) Using 'inViewport: true' if objects exist outside view.`;

        logger.warn("findObjects returned no results", {
          filters,
          totalObjects,
          selectedCount: this.context.selectedObjectIds?.length || 0,
          hasViewport: !!this.context.viewportBounds,
        });
      } else if (input.first) {
        message = `✅ Found object: ${objectDescriptions[0]} (ID: ${objectIds[0]})`;
      } else {
        message = `✅ Found ${objectIds.length} object(s) matching: ${filters.join(", ")}`;
      }

      logger.info("findObjects completed", {
        filters,
        count: objectIds.length,
        objectIds: objectIds.slice(0, 5), // Log first 5 IDs
        first: input.first || false,
      });

      return {
        success: true,
        message,
        data: {
          objectIds,
          count: objectIds.length,
          objects: objectDescriptions,
          filters: filters,
          first: input.first || false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to find objects",
      };
    }
  }

  /**
   * Normalize color for comparison
   *
   * Converts color names to hex and normalizes hex format
   *
   * @param color - Color string (hex or name)
   * @returns Normalized hex color (lowercase, with #)
   */
  private normalizeColor(color: string): string {
    const normalized = color.toLowerCase().trim();

    // Color name to hex mapping
    const colorMap: Record<string, string> = {
      black: "#000000",
      white: "#ffffff",
      red: "#ef4444",
      green: "#22c55e",
      blue: "#3b82f6",
      yellow: "#eab308",
      purple: "#a855f7",
      orange: "#f97316",
      gray: "#6b7280",
      grey: "#6b7280",
      pink: "#ec4899",
      cyan: "#06b6d4",
      transparent: "transparent",
    };

    // Check if it's a color name
    if (colorMap[normalized]) {
      return colorMap[normalized];
    }

    // Ensure hex has #
    if (normalized.startsWith("#")) {
      return normalized;
    }

    return `#${normalized}`;
  }

  /**
   * Calculate object size for sorting
   *
   * @param obj - Canvas object
   * @returns Size value (area for rectangles, radius for circles)
   */
  private getObjectSize(obj: CanvasObject): number {
    if (obj.type === "circle" && obj.radius) {
      return Math.PI * obj.radius * obj.radius; // Area
    }
    if (obj.width && obj.height) {
      return obj.width * obj.height; // Area
    }
    return 0;
  }
}
