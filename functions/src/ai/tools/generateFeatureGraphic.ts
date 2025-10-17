/**
 * Generate Feature Graphic Tool
 *
 * AI tool for generating professional Google Play Store feature graphics.
 * Creates a single 1792x1024 landscape canvas object from a text description.
 *
 * Follows Google Play design standards and ASO best practices.
 *
 * @see https://developer.android.com/distribute/best-practices/launch/feature-graphic
 * @see https://support.google.com/googleplay/android-developer/answer/9866151
 */

import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';
import { generateImage, enhancePrompt, validatePrompt } from '../../services/image-generation';
import { uploadImageFromUrl } from '../../services/storage-upload';
import { createCanvasObject } from '../../services/canvas-objects';
import { findEmptySpace } from '../utils/collision-detector';
import * as logger from 'firebase-functions/logger';

/**
 * Zod schema for feature graphic generation parameters
 *
 * Schema descriptions are shown to the LLM to help it understand
 * what parameters to extract from natural language commands.
 */
const GenerateFeatureGraphicSchema = z.object({
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be less than 200 characters')
    .describe(
      'Description of the feature graphic to generate. Should describe the app or its key feature. ' +
      'Examples: "fitness tracking app", "music streaming service with headphones", "photo editor interface"'
    ),
});

/**
 * Tool for generating feature graphics with DALL-E 3
 *
 * This tool:
 * 1. Enhances user prompt with professional design principles
 * 2. Generates 1792x1024 landscape graphic using DALL-E 3
 * 3. Uploads to Firebase Storage for permanent access
 * 4. Creates canvas object with proper dimensions
 * 5. Places graphic at viewport center or canvas center
 * 6. Labels with app name/keyword
 *
 * Design principles applied:
 * - Google Play ASO best practices (31% conversion lift potential)
 * - Video overlay ready (play button safe zone)
 * - Clear value proposition in 2-3 seconds
 * - Vibrant colors for maximum impact
 * - Professional quality for store listing
 */
export class GenerateFeatureGraphicTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'generateFeatureGraphic',
      // Tool description for LLM (helps it understand when to use this tool)
      'Generate professional Google Play Store feature graphic (1792x1024 landscape) from a text description. ' +
      'Creates a high-quality marketing asset with automatic prompt enhancement following ' +
      'Google Play design standards and 2025 ASO best practices. Use this when user asks to ' +
      'create feature graphic, generate Play Store graphic, make store banner, or design marketing asset. ' +
      'The graphic will be placed on the canvas with proper dimensions.',
      GenerateFeatureGraphicSchema,
      context
    );
  }

  /**
   * Execute feature graphic generation
   *
   * Workflow:
   * 1. Validate and enhance prompt
   * 2. Generate 1792x1024 image with DALL-E 3
   * 3. Upload to Firebase Storage
   * 4. Calculate placement on canvas (viewport-aware)
   * 5. Create feature graphic canvas object
   * 6. Return success with object ID
   *
   * @param input - Validated input from Zod schema
   * @returns Tool result with success status and created object ID
   */
  async execute(input: z.infer<typeof GenerateFeatureGraphicSchema>): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting feature graphic generation', {
        description: input.description,
        userId: this.context.userId,
        canvasId: this.context.canvasId,
      });

      // Step 1: Validate prompt
      const validation = validatePrompt(input.description);
      if (!validation.valid) {
        logger.warn('Invalid prompt', { error: validation.error, description: input.description });
        return {
          success: false,
          error: validation.error,
          message: 'Invalid description: ' + validation.error,
        };
      }

      // Step 2: Enhance prompt with design best practices
      const enhancedPrompt = enhancePrompt(input.description, 'feature');

      logger.info('Prompt enhanced', {
        original: input.description,
        enhanced: enhancedPrompt.substring(0, 100) + '...',
      });

      // Step 3: Generate image with DALL-E 3
      const imageResult = await generateImage({
        prompt: enhancedPrompt,
        type: 'feature',
        size: '1792x1024',
        quality: 'hd', // Use HD quality for feature graphics
        style: 'vivid', // Vivid for more saturated, eye-catching colors
      });

      if (!imageResult.success || !imageResult.imageUrl) {
        logger.error('Image generation failed', {
          error: imageResult.error,
          errorCode: imageResult.errorCode,
        });

        // Return user-friendly error message
        return {
          success: false,
          error: imageResult.error || 'Failed to generate image',
          message: `Failed to generate feature graphic: ${imageResult.error}`,
        };
      }

      logger.info('Image generated', {
        url: imageResult.imageUrl.substring(0, 50) + '...',
        revisedPrompt: imageResult.revisedPrompt?.substring(0, 100),
      });

      // Step 4: Upload to Firebase Storage (OpenAI URLs expire in 1 hour)
      const uploadResult = await uploadImageFromUrl(
        imageResult.imageUrl,
        this.context.userId,
        'feature'
      );

      if (!uploadResult.success || !uploadResult.publicUrl) {
        logger.error('Storage upload failed', {
          error: uploadResult.error,
          errorCode: uploadResult.errorCode,
        });

        return {
          success: false,
          error: uploadResult.error || 'Failed to save image',
          message: `Failed to save feature graphic: ${uploadResult.error}`,
        };
      }

      logger.info('Image uploaded to storage', {
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
        storagePath: uploadResult.storagePath,
      });

      // Step 5: Calculate canvas placement (viewport-aware)
      // Feature graphic dimensions: 1792 x 1024
      let startX: number;
      let startY: number;

      if (this.context.viewportBounds) {
        // Use viewport center if available (user's current view)
        startX = this.context.viewportBounds.centerX - 896; // Half of width (1792/2)
        startY = this.context.viewportBounds.centerY - 512; // Half of height (1024/2)

        logger.info('Using viewport-aware placement', {
          viewportCenter: {
            x: this.context.viewportBounds.centerX,
            y: this.context.viewportBounds.centerY,
          },
          graphicTopLeft: { x: startX, y: startY },
        });
      } else {
        // Fallback to canvas center
        startX = this.context.canvasSize.width / 2 - 896;
        startY = this.context.canvasSize.height / 2 - 512;

        logger.info('Using canvas center placement', {
          canvasSize: this.context.canvasSize,
          graphicTopLeft: { x: startX, y: startY },
        });
      }

      // Check for overlap and adjust if needed
      const position = findEmptySpace(
        startX,
        startY,
        1792,
        1024,
        this.context.currentObjects
      );

      if (position.x !== startX || position.y !== startY) {
        logger.info('Adjusted feature graphic position to avoid overlap', {
          original: { x: startX, y: startY },
          adjusted: position,
        });
        startX = position.x;
        startY = position.y;
      }

      // Step 6: Extract keyword for label (first 3 words, capitalized)
      const words = input.description.trim().split(/\s+/).filter(w => w.length > 0);
      const keyword = words.slice(0, 3).join(' ').toLowerCase();
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);

      logger.info('Extracted keyword for label', {
        description: input.description,
        keyword: capitalizedKeyword,
      });

      // Step 7: Create feature graphic on canvas
      const graphicId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: startX, y: startY },
        dimensions: { width: 1792, height: 1024 },
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        name: `Feature - ${capitalizedKeyword}`,
        userId: this.context.userId,
      });

      logger.info('Feature graphic created on canvas', {
        id: graphicId,
        position: { x: startX, y: startY },
        size: '1792x1024',
      });

      const duration = Date.now() - startTime;

      logger.info('Feature graphic generation completed successfully', {
        graphicId,
        duration: `${duration}ms`,
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
      });

      // Step 8: Return success result
      return {
        success: true,
        message: `Created Google Play feature graphic (1792x1024) for "${capitalizedKeyword}"`,
        objectsCreated: [graphicId],
        data: {
          graphicId,
          imageUrl: uploadResult.publicUrl,
          storagePath: uploadResult.storagePath,
          revisedPrompt: imageResult.revisedPrompt,
          keyword: capitalizedKeyword,
          duration: duration,
        },
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Feature graphic generation failed with unexpected error', {
        error: errorMessage,
        stack: errorStack,
        input,
        duration: `${duration}ms`,
      });

      return {
        success: false,
        error: errorMessage,
        message: 'Failed to generate feature graphic due to unexpected error',
      };
    }
  }
}
