/**
 * AI Tools Registry
 *
 * Central registry for all canvas manipulation tools.
 * Tools are initialized with context and provided to the AI agent.
 */

import {DynamicStructuredTool} from "@langchain/core/tools";
import {CanvasToolContext} from "./types";
import {CreateRectangleTool} from "./createRectangle";
import {CreateCircleTool} from "./createCircle";
import {CreateTextTool} from "./createText";
import {CreateLineTool} from "./createLine";
import {MoveObjectTool} from "./moveObject";
import {ResizeObjectTool} from "./resizeObject";
import {RotateObjectTool} from "./rotateObject";
import {DeleteObjectsTool} from "./deleteObjects";
import {UpdateAppearanceTool} from "./updateAppearance";
import {GetCanvasStateTool} from "./getCanvasState";
import {ArrangeInRowTool} from "./arrangeInRow";
import {ArrangeInColumnTool} from "./arrangeInColumn";
import {ArrangeInGridTool} from "./arrangeInGrid";
import {GetViewportCenterTool} from "./getViewportCenter.js";
import {FindEmptySpaceTool} from "./findEmptySpace.js";
import {GenerateAppIconTool} from "./generateAppIcon";
import {GenerateFeatureGraphicTool} from "./generateFeatureGraphic";
import {CreateBatchTool} from "./createBatch";
import {FindObjectsTool} from "./findObjects";
import {DistributeObjectsTool} from "./distributeObjects";
import {CreateFormTool} from "./createForm";
import {CreateNavBarTool} from "./createNavBar";
import {CreateCardTool} from "./createCard";
import {CreatePirateShipOnHorseTool} from "./createPirateShipOnHorse";

/**
 * Get all available canvas tools
 *
 * Initializes all tool instances with the provided context.
 *
 * @param context - Canvas context (canvasId, userId, current objects)
 * @returns Array of LangChain tools ready to use
 */
export function getTools(context: CanvasToolContext): DynamicStructuredTool[] {
  const tools = [
    // Creation tools
    new CreateRectangleTool(context),
    new CreateCircleTool(context),
    new CreateTextTool(context),
    new CreateLineTool(context),

    // Manipulation tools
    new MoveObjectTool(context),
    new ResizeObjectTool(context),
    new RotateObjectTool(context),
    new DeleteObjectsTool(context),
    new UpdateAppearanceTool(context),

    // Query tools
    new GetCanvasStateTool(context),
    new FindObjectsTool(context),

    // Layout tools
    new ArrangeInRowTool(context),
    new ArrangeInColumnTool(context),
    new ArrangeInGridTool(context),
    new DistributeObjectsTool(context),

    // Spatial awareness tools
    new GetViewportCenterTool(context),
    new FindEmptySpaceTool(context),

    // AI Image Generation tools
    new GenerateAppIconTool(context),
    new GenerateFeatureGraphicTool(context),

    // Batch operation tools
    new CreateBatchTool(context),

    // Composite template tools
    new CreateFormTool(context),
    new CreateNavBarTool(context),
    new CreateCardTool(context),

    // Fun demo tools
    new CreatePirateShipOnHorseTool(context),

    // TODO Phase 4: Add grouping tool
    // - groupObjects (parent-child relationships)
  ];

  return tools.map((tool) => tool.getTool());
}

// Re-export types for convenience
export {CanvasToolContext, ToolResult} from "./types";
