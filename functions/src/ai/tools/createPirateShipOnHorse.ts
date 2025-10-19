/**
 * Create Pirate Ship on Horse Tool
 *
 * AI tool for creating an absurd "pirate ship riding on a horse" composition.
 * Creates 100+ shapes (rectangles, circles, lines) for a memorable demo.
 *
 * Use this tool when:
 * - User mentions "pirate" or "horse" in their prompt
 * - User wants a fun, ridiculous demo composition
 *
 * Best Practice: Showcase grouping, layering, and creative shape usage.
 */

import {z} from "zod";
import {CanvasTool} from "./base";
import {ToolResult, CanvasToolContext} from "./types";
import {createCanvasObject} from "../../services/canvas-objects";
import * as logger from "firebase-functions/logger";

/**
 * Schema for pirate ship on horse creation
 */
const CreatePirateShipOnHorseSchema = z.object({
  // Positioning
  centerX: z
    .number()
    .optional()
    .describe("Center X position (defaults to viewport center)"),
  centerY: z
    .number()
    .optional()
    .describe("Center Y position (defaults to viewport center)"),

  // Scale
  scale: z
    .number()
    .min(0.5)
    .max(2)
    .default(1)
    .describe("Scale factor (0.5-2, default: 1)"),
});

/**
 * Tool for creating a pirate ship on a horse composition
 *
 * Creates a hilarious composition of a pirate ship riding on top of a horse,
 * made entirely from basic shapes (rectangles, circles, lines).
 */
export class CreatePirateShipOnHorseTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      "createPirateShipOnHorse",
      "Create an absurd, hilarious 'pirate ship riding on a horse' composition made from 100+ basic shapes. " +
        "Perfect for demos and showcasing creative shape combinations. " +
        "Includes detailed horse (body, legs, head, tail, mane), pirate ship (hull, deck, mast, sail, flag, skull), " +
        "and fun details (waves, clouds, sun, parrot). " +
        "Use this when user mentions 'pirate' or 'horse' or wants a fun demo.",
      CreatePirateShipOnHorseSchema,
      context
    );
  }

  /**
   * Execute pirate ship on horse creation
   *
   * @param input - Creation parameters
   * @returns Tool result with created object IDs
   */
  async execute(
    input: z.infer<typeof CreatePirateShipOnHorseSchema>
  ): Promise<ToolResult> {
    try {
      // Calculate center position
      const centerX =
        input.centerX ??
        (this.context.viewportBounds?.centerX ||
          this.context.canvasSize.width / 2);
      const centerY =
        input.centerY ??
        (this.context.viewportBounds?.centerY ||
          this.context.canvasSize.height / 2);

      const scale = input.scale;
      const createdIds: string[] = [];

      logger.info("Creating pirate ship on horse", {
        center: {x: centerX, y: centerY},
        scale,
      });

      // Color palette
      const colors = {
        // Horse colors
        horseBrown: "#8B4513",
        horseDark: "#654321",
        horseBlack: "#1a1a1a",

        // Ship colors
        shipHull: "#654321",
        shipDeck: "#8B4513",
        sailWhite: "#F5E6D3",
        flagBlack: "#000000",
        flagRed: "#DC143C",

        // Environment colors
        waterBlue: "#4A90E2",
        skyBlue: "#87CEEB",
        sunYellow: "#FFD700",
        cloudWhite: "#FFFFFF",
        grassGreen: "#228B22",

        // Details
        gold: "#FFD700",
        white: "#FFFFFF",
      };

      // Base positioning (centered composition)
      const baseY = centerY + 50 * scale;

      // === BACKGROUND === //

      // Sky
      const skyId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 400 * scale, y: centerY - 250 * scale},
        dimensions: {width: 800 * scale, height: 300 * scale},
        appearance: {fill: colors.skyBlue, strokeWidth: 0},
        name: "Sky Background",
        userId: this.context.userId,
      });
      createdIds.push(skyId);

      // Sun
      const sunId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: centerX + 250 * scale, y: centerY - 180 * scale},
        radius: 40 * scale,
        appearance: {fill: colors.sunYellow, strokeWidth: 0},
        name: "Sun",
        userId: this.context.userId,
      });
      createdIds.push(sunId);

      // Sun rays (8 lines radiating outward)
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const rayLength = 25 * scale;
        const rayId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "line",
          position: {
            x: centerX + 250 * scale + Math.cos(angle) * 50 * scale,
            y: centerY - 180 * scale + Math.sin(angle) * 50 * scale,
          },
          points: [
            0,
            0,
            Math.cos(angle) * rayLength,
            Math.sin(angle) * rayLength,
          ],
          appearance: {stroke: colors.sunYellow, strokeWidth: 3 * scale},
          name: `Sun Ray ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(rayId);
      }

      // Clouds (3 clouds, each made of 3 circles)
      for (let cloudNum = 0; cloudNum < 3; cloudNum++) {
        const cloudX = centerX - 300 * scale + cloudNum * 250 * scale;
        const cloudY = centerY - 200 * scale + cloudNum * 20 * scale;

        for (let puff = 0; puff < 3; puff++) {
          const puffId = await createCanvasObject({
            canvasId: this.context.canvasId,
            type: "circle",
            position: {x: cloudX + puff * 20 * scale, y: cloudY},
            radius: (15 + puff * 5) * scale,
            appearance: {fill: colors.cloudWhite, strokeWidth: 0},
            name: `Cloud ${cloudNum + 1} Puff ${puff + 1}`,
            userId: this.context.userId,
          });
          createdIds.push(puffId);
        }
      }

      // Water (waves made of rectangles)
      for (let i = 0; i < 10; i++) {
        const waveId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {
            x: centerX - 400 * scale + i * 80 * scale,
            y: baseY + 150 * scale + Math.sin(i) * 10 * scale,
          },
          dimensions: {width: 80 * scale, height: 15 * scale},
          appearance: {fill: colors.waterBlue, strokeWidth: 0},
          name: `Wave ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(waveId);
      }

      // === HORSE (bottom layer) === //

      // Horse body (main rectangle)
      const horseBodyId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 100 * scale, y: baseY},
        dimensions: {width: 200 * scale, height: 80 * scale},
        appearance: {
          fill: colors.horseBrown,
          stroke: colors.horseDark,
          strokeWidth: 2 * scale,
        },
        name: "Horse Body",
        userId: this.context.userId,
      });
      createdIds.push(horseBodyId);

      // Horse legs (4 rectangles)
      const legPositions = [
        {x: -70, name: "Front Left"},
        {x: -30, name: "Front Right"},
        {x: 30, name: "Back Left"},
        {x: 70, name: "Back Right"},
      ];

      for (const leg of legPositions) {
        const legId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {
            x: centerX + leg.x * scale,
            y: baseY + 80 * scale,
          },
          dimensions: {width: 20 * scale, height: 60 * scale},
          appearance: {
            fill: colors.horseBrown,
            stroke: colors.horseDark,
            strokeWidth: 2 * scale,
          },
          name: `Horse ${leg.name} Leg`,
          userId: this.context.userId,
        });
        createdIds.push(legId);

        // Horse hooves (small rectangles)
        const hoofId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {
            x: centerX + leg.x * scale - 5 * scale,
            y: baseY + 140 * scale,
          },
          dimensions: {width: 30 * scale, height: 10 * scale},
          appearance: {fill: colors.horseBlack, strokeWidth: 0},
          name: `Horse ${leg.name} Hoof`,
          userId: this.context.userId,
        });
        createdIds.push(hoofId);
      }

      // Horse head (rectangle at angle)
      const horseHeadId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 120 * scale, y: baseY - 40 * scale},
        dimensions: {width: 50 * scale, height: 70 * scale},
        appearance: {
          fill: colors.horseBrown,
          stroke: colors.horseDark,
          strokeWidth: 2 * scale,
        },
        name: "Horse Head",
        userId: this.context.userId,
      });
      createdIds.push(horseHeadId);

      // Horse ears (2 small triangles - simulated with rectangles)
      for (let i = 0; i < 2; i++) {
        const earId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {
            x: centerX - 115 * scale + i * 30 * scale,
            y: baseY - 50 * scale,
          },
          dimensions: {width: 10 * scale, height: 20 * scale},
          appearance: {fill: colors.horseBrown, strokeWidth: 0},
          name: `Horse Ear ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(earId);
      }

      // Horse eyes (2 circles)
      for (let i = 0; i < 2; i++) {
        const eyeId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "circle",
          position: {
            x: centerX - 110 * scale + i * 20 * scale,
            y: baseY - 20 * scale,
          },
          radius: 4 * scale,
          appearance: {fill: colors.horseBlack, strokeWidth: 0},
          name: `Horse Eye ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(eyeId);
      }

      // Horse mane (10 small circles along neck)
      for (let i = 0; i < 10; i++) {
        const maneId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "circle",
          position: {
            x: centerX - 100 * scale + i * 10 * scale,
            y: baseY - 10 * scale - Math.sin(i * 0.5) * 5 * scale,
          },
          radius: 6 * scale,
          appearance: {fill: colors.horseDark, strokeWidth: 0},
          name: `Mane Tuft ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(maneId);
      }

      // Horse tail (5 circles cascading)
      for (let i = 0; i < 5; i++) {
        const tailId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "circle",
          position: {
            x: centerX + 100 * scale + i * 8 * scale,
            y: baseY + 20 * scale + i * 12 * scale,
          },
          radius: 8 * scale,
          appearance: {fill: colors.horseDark, strokeWidth: 0},
          name: `Tail Tuft ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(tailId);
      }

      // === PIRATE SHIP (on top of horse) === //

      const shipY = baseY - 80 * scale;

      // Ship hull (large rectangle)
      const hullId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 150 * scale, y: shipY},
        dimensions: {width: 300 * scale, height: 80 * scale},
        appearance: {
          fill: colors.shipHull,
          stroke: colors.horseDark,
          strokeWidth: 3 * scale,
        },
        name: "Ship Hull",
        userId: this.context.userId,
      });
      createdIds.push(hullId);

      // Ship bow (front triangle - simulated with rectangle)
      const bowId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 170 * scale, y: shipY + 20 * scale},
        dimensions: {width: 20 * scale, height: 40 * scale},
        appearance: {fill: colors.shipHull, strokeWidth: 0},
        name: "Ship Bow",
        userId: this.context.userId,
      });
      createdIds.push(bowId);

      // Ship deck (rectangle on top)
      const deckId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 150 * scale, y: shipY - 10 * scale},
        dimensions: {width: 300 * scale, height: 10 * scale},
        appearance: {fill: colors.shipDeck, strokeWidth: 0},
        name: "Ship Deck",
        userId: this.context.userId,
      });
      createdIds.push(deckId);

      // Deck planks (10 horizontal lines)
      for (let i = 0; i < 10; i++) {
        const plankId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "line",
          position: {x: centerX - 150 * scale + i * 30 * scale, y: shipY - 5 * scale},
          points: [0, 0, 0, 10 * scale],
          appearance: {stroke: colors.horseDark, strokeWidth: 2 * scale},
          name: `Deck Plank ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(plankId);
      }

      // Ship windows (6 circles)
      for (let i = 0; i < 6; i++) {
        const windowId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "circle",
          position: {
            x: centerX - 120 * scale + i * 40 * scale,
            y: shipY + 40 * scale,
          },
          radius: 8 * scale,
          appearance: {
            fill: colors.skyBlue,
            stroke: colors.gold,
            strokeWidth: 2 * scale,
          },
          name: `Ship Window ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(windowId);
      }

      // Ship mast (tall rectangle)
      const mastId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 5 * scale, y: shipY - 150 * scale},
        dimensions: {width: 10 * scale, height: 150 * scale},
        appearance: {fill: colors.horseDark, strokeWidth: 0},
        name: "Ship Mast",
        userId: this.context.userId,
      });
      createdIds.push(mastId);

      // Ship sail (large rectangle)
      const sailId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX + 10 * scale, y: shipY - 130 * scale},
        dimensions: {width: 100 * scale, height: 90 * scale},
        appearance: {
          fill: colors.sailWhite,
          stroke: colors.horseDark,
          strokeWidth: 2 * scale,
        },
        name: "Ship Sail",
        userId: this.context.userId,
      });
      createdIds.push(sailId);

      // Sail stitching (3 horizontal lines)
      for (let i = 0; i < 3; i++) {
        const stitchId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "line",
          position: {x: centerX + 10 * scale, y: shipY - 120 * scale + i * 30 * scale},
          points: [0, 0, 100 * scale, 0],
          appearance: {stroke: colors.horseDark, strokeWidth: 1 * scale},
          name: `Sail Stitch ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(stitchId);
      }

      // Pirate flag (rectangle at top of mast)
      const flagId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: centerX - 40 * scale, y: shipY - 170 * scale},
        dimensions: {width: 50 * scale, height: 30 * scale},
        appearance: {fill: colors.flagBlack, strokeWidth: 0},
        name: "Pirate Flag",
        userId: this.context.userId,
      });
      createdIds.push(flagId);

      // Skull on flag (2 circles for skull)
      const skullId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: centerX - 15 * scale, y: shipY - 155 * scale},
        radius: 8 * scale,
        appearance: {fill: colors.white, strokeWidth: 0},
        name: "Skull Head",
        userId: this.context.userId,
      });
      createdIds.push(skullId);

      // Skull eyes (2 small circles)
      for (let i = 0; i < 2; i++) {
        const eyeId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "circle",
          position: {
            x: centerX - 20 * scale + i * 10 * scale,
            y: shipY - 155 * scale,
          },
          radius: 2 * scale,
          appearance: {fill: colors.flagBlack, strokeWidth: 0},
          name: `Skull Eye ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(eyeId);
      }

      // Crossbones (2 lines crossing)
      const bone1Id = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "line",
        position: {x: centerX - 25 * scale, y: shipY - 145 * scale},
        points: [0, 0, 20 * scale, 0],
        appearance: {stroke: colors.white, strokeWidth: 3 * scale},
        name: "Crossbone 1",
        userId: this.context.userId,
      });
      createdIds.push(bone1Id);

      const bone2Id = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "line",
        position: {x: centerX - 5 * scale, y: shipY - 145 * scale},
        points: [-20 * scale, 0, 0, 0],
        appearance: {stroke: colors.white, strokeWidth: 3 * scale},
        name: "Crossbone 2",
        userId: this.context.userId,
      });
      createdIds.push(bone2Id);

      // Ship anchor (circle + line)
      const anchorRingId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: centerX + 130 * scale, y: shipY + 10 * scale},
        radius: 8 * scale,
        appearance: {
          fill: "transparent",
          stroke: colors.horseDark,
          strokeWidth: 3 * scale,
        },
        name: "Anchor Ring",
        userId: this.context.userId,
      });
      createdIds.push(anchorRingId);

      const anchorLineId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "line",
        position: {x: centerX + 130 * scale, y: shipY + 18 * scale},
        points: [0, 0, 0, 30 * scale],
        appearance: {stroke: colors.horseDark, strokeWidth: 3 * scale},
        name: "Anchor Line",
        userId: this.context.userId,
      });
      createdIds.push(anchorLineId);

      // Anchor flukes (2 rectangles at bottom)
      for (let i = 0; i < 2; i++) {
        const flukeId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {
            x: centerX + 130 * scale + (i === 0 ? -15 : 5) * scale,
            y: shipY + 48 * scale,
          },
          dimensions: {width: 10 * scale, height: 15 * scale},
          appearance: {fill: colors.horseDark, strokeWidth: 0},
          name: `Anchor Fluke ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(flukeId);
      }

      // === PARROT (on ship railing) === //

      const parrotX = centerX - 60 * scale;
      const parrotY = shipY - 20 * scale;

      // Parrot body (red circle)
      const parrotBodyId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: parrotX, y: parrotY},
        radius: 12 * scale,
        appearance: {fill: colors.flagRed, strokeWidth: 0},
        name: "Parrot Body",
        userId: this.context.userId,
      });
      createdIds.push(parrotBodyId);

      // Parrot head (smaller circle)
      const parrotHeadId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: parrotX - 8 * scale, y: parrotY - 12 * scale},
        radius: 8 * scale,
        appearance: {fill: colors.flagRed, strokeWidth: 0},
        name: "Parrot Head",
        userId: this.context.userId,
      });
      createdIds.push(parrotHeadId);

      // Parrot beak (small rectangle)
      const beakId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: parrotX - 18 * scale, y: parrotY - 12 * scale},
        dimensions: {width: 8 * scale, height: 4 * scale},
        appearance: {fill: colors.sunYellow, strokeWidth: 0},
        name: "Parrot Beak",
        userId: this.context.userId,
      });
      createdIds.push(beakId);

      // Parrot eye (tiny circle)
      const parrotEyeId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: parrotX - 10 * scale, y: parrotY - 14 * scale},
        radius: 2 * scale,
        appearance: {fill: colors.horseBlack, strokeWidth: 0},
        name: "Parrot Eye",
        userId: this.context.userId,
      });
      createdIds.push(parrotEyeId);

      // Parrot tail feathers (3 rectangles)
      for (let i = 0; i < 3; i++) {
        const featherColors = [colors.flagRed, colors.sunYellow, colors.grassGreen];
        const featherId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "rectangle",
          position: {
            x: parrotX + 10 * scale + i * 4 * scale,
            y: parrotY + i * 3 * scale,
          },
          dimensions: {width: 3 * scale, height: 15 * scale},
          appearance: {fill: featherColors[i], strokeWidth: 0},
          name: `Parrot Tail Feather ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(featherId);
      }

      // === TREASURE CHEST (on deck) === //

      const chestX = centerX + 60 * scale;
      const chestY = shipY - 5 * scale;

      // Chest box (rectangle)
      const chestId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "rectangle",
        position: {x: chestX, y: chestY},
        dimensions: {width: 40 * scale, height: 25 * scale},
        appearance: {
          fill: colors.shipHull,
          stroke: colors.gold,
          strokeWidth: 2 * scale,
        },
        name: "Treasure Chest",
        userId: this.context.userId,
      });
      createdIds.push(chestId);

      // Chest lock (small circle)
      const lockId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: "circle",
        position: {x: chestX + 20 * scale, y: chestY + 12 * scale},
        radius: 4 * scale,
        appearance: {fill: colors.gold, strokeWidth: 0},
        name: "Chest Lock",
        userId: this.context.userId,
      });
      createdIds.push(lockId);

      // Gold coins (6 small circles on top)
      for (let i = 0; i < 6; i++) {
        const coinId = await createCanvasObject({
          canvasId: this.context.canvasId,
          type: "circle",
          position: {
            x: chestX + 10 * scale + (i % 3) * 10 * scale,
            y: chestY - 10 * scale - Math.floor(i / 3) * 8 * scale,
          },
          radius: 4 * scale,
          appearance: {fill: colors.gold, strokeWidth: 0},
          name: `Gold Coin ${i + 1}`,
          userId: this.context.userId,
        });
        createdIds.push(coinId);
      }

      // Update context
      this.context.lastCreatedObjectIds = createdIds;

      const message =
        `🏴‍☠️🐴 Created epic "Pirate Ship on Horse" composition with ${createdIds.length} shapes! ` +
        `Includes detailed horse, pirate ship with sail and skull flag, parrot, treasure chest, ` +
        `waves, clouds, and sun. Positioned at (${Math.round(centerX)}, ${Math.round(centerY)}).`;

      logger.info("Pirate ship on horse created successfully", {
        objectCount: createdIds.length,
        center: {x: centerX, y: centerY},
      });

      return {
        success: true,
        message,
        objectsCreated: createdIds,
        data: {
          objectCount: createdIds.length,
          position: {x: centerX, y: centerY},
          scale: input.scale,
          components: [
            "horse (body, legs, head, tail, mane)",
            "ship (hull, deck, mast, sail, flag, skull, anchor)",
            "parrot",
            "treasure chest with coins",
            "environment (sky, sun, clouds, waves)",
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        message: "Failed to create pirate ship on horse composition",
      };
    }
  }
}
