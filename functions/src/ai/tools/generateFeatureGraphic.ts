/**
 * Generate Feature Graphic Tool
 *
 * AI tool for generating professional Google Play Store feature graphics.
 * Uses conversational flow to gather detailed information before generating.
 *
 * Creates a group containing 3 canvas objects (in z-order):
 * 1. Feature graphic (1024x500 displayed, 1792x1024 source) - background/bottom layer
 * 2. Text label showing app name and dimensions - middle layer
 * 3. Info box with Google Play requirements and best practices (from apptamin.com) - top layer
 *
 * All items are grouped together for easy organization and manipulation.
 * The feature graphic is intentionally placed at the bottom of the z-index stack.
 *
 * Follows Google Play design standards (1024x500px) and apptamin.com ASO best practices:
 * - Vivid colors, readable text, play button awareness
 * - Clear value proposition in 2-3 seconds
 * - Professional quality for store listing
 *
 * @see https://www.apptamin.com/blog/feature-graphic-play-store/
 * @see https://developer.android.com/distribute/best-practices/launch/feature-graphic
 * @see https://support.google.com/googleplay/android-developer/answer/9866151
 */

import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';
import { generateImage, validatePrompt } from '../../services/image-generation';
import { uploadImageFromUrl } from '../../services/storage-upload';
import { createCanvasObject } from '../../services/canvas-objects';
import { findEmptySpace } from '../utils/collision-detector';
import * as logger from 'firebase-functions/logger';

/**
 * Zod schema for feature graphic generation parameters
 *
 * Schema descriptions are shown to the LLM to help it understand
 * what parameters to extract from natural language commands.
 *
 * IMPORTANT: The LLM should ask follow-up questions to gather missing information,
 * then generate directly without asking for confirmation.
 */
const GenerateFeatureGraphicSchema = z.object({
  // Core app information
  appName: z.string()
    .min(2, 'App name must be at least 2 characters')
    .max(50, 'App name must be less than 50 characters')
    .describe(
      'The name of the app. Examples: "Coffee Finder", "Fitness Pro", "Music Master"'
    ),

  appCategory: z.string()
    .min(2, 'App category must be at least 2 characters')
    .max(30, 'App category must be less than 30 characters')
    .describe(
      'The category or type of app. Examples: "productivity", "fitness", "music streaming", "photo editing", "social"'
    ),

  keyFeature: z.string()
    .min(5, 'Key feature must be at least 5 characters')
    .max(100, 'Key feature must be less than 100 characters')
    .describe(
      'The main feature or value proposition to highlight. What makes this app special? ' +
      'Examples: "track your coffee intake", "AI-powered workout plans", "offline music playback"'
    ),

  visualDescription: z.string()
    .min(10, 'Visual description must be at least 10 characters')
    .max(200, 'Visual description must be less than 200 characters')
    .describe(
      'Visual elements to include in the graphic. Be specific about imagery, colors, mood. ' +
      'Examples: "coffee cup with steam, warm brown and cream colors, cozy atmosphere", ' +
      '"person running with headphones, energetic blues and greens, motivational", ' +
      '"musical notes floating around headphones, vibrant purples and pinks, modern"'
    ),

  tagline: z.string()
    .optional()
    .describe(
      'Optional short tagline to include (keep under 30 characters for readability). ' +
      'Examples: "Your Daily Coffee Companion", "Train Smarter", "Music Anywhere"'
    ),
});

