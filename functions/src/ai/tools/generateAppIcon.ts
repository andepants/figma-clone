/**
 * Generate App Icon Tool
 *
 * AI tool for generating professional app icons for iOS and Android.
 * Creates two canvas objects: iOS (1024x1024) and Android (512x512)
 * from a single generated image, properly sized and labeled.
 *
 * Follows Apple Human Interface Guidelines and Google Play design standards.
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/app-icons
 * @see https://developer.android.com/google-play/resources/icon-design-specifications
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
 * Zod schema for app icon generation parameters
 *
 * Schema descriptions are shown to the LLM to help it understand
 * what parameters to extract from natural language commands.
 */
const GenerateAppIconSchema = z.object({
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be less than 200 characters')
    .describe(
      'Description of the app icon to generate. Should be concise and focused. ' +
      'Examples: "a coffee cup", "a fitness tracker with heart icon", "a music note with gradient"'
    ),
});

/**
 * Tool for generating app icons with DALL-E 3
 *
 * This tool:
 * 1. Enhances user prompt with professional design principles
 * 2. Generates 1024x1024 icon using DALL-E 3
 * 3. Uploads to Firebase Storage for permanent access
 * 4. Creates two canvas objects (iOS 1024x1024, Android 512x512)
 * 5. Places icons in horizontal row with 100px spacing
 * 6. Labels with platform and keyword
 *
 * Design principles applied:
 * - Glassmorphism 2.0 for modern aesthetic (22% higher conversion)
 * - Vibrant gradients for visibility (28% better in search)
 * - No text (per Apple HIG - illegible at small sizes)
 * - Centered composition for balance
 * - High contrast for accessibility
 */
