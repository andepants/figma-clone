/**
 * Generate App Icon Tool
 *
 * AI tool for generating professional app icons for iOS and Android.
 * Creates TWO distinct design styles (Glassmorphism & Minimalist) with 1 icon each:
 * - 1024x1024 (Glassmorphism)
 * - 1024x1024 (Minimalist)
 *
 * Also creates:
 * - Text labels above each icon showing style
 *
 * Total canvas objects created: 4 (2 labels + 2 images)
 *
 * Design styles:
 * - Glassmorphism: Modern, vibrant gradients, 3D depth, high contrast
 * - Minimalist: Clean, simple geometric shapes, flat design (inspired by Apple, Airbnb, Figma)
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
 * 1. Validates and enhances user prompt with TWO different design styles
 * 2. Generates TWO 1024x1024 icons using DALL-E 3 (Glassmorphism + Minimalist)
 * 3. Uploads both images to Firebase Storage for permanent access
 * 4. Creates 9 canvas objects in a grid layout:
 *    - Info box with design guidelines and requirements
 *    - 4 text labels (iOS/Android for each style)
 *    - 4 image objects (iOS 1024, Android 512 for each style)
 * 5. Places everything in viewport-aware grid with proper spacing
 *
 * Design principles applied:
 * - Glassmorphism: Modern, vibrant gradients, 3D depth (22% higher conversion)
 * - Minimalist: Clean, simple, flat design (inspired by Apple, Airbnb, Figma)
 * - No text in icons (per Apple HIG - illegible at small sizes)
 * - Edge-to-edge fill (NO dark backgrounds around icons)
 * - High contrast for accessibility
 */