/**
 * Tool for generating feature graphics with DALL-E 3
 *
 * This tool:
 * 1. Gathers detailed information through conversation (app name, category, key feature, visuals, tagline)
 * 2. Enhances user prompt with professional design principles from apptamin.com best practices
 * 3. Generates 1024x500 landscape graphic using DALL-E 3 (correct Google Play size)
 * 4. Uploads to Firebase Storage for permanent access
 * 5. Creates a group container for all feature graphic items
 * 6. Creates the feature graphic canvas object (first/bottom layer in group)
 * 7. Creates text label above the graphic (middle layer in group)
 * 8. Creates info box with requirements and tips (top layer in group)
 * 9. Places everything in viewport-aware layout
 *
 * Design principles applied (from apptamin.com):
 * - Size: 1024x500px (Google Play requirement)
 * - Vivid foreground and background colors
 * - Large, readable text (minimal and descriptive)
 * - Mindful of play button placement
 * - Clear value proposition visible in 2-3 seconds
 * - Professional quality for store listing
 */
export class GenerateFeatureGraphicTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'generateFeatureGraphic',
      // Tool description for LLM (helps it understand when to use this tool)
      'Generate professional Google Play Store feature graphic (1024x500 landscape). ' +
      'IMPORTANT: Extract the following from user input or ask follow-up questions: ' +
      '1) App name, 2) App category (e.g., fitness, productivity), 3) Key feature or value proposition, ' +
      '4) Visual description (colors, imagery, mood), 5) Optional tagline (under 30 chars). ' +
      '\n\n' +
      'FORMAT YOUR QUESTIONS CLEARLY with line breaks:\n' +
      'Example: "To create your feature graphic, I need:\n\n1. What is the app name?\n2. What category does it fall under?\n\nPlease provide these details!"\n\n' +
      'Once you have this information, generate immediately WITHOUT asking for confirmation. ' +
      'Creates high-quality marketing asset with info box, label, and graphic following ' +
      'Google Play design standards and apptamin.com best practices (vivid colors, readable text, play button awareness). ' +
      'Use this when user asks to create feature graphic, generate Play Store graphic, make store banner, or design marketing asset.',
      GenerateFeatureGraphicSchema,
      context
    );
  }

  /**
   * Execute feature graphic generation
   *
   * Workflow:
   * 1. Build detailed prompt from gathered information
   * 2. Enhance prompt with apptamin.com best practices
   * 3. Generate 1024x500 image with DALL-E 3
   * 4. Upload to Firebase Storage
   * 5. Calculate layout placement (viewport-aware)
   * 6. Create group container for all items
   * 7. Create feature graphic canvas object (first/bottom layer)
   * 8. Create text label above graphic (middle layer)
   * 9. Create info box with requirements and tips (top layer)
   * 10. Return success with all object IDs
   *
   * @param input - Validated input from Zod schema with all gathered information
   * @returns Tool result with success status and created object IDs (group + children)
   */
  async execute(input: z.infer<typeof GenerateFeatureGraphicSchema>): Promise<ToolResult> {
    const startTime = Date.now();
    let currentStep = 'initialization';

    try {
      logger.info('Starting feature graphic generation', {
        appName: input.appName,
        appCategory: input.appCategory,
        keyFeature: input.keyFeature,
        userId: this.context.userId,
        canvasId: this.context.canvasId,
      });

      // Step 1: Build comprehensive prompt from gathered information
      currentStep = 'prompt_building';
      logger.info('Step 1: Building prompt from gathered information');

      const promptDescription = `${input.appCategory} app called "${input.appName}" that helps users ${input.keyFeature}. ` +
                               `Visual style: ${input.visualDescription}` +
                               (input.tagline ? `. Include tagline: "${input.tagline}"` : '');

      const validation = validatePrompt(promptDescription);
      if (!validation.valid) {
        logger.warn('Invalid prompt', { error: validation.error, promptDescription });
        return {
          success: false,
          error: validation.error,
          message: 'Invalid description: ' + validation.error,
        };
      }

      // Step 2: Enhance prompt with apptamin.com best practices
      currentStep = 'prompt_enhancement';
      logger.info('Step 2: Enhancing prompt with apptamin.com best practices');

      // Create enhanced prompt with specific Google Play best practices
      const enhancedPrompt = `Professional Google Play Store feature graphic (1024x500 landscape): ${promptDescription}

CRITICAL SIZE: Image must be EXACTLY 1024 pixels wide by 500 pixels tall landscape format.

Design Requirements (from apptamin.com):
- Use vivid foreground and background colors for maximum impact
- Large, readable text (minimal and descriptive)
- Clear value proposition visible in 2-3 seconds
- Create story and sense of context to humanize the app
- Avoid overcrowding with text
- Leave safe zone in center for play button overlay
- Do NOT repeat first screenshot visuals
- Ensure text is readable and not near image borders

Visual Style:
- Modern, professional, and eye-catching
- Vibrant color palette that stands out in store listings
- Clear focal point that draws attention
- Consistent with app's brand identity
${input.tagline ? `- Include tagline prominently: "${input.tagline}"` : '- NO tagline text needed'}

Technical Specifications:
- 1024x500 pixel landscape orientation (EXACT size requirement)
- High quality, suitable for Google Play Store
- Text should be large enough to read at thumbnail size
- Leave 20% margin on all sides for safety
- Center area reserved for potential play button overlay`;

      logger.info('Prompt enhanced successfully', {
        original: promptDescription.substring(0, 100) + '...',
        enhancedLength: enhancedPrompt.length,
      });

      // Step 3: Generate image with DALL-E 3 (correct size: 1024x1024, we'll crop/resize in display)
      // Note: DALL-E 3 doesn't support 1024x500, so we use 1792x1024 and resize for display
      currentStep = 'image_generation';
      logger.info('Step 3: Generating image with DALL-E 3', {
        type: 'feature',
        size: '1792x1024',
        quality: 'hd',
        promptLength: enhancedPrompt.length,
      });

      const imageResult = await generateImage({
        prompt: enhancedPrompt,
        type: 'feature',
        size: '1792x1024', // DALL-E 3 limitation - closest to 1024x500 aspect ratio
        quality: 'hd',
        style: 'vivid',
      });

      if (!imageResult.success || !imageResult.imageUrl) {
        logger.error('Image generation failed', {
          error: imageResult.error,
          errorCode: imageResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: imageResult.error || 'Failed to generate image',
          message: `Failed to generate feature graphic: ${imageResult.error}`,
        };
      }

      logger.info('Image generated successfully', {
        url: imageResult.imageUrl.substring(0, 50) + '...',
        revisedPrompt: imageResult.revisedPrompt?.substring(0, 100),
      });

      // Step 4: Upload to Firebase Storage
      currentStep = 'storage_upload';
      logger.info('Step 4: Uploading image to Firebase Storage');

      const uploadResult = await uploadImageFromUrl(
        imageResult.imageUrl,
        this.context.canvasId,
        'feature'
      );

      if (!uploadResult.success || !uploadResult.publicUrl) {
        logger.error('Storage upload failed', {
          error: uploadResult.error,
          errorCode: uploadResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: uploadResult.error || 'Failed to save image',
          message: `Failed to save feature graphic: ${uploadResult.error}`,
        };
      }

      logger.info('Image uploaded to storage successfully', {
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
        storagePath: uploadResult.storagePath,
      });

      // Step 5: Calculate layout placement (viewport-aware)
      // Layout: [Info Box 1024x300] -> [Label 1024x40] -> [Graphic 1024x500]
      // Total: 1024w x 890h (300 + 50 gap + 40 + 10 gap + 500 + 50 bottom margin)
      currentStep = 'position_calculation';
      logger.info('Step 5: Calculating layout placement');

      const GRAPHIC_WIDTH = 1024;
      const GRAPHIC_HEIGHT = 500; // Correct Google Play size
      const INFO_BOX_HEIGHT = 300;
      const LABEL_HEIGHT = 40;
      const INFO_TO_LABEL_GAP = 50;
      const LABEL_TO_GRAPHIC_GAP = 10;
      const BOTTOM_MARGIN = 50;

      const TOTAL_WIDTH = GRAPHIC_WIDTH;
      const TOTAL_HEIGHT = INFO_BOX_HEIGHT + INFO_TO_LABEL_GAP + LABEL_HEIGHT + LABEL_TO_GRAPHIC_GAP + GRAPHIC_HEIGHT + BOTTOM_MARGIN;

      let gridStartX: number;
      let gridStartY: number;

      if (this.context.viewportBounds) {
        gridStartX = this.context.viewportBounds.centerX - TOTAL_WIDTH / 2;
        gridStartY = this.context.viewportBounds.centerY - TOTAL_HEIGHT / 2;

        logger.info('Using viewport-aware placement', {
          viewportCenter: {
            x: this.context.viewportBounds.centerX,
            y: this.context.viewportBounds.centerY,
          },
          gridTopLeft: { x: gridStartX, y: gridStartY },
        });
      } else {
        gridStartX = this.context.canvasSize.width / 2 - TOTAL_WIDTH / 2;
        gridStartY = this.context.canvasSize.height / 2 - TOTAL_HEIGHT / 2;

        logger.info('Using canvas center placement', {
          canvasSize: this.context.canvasSize,
          gridTopLeft: { x: gridStartX, y: gridStartY },
        });
      }

      // Check for overlap and adjust if needed
      const adjustedPosition = findEmptySpace(
        gridStartX,
        gridStartY,
        TOTAL_WIDTH,
        TOTAL_HEIGHT,
        this.context.currentObjects
      );

      if (adjustedPosition.x !== gridStartX || adjustedPosition.y !== gridStartY) {
        logger.info('Adjusted grid position to avoid overlap', {
          original: { x: gridStartX, y: gridStartY },
          adjusted: adjustedPosition,
        });
        gridStartX = adjustedPosition.x;
        gridStartY = adjustedPosition.y;
      }

      // Calculate positions
      const infoBoxY = gridStartY;
      const labelY = gridStartY + INFO_BOX_HEIGHT + INFO_TO_LABEL_GAP;
      const graphicY = labelY + LABEL_HEIGHT + LABEL_TO_GRAPHIC_GAP;

      // Step 6: Create group for all feature graphic items
      currentStep = 'create_group';
      logger.info('Step 6: Creating group for feature graphic items');

      const groupId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'group',
        position: { x: gridStartX + GRAPHIC_WIDTH / 2, y: gridStartY + TOTAL_HEIGHT / 2 },
        appearance: {},
        name: `Feature Graphic - ${input.appName}`,
        userId: this.context.userId,
        isCollapsed: false,
      });

      logger.info('Group created successfully', { id: groupId });

      // Step 7: Create info box with requirements and tips
      currentStep = 'create_info_box';
      logger.info('Step 7: Creating info box with requirements and tips');

      const infoText = `Google Play Feature Graphic Guidelines (from apptamin.com)

Requirements:
• Size: 1024x500 pixels (landscape)
• Format: 24-bit PNG (no alpha) or JPEG
• Placement: Shown before screenshots in store listing
• Visibility: Brand searches, recommended sections, and ads

Design Best Practices:
• Use vivid foreground and background colors
• Create story and sense of context to humanize your app
• Large, readable text (minimal and descriptive)
• Leave safe zone in center for play button overlay
• Avoid overcrowding with text or placing critical text near borders
• Do NOT duplicate first screenshot content
• Ensure consistency with screenshot style

Optimization Tips:
• Localize for different markets
• Consider seasonal or time-sensitive designs
• A/B test feature graphic variations
• Clear value proposition visible in 2-3 seconds
• Can drive 31% lift in conversion rates when optimized

More info: https://www.apptamin.com/blog/feature-graphic-play-store/`;

      // Step 8: Create feature graphic on canvas (FIRST - lowest z-index, appears at back)
      currentStep = 'create_graphic';
      logger.info('Step 8: Creating feature graphic on canvas');

      // Generate filename for metadata
      const timestamp = Date.now();
      const fileName = `${input.appName.replace(/\s+/g, '-').toLowerCase()}-feature-${timestamp}.png`;

      // Estimate file size for 1792x1024 PNG (typically 500KB-3MB, we'll use 1.5MB as estimate)
      const estimatedFileSize = 1.5 * 1024 * 1024; // 1.5MB

      const graphicId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: gridStartX, y: graphicY },
        dimensions: { width: GRAPHIC_WIDTH, height: GRAPHIC_HEIGHT }, // Display as 1024x500
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        naturalWidth: 1792, // Original size from DALL-E
        naturalHeight: 1024,
        fileName: fileName,
        fileSize: estimatedFileSize,
        mimeType: 'image/png',
        storageType: 'storage',
        storagePath: uploadResult.storagePath,
        name: `Feature - ${input.appName}`,
        userId: this.context.userId,
        parentId: groupId, // Add to group
      });

      logger.info('Feature graphic created successfully', { id: graphicId });

      // Step 9: Create text label (SECOND - higher z-index than graphic)
      currentStep = 'create_label';
      logger.info('Step 9: Creating text label');

      const labelText = `Google Play Feature Graphic (1024x500) - ${input.appName}`;

      const labelId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'text',
        position: { x: gridStartX, y: labelY },
        dimensions: { width: GRAPHIC_WIDTH, height: LABEL_HEIGHT },
        appearance: { fill: '#000000' },
        text: labelText,
        fontSize: 24,
        fontFamily: 'Inter',
        name: `Feature Graphic Label - ${input.appName}`,
        userId: this.context.userId,
        parentId: groupId, // Add to group
      });

      logger.info('Text label created successfully', { id: labelId });

      // Step 10: Create info box (LAST - highest z-index, appears at front)
      currentStep = 'create_info_box';
      logger.info('Step 10: Creating info box with requirements and tips');

      const infoBoxId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'text',
        position: { x: gridStartX, y: infoBoxY },
        dimensions: { width: GRAPHIC_WIDTH, height: INFO_BOX_HEIGHT },
        appearance: {
          fill: '#333333',
          stroke: '#e5e7eb',
          strokeWidth: 1,
        },
        text: infoText,
        fontSize: 14,
        fontFamily: 'Inter',
        name: 'Feature Graphic Guidelines',
        userId: this.context.userId,
        parentId: groupId, // Add to group
      });

      logger.info('Info box created successfully', { id: infoBoxId });

      const duration = Date.now() - startTime;

      currentStep = 'completed';
      logger.info('Feature graphic generation completed successfully', {
        groupId,
        infoBoxId,
        labelId,
        graphicId,
        duration: `${duration}ms`,
        finalStep: currentStep,
      });

      // Step 11: Return success result
      return {
        success: true,
        message: `Created Google Play feature graphic (1024x500) for "${input.appName}" with info box and label (grouped)`,
        objectsCreated: [groupId, graphicId, labelId, infoBoxId], // Group first, then children in z-order
        data: {
          groupId,
          infoBoxId,
          labelId,
          graphicId,
          imageUrl: uploadResult.publicUrl,
          storagePath: uploadResult.storagePath,
          revisedPrompt: imageResult.revisedPrompt,
          appName: input.appName,
          duration: duration,
        },
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';

      logger.error('Feature graphic generation failed with unexpected error', {
        currentStep,
        errorName,
        error: errorMessage,
        stack: errorStack,
        input,
        userId: this.context.userId,
        canvasId: this.context.canvasId,
        duration: `${duration}ms`,
      });

      return {
        success: false,
        error: `${errorMessage} (failed at: ${currentStep})`,
        message: `Failed to generate feature graphic during ${currentStep.replace(/_/g, ' ')}: ${errorMessage}`,
      };
    }
  }
}
