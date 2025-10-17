/**
 * Image Generation Service
 *
 * Handles all AI image generation using OpenAI DALL-E 3.
 * Provides prompt enhancement based on 2025 app store design best practices.
 *
 * @see https://platform.openai.com/docs/guides/images
 * @see functions/src/ai/tools/generateAppIcon.ts (usage example)
 */

import OpenAI from 'openai';
import * as logger from 'firebase-functions/logger';

/**
 * Options for image generation request
 * @interface GenerateImageOptions
 */
interface GenerateImageOptions {
  /** User's description (will be enhanced) */
  prompt: string;
  /** Type of image (affects prompt enhancement) */
  type: 'icon' | 'feature';
  /** Output size - must match DALL-E 3 supported sizes */
  size: '1024x1024' | '1024x1792' | '1792x1024';
  /** Image quality (hd recommended for icons) */
  quality?: 'standard' | 'hd';
  /** Style preference (vivid = more saturated colors) */
  style?: 'vivid' | 'natural';
}

/**
 * Result from image generation request
 * @interface GenerateImageResult
 */
interface GenerateImageResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Temporary URL (expires in 1 hour) - download immediately */
  imageUrl?: string;
  /** Base64 encoded image data (alternative to URL) */
  base64?: string;
  /** DALL-E's revised/enhanced prompt (useful for debugging) */
  revisedPrompt?: string;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'api_error' | 'rate_limit' | 'content_policy' | 'invalid_prompt' | 'network_error';
}

/**
 * Generate image using DALL-E 3
 *
 * Makes request to OpenAI API with enhanced prompt and returns result.
 * Handles errors gracefully and provides detailed error information.
 *
 * @param options - Generation options
 * @returns Promise with generation result
 *
 * @example
 * const result = await generateImage({
 *   prompt: 'Professional app icon: coffee cup',
 *   type: 'icon',
 *   size: '1024x1024',
 *   quality: 'hd',
 *   style: 'vivid'
 * });
 *
 * if (result.success) {
 *   console.log('Image URL:', result.imageUrl);
 * }
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    // Validate API key exists
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY not configured');
      return {
        success: false,
        error: 'OpenAI API key not configured',
        errorCode: 'api_error',
      };
    }

    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30s timeout
      maxRetries: 2, // Retry failed requests twice
    });

    logger.info('Generating image with DALL-E 3', {
      type: options.type,
      size: options.size,
      quality: options.quality,
      promptLength: options.prompt.length,
      promptPreview: options.prompt.substring(0, 150) + '...',
    });

    // Make API request
    logger.info('Calling OpenAI API', {
      model: 'dall-e-3',
      requestParams: {
        n: 1,
        size: options.size,
        quality: options.quality || 'hd',
        style: options.style || 'vivid',
        response_format: 'url',
      },
    });

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: options.prompt,
      n: 1, // DALL-E 3 only supports n=1
      size: options.size,
      quality: options.quality || 'hd',
      style: options.style || 'vivid',
      response_format: 'url', // URL format (expires in 1 hour)
    });

    logger.info('OpenAI API response received', {
      hasData: !!response.data,
      dataLength: response.data?.length || 0,
      hasImageData: !!response.data?.[0],
      hasUrl: !!response.data?.[0]?.url,
      hasRevisedPrompt: !!response.data?.[0]?.revised_prompt,
    });

    const imageData = response.data?.[0];
    const duration = Date.now() - startTime;

    if (!imageData || !imageData.url) {
      logger.error('No image data in response', {
        hasResponse: !!response,
        hasData: !!response.data,
        dataLength: response.data?.length,
        imageData,
      });
      return {
        success: false,
        error: 'No image generated',
        errorCode: 'api_error',
      };
    }

    logger.info('Image generated successfully', {
      duration: `${duration}ms`,
      url: imageData.url.substring(0, 50) + '...',
      urlLength: imageData.url.length,
      revisedPrompt: imageData.revised_prompt?.substring(0, 100),
      revisedPromptLength: imageData.revised_prompt?.length || 0,
    });

    return {
      success: true,
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorObj = error as {
      message?: string;
      type?: string;
      code?: string;
      status?: number;
      response?: { status?: number; data?: unknown };
      stack?: string;
    };

    // Log comprehensive error details
    logger.error('Image generation failed', {
      errorMessage: errorObj.message,
      errorType: errorObj.type,
      errorCode: errorObj.code,
      errorStatus: errorObj.status,
      responseStatus: errorObj.response?.status,
      responseData: errorObj.response?.data,
      stack: errorObj.stack,
      duration: `${duration}ms`,
      fullError: JSON.stringify(error, null, 2).substring(0, 500),
    });

    // Map OpenAI error codes to our error codes
    let errorCode: GenerateImageResult['errorCode'] = 'api_error';
    let errorMessage = 'Failed to generate image';

    if (errorObj.status === 429 || errorObj.response?.status === 429) {
      errorCode = 'rate_limit';
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (errorObj.code === 'content_policy_violation') {
      errorCode = 'content_policy';
      errorMessage = 'Image prompt violates content policy. Please try a different description.';
    } else if (errorObj.code === 'invalid_prompt') {
      errorCode = 'invalid_prompt';
      errorMessage = 'Invalid prompt. Please provide a clearer description.';
    } else if (errorObj.message?.includes('timeout') || errorObj.message?.includes('ECONNRESET')) {
      errorCode = 'network_error';
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (errorObj.message) {
      // Include actual error message for debugging
      errorMessage = `Failed to generate image: ${errorObj.message}`;
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Enhance user prompt with professional design principles
 *
 * Takes a simple user description and enhances it with 2025 app store
 * design best practices to ensure professional, high-quality output.
 *
 * Based on research:
 * - 2025 app icon trends (glassmorphism 2.0, vibrant gradients, 3D symbolism)
 * - Apple Human Interface Guidelines (simple, memorable, no text)
 * - Google Play feature graphic best practices (clear value prop, video-ready)
 * - DALL-E 3 prompting techniques (descriptive, technical specs)
 *
 * @param userPrompt - Simple user description (e.g., "coffee cup", "fitness app")
 * @param type - Type of image to generate
 * @returns Enhanced prompt optimized for DALL-E 3
 *
 * @example
 * enhancePrompt('coffee cup', 'icon')
 * // Returns: "Professional mobile app icon design: coffee cup. Style: modern minimalist..."
 *
 * enhancePrompt('fitness app', 'feature')
 * // Returns: "Professional Google Play Store feature graphic: fitness app..."
 */