export class GenerateAppIconTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'generateAppIcon',
      // Tool description for LLM (helps it understand when to use this tool)
      'Generate professional app icons for iOS and Android from a text description. ' +
      'Creates TWO distinct design styles (Glassmorphism & Minimalist) with 1 icon each (2 total): ' +
      '1024x1024 for each style. Also creates text labels for each icon. Total: 4 canvas objects. ' +
      'Automatic prompt enhancement following Apple Human Interface Guidelines and ' +
      '2025 design trends. Icons fill entire image edge-to-edge with NO dark backgrounds or rounded corners. ' +
      'Use this when user asks to create app icons, generate app icons, ' +
      'make app icons, or design app icons. Everything is placed in a viewport-aware grid layout.',
      GenerateAppIconSchema,
      context
    );
  }

  /**
   * Execute app icon generation
   *
   * Workflow:
   * 1. Validate user prompt
   * 2. Enhance prompt with TWO different design styles (Glassmorphism + Minimalist)
   * 3. Generate glassmorphism 1024x1024 image with DALL-E 3
   * 4. Generate minimalist 1024x1024 image with DALL-E 3
   * 5. Upload both images to Firebase Storage
   * 6. Calculate grid layout placement (viewport-aware)
   * 7. Create 2 text labels (one for each style)
   * 8. Create 2 icon images (1024x1024 each)
   * 9. Return success with all 4 object IDs
   *
   * @param input - Validated input from Zod schema
   * @returns Tool result with success status and all created object IDs
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

      // Step 2: Enhance prompts with two different design styles
      currentStep = 'prompt_enhancement';
      logger.info('Step 2: Enhancing prompts with two different design styles');

      const glassmorphismPrompt = enhancePrompt(input.description, 'icon', 'glassmorphism');
      const minimalistPrompt = enhancePrompt(input.description, 'icon', 'minimalist');

      logger.info('Prompts enhanced successfully', {
        original: input.description,
        glassmorphismLength: glassmorphismPrompt.length,
        minimalistLength: minimalistPrompt.length,
      });

      // Step 3: Generate glassmorphism style image with DALL-E 3
      currentStep = 'image_generation_glassmorphism';
      logger.info('Step 3: Generating glassmorphism style image with DALL-E 3', {
        promptLength: glassmorphismPrompt.length,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      const glassmorphismImageResult = await generateImage({
        prompt: glassmorphismPrompt,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      logger.info('Glassmorphism image generation completed', {
        success: glassmorphismImageResult.success,
        hasImageUrl: !!glassmorphismImageResult.imageUrl,
        hasError: !!glassmorphismImageResult.error,
        errorCode: glassmorphismImageResult.errorCode,
      });

      if (!glassmorphismImageResult.success || !glassmorphismImageResult.imageUrl) {
        logger.error('Glassmorphism image generation failed', {
          error: glassmorphismImageResult.error,
          errorCode: glassmorphismImageResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: glassmorphismImageResult.error || 'Failed to generate glassmorphism image',
          message: `Failed to generate glassmorphism app icon: ${glassmorphismImageResult.error}`,
        };
      }

      logger.info('Glassmorphism image generated successfully', {
        url: glassmorphismImageResult.imageUrl.substring(0, 50) + '...',
        urlLength: glassmorphismImageResult.imageUrl.length,
      });

      // Step 3b: Generate minimalist style image with DALL-E 3
      currentStep = 'image_generation_minimalist';
      logger.info('Step 3b: Generating minimalist style image with DALL-E 3', {
        promptLength: minimalistPrompt.length,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      const minimalistImageResult = await generateImage({
        prompt: minimalistPrompt,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      logger.info('Minimalist image generation completed', {
        success: minimalistImageResult.success,
        hasImageUrl: !!minimalistImageResult.imageUrl,
        hasError: !!minimalistImageResult.error,
        errorCode: minimalistImageResult.errorCode,
      });

      if (!minimalistImageResult.success || !minimalistImageResult.imageUrl) {
        logger.error('Minimalist image generation failed', {
          error: minimalistImageResult.error,
          errorCode: minimalistImageResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: minimalistImageResult.error || 'Failed to generate minimalist image',
          message: `Failed to generate minimalist app icon: ${minimalistImageResult.error}`,
        };
      }

      logger.info('Minimalist image generated successfully', {
        url: minimalistImageResult.imageUrl.substring(0, 50) + '...',
        urlLength: minimalistImageResult.imageUrl.length,
      });

      // Step 4: Upload glassmorphism image to Firebase Storage
      currentStep = 'storage_upload_glassmorphism';
      logger.info('Step 4: Uploading glassmorphism image to Firebase Storage', {
        sourceUrl: glassmorphismImageResult.imageUrl.substring(0, 80) + '...',
        projectId: this.context.canvasId,
        type: 'icon',
      });

      const glassmorphismUploadResult = await uploadImageFromUrl(
        glassmorphismImageResult.imageUrl,
        this.context.canvasId,
        'icon'
      );

      logger.info('Glassmorphism storage upload completed', {
        success: glassmorphismUploadResult.success,
        hasPublicUrl: !!glassmorphismUploadResult.publicUrl,
        hasStoragePath: !!glassmorphismUploadResult.storagePath,
      });

      if (!glassmorphismUploadResult.success || !glassmorphismUploadResult.publicUrl) {
        logger.error('Glassmorphism storage upload failed', {
          error: glassmorphismUploadResult.error,
          errorCode: glassmorphismUploadResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: glassmorphismUploadResult.error || 'Failed to save glassmorphism image',
          message: `Failed to save glassmorphism app icon: ${glassmorphismUploadResult.error}`,
        };
      }

      logger.info('Glassmorphism image uploaded successfully', {
        publicUrl: glassmorphismUploadResult.publicUrl.substring(0, 80) + '...',
        storagePath: glassmorphismUploadResult.storagePath,
      });

      // Step 4b: Upload minimalist image to Firebase Storage
      currentStep = 'storage_upload_minimalist';
      logger.info('Step 4b: Uploading minimalist image to Firebase Storage', {
        sourceUrl: minimalistImageResult.imageUrl.substring(0, 80) + '...',
        projectId: this.context.canvasId,
        type: 'icon',
      });

      const minimalistUploadResult = await uploadImageFromUrl(
        minimalistImageResult.imageUrl,
        this.context.canvasId,
        'icon'
      );

      logger.info('Minimalist storage upload completed', {
        success: minimalistUploadResult.success,
        hasPublicUrl: !!minimalistUploadResult.publicUrl,
        hasStoragePath: !!minimalistUploadResult.storagePath,
      });

      if (!minimalistUploadResult.success || !minimalistUploadResult.publicUrl) {
        logger.error('Minimalist storage upload failed', {
          error: minimalistUploadResult.error,
          errorCode: minimalistUploadResult.errorCode,
          currentStep,
        });

        return {
          success: false,
          error: minimalistUploadResult.error || 'Failed to save minimalist image',
          message: `Failed to save minimalist app icon: ${minimalistUploadResult.error}`,
        };
      }

      logger.info('Minimalist image uploaded successfully', {
        publicUrl: minimalistUploadResult.publicUrl.substring(0, 80) + '...',
        storagePath: minimalistUploadResult.storagePath,
      });

      // Step 5: Calculate canvas placement for grid layout (viewport-aware)
      currentStep = 'position_calculation';
      logger.info('Step 5: Calculating grid layout placement', {
        hasViewportBounds: !!this.context.viewportBounds,
        canvasSize: this.context.canvasSize,
        objectCount: this.context.currentObjects?.length || 0,
      });

      // Grid layout dimensions:
      // Row spacing: 60px between rows
      // Label height: 40px, gap between label and image: 10px
      // Icon size: 1024x1024 (one per style)
      // Total width: 1024px
      // Total height: 40 (label) + 10 (gap) + 1024 (row1) + 60 (gap) + 40 (label) + 10 (gap) + 1024 (row2) = 2208px

      const GRID_WIDTH = 1024;
      const GRID_HEIGHT = 2208;
      const LABEL_HEIGHT = 40;
      const LABEL_TO_IMAGE_GAP = 10;
      const ROW_GAP = 60;

      let gridStartX: number;
      let gridStartY: number;

      if (this.context.viewportBounds) {
        // Use viewport center if available (user's current view)
        gridStartX = this.context.viewportBounds.centerX - GRID_WIDTH / 2;
        gridStartY = this.context.viewportBounds.centerY - GRID_HEIGHT / 2;

        logger.info('Using viewport-aware placement', {
          viewportCenter: {
            x: this.context.viewportBounds.centerX,
            y: this.context.viewportBounds.centerY,
          },
          gridTopLeft: { x: gridStartX, y: gridStartY },
        });
      } else {
        // Fallback to canvas center
        gridStartX = this.context.canvasSize.width / 2 - GRID_WIDTH / 2;
        gridStartY = this.context.canvasSize.height / 2 - GRID_HEIGHT / 2;

        logger.info('Using canvas center placement', {
          canvasSize: this.context.canvasSize,
          gridTopLeft: { x: gridStartX, y: gridStartY },
        });
      }

      // Check for overlap and adjust if needed
      logger.info('Checking for object overlap', {
        proposedPosition: { x: gridStartX, y: gridStartY },
        dimensions: { width: GRID_WIDTH, height: GRID_HEIGHT },
      });

      const adjustedPosition = findEmptySpace(
        gridStartX,
        gridStartY,
        GRID_WIDTH,
        GRID_HEIGHT,
        this.context.currentObjects
      );

      if (adjustedPosition.x !== gridStartX || adjustedPosition.y !== gridStartY) {
        logger.info('Adjusted grid position to avoid overlap', {
          original: { x: gridStartX, y: gridStartY },
          adjusted: adjustedPosition,
        });
        gridStartX = adjustedPosition.x;
        gridStartY = adjustedPosition.y;
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

      // Calculate all positions for grid layout (single column)
      const row1LabelY = gridStartY;
      const row1ImageY = row1LabelY + LABEL_HEIGHT + LABEL_TO_IMAGE_GAP;
      const row2LabelY = row1ImageY + 1024 + ROW_GAP;
      const row2ImageY = row2LabelY + LABEL_HEIGHT + LABEL_TO_IMAGE_GAP;

      const iconX = gridStartX;

      // Step 7: Create text labels for both icons
      currentStep = 'create_labels';
      logger.info('Step 7: Creating text labels for both icons');

      const row1LabelId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'text',
        position: { x: iconX, y: row1LabelY },
        dimensions: { width: 1024, height: LABEL_HEIGHT },
        appearance: { fill: '#000000' },
        text: `1024x1024 - Glassmorphism Style`,
        fontSize: 24,
        fontFamily: 'Inter',
        name: 'Glassmorphism Label',
        userId: this.context.userId,
      });

      const row2LabelId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'text',
        position: { x: iconX, y: row2LabelY },
        dimensions: { width: 1024, height: LABEL_HEIGHT },
        appearance: { fill: '#000000' },
        text: `1024x1024 - Minimalist Style`,
        fontSize: 24,
        fontFamily: 'Inter',
        name: 'Minimalist Label',
        userId: this.context.userId,
      });

      logger.info('Text labels created successfully');

      // Step 8: Create 2 icon images in vertical layout
      currentStep = 'create_icon_images';
      logger.info('Step 8: Creating 2 icon images in vertical layout');

      // Row 1: Glassmorphism style icon
      const row1IconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: iconX, y: row1ImageY },
        dimensions: { width: 1024, height: 1024 },
        appearance: {},
        imageUrl: glassmorphismUploadResult.publicUrl,
        naturalWidth: 1024,
        naturalHeight: 1024,
        fileName: `Glassmorphism-${fileName}`,
        fileSize: estimatedFileSize,
        mimeType: 'image/png',
        storageType: 'storage',
        storagePath: glassmorphismUploadResult.storagePath,
        name: `${capitalizedKeyword} (Glassmorphism)`,
        userId: this.context.userId,
      });

      // Row 2: Minimalist style icon
      const row2IconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: iconX, y: row2ImageY },
        dimensions: { width: 1024, height: 1024 },
        appearance: {},
        imageUrl: minimalistUploadResult.publicUrl,
        naturalWidth: 1024,
        naturalHeight: 1024,
        fileName: `Minimalist-${fileName}`,
        fileSize: estimatedFileSize,
        mimeType: 'image/png',
        storageType: 'storage',
        storagePath: minimalistUploadResult.storagePath,
        name: `${capitalizedKeyword} (Minimalist)`,
        userId: this.context.userId,
      });

      logger.info('All icon images created successfully');

      const duration = Date.now() - startTime;

      currentStep = 'completed';
      logger.info('App icon generation completed successfully', {
        row1IconId,
        row2IconId,
        duration: `${duration}ms`,
        finalStep: currentStep,
      });

      // Step 9: Return success result
      return {
        success: true,
        message: `Created 2 app icon styles (Glassmorphism & Minimalist) at 1024x1024 for "${capitalizedKeyword}"`,
        objectsCreated: [
          row1LabelId,
          row1IconId,
          row2LabelId,
          row2IconId,
        ],
        data: {
          glassmorphismImageUrl: glassmorphismUploadResult.publicUrl,
          minimalistImageUrl: minimalistUploadResult.publicUrl,
          glassmorphismStoragePath: glassmorphismUploadResult.storagePath,
          minimalistStoragePath: minimalistUploadResult.storagePath,
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