export class GenerateAppIconTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'generateAppIcon',
      // Tool description for LLM (helps it understand when to use this tool)
      'Generate professional app icons for iOS and Android from a text description. ' +
      'Creates two high-quality icons (iOS: 1024x1024, Android: 512x512) with ' +
      'automatic prompt enhancement following Apple Human Interface Guidelines and ' +
      '2025 design trends. Use this when user asks to create app icons, generate app icons, ' +
      'make app icons, or design app icons. The icons will be placed on the canvas ' +
      'side-by-side with proper labels.',
      GenerateAppIconSchema,
      context
    );
  }

  /**
   * Execute app icon generation
   *
   * Workflow:
   * 1. Validate and enhance prompt
   * 2. Generate 1024x1024 image with DALL-E 3
   * 3. Upload to Firebase Storage
   * 4. Calculate placement on canvas (viewport-aware)
   * 5. Create iOS icon (1024x1024)
   * 6. Create Android icon (512x512)
   * 7. Return success with object IDs
   *
   * @param input - Validated input from Zod schema
   * @returns Tool result with success status and created object IDs
   */
  async execute(input: z.infer<typeof GenerateAppIconSchema>): Promise<ToolResult> {
    const startTime = Date.now();
    let currentStep = 'initialization';

    try {
      logger.info('Starting app icon generation', {
        description: input.description,
        userId: this.context.userId,
        canvasId: this.context.canvasId,
        contextViewport: this.context.viewportBounds,
        contextCanvasSize: this.context.canvasSize,
        contextObjectCount: this.context.currentObjects?.length || 0,
      });

      // Step 1: Validate prompt
      currentStep = 'prompt_validation';
      logger.info('Step 1: Validating prompt', { description: input.description });

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
      currentStep = 'prompt_enhancement';
      logger.info('Step 2: Enhancing prompt with design best practices');

      const enhancedPrompt = enhancePrompt(input.description, 'icon');

      logger.info('Prompt enhanced successfully', {
        original: input.description,
        enhanced: enhancedPrompt.substring(0, 100) + '...',
        enhancedLength: enhancedPrompt.length,
      });

      // Step 3: Generate image with DALL-E 3
      currentStep = 'image_generation';
      logger.info('Step 3: Generating image with DALL-E 3', {
        promptLength: enhancedPrompt.length,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      const imageResult = await generateImage({
        prompt: enhancedPrompt,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd', // Use HD quality for icons
        style: 'vivid', // Vivid for more saturated, eye-catching colors
      });

      logger.info('Image generation completed', {
        success: imageResult.success,
        hasImageUrl: !!imageResult.imageUrl,
        hasError: !!imageResult.error,
        errorCode: imageResult.errorCode,
      });

      if (!imageResult.success || !imageResult.imageUrl) {
        logger.error('Image generation failed', {
          error: imageResult.error,
          errorCode: imageResult.errorCode,
          currentStep,
        });

        // Return user-friendly error message
        return {
          success: false,
          error: imageResult.error || 'Failed to generate image',
          message: `Failed to generate app icon: ${imageResult.error}`,
        };
      }

      logger.info('Image generated successfully', {
        url: imageResult.imageUrl.substring(0, 50) + '...',
        urlLength: imageResult.imageUrl.length,
        revisedPrompt: imageResult.revisedPrompt?.substring(0, 100),
        hasRevisedPrompt: !!imageResult.revisedPrompt,
      });

      // Step 4: Upload to Firebase Storage (OpenAI URLs expire in 1 hour)
      currentStep = 'storage_upload';
      logger.info('Step 4: Uploading image to Firebase Storage', {
        sourceUrl: imageResult.imageUrl.substring(0, 80) + '...',
        projectId: this.context.canvasId,
        type: 'icon',
      });

      const uploadResult = await uploadImageFromUrl(
        imageResult.imageUrl,
        this.context.canvasId,
        'icon'
      );

      logger.info('Storage upload completed', {
        success: uploadResult.success,
        hasPublicUrl: !!uploadResult.publicUrl,
        hasStoragePath: !!uploadResult.storagePath,
        hasError: !!uploadResult.error,
        errorCode: uploadResult.errorCode,
      });

      if (!uploadResult.success || !uploadResult.publicUrl) {
        logger.error('Storage upload failed', {
          error: uploadResult.error,
          errorCode: uploadResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: uploadResult.error || 'Failed to save image',
          message: `Failed to save app icon: ${uploadResult.error}`,
        };
      }

      logger.info('Image uploaded to storage successfully', {
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
        publicUrlLength: uploadResult.publicUrl.length,
        storagePath: uploadResult.storagePath,
      });

      // Step 5: Calculate canvas placement (viewport-aware)
      currentStep = 'position_calculation';
      logger.info('Step 5: Calculating canvas placement', {
        hasViewportBounds: !!this.context.viewportBounds,
        canvasSize: this.context.canvasSize,
        objectCount: this.context.currentObjects?.length || 0,
      });

      // Place icons in horizontal row: [iOS 1024x1024] [100px gap] [Android 512x512]
      // Total width: 1024 + 100 + 512 = 1636px
      // Total height: 1024px (iOS height, Android centered vertically)
      let startX: number;
      let startY: number;

      if (this.context.viewportBounds) {
        // Use viewport center if available (user's current view)
        startX = this.context.viewportBounds.centerX - 818; // Half of total width (1636/2)
        startY = this.context.viewportBounds.centerY - 512; // Half of height (1024/2)

        logger.info('Using viewport-aware placement', {
          viewportCenter: {
            x: this.context.viewportBounds.centerX,
            y: this.context.viewportBounds.centerY,
          },
          iconTopLeft: { x: startX, y: startY },
        });
      } else {
        // Fallback to canvas center
        startX = this.context.canvasSize.width / 2 - 818;
        startY = this.context.canvasSize.height / 2 - 512;

        logger.info('Using canvas center placement', {
          canvasSize: this.context.canvasSize,
          iconTopLeft: { x: startX, y: startY },
        });
      }

      // Check for overlap and adjust if needed
      logger.info('Checking for object overlap', {
        proposedPosition: { x: startX, y: startY },
        dimensions: { width: 1024, height: 1024 },
      });

      const iosPosition = findEmptySpace(
        startX,
        startY,
        1024,
        1024,
        this.context.currentObjects
      );

      if (iosPosition.x !== startX || iosPosition.y !== startY) {
        logger.info('Adjusted iOS icon position to avoid overlap', {
          original: { x: startX, y: startY },
          adjusted: iosPosition,
        });
        startX = iosPosition.x;
        startY = iosPosition.y;
      } else {
        logger.info('No position adjustment needed - no overlap detected');
      }

      // Step 6: Extract keyword for labels and prepare metadata (first 2 words, capitalized)
      currentStep = 'keyword_extraction';
      const words = input.description.trim().split(/\s+/).filter(w => w.length > 0);
      const keyword = words.slice(0, 2).join(' ').toLowerCase();
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);

      // Generate filename for metadata
      const timestamp = Date.now();
      const fileName = `${keyword.replace(/\s+/g, '-')}-icon-${timestamp}.png`;

      // Estimate file size for 1024x1024 PNG (typically 50-200KB, we'll use 100KB as estimate)
      const estimatedFileSize = 100 * 1024; // 100KB

      logger.info('Step 6: Extracted keyword and prepared metadata', {
        description: input.description,
        wordCount: words.length,
        keyword: capitalizedKeyword,
        fileName,
        estimatedFileSize,
      });

      // Step 7: Create iOS icon (1024x1024) on canvas
      currentStep = 'create_ios_icon';
      logger.info('Step 7: Creating iOS icon on canvas', {
        canvasId: this.context.canvasId,
        position: { x: startX, y: startY },
        dimensions: { width: 1024, height: 1024 },
        name: `iOS - ${capitalizedKeyword}`,
        imageUrl: uploadResult.publicUrl.substring(0, 80) + '...',
      });

      const iosIconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: startX, y: startY },
        dimensions: { width: 1024, height: 1024 },
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        naturalWidth: 1024,
        naturalHeight: 1024,
        fileName: `iOS-${fileName}`,
        fileSize: estimatedFileSize,
        mimeType: 'image/png',
        storageType: 'storage',
        storagePath: uploadResult.storagePath,
        name: `iOS - ${capitalizedKeyword}`,
        userId: this.context.userId,
      });

      logger.info('iOS icon created on canvas successfully', {
        id: iosIconId,
        idLength: iosIconId?.length || 0,
        position: { x: startX, y: startY },
        size: '1024x1024',
      });

      // Step 8: Create Android icon (512x512) on canvas
      currentStep = 'create_android_icon';
      // Position: right of iOS icon with 100px gap, centered vertically
      const androidX = startX + 1024 + 100; // iOS width + gap
      const androidY = startY + 256; // Center vertically: (1024 - 512) / 2

      logger.info('Step 8: Creating Android icon on canvas', {
        canvasId: this.context.canvasId,
        position: { x: androidX, y: androidY },
        dimensions: { width: 512, height: 512 },
        name: `Android - ${capitalizedKeyword}`,
        imageUrl: uploadResult.publicUrl.substring(0, 80) + '...',
      });

      const androidIconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: androidX, y: androidY },
        dimensions: { width: 512, height: 512 },
        appearance: {},
        imageUrl: uploadResult.publicUrl, // Same image, different size
        naturalWidth: 1024, // Original image is 1024x1024, we scale to 512 for display
        naturalHeight: 1024,
        fileName: `Android-${fileName}`,
        fileSize: estimatedFileSize,
        mimeType: 'image/png',
        storageType: 'storage',
        storagePath: uploadResult.storagePath,
        name: `Android - ${capitalizedKeyword}`,
        userId: this.context.userId,
      });

      logger.info('Android icon created on canvas successfully', {
        id: androidIconId,
        idLength: androidIconId?.length || 0,
        position: { x: androidX, y: androidY },
        size: '512x512',
      });

      const duration = Date.now() - startTime;

      currentStep = 'completed';
      logger.info('App icon generation completed successfully', {
        iosIconId,
        androidIconId,
        duration: `${duration}ms`,
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
        finalStep: currentStep,
      });

      // Step 9: Return success result
      return {
        success: true,
        message: `Created iOS (1024x1024) and Android (512x512) app icons for "${capitalizedKeyword}"`,
        objectsCreated: [iosIconId, androidIconId],
        data: {
          iosIconId,
          androidIconId,
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
      const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';

      logger.error('App icon generation failed with unexpected error', {
        currentStep, // Shows which step failed
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
        message: `Failed to generate app icon during ${currentStep.replace(/_/g, ' ')}: ${errorMessage}`,
      };
    }
  }
}