export function enhancePrompt(userPrompt: string, type: 'icon' | 'feature'): string {
  // Sanitize user input (remove special chars that might confuse DALL-E)
  const sanitized = userPrompt.trim().replace(/[^\w\s-]/g, '');

  if (type === 'icon') {
    // App icon enhancement based on:
    // - Apple HIG: "App icons should be simple, recognizable, and memorable"
    // - 2025 trends: Glassmorphism 2.0 (22% higher conversion), vibrant gradients (28% better visibility)
    // - Technical: Square format, no text (illegible at small sizes), centered composition
    return `Professional mobile app icon design for iOS and Android: ${sanitized}.

Style requirements:
- Modern minimalist aesthetic with glassmorphism 2.0 effect (subtle depth, soft translucency)
- Vibrant gradient colors with high contrast for maximum visibility
- 3D symbolism with subtle shadows and highlights for tactile feel
- Bold, memorable, and instantly recognizable design
- Clean edges and smooth curves following Apple's "squircle" shape philosophy

Technical specifications:
- Perfectly centered composition with balanced visual weight
- NO text or letters (illegible at small sizes, against Apple HIG)
- Simple geometric shapes that scale well from 29px to 1024px
- Suitable for both iOS (rounded square) and Android (adaptive icon)
- Square format with no transparency
- Professional quality suitable for App Store and Google Play

Color guidance:
- Use vibrant, saturated colors from modern app design palettes
- Ensure high contrast between foreground and background
- Avoid pure black, white, or dark gray backgrounds (blends with store background)

Design philosophy:
- Follow Apple's principle of "simple but not simplistic"
- Create a unique visual identity that stands out in crowded app stores
- Design should be recognizable even at thumbnail size
- Should work well in both light and dark mode contexts`;
  } else {
    // Feature graphic enhancement based on:
    // - Google Play best practices: "Feature graphic occupies 1/3 of screen, huge impact on conversion"
    // - Phiture ASO analysis: Can drive 31% lift in conversion rates
    // - Video overlay consideration: Must remain readable with play button overlay
    // - 2025 ASO trends: Data-driven, tested designs outperform generic imagery
    return `Professional Google Play Store feature graphic (1024x500 landscape): ${sanitized}.

Purpose and placement:
- Primary marketing asset shown prominently in Google Play Store
- Serves as video cover image with play button overlay
- Appears in expanded search results and app collections
- User grants only 2-3 seconds of attention - must be immediately understandable

Visual design requirements:
- Clean, modern design that showcases app's value proposition clearly
- Vibrant, contrasting colors that pop on screen (avoid white, black, or dark gray backgrounds)
- Eye-catching visuals with strong focal point in center
- Professional quality with high attention to detail
- Suitable for video play button overlay (key elements visible around center)
- No text clutter - visuals should tell the story

Composition:
- Horizontal landscape format optimized for 1024x500 dimensions
- Key visual elements centered and clearly visible
- Safe margins on all sides (avoid elements near edges that may be cropped)
- Balanced composition with clear visual hierarchy
- Logo placement that's visible but not distracting

Technical specifications:
- High detail and professional rendering quality
- Vibrant, saturated colors for maximum impact
- No transparency (JPEG or 24-bit PNG)
- Optimized for display on various Android device screens
- Should work well when scaled for different placements

Marketing effectiveness:
- Design should instantly communicate app's core benefit
- Create emotional connection with target users
- Differentiate from competitors in same category
- Drive user to tap/watch video or read more about app

Best practices from 2025 ASO research:
- Test multiple variations for optimal conversion
- Keep design simple and focused on one key message
- Use imagery specific to your app (avoid generic stock photos)
- Ensure design works well in both featured placement and search results`;
  }
}

/**
 * Validate prompt length and content
 *
 * DALL-E 3 has a 4000 character limit for prompts.
 * Also checks for potentially problematic content.
 *
 * @param prompt - Prompt to validate
 * @returns Validation result with error message if invalid
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > 4000) {
    return { valid: false, error: 'Prompt too long (max 4000 characters)' };
  }

  // Check for potentially problematic content
  const prohibited = ['nude', 'nsfw', 'explicit', 'violence', 'gore'];
  const lowerPrompt = prompt.toLowerCase();
  for (const word of prohibited) {
    if (lowerPrompt.includes(word)) {
      return { valid: false, error: 'Prompt contains prohibited content' };
    }
  }

  return { valid: true };
}
