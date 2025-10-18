# Implementation Plan: AI Image Generation for App Icons & Feature Graphics

**Created:** 2025-10-17
**Updated:** 2025-10-17
**Estimated Time:** 24-30 hours
**Status:** Not Started

## Overview

Add AI-powered image generation capabilities to create professional app icons and feature graphics using OpenAI's DALL-E 3. Users can generate icons via `/icon` and `/feature` commands with automatic prompt enhancement, intelligent sizing, Firebase Storage integration, and canvas placement.

## Dependencies

- OpenAI API key (already configured)
- Firebase Storage (already configured)
- Existing AI agent system (LangChain + LangGraph)
- Existing canvas image upload system
- shadcn/ui components (for autocomplete UI)

## Success Metrics

- [ ] Users can generate app icons with `/icon [description]` command
- [ ] Users can generate feature graphics with `/feature [description]` command
- [ ] Icons automatically sized: iOS (1024x1024) + Android (512x512)
- [ ] Feature graphics sized: Android (1792x1024 landscape)
- [ ] Images stored in Firebase Storage with public URLs
- [ ] Images placed on canvas with proper labels and spacing
- [ ] Command suggestions appear when typing `/`
- [ ] Simple prompts enhanced with professional design principles
- [ ] All interactions follow Apple Human Interface Guidelines
- [ ] Robust error handling for all edge cases
- [ ] Performance <20s per generation
- [ ] Cost tracking and rate limiting

---

## Phase 0: Research & Planning ✅

### Decisions Made

**Image Generation:**
- Model: OpenAI DALL-E 3 (higher quality, $0.04/image for 1024x1024, $0.08/image for 1792x1024)
- Format: PNG via URL (expires after 1 hour, must download immediately)
- Storage: Firebase Storage (permanent, user-scoped under `ai-generated/{userId}/`)

**Icon Sizes:**
- iOS: 1024x1024 (App Store requirement per Apple guidelines)
- Android: 512x512 (scaled from iOS for consistency)
- Feature Graphic: 1792x1024 (Google Play landscape format)

**UX Pattern:**
- Command syntax: `/icon a coffee cup` (no quotes needed)
- Inline autocomplete in AI chat input (following VS Code command palette pattern)
- Command suggestions when typing `/`
- Canvas placement: horizontal row, 100px spacing, viewport-aware
- Following Apple HIG for interaction patterns

**Prompt Enhancement Strategy:**
Based on 2025 app store best practices research:
- **Icons**: Glassmorphism 2.0, dynamic minimalism, vibrant gradients, 3D symbolism, no text, centered
- **Feature Graphics**: Clear value prop, contrasting colors, no text clutter, video overlay ready, centered composition
- **General**: Simple, bold, high contrast, memorable, professional quality

---

## Phase 1: Backend - Image Generation Tools (10-12 hours)

### 1.1: OpenAI Integration & Prompt Enhancement (4-5 hours)

#### 1.1.0 Research OpenAI DALL-E 3 API (30 min)
- [x] **Action:** Use Context7 MCP to get latest OpenAI documentation
  - **Why:** Ensure we're using the latest API patterns and best practices
  - **Steps:**
    1. Use `mcp__context7__resolve-library-id` with `libraryName: "openai"`
    2. Use `mcp__context7__get-library-docs` with library ID `/openai/openai-node`
    3. Focus on topics: "image generation", "DALL-E 3", "error handling"
    4. Review response format options (URL vs base64)
    5. Review size constraints and quality parameters
    6. Review rate limiting and error codes
    7. Document findings in implementation notes
  - **Success Criteria:**
    - [x] Understand all DALL-E 3 parameters
    - [x] Know error codes and handling strategies
    - [x] Understand rate limits and quotas
  - **Edge Cases:**
    - ⚠️ API changes: Always check latest docs before implementation
    - ⚠️ Deprecated parameters: Note any warnings in docs

#### 1.1.1 Create Image Generation Service - Part A: Setup (1 hour)
- [x] **Action:** Create `functions/src/services/image-generation.ts` with base structure
  - **Why:** Centralized service for all image generation operations
  - **Files Modified:**
    - Create: `functions/src/services/image-generation.ts`
  - **Implementation Steps:**
    1. Create file with JSDoc header explaining service purpose
    2. Import OpenAI from 'openai' package
    3. Import Firebase Functions logger
    4. Define TypeScript interfaces for all inputs/outputs
    5. Add detailed JSDoc comments for each interface
    6. Validate OpenAI package is installed in functions/package.json
    7. If not installed, run `cd functions && npm install openai@latest`
  - **Implementation Details:**
```typescript
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
```
  - **Success Criteria:**
    - [x] File created with proper structure
    - [x] All interfaces documented with JSDoc
    - [x] OpenAI package installed and imported
    - [x] TypeScript types compile without errors
  - **Tests:**
    1. Run `cd functions && npm run build` to verify TypeScript compiles
    2. Verify no import errors
  - **Edge Cases:**
    - ⚠️ OpenAI package not installed: Install via npm
    - ⚠️ TypeScript version mismatch: Check package.json compatibility
    - ⚠️ Import path issues: Verify relative paths

#### 1.1.2 Create Image Generation Service - Part B: generateImage Function (1.5 hours)
- [x] **Action:** Implement `generateImage` function with comprehensive error handling
  - **Why:** Core function for calling DALL-E 3 API
  - **Implementation Steps:**
    1. Use Context7 to review latest OpenAI image generation examples
    2. Implement function with try-catch wrapper
    3. Validate API key exists before making request
    4. Add timeout handling (30s max)
    5. Parse OpenAI error codes and map to our error codes
    6. Log all requests and responses for debugging
    7. Handle network failures gracefully
    8. Return structured result object
  - **Implementation Details:**
```typescript
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
    });

    // Make API request
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: options.prompt,
      n: 1, // DALL-E 3 only supports n=1
      size: options.size,
      quality: options.quality || 'hd',
      style: options.style || 'vivid',
      response_format: 'url', // URL format (expires in 1 hour)
    });

    const imageData = response.data[0];
    const duration = Date.now() - startTime;

    if (!imageData || !imageData.url) {
      logger.error('No image data in response');
      return {
        success: false,
        error: 'No image generated',
        errorCode: 'api_error',
      };
    }

    logger.info('Image generated successfully', {
      duration: `${duration}ms`,
      url: imageData.url.substring(0, 50) + '...',
      revisedPrompt: imageData.revised_prompt?.substring(0, 100),
    });

    return {
      success: true,
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Image generation failed', {
      error: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
      duration: `${duration}ms`,
    });

    // Map OpenAI error codes to our error codes
    let errorCode: GenerateImageResult['errorCode'] = 'api_error';
    let errorMessage = 'Failed to generate image';

    if (error.status === 429) {
      errorCode = 'rate_limit';
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error.code === 'content_policy_violation') {
      errorCode = 'content_policy';
      errorMessage = 'Image prompt violates content policy. Please try a different description.';
    } else if (error.code === 'invalid_prompt') {
      errorCode = 'invalid_prompt';
      errorMessage = 'Invalid prompt. Please provide a clearer description.';
    } else if (error.message?.includes('timeout') || error.message?.includes('ECONNRESET')) {
      errorCode = 'network_error';
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}
```
  - **Success Criteria:**
    - [x] Function handles successful API calls
    - [x] All OpenAI error types handled and mapped
    - [x] Timeout configured (30s)
    - [x] Retry logic in place (2 retries)
    - [x] Comprehensive logging for debugging
    - [x] Returns structured error codes
  - **Tests:**
    1. Mock successful API call, verify result structure
    2. Mock rate limit error (429), verify error code mapping
    3. Mock content policy violation, verify friendly error message
    4. Mock network timeout, verify timeout handling
    5. Test with missing API key, verify error
  - **Edge Cases:**
    - ⚠️ API key invalid: Return api_error with clear message
    - ⚠️ Rate limit (429): Return rate_limit code, suggest retry timing
    - ⚠️ Content policy violation: Return content_policy, ask for different description
    - ⚠️ Network timeout: Return network_error, suggest checking connection
    - ⚠️ Malformed response: Check for null/undefined before accessing properties
    - ⚠️ Empty URL in response: Validate imageData.url exists
    - ⚠️ Very long prompts: OpenAI has 4000 char limit, validate in caller

#### 1.1.3 Create Image Generation Service - Part C: enhancePrompt Function (1.5 hours)
- [x] **Action:** Implement prompt enhancement with 2025 design best practices
  - **Why:** Ensure high-quality, professional outputs from simple user prompts
  - **Research Steps:**
    1. Review web search results from Phase 0 on app icon design trends
    2. Review web search results on Google Play feature graphic best practices
    3. Use Context7 to get DALL-E 3 prompting best practices
    4. Review Apple Human Interface Guidelines for icon design
    5. Document specific design principles to include in prompts
  - **Implementation Steps:**
    1. Define enhancement templates for icons and feature graphics
    2. Include 2025 design trends (glassmorphism, gradients, etc.)
    3. Include technical requirements (centered, no text, etc.)
    4. Include quality indicators (professional, high detail, etc.)
    5. Test with various user inputs to ensure good results
    6. Add comments explaining each enhancement choice
  - **Implementation Details:**
```typescript
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
```
  - **Success Criteria:**
    - [x] Icon prompts include glassmorphism, gradients, 3D symbolism
    - [x] Icon prompts explicitly forbid text
    - [x] Icon prompts reference Apple HIG principles
    - [x] Feature graphic prompts include video overlay consideration
    - [x] Feature graphic prompts mention Google Play best practices
    - [x] Both prompts include technical specifications
    - [x] Prompt validation prevents issues before API call
  - **Tests:**
    1. Test `enhancePrompt('coffee', 'icon')` returns comprehensive prompt
    2. Verify icon prompt includes "no text" restriction
    3. Verify icon prompt mentions Apple HIG concepts
    4. Test `enhancePrompt('fitness app', 'feature')` returns landscape-optimized prompt
    5. Verify feature graphic prompt mentions video overlay
    6. Test `validatePrompt` with empty string, returns error
    7. Test `validatePrompt` with 4001 char string, returns error
    8. Test `validatePrompt` with prohibited words, returns error
  - **Edge Cases:**
    - ⚠️ Very short prompts (e.g., "a"): Still enhanced, but may produce generic results
    - ⚠️ Special characters in prompt: Sanitized before enhancement
    - ⚠️ Prompt with prohibited words: Caught by validation
    - ⚠️ Enhanced prompt >4000 chars: Validate after enhancement, truncate if needed

#### 1.1.4 Create Firebase Storage Upload Service - Setup (1 hour)
- [x] **Action:** Create `functions/src/services/storage-upload.ts` with base structure
  - **Why:** Persistent storage for generated images (OpenAI URLs expire after 1 hour)
  - **Research Steps:**
    1. Use Context7 to get Firebase Admin SDK Storage documentation
    2. Review existing Firebase Storage usage in codebase
    3. Review Firebase Storage security rules for public access
    4. Document storage path structure for images
  - **Files Modified:**
    - Create: `functions/src/services/storage-upload.ts`
  - **Implementation Steps:**
    1. Create file with JSDoc header
    2. Import Firebase Admin Storage
    3. Import node-fetch for downloading images
    4. Import uuid for unique filenames
    5. Define TypeScript interfaces
    6. Verify firebase-admin is installed
    7. Verify node-fetch is installed (for downloading image from OpenAI URL)
  - **Implementation Details:**
```typescript
/**
 * Firebase Storage Upload Service
 *
 * Handles downloading images from OpenAI (which expire after 1 hour)
 * and uploading them to Firebase Storage for permanent storage.
 *
 * Storage structure:
 * ai-generated/{userId}/icon/{timestamp}-{uuid}.png
 * ai-generated/{userId}/feature/{timestamp}-{uuid}.png
 *
 * @see https://firebase.google.com/docs/storage
 * @see functions/src/ai/tools/generateAppIcon.ts (usage example)
 */

import { getStorage } from 'firebase-admin/storage';
import fetch from 'node-fetch';
import * as logger from 'firebase-functions/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result from storage upload operation
 * @interface UploadImageResult
 */
interface UploadImageResult {
  /** Whether upload succeeded */
  success: boolean;
  /** Public URL for accessing image */
  publicUrl?: string;
  /** Storage path (for deletion/management) */
  storagePath?: string;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'download_failed' | 'upload_failed' | 'quota_exceeded' | 'invalid_url';
}
```
  - **Success Criteria:**
    - [x] File created with proper structure
    - [x] All interfaces documented
    - [x] firebase-admin imported correctly
    - [x] node-fetch imported correctly
    - [x] uuid imported correctly
  - **Tests:**
    1. Run `cd functions && npm run build` to verify TypeScript compiles
    2. Verify all imports resolve correctly
  - **Edge Cases:**
    - ⚠️ node-fetch not installed: Install via `npm install node-fetch@2`
    - ⚠️ uuid not installed: Install via `npm install uuid`
    - ⚠️ firebase-admin version mismatch: Check compatibility

#### 1.1.5 Create Firebase Storage Upload Service - Implementation (1.5 hours)
- [x] **Action:** Implement `uploadImageFromUrl` function with retry logic
  - **Why:** Download from OpenAI and upload to permanent storage
  - **Implementation Steps:**
    1. Implement download from OpenAI URL with timeout
    2. Generate unique, descriptive filename
    3. Upload buffer to Firebase Storage
    4. Set proper metadata (content type, generation info)
    5. Make file publicly accessible
    6. Return public URL
    7. Add retry logic for transient failures
    8. Add comprehensive error handling
    9. Log all operations for debugging
  - **Implementation Details:**
```typescript
/**
 * Download image from URL and upload to Firebase Storage
 *
 * Downloads image from OpenAI's temporary URL (expires in 1 hour)
 * and uploads to Firebase Storage for permanent public access.
 *
 * Includes retry logic for transient network failures.
 *
 * @param imageUrl - OpenAI image URL (temporary, expires in 1 hour)
 * @param userId - User ID (for organizing storage)
 * @param type - Image type (for organizing storage and metadata)
 * @returns Upload result with public URL
 *
 * @example
 * const result = await uploadImageFromUrl(
 *   'https://oaidalleapiprodscus.blob.core.windows.net/...',
 *   'user123',
 *   'icon'
 * );
 *
 * if (result.success) {
 *   console.log('Public URL:', result.publicUrl);
 * }
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  userId: string,
  type: 'icon' | 'feature',
  retryCount = 0
): Promise<UploadImageResult> {
  const startTime = Date.now();
  const MAX_RETRIES = 2;

  try {
    // Validate inputs
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return {
        success: false,
        error: 'Invalid image URL',
        errorCode: 'invalid_url',
      };
    }

    if (!userId || userId.trim().length === 0) {
      return {
        success: false,
        error: 'User ID required',
        errorCode: 'upload_failed',
      };
    }

    logger.info('Downloading image from OpenAI', {
      url: imageUrl.substring(0, 50) + '...',
      userId,
      type,
      retry: retryCount,
    });

    // Download image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.buffer();

    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded empty file');
    }

    logger.info('Image downloaded', {
      sizeBytes: buffer.length,
      sizeKB: Math.round(buffer.length / 1024),
    });

    // Generate unique filename with timestamp and UUID
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const filename = `ai-generated/${userId}/${type}/${timestamp}-${uniqueId}.png`;

    logger.info('Uploading to Firebase Storage', {
      filename,
      userId,
      type,
    });

    // Get storage bucket
    const bucket = getStorage().bucket();
    const file = bucket.file(filename);

    // Upload with metadata
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        metadata: {
          generatedBy: 'dalle-3',
          userId,
          type,
          timestamp: timestamp.toString(),
          generatedAt: new Date(timestamp).toISOString(),
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Construct public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    const duration = Date.now() - startTime;

    logger.info('Image uploaded successfully', {
      filename,
      publicUrl: publicUrl.substring(0, 80) + '...',
      duration: `${duration}ms`,
      sizeKB: Math.round(buffer.length / 1024),
    });

    return {
      success: true,
      publicUrl,
      storagePath: filename,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Storage upload failed', {
      error: error.message,
      userId,
      type,
      retry: retryCount,
      duration: `${duration}ms`,
    });

    // Retry logic for transient errors
    const isTransientError =
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('timeout') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('socket hang up');

    if (isTransientError && retryCount < MAX_RETRIES) {
      logger.info('Retrying upload', { attempt: retryCount + 1 });
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return uploadImageFromUrl(imageUrl, userId, type, retryCount + 1);
    }

    // Determine error code
    let errorCode: UploadImageResult['errorCode'] = 'upload_failed';
    let errorMessage = 'Failed to upload image to storage';

    if (error.message?.includes('quota') || error.message?.includes('QUOTA')) {
      errorCode = 'quota_exceeded';
      errorMessage = 'Storage quota exceeded. Please contact support.';
    } else if (error.message?.includes('Download failed')) {
      errorCode = 'download_failed';
      errorMessage = 'Failed to download image from OpenAI. Please try again.';
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorCode = 'download_failed';
      errorMessage = 'Image download timed out. Please try again.';
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Delete image from Firebase Storage
 *
 * Useful for cleanup or regeneration workflows.
 *
 * @param storagePath - Storage path from upload result
 * @returns Success status
 */
export async function deleteImage(storagePath: string): Promise<boolean> {
  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);
    await file.delete();

    logger.info('Image deleted from storage', { storagePath });
    return true;
  } catch (error: any) {
    logger.error('Failed to delete image', { error: error.message, storagePath });
    return false;
  }
}
```
  - **Success Criteria:**
    - [x] Downloads image from URL with 30s timeout
    - [x] Uploads to correct storage path structure
    - [x] Sets proper metadata (content type, cache control, custom metadata)
    - [x] Makes file publicly accessible
    - [x] Returns valid public URL
    - [x] Retries transient failures (2 retries max)
    - [x] Handles all error cases gracefully
    - [x] Logs all operations
  - **Tests:**
    1. Mock successful download and upload, verify result
    2. Mock download timeout, verify retry logic
    3. Mock network error, verify retries and eventual failure
    4. Mock quota exceeded error, verify error code
    5. Test with invalid URL, verify error
    6. Test with empty buffer, verify error
    7. Test deleteImage with valid path, verify deletion
  - **Edge Cases:**
    - ⚠️ Download timeout: Retry with exponential backoff
    - ⚠️ Empty buffer: Return download_failed error
    - ⚠️ Storage quota exceeded: Return quota_exceeded with support message
    - ⚠️ Invalid URL format: Validate before attempting download
    - ⚠️ Network transient errors: Retry up to 2 times
    - ⚠️ File already exists: Firebase Storage overwrites by default (OK)
    - ⚠️ Very large files (>10MB): OpenAI unlikely to return this, but timeout handles it

### 1.2: AI Tools for Image Generation (4-5 hours)

#### 1.2.0 Review Existing Tool Patterns (30 min)
- [x] **Action:** Study existing AI tool implementations for consistency
  - **Why:** Maintain consistent patterns across all tools
  - **Files to Review:**
    - Read: `functions/src/ai/tools/base.ts`
    - Read: `functions/src/ai/tools/createRectangle.ts`
    - Read: `functions/src/ai/tools/types.ts`
  - **Key Patterns to Note:**
    1. All tools extend CanvasTool base class
    2. Zod schemas for input validation
    3. ToolResult return type
    4. Error handling pattern
    5. Logging conventions
    6. Canvas object creation pattern
  - **Success Criteria:**
    - [x] Understand base class usage
    - [x] Know ToolResult structure
    - [x] Understand error handling pattern
  - **Edge Cases:**
    - ⚠️ Circular dependencies: Import only from base.ts and types.ts

#### 1.2.1 Create GenerateAppIconTool - Part A: Schema & Constructor (1 hour)
- [x] **Action:** Create `functions/src/ai/tools/generateAppIcon.ts` with Zod schema
  - **Why:** AI tool for generating app icons via natural language
  - **Files Modified:**
    - Create: `functions/src/ai/tools/generateAppIcon.ts`
  - **Implementation Steps:**
    1. Create file with comprehensive JSDoc header
    2. Import dependencies (zod, base classes, services)
    3. Define Zod schema with detailed descriptions for LLM
    4. Create class extending CanvasTool
    5. Implement constructor with tool name and description
    6. Add comments explaining Apple HIG compliance
  - **Implementation Details:**
```typescript
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

  // execute method will be implemented in next step
}
```
  - **Success Criteria:**
    - [x] File created with comprehensive documentation
    - [x] Zod schema defined with helpful descriptions
    - [x] Tool description clearly explains when to use it
    - [x] Constructor properly calls super()
    - [x] All imports resolve correctly
  - **Tests:**
    1. Verify file compiles without TypeScript errors
    2. Verify schema can parse valid input: `{ description: "coffee cup" }`
    3. Verify schema rejects too-short input: `{ description: "a" }`
    4. Verify schema rejects too-long input (>200 chars)
  - **Edge Cases:**
    - ⚠️ Empty description: Caught by Zod .min(3)
    - ⚠️ Very long description: Caught by Zod .max(200)
    - ⚠️ Special characters: Sanitized by enhancePrompt

#### 1.2.2 Create GenerateAppIconTool - Part B: Execute Method (2 hours)
- [x] **Action:** Implement execute method with full workflow
  - **Why:** Core logic for icon generation and canvas placement
  - **Implementation Steps:**
    1. Add detailed JSDoc for execute method
    2. Validate description using validatePrompt
    3. Enhance prompt with icon best practices
    4. Call generateImage service
    5. Handle generation errors gracefully
    6. Upload image to Firebase Storage
    7. Handle upload errors gracefully
    8. Calculate canvas placement (viewport-aware)
    9. Handle potential overlap using collision detection
    10. Extract keyword for labels (first 2 words)
    11. Create iOS icon object (1024x1024)
    12. Create Android icon object (512x512, offset +1124px right, centered vertically)
    13. Log all operations
    14. Return ToolResult with both object IDs
  - **Implementation Details:**
```typescript
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

    try {
      logger.info('Starting app icon generation', {
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
      const enhancedPrompt = enhancePrompt(input.description, 'icon');

      logger.info('Prompt enhanced', {
        original: input.description,
        enhanced: enhancedPrompt.substring(0, 100) + '...',
      });

      // Step 3: Generate image with DALL-E 3
      const imageResult = await generateImage({
        prompt: enhancedPrompt,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd', // Use HD quality for icons
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
          message: `Failed to generate app icon: ${imageResult.error}`,
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
        'icon'
      );

      if (!uploadResult.success || !uploadResult.publicUrl) {
        logger.error('Storage upload failed', {
          error: uploadResult.error,
          errorCode: uploadResult.errorCode,
        });

        return {
          success: false,
          error: uploadResult.error || 'Failed to save image',
          message: `Failed to save app icon: ${uploadResult.error}`,
        };
      }

      logger.info('Image uploaded to storage', {
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
        storagePath: uploadResult.storagePath,
      });

      // Step 5: Calculate canvas placement (viewport-aware)
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
      }

      // Step 6: Extract keyword for labels (first 2 words, capitalized)
      const words = input.description.trim().split(/\s+/).filter(w => w.length > 0);
      const keyword = words.slice(0, 2).join(' ').toLowerCase();
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);

      logger.info('Extracted keyword for labels', {
        description: input.description,
        keyword: capitalizedKeyword,
      });

      // Step 7: Create iOS icon (1024x1024) on canvas
      const iosIconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: startX, y: startY },
        dimensions: { width: 1024, height: 1024 },
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        name: `iOS - ${capitalizedKeyword}`,
        userId: this.context.userId,
      });

      logger.info('iOS icon created on canvas', {
        id: iosIconId,
        position: { x: startX, y: startY },
        size: '1024x1024',
      });

      // Step 8: Create Android icon (512x512) on canvas
      // Position: right of iOS icon with 100px gap, centered vertically
      const androidX = startX + 1024 + 100; // iOS width + gap
      const androidY = startY + 256; // Center vertically: (1024 - 512) / 2

      const androidIconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: androidX, y: androidY },
        dimensions: { width: 512, height: 512 },
        appearance: {},
        imageUrl: uploadResult.publicUrl, // Same image, different size
        name: `Android - ${capitalizedKeyword}`,
        userId: this.context.userId,
      });

      logger.info('Android icon created on canvas', {
        id: androidIconId,
        position: { x: androidX, y: androidY },
        size: '512x512',
      });

      const duration = Date.now() - startTime;

      logger.info('App icon generation completed successfully', {
        iosIconId,
        androidIconId,
        duration: `${duration}ms`,
        publicUrl: uploadResult.publicUrl.substring(0, 80) + '...',
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
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('App icon generation failed with unexpected error', {
        error: error.message,
        stack: error.stack,
        input,
        duration: `${duration}ms`,
      });

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        message: 'Failed to generate app icon due to unexpected error',
      };
    }
  }
}
```
  - **Success Criteria:**
    - [x] Prompt validation before generation
    - [x] Prompt enhancement applied
    - [x] Image generation called with correct parameters
    - [x] Storage upload handles expired URLs correctly
    - [x] Viewport-aware placement calculated correctly
    - [x] Collision detection prevents overlap
    - [x] iOS icon created at correct position and size
    - [x] Android icon offset correctly (right + 100px, vertically centered)
    - [x] Both icons use same image URL
    - [x] Labels include platform and keyword
    - [x] All operations logged for debugging
    - [x] All errors handled gracefully with user-friendly messages
    - [x] Duration tracked and logged
  - **Tests:**
    1. Mock successful flow end-to-end, verify both icons created
    2. Mock invalid prompt, verify validation catches it
    3. Mock generation failure, verify error handled
    4. Mock upload failure, verify error handled
    5. Mock collision detection, verify position adjusted
    6. Test keyword extraction with 1 word, 2 words, 3+ words
    7. Test with viewport bounds, verify viewport-aware placement
    8. Test without viewport bounds, verify canvas center fallback
  - **Edge Cases:**
    - ⚠️ Invalid prompt: Caught by validatePrompt before API call
    - ⚠️ Generation fails: Return error with friendly message
    - ⚠️ Upload fails: Return error suggesting retry
    - ⚠️ Canvas overlap: Use findEmptySpace to adjust position
    - ⚠️ Very long description: Truncated to 200 chars by schema
    - ⚠️ Single word description: Keyword will be single word (OK)
    - ⚠️ Description with special chars: Sanitized by enhancePrompt
    - ⚠️ Viewport bounds missing: Fallback to canvas center
    - ⚠️ Canvas objects array empty: No collision, use calculated position

#### 1.2.3 Create GenerateFeatureGraphicTool (Similar to 1.2.1-1.2.2, 2-3 hours)
- [x] **Action:** Create `functions/src/ai/tools/generateFeatureGraphic.ts` following same pattern
  - **Why:** Generate landscape feature graphics for Google Play Store
  - **Implementation:** Similar to GenerateAppIconTool but:
    - Single image output (1792x1024 landscape)
    - Different prompt enhancement (video overlay, clear value prop)
    - Single canvas object instead of two
    - Label: "Feature - [keyword]"
  - **Success Criteria:**
    - [x] Tool generates 1792x1024 landscape image
    - [x] Prompt enhanced with Google Play best practices
    - [x] Single canvas object created
    - [x] Viewport-aware placement
    - [x] All error handling in place

#### 1.2.4 Register Tools in Index (15 min)
- [x] **Action:** Update `functions/src/ai/tools/index.ts` to register new tools
  - **Why:** Make tools available to LangChain agent
  - **Implementation Steps:**
    1. Import GenerateAppIconTool and GenerateFeatureGraphicTool
    2. Add to tools array in getTools function
    3. Verify no circular dependencies
    4. Deploy functions and test
  - **Success Criteria:**
    - [x] Both tools registered
    - [x] Functions deploy successfully
    - [x] Tools callable from agent
    - [x] No TypeScript errors

---
## Phase 2: Frontend - Command Autocomplete (5-6 hours)

### 2.1: Command Detection & Autocomplete UI (3-4 hours)

#### 2.1.0 Research React Patterns for Autocomplete (30 min)
- [x] **Action:** Review best practices for autocomplete components in React
  - **Why:** Ensure we follow industry-standard patterns for keyboard navigation and accessibility
  - **Research Steps:**
    1. Use Context7 to get React documentation on controlled components
    2. Review shadcn/ui command component patterns for autocomplete UX
    3. Review Apple HIG for command palette interaction patterns
    4. Study VS Code command palette behavior (reference implementation)
    5. Document keyboard navigation requirements (ArrowUp, ArrowDown, Tab, Enter, Escape)
    6. Document accessibility requirements (ARIA labels, roles, live regions)
  - **Key Patterns to Document:**
    - Controlled input with React state
    - Keyboard event handling without preventing typing
    - Focus management for dropdown
    - Positioning strategy (absolute vs portal)
    - Click-outside detection for closing
  - **Success Criteria:**
    - [x] Understand React controlled component pattern
    - [x] Know accessibility requirements for autocomplete
    - [x] Document keyboard shortcuts to implement
    - [x] Identify positioning strategy
  - **Edge Cases:**
    - ⚠️ Focus trap: Ensure user can exit autocomplete with Escape
    - ⚠️ Mobile considerations: Touch vs keyboard interaction
    - ⚠️ Screen readers: Need ARIA labels and announcements

#### 2.1.1 Create Command Parser Utility (1 hour)
- [x] **Action:** Create `src/features/ai-agent/utils/commandParser.ts`
  - **Why:** Parse and detect `/icon` and `/feature` commands with fuzzy matching
  - **Files Modified:**
    - Create: `src/features/ai-agent/utils/commandParser.ts`
  - **Implementation Steps:**
    1. Create file with JSDoc header
    2. Define AI_COMMANDS constant with all available commands
    3. Implement hasCommandPrefix for quick detection
    4. Implement getCommandSuggestions with fuzzy matching
    5. Implement parseCommand to extract command and description
    6. Add comprehensive JSDoc for each function
    7. Export all functions and constants
  - **Implementation Details:**
```typescript
/**
 * Command Parser Utility
 *
 * Parses AI agent commands (e.g., /icon, /feature) and provides
 * autocomplete suggestions as user types. Supports fuzzy matching
 * for better UX (e.g., "/ic" matches "/icon").
 *
 * Command syntax: /command description
 * Example: /icon a coffee cup
 *
 * @see src/features/ai-agent/components/ChatInput.tsx (usage)
 * @see src/features/ai-agent/components/CommandAutocomplete.tsx (display)
 */

/**
 * Available AI commands
 * Each command includes the trigger, description, and example usage
 */
export const AI_COMMANDS = [
  {
    command: '/icon',
    description: 'Generate iOS & Android app icons',
    example: '/icon a coffee cup',
    category: 'Image Generation',
  },
  {
    command: '/feature',
    description: 'Generate Android feature graphic',
    example: '/feature fitness app with running theme',
    category: 'Image Generation',
  },
] as const;

/**
 * Type for command object
 */
export type AICommand = typeof AI_COMMANDS[number];

/**
 * Check if input starts with command prefix
 *
 * Quick check to determine if autocomplete should be shown.
 * Used to avoid unnecessary filtering when user isn't typing a command.
 *
 * @param input - Current input value
 * @returns true if input starts with "/"
 *
 * @example
 * hasCommandPrefix('/icon') // true
 * hasCommandPrefix('create a square') // false
 * hasCommandPrefix(' /icon') // false (whitespace before /)
 */
export function hasCommandPrefix(input: string): boolean {
  return input.trim().startsWith('/');
}

/**
 * Get command suggestions based on current input
 *
 * Supports fuzzy matching: "/ic" will match "/icon"
 * Returns empty array if no match or if command already complete
 *
 * @param input - Current input value
 * @returns Array of matching commands, empty if no matches
 *
 * @example
 * getCommandSuggestions('/') // Returns all commands
 * getCommandSuggestions('/ic') // Returns [/icon]
 * getCommandSuggestions('/icon') // Returns [/icon]
 * getCommandSuggestions('/icon coffee') // Returns [] (command complete)
 */
export function getCommandSuggestions(input: string): AICommand[] {
  if (!hasCommandPrefix(input)) {
    return [];
  }

  const trimmed = input.trim().toLowerCase();

  // If input has space, command is complete (user is typing description)
  if (trimmed.includes(' ')) {
    return [];
  }

  // Match commands that start with the input
  return AI_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().startsWith(trimmed)
  );
}

/**
 * Parse command and description from input
 *
 * Extracts the command (e.g., "/icon") and description (e.g., "coffee cup")
 * from user input. Validates that command exists in AI_COMMANDS.
 *
 * @param input - Complete user input
 * @returns Object with command and description, or null if invalid
 *
 * @example
 * parseCommand('/icon coffee cup')
 * // Returns: { command: '/icon', description: 'coffee cup' }
 *
 * parseCommand('/invalid test')
 * // Returns: null (command not recognized)
 *
 * parseCommand('/icon')
 * // Returns: null (no description provided)
 */
export function parseCommand(input: string): {
  command: string;
  description: string;
  commandObj: AICommand;
} | null {
  const trimmed = input.trim();

  // Must start with /
  if (!hasCommandPrefix(trimmed)) {
    return null;
  }

  // Split on first space
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    // No space found, no description
    return null;
  }

  const command = trimmed.substring(0, spaceIndex).toLowerCase();
  const description = trimmed.substring(spaceIndex + 1).trim();

  // Validate command exists
  const commandObj = AI_COMMANDS.find(cmd => cmd.command === command);

  if (!commandObj) {
    return null;
  }

  // Validate description not empty
  if (!description || description.length === 0) {
    return null;
  }

  return {
    command,
    description,
    commandObj,
  };
}

/**
 * Get command by exact match
 *
 * Helper to retrieve full command object by command string.
 * Useful for displaying help or examples.
 *
 * @param command - Command string (e.g., "/icon")
 * @returns Command object or undefined
 */
export function getCommand(command: string): AICommand | undefined {
  return AI_COMMANDS.find(cmd => cmd.command === command);
}
```
  - **Success Criteria:**
    - [x] `hasCommandPrefix('/icon')` returns `true`
    - [x] `hasCommandPrefix('create')` returns `false`
    - [x] `getCommandSuggestions('/')` returns all commands
    - [x] `getCommandSuggestions('/ic')` returns `/icon` only
    - [x] `getCommandSuggestions('/icon coffee')` returns `[]` (command complete)
    - [x] `parseCommand('/icon coffee')` returns `{ command: '/icon', description: 'coffee' }`
    - [x] `parseCommand('/icon')` returns `null` (no description)
    - [x] `parseCommand('/invalid test')` returns `null` (unknown command)
  - **Tests:**
    1. Test `hasCommandPrefix` with various inputs (leading space, no slash, etc.)
    2. Test `getCommandSuggestions` with partial matches
    3. Test `getCommandSuggestions` with complete command + description
    4. Test `parseCommand` with valid command and description
    5. Test `parseCommand` with missing description
    6. Test `parseCommand` with unknown command
    7. Test `parseCommand` with special characters in description
  - **Edge Cases:**
    - ⚠️ Leading/trailing whitespace: Always trim input
    - ⚠️ Mixed case: Convert to lowercase for matching
    - ⚠️ Multiple spaces between command and description: trim() handles this
    - ⚠️ Special characters in description: Allowed, sanitization happens in backend
    - ⚠️ Very long description: Allow any length, backend will validate
    - ⚠️ Empty description: Return null, require at least 1 character

#### 2.1.2 Create Command Autocomplete Component (1.5 hours)
- [x] **Action:** Create `src/features/ai-agent/components/CommandAutocomplete.tsx`
  - **Why:** Display command suggestions with keyboard navigation and click selection
  - **Files Modified:**
    - Create: `src/features/ai-agent/components/CommandAutocomplete.tsx`
  - **Research Steps:**
    1. Review shadcn/ui command component for styling inspiration
    2. Study Apple HIG for autocomplete list styling
    3. Document ARIA attributes needed for accessibility
  - **Implementation Steps:**
    1. Create functional component with TypeScript props
    2. Implement suggestion list with hover and selected states
    3. Add click handlers for mouse selection
    4. Style with Tailwind following Canvas Icons design system
    5. Add ARIA attributes for screen readers
    6. Implement smooth transitions
    7. Handle empty state (shouldn't render if no suggestions)
  - **Implementation Details:**
```typescript
/**
 * Command Autocomplete Component
 *
 * Displays autocomplete suggestions when user types "/" in AI input.
 * Supports both mouse and keyboard navigation. Positioned absolutely
 * above the input field.
 *
 * Follows Apple HIG for visual design and interaction patterns.
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/macos/menus/menu-anatomy/
 */

import { cn } from '@/lib/utils';
import type { AICommand } from '../utils/commandParser';

interface CommandAutocompleteProps {
  /** Array of command suggestions to display */
  suggestions: AICommand[];
  /** Index of currently selected suggestion (for keyboard navigation) */
  selectedIndex: number;
  /** Callback when suggestion is clicked or selected */
  onSelect: (command: string) => void;
  /** Optional className for positioning/styling */
  className?: string;
}

/**
 * Command autocomplete dropdown
 *
 * Shows when user types "/" in AI input. Renders nothing if no suggestions.
 * Positioned absolutely above input with bottom-full.
 *
 * Keyboard navigation:
 * - ArrowUp/ArrowDown: Navigate suggestions
 * - Tab/Enter: Select highlighted suggestion
 * - Escape: Close (handled by parent)
 *
 * Accessibility:
 * - role="listbox" for dropdown
 * - role="option" for each suggestion
 * - aria-selected for keyboard selection
 * - aria-activedescendant on input (managed by parent)
 */
export function CommandAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
  className,
}: CommandAutocompleteProps) {
  // Don't render if no suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      role="listbox"
      className={cn(
        // Positioning
        'absolute bottom-full left-0 right-0 mb-2',
        // Visual style
        'bg-white border border-gray-200 rounded-lg shadow-lg',
        // Layout
        'overflow-hidden',
        // Animation
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {suggestions.map((suggestion, index) => {
        const isSelected = selectedIndex === index;

        return (
          <button
            key={suggestion.command}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(suggestion.command)}
            className={cn(
              // Layout
              'w-full px-3 py-2 text-left',
              // Spacing
              'space-y-0.5',
              // Transitions
              'transition-colors duration-150',
              // Hover state (matches shadcn/ui command)
              'hover:bg-gray-50',
              // Selected state (keyboard navigation)
              isSelected && 'bg-blue-50 hover:bg-blue-50',
              // Focus visible (for keyboard users)
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'
            )}
          >
            {/* Command name */}
            <div
              className={cn(
                'font-medium text-sm',
                isSelected ? 'text-blue-900' : 'text-gray-900'
              )}
            >
              {suggestion.command}
            </div>

            {/* Description */}
            <div className="text-xs text-gray-500">
              {suggestion.description}
            </div>

            {/* Example usage */}
            <div className="text-xs text-gray-400 font-mono mt-1">
              {suggestion.example}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```
  - **Success Criteria:**
    - [x] Component renders suggestion list
    - [x] Empty suggestions array renders nothing (null)
    - [x] Selected suggestion highlighted with blue background
    - [x] Hover state shows gray background
    - [x] Click on suggestion calls onSelect callback
    - [x] Smooth fade-in animation when appearing
    - [x] ARIA attributes present for accessibility
    - [x] Follows Canvas Icons design system (gray-50 hover, blue-50 selected)
  - **Tests:**
    1. Render with empty suggestions, verify null rendered
    2. Render with 2 suggestions, verify both displayed
    3. Render with selectedIndex=1, verify correct item highlighted
    4. Click on suggestion, verify onSelect called with correct command
    5. Hover over item, verify hover state applied
    6. Check ARIA attributes with accessibility tools
  - **Edge Cases:**
    - ⚠️ No suggestions: Return null, don't render empty div
    - ⚠️ Very long descriptions: Text wraps gracefully with space-y-0.5
    - ⚠️ Mobile viewport: Full width (left-0 right-0), proper touch targets (py-2)
    - ⚠️ Keyboard navigation: Selected state takes precedence over hover
    - ⚠️ Multiple rapid selections: Click handler debounced by React's batching

#### 2.1.3 Update ChatInput with Autocomplete Integration (1.5-2 hours)
- [x] **Action:** Update `src/features/ai-agent/components/ChatInput.tsx`
  - **Why:** Integrate autocomplete into existing input with keyboard navigation
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatInput.tsx`
  - **Research Steps:**
    1. Review current ChatInput implementation
    2. Study keyboard event handling in React
    3. Document key codes to handle (ArrowUp, ArrowDown, Tab, Enter, Escape)
    4. Review focus management patterns
  - **Implementation Steps:**
    1. Import commandParser utilities and CommandAutocomplete
    2. Add state for suggestions and selectedIndex
    3. Add useEffect to update suggestions when input changes
    4. Implement handleKeyDown for keyboard navigation
    5. Add Tab handler for autocomplete completion
    6. Add ArrowUp/ArrowDown handlers for navigation
    7. Add Escape handler to close autocomplete
    8. Preserve existing Enter handler for submission
    9. Add handleSelectSuggestion for click completion
    10. Add ARIA attributes to textarea for screen readers
  - **Implementation Details:**
```typescript
/**
 * Chat Input Component (Updated)
 *
 * AI agent chat input with command autocomplete support.
 * Detects "/" commands and shows suggestions with keyboard navigation.
 *
 * Keyboard shortcuts:
 * - /: Trigger autocomplete
 * - ArrowDown: Navigate to next suggestion
 * - ArrowUp: Navigate to previous suggestion
 * - Tab: Complete selected suggestion
 * - Enter: Submit (without Shift) or newline (with Shift)
 * - Escape: Close autocomplete
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIAgent } from '../hooks/useAIAgent';
import {
  getCommandSuggestions,
  parseCommand,
  hasCommandPrefix
} from '../utils/commandParser';
import { CommandAutocomplete } from './CommandAutocomplete';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof getCommandSuggestions>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendCommand, isProcessing } = useAIAgent();

  /**
   * Update suggestions whenever input changes
   *
   * Resets selectedIndex to 0 when suggestions change to always
   * highlight first suggestion.
   */
  useEffect(() => {
    const newSuggestions = getCommandSuggestions(input);
    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [input]);

  /**
   * Handle keyboard navigation and submission
   *
   * Intercepts:
   * - ArrowDown: Next suggestion
   * - ArrowUp: Previous suggestion
   * - Tab: Complete selected suggestion
   * - Enter: Submit (unless Shift held)
   * - Escape: Close autocomplete
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const hasSuggestions = suggestions.length > 0;

    // Handle autocomplete navigation
    if (hasSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor movement
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault(); // Prevent focus loss
        const selected = suggestions[selectedIndex];
        setInput(selected.command + ' ');
        setSuggestions([]);

        // Focus textarea after completion
        textareaRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        setSelectedIndex(0);
        return;
      }
    }

    // Handle submission (Enter without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [suggestions, selectedIndex]);

  /**
   * Handle suggestion click selection
   *
   * Completes the command and appends a space so user can
   * immediately start typing description.
   */
  const handleSelectSuggestion = useCallback((command: string) => {
    setInput(command + ' ');
    setSuggestions([]);
    setSelectedIndex(0);

    // Focus textarea after selection
    textareaRef.current?.focus();
  }, []);

  /**
   * Handle form submission
   *
   * Validates input, sends command, and resets form.
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isProcessing) {
      return;
    }

    // Check if this is a command
    if (hasCommandPrefix(trimmed)) {
      const parsed = parseCommand(trimmed);

      if (!parsed) {
        // Invalid command, show error in UI
        // (this would be handled by parent component showing error toast)
        console.error('Invalid command format');
        return;
      }

      // Send command with description
      sendCommand(parsed.command, parsed.description);
    } else {
      // Regular message
      sendCommand(trimmed);
    }

    // Reset form
    setInput('');
    setSuggestions([]);
    setSelectedIndex(0);
  }, [input, isProcessing, sendCommand]);

  /**
   * Handle input change
   *
   * Updates state and auto-resizes textarea.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea (optional enhancement)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 relative">
      {/* Autocomplete dropdown */}
      <CommandAutocomplete
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        onSelect={handleSelectSuggestion}
      />

      <div className="flex gap-2">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type / for commands, or describe what you want to create..."
          disabled={isProcessing}
          rows={1}
          className={cn(
            'flex-1 resize-none',
            'px-3 py-2',
            'text-sm',
            'border border-gray-200 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'placeholder:text-gray-400'
          )}
          aria-label="AI command input"
          aria-describedby={suggestions.length > 0 ? 'command-suggestions' : undefined}
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className={cn(
            'px-4 py-2',
            'bg-blue-500 text-white',
            'rounded-lg',
            'hover:bg-blue-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            'flex items-center gap-2'
          )}
          aria-label="Send command"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden ARIA live region for announcements */}
      {suggestions.length > 0 && (
        <div
          id="command-suggestions"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {suggestions.length} command{suggestions.length === 1 ? '' : 's'} available
        </div>
      )}
    </form>
  );
}
```
  - **Success Criteria:**
    - [x] Autocomplete appears when typing `/`
    - [x] ArrowDown navigates to next suggestion
    - [x] ArrowUp navigates to previous suggestion
    - [x] ArrowDown wraps from last to first suggestion
    - [x] ArrowUp wraps from first to last suggestion
    - [x] Tab completes selected suggestion and adds space
    - [x] Enter submits form (without Shift)
    - [x] Shift+Enter adds newline (default textarea behavior)
    - [x] Escape closes autocomplete
    - [x] Clicking suggestion completes and focuses textarea
    - [x] Form submission validates command format
    - [x] Invalid command shows error (console log for now)
    - [x] Loading state disables input and button
    - [x] ARIA attributes present for screen readers
  - **Tests:**
    1. Type `/`, verify autocomplete appears
    2. Press ArrowDown twice, verify selection moves
    3. Press ArrowUp, verify selection moves backward
    4. Press ArrowDown at last item, verify wraps to first
    5. Press Tab, verify input updated with selected command + space
    6. Type `/icon coffee`, press Enter, verify submission
    7. Type `/icon`, press Enter, verify error (no description)
    8. Press Escape with autocomplete open, verify closes
    9. Click suggestion, verify input updated and focused
    10. Test with keyboard only (tab to input, navigate, select)
  - **Edge Cases:**
    - ⚠️ Rapid typing: useEffect with input dependency updates suggestions correctly
    - ⚠️ Tab with no suggestions: Default browser behavior (focus next element)
    - ⚠️ Enter with suggestions open: Still submits (no special handling needed)
    - ⚠️ ArrowUp/Down without suggestions: Default textarea behavior
    - ⚠️ Focus loss during keyboard navigation: Suggestions remain open until Escape or selection
    - ⚠️ Empty input submission: Prevented by disabled state check
    - ⚠️ Multiple spaces in command: trim() normalizes before submission
    - ⚠️ Very long input: Textarea auto-resizes (optional enhancement)

---

## Phase 3: Integration & Testing (3-4 hours)

### 3.1: End-to-End Testing (2-2.5 hours)

#### 3.1.1 Test Icon Generation Flow - Happy Path (45 min)
- [ ] **Action:** Manual E2E testing of complete icon generation workflow
  - **Why:** Verify entire flow from autocomplete to canvas placement works correctly
  - **Test Environment Setup:**
    1. Ensure Firebase emulator running (if testing locally)
    2. Verify OpenAI API key configured in `.env`
    3. Open browser dev tools to monitor network and console
    4. Clear canvas to start with clean slate
  - **Test Procedure:**
    1. **Open AI Chat Panel**
       - Press Cmd+K (Mac) or Ctrl+K (Windows) to open chat
       - Verify panel slides in from bottom-right
       - Verify input is focused automatically

    2. **Test Autocomplete Trigger**
       - Type `/` in input
       - Verify autocomplete appears with 2 commands
       - Verify `/icon` and `/feature` both shown
       - Verify descriptions and examples displayed

    3. **Test Keyboard Navigation**
       - Press ArrowDown
       - Verify selection moves to second item (blue highlight)
       - Press ArrowUp
       - Verify selection moves back to first item
       - Press ArrowDown twice more
       - Verify selection wraps to first item

    4. **Test Tab Completion**
       - With `/icon` selected, press Tab
       - Verify input shows `/icon ` (with trailing space)
       - Verify autocomplete closes
       - Verify cursor positioned after space

    5. **Complete Command and Submit**
       - Type `coffee cup` (full command: `/icon coffee cup`)
       - Verify autocomplete remains closed
       - Press Enter to submit
       - Verify loading state shown (button disabled, spinner visible)

    6. **Monitor Generation Process** (15-20 seconds expected)
       - Check browser console for logs:
         - "Starting app icon generation"
         - "Prompt enhanced"
         - "Image generated"
         - "Image uploaded to storage"
         - "iOS icon created on canvas"
         - "Android icon created on canvas"
       - Check Network tab for:
         - Firebase Function call (POST)
         - OpenAI API call (visible in function logs)
         - Firebase Storage upload

    7. **Verify Success Message**
       - Verify success message appears in chat
       - Message should read: "Created iOS (1024x1024) and Android (512x512) app icons for 'Coffee cup'"
       - Verify loading state cleared

    8. **Verify Canvas Objects**
       - Verify 2 new image objects appear on canvas
       - iOS icon (left): 1024x1024, labeled "iOS - Coffee cup"
       - Android icon (right): 512x512, labeled "Android - Coffee cup"
       - Verify 100px horizontal gap between icons
       - Verify Android icon centered vertically relative to iOS icon
       - Verify icons placed near viewport center

    9. **Verify Image Quality**
       - Select iOS icon, verify image is sharp and high-quality
       - Verify image matches description ("coffee cup")
       - Verify image has modern design (gradients, glassmorphism)
       - Verify no text present in image (per Apple HIG)

    10. **Verify Firebase Storage**
        - Open Firebase Console → Storage
        - Navigate to `ai-generated/{userId}/icon/`
        - Verify new PNG file uploaded
        - Click file, verify public URL accessible
        - Verify image matches canvas version

  - **Success Criteria:**
    - [ ] Autocomplete triggers on `/`
    - [ ] Keyboard navigation works (ArrowUp, ArrowDown, Tab)
    - [ ] Tab completion adds command + space
    - [ ] Form submission sends command
    - [ ] Loading state shown during generation (15-20s)
    - [ ] Success message appears in chat
    - [ ] Two icons appear on canvas (iOS 1024x1024, Android 512x512)
    - [ ] Labels correct ("iOS - Coffee cup", "Android - Coffee cup")
    - [ ] Spacing correct (100px horizontal gap)
    - [ ] Android icon vertically centered relative to iOS
    - [ ] Images high quality (HD, gradients, no text)
    - [ ] Images stored in Firebase Storage
    - [ ] Public URLs accessible

  - **Expected Timings:**
    - Autocomplete appearance: <50ms
    - Command submission: <100ms
    - Total generation time: 15-20 seconds
      - DALL-E 3 generation: 10-15s
      - Storage upload: 2-3s
      - Canvas object creation: <1s

  - **Edge Cases Covered:**
    - ⚠️ Network latency: Generation may take up to 30s on slow connections
    - ⚠️ Viewport positioning: Icons should appear centered in current view

#### 3.1.2 Test Feature Graphic Generation Flow (30 min)
- [ ] **Action:** Manual E2E testing of feature graphic generation
  - **Why:** Verify landscape graphic generation and single-image placement
  - **Test Procedure:**
    1. **Trigger Autocomplete**
       - Type `/` in AI input
       - Verify autocomplete appears

    2. **Select Feature Command**
       - Type `f` (input now `/f`)
       - Verify only `/feature` shown in autocomplete
       - Press Tab to complete

    3. **Submit Description**
       - Type `fitness app with running theme`
       - Full command: `/feature fitness app with running theme`
       - Press Enter
       - Verify loading state

    4. **Monitor Generation** (15-25 seconds expected)
       - Check console for logs
       - Note: DALL-E 3 takes longer for 1792x1024 images

    5. **Verify Success Message**
       - Message: "Created feature graphic for 'Fitness app'"
       - Verify loading cleared

    6. **Verify Canvas Object**
       - Verify single landscape image appears
       - Dimensions: 1792x1024 (landscape orientation)
       - Label: "Feature - Fitness app"
       - Position: Centered in viewport

    7. **Verify Image Content**
       - Image should be landscape/horizontal
       - Should depict fitness theme (running, activity)
       - Should have vibrant colors
       - Should have clear focal point
       - No video play button (that's added by Google Play, not generated)

    8. **Verify Firebase Storage**
       - Check `ai-generated/{userId}/feature/`
       - Verify PNG uploaded
       - Verify public URL accessible

  - **Success Criteria:**
    - [ ] Autocomplete filters to `/feature` when typing `/f`
    - [ ] Feature graphic generated successfully
    - [ ] Single image object created (1792x1024)
    - [ ] Label accurate ("Feature - Fitness app")
    - [ ] Landscape orientation correct
    - [ ] Image stored in Firebase Storage under `feature/` directory

  - **Edge Cases:**
    - ⚠️ Longer generation time: 1792x1024 images cost more API time
    - ⚠️ Different aspect ratio: Ensure Konva renders landscape correctly

#### 3.1.3 Test Error Scenarios (1 hour)
- [ ] **Action:** Test all error handling paths
  - **Why:** Ensure graceful failures and helpful error messages
  - **Test Cases:**

  **Test 1: Invalid Command**
  - Type `/invalid test`
  - Press Enter
  - Expected: Error message "Unknown command: /invalid"
  - Verify: Input remains (not cleared), user can edit
  - Verify: Autocomplete suggests corrections if partial match

  **Test 2: Empty Description**
  - Type `/icon` (no description)
  - Press Enter
  - Expected: Error message "Description required for /icon command"
  - Verify: Input remains, cursor after command for easy editing

  **Test 3: Very Short Description**
  - Type `/icon a` (only 1 char)
  - Press Enter
  - Expected: Error from backend validation (min 3 chars)
  - Verify: Clear error message shown in chat
  - Verify: Input not cleared

  **Test 4: Very Long Description (>200 chars)**
  - Type `/icon` + 250 character description
  - Press Enter
  - Expected: Backend truncates to 200 chars OR rejects
  - Verify: Either succeeds with truncated prompt OR shows error
  - Document: Current behavior (truncate or reject)

  **Test 5: Special Characters in Description**
  - Type `/icon coffee@#$%^&*cup`
  - Press Enter
  - Expected: Special chars sanitized by backend
  - Verify: Generation succeeds, output is "coffee cup"

  **Test 6: Network Timeout (Mock)**
  - Temporarily disable network in dev tools
  - Type `/icon test`
  - Press Enter
  - Expected: Network error after timeout (30s)
  - Verify: Error message "Network error, please try again"
  - Verify: Loading state cleared
  - Verify: User can retry

  **Test 7: OpenAI API Error (Temporarily Remove Key)**
  - In Firebase Functions config, temporarily unset OPENAI_API_KEY
  - Type `/icon coffee`
  - Press Enter
  - Expected: API configuration error
  - Verify: Error message "Service unavailable, please try again later"
  - Verify: Does not expose sensitive error details to user
  - Restore: Reset API key after test

  **Test 8: Rate Limit (Mock if Possible)**
  - If you have test API key with low rate limit:
    - Submit 5 icon commands rapidly
    - Expected: Rate limit error on 5th request
    - Verify: Error message "Too many requests, please wait a moment"
    - Verify: Suggests wait time if available
  - If cannot test: Document expected behavior

  **Test 9: Content Policy Violation**
  - Type `/icon nude person` (intentionally violates policy)
  - Press Enter
  - Expected: Content policy error from OpenAI
  - Verify: Error message "Image violates content policy. Try a different description."
  - Verify: No exposed technical details
  - Verify: Input cleared for security (don't keep inappropriate content)

  **Test 10: Canvas Overlap Detection**
  - Create large rectangle at viewport center
  - Type `/icon coffee`
  - Press Enter
  - Expected: Icons placed offset from rectangle (not overlapping)
  - Verify: `findEmptySpace` adjusted position
  - Verify: Console log shows "Adjusted position to avoid overlap"

  - **Success Criteria:**
    - [ ] Invalid command shows clear error message
    - [ ] Empty description prevented and explained
    - [ ] Very short description rejected with minimum length error
    - [ ] Very long description handled (truncate or reject)
    - [ ] Special characters sanitized gracefully
    - [ ] Network errors show user-friendly message
    - [ ] API errors don't expose sensitive details
    - [ ] Rate limits explained with retry guidance
    - [ ] Content policy violations handled gracefully
    - [ ] Canvas overlap avoided automatically

  - **Edge Cases:**
    - ⚠️ Multiple rapid submissions: Queue or reject with "Already processing" message
    - ⚠️ Simultaneous errors: Show most relevant error first
    - ⚠️ Error during upload after successful generation: Still show error, don't waste generation

### 3.2: Performance & Cost Testing (1-1.5 hours)

#### 3.2.1 Measure Generation Times (45 min)
- [ ] **Action:** Log and analyze generation timing breakdown
  - **Why:** Ensure reasonable user experience (<20s target)
  - **Test Procedure:**
    1. **Set Up Performance Logging**
       - Open browser performance monitor
       - Open Firebase Functions logs
       - Prepare spreadsheet for recording times

    2. **Test Icon Generation (10 samples)**
       - Generate 10 different icons with varied prompts:
         1. `/icon coffee cup`
         2. `/icon fitness tracker`
         3. `/icon music note`
         4. `/icon camera lens`
         5. `/icon book with bookmark`
         6. `/icon shopping cart`
         7. `/icon weather cloud`
         8. `/icon calendar date`
         9. `/icon email envelope`
         10. `/icon location pin`

       - For each, record:
         - Total time (user perspective: submit to canvas appearance)
         - DALL-E 3 generation time (from function logs)
         - Storage upload time (from function logs)
         - Canvas object creation time (from function logs)
         - Network latency (total - sum of above)

    3. **Test Feature Graphic Generation (10 samples)**
       - Generate 10 feature graphics:
         1. `/feature fitness app running theme`
         2. `/feature meditation app calm design`
         3. `/feature recipe app food showcase`
         4. `/feature travel app destinations`
         5. `/feature music app streaming`
         6. `/feature photo editor filters`
         7. `/feature task manager productivity`
         8. `/feature language learning translation`
         9. `/feature shopping app deals`
         10. `/feature weather app forecast`

       - Record same metrics

    4. **Calculate Statistics**
       - Average times
       - Min/max times
       - Standard deviation
       - 95th percentile (worst acceptable case)

    5. **Analyze Breakdown**
       - What percentage is DALL-E 3 generation?
       - What percentage is storage upload?
       - What percentage is network/overhead?
       - Are there outliers? Why?

  - **Success Criteria:**
    - [ ] Icon generation average: <20 seconds
    - [ ] Feature graphic average: <25 seconds (larger images)
    - [ ] DALL-E 3 time: 10-15s (out of our control, document)
    - [ ] Storage upload: <3s for icons, <5s for features
    - [ ] Canvas creation: <500ms
    - [ ] Network latency: <2s
    - [ ] No generation exceeds 30s (timeout)

  - **Expected Results:**
    - Icon (1024x1024): 15-20s total
      - DALL-E 3: 10-15s
      - Storage: 2-3s
      - Canvas: 0.5s
      - Network: 1-2s
    - Feature (1792x1024): 20-25s total
      - DALL-E 3: 15-20s (larger image)
      - Storage: 3-5s (larger file)
      - Canvas: 0.5s
      - Network: 1-2s

  - **Edge Cases:**
    - ⚠️ Slow internet: Storage upload may take 10s+ on slow connections
    - ⚠️ OpenAI server load: Generation time varies by API load
    - ⚠️ Complex prompts: Enhanced prompts are long, may take slightly longer

#### 3.2.2 Calculate and Document Costs (30 min)
- [ ] **Action:** Calculate operational costs per generation
  - **Why:** Understand cost implications for rate limiting decisions
  - **Cost Breakdown:**

    **Icon Generation:**
    - DALL-E 3 1024x1024 HD: $0.04 per image
    - Firebase Storage: ~$0.026 per GB/month
      - Average icon size: ~500KB
      - Cost per icon: ~$0.000013/month
    - Firebase Functions: Depends on region and invocations
      - 1GB memory, ~30s execution: ~$0.00001 per invocation
    - Total per icon generation: ~$0.04 + negligible storage/function costs

    **Feature Graphic Generation:**
    - DALL-E 3 1792x1024 HD: $0.08 per image
    - Firebase Storage:
      - Average feature graphic size: ~1MB
      - Cost per feature: ~$0.000026/month
    - Firebase Functions: Same as above
    - Total per feature generation: ~$0.08 + negligible costs

    **Monthly Cost Projections:**
    - 100 users, 10 generations each = 1000 generations
    - If 50/50 split icon/feature:
      - Icons: 500 × $0.04 = $20
      - Features: 500 × $0.08 = $40
      - Total: $60/month for 1000 generations

    - 1000 users, 5 generations each = 5000 generations
      - Icons: 2500 × $0.04 = $100
      - Features: 2500 × $0.08 = $200
      - Total: $300/month for 5000 generations

  - **Rate Limiting Recommendations:**
    Based on costs, suggest implementing:
    - Free tier: 10 generations per day per user
    - Pro tier: 100 generations per day per user
    - Or implement pay-per-use: $0.05 per icon, $0.10 per feature (small markup)

  - **Documentation:**
    - Document costs in `_docs/architecture/ai-system.md`
    - Add section on cost tracking and rate limiting
    - Include guidance for future pricing decisions

  - **Success Criteria:**
    - [ ] Cost per icon documented ($0.04)
    - [ ] Cost per feature graphic documented ($0.08)
    - [ ] Monthly projections calculated for various user counts
    - [ ] Rate limiting recommendations provided
    - [ ] Documentation updated with cost information

  - **Edge Cases:**
    - ⚠️ OpenAI price changes: Check pricing page quarterly
    - ⚠️ Firebase cost variations: Actual costs may vary by region
    - ⚠️ Bulk discounts: OpenAI may offer discounts for high volume

### 3.3: Documentation (30-45 min)

#### 3.3.1 Update AI System Documentation (20 min)
- [ ] **Action:** Update `_docs/architecture/ai-system.md`
  - **Why:** Document new capabilities for future reference
  - **Content to Add:**

    **Section: Image Generation Tools**
    ```markdown
    ## Image Generation Tools

    ### Overview
    Canvas Icons supports AI-powered image generation for app icons and
    feature graphics using OpenAI's DALL-E 3.

    ### Available Commands

    #### /icon - Generate App Icons
    **Syntax:** `/icon [description]`
    **Example:** `/icon a coffee cup`

    Generates professional app icons for iOS and Android:
    - iOS: 1024x1024 (App Store requirement)
    - Android: 512x512 (scaled for consistency)
    - Automatically placed on canvas with 100px spacing
    - Labels: "iOS - [keyword]" and "Android - [keyword]"

    **Prompt Enhancement:**
    - Applies 2025 design trends (glassmorphism, gradients)
    - Enforces Apple HIG (no text, centered composition)
    - Optimizes for app store visibility

    #### /feature - Generate Feature Graphics
    **Syntax:** `/feature [description]`
    **Example:** `/feature fitness app with running theme`

    Generates Google Play Store feature graphics:
    - Dimensions: 1792x1024 (landscape)
    - Optimized for video overlay
    - Vibrant colors for maximum impact
    - Label: "Feature - [keyword]"

    ### Technical Implementation

    **Backend Stack:**
    - OpenAI DALL-E 3 for generation
    - Firebase Storage for permanent hosting
    - Firebase Functions for orchestration

    **Workflow:**
    1. User types command in AI chat
    2. Frontend parses command and description
    3. Backend validates and enhances prompt
    4. DALL-E 3 generates image (10-20s)
    5. Image uploaded to Firebase Storage
    6. Canvas objects created with public URLs

    **Performance:**
    - Icon generation: ~15-20 seconds
    - Feature graphic: ~20-25 seconds
    - 30 second timeout

    **Cost:**
    - Icon: $0.04 per generation
    - Feature graphic: $0.08 per generation
    - Storage: negligible (<$0.0001 per image/month)

    ### Prompt Enhancement Strategy

    **Icons:**
    - Glassmorphism 2.0 aesthetic
    - Vibrant gradient colors
    - 3D symbolism with depth
    - NO text (Apple HIG requirement)
    - Centered composition
    - High contrast for accessibility

    **Feature Graphics:**
    - Clear value proposition
    - Video overlay consideration
    - Vibrant contrasting colors
    - Centered focal point
    - Professional quality
    - Landscape optimized

    ### Error Handling

    - Rate limits: 429 errors handled gracefully
    - Content policy: Violations explained to user
    - Network failures: Retry with exponential backoff
    - Invalid prompts: Validated before API call
    - Storage failures: Clear error messages

    ### Future Enhancements

    - [ ] Custom style parameters (vivid vs natural)
    - [ ] Regeneration with same prompt
    - [ ] Image editing commands
    - [ ] Batch generation
    - [ ] Cost tracking per user
    - [ ] Rate limiting implementation
    ```

  - **Success Criteria:**
    - [ ] Documentation complete and accurate
    - [ ] Command syntax documented
    - [ ] Examples provided
    - [ ] Technical details explained
    - [ ] Cost information included
    - [ ] Future enhancements listed

#### 3.3.2 Update CLAUDE.md Project Instructions (15 min)
- [ ] **Action:** Update `/Users/andre/coding/figma-clone/CLAUDE.md`
  - **Why:** Inform future AI development sessions about new features
  - **Content to Add:**

    Add new section after AI Assistant section:

    ```markdown
    ## AI Image Generation

    Canvas Icons supports AI-powered image generation for app icons and feature graphics.

    ### Commands

    - **`/icon [description]`**: Generate iOS (1024x1024) and Android (512x512) app icons
    - **`/feature [description]`**: Generate Google Play feature graphic (1792x1024 landscape)

    ### Implementation Pattern

    ```typescript
    // Command autocomplete in ChatInput
    import { getCommandSuggestions, parseCommand } from '@/features/ai-agent/utils/commandParser';

    // Get suggestions as user types
    const suggestions = getCommandSuggestions(input);

    // Parse complete command
    const parsed = parseCommand('/icon coffee cup');
    // Returns: { command: '/icon', description: 'coffee cup', commandObj: {...} }
    ```

    ### Backend Tools

    Located in `functions/src/ai/tools/`:
    - `generateAppIcon.ts`: Creates iOS + Android icons
    - `generateFeatureGraphic.ts`: Creates landscape feature graphic

    ### Services

    - `functions/src/services/image-generation.ts`: DALL-E 3 integration
    - `functions/src/services/storage-upload.ts`: Firebase Storage uploads

    ### Storage Structure

    ```
    ai-generated/
      {userId}/
        icon/
          {timestamp}-{uuid}.png
        feature/
          {timestamp}-{uuid}.png
    ```

    ### Prompt Enhancement

    Simple user prompts are automatically enhanced with:
    - 2025 app store design best practices
    - Apple Human Interface Guidelines
    - Google Play Store recommendations
    - Technical specifications for DALL-E 3

    ### Error Handling

    All image generation operations include:
    - Input validation before API calls
    - Rate limit handling (429 errors)
    - Content policy violation detection
    - Network failure retry logic
    - User-friendly error messages

    ### Performance

    - Target: <20s for icons, <25s for feature graphics
    - DALL-E 3 generation: 10-20s (varies by API load)
    - Storage upload: 2-5s (depends on image size)
    - Canvas object creation: <500ms

    ### Cost

    - Icon: $0.04 per generation
    - Feature graphic: $0.08 per generation
    - Consider rate limiting (e.g., 10 free generations/day)
    ```

  - **Success Criteria:**
    - [ ] CLAUDE.md updated with image generation info
    - [ ] Command syntax documented
    - [ ] Implementation patterns shown
    - [ ] Storage structure explained
    - [ ] Performance targets documented
    - [ ] Cost information included

---

## Phase 4: Polish & Optimization (2-3 hours)

### 4.1: UX Improvements (1.5-2 hours)

#### 4.1.1 Add Generation Progress Indicator (1 hour)
- [ ] **Action:** Show detailed progress during image generation
  - **Why:** 15-20 second wait times need feedback to avoid user confusion
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatMessage.tsx`
    - Update: `src/features/ai-agent/hooks/useAIAgent.ts`
  - **Research Steps:**
    1. Review Apple HIG for progress indicator design
    2. Study existing loading patterns in Canvas Icons
    3. Document progress states to show
  - **Implementation Steps:**
    1. Add progress state to useAIAgent hook
    2. Update backend to send progress updates via Firebase RTDB
    3. Create ProgressIndicator component
    4. Show progress in chat message during generation
    5. Update progress as backend reports milestones
    6. Clear progress on completion or error
  - **Progress Stages:**
    1. "Generating image..." (0-15s)
    2. "Uploading to storage..." (15-18s)
    3. "Placing on canvas..." (18-20s)
  - **Implementation Details:**
```typescript
/**
 * Progress Indicator Component
 *
 * Shows generation progress with animated stages.
 * Follows Apple HIG for progress feedback.
 */

interface ProgressIndicatorProps {
  stage: 'generating' | 'uploading' | 'placing' | 'complete';
  error?: string;
}

export function ProgressIndicator({ stage, error }: ProgressIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <XCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  const stages = [
    { key: 'generating', label: 'Generating image...', icon: Sparkles },
    { key: 'uploading', label: 'Uploading to storage...', icon: Upload },
    { key: 'placing', label: 'Placing on canvas...', icon: Image },
  ];

  return (
    <div className="space-y-2">
      {stages.map((s, index) => {
        const isActive = s.key === stage;
        const isComplete = stages.findIndex(x => x.key === stage) > index;
        const Icon = s.icon;

        return (
          <div
            key={s.key}
            className={cn(
              'flex items-center gap-2 text-sm transition-colors',
              isActive && 'text-blue-600',
              isComplete && 'text-green-600',
              !isActive && !isComplete && 'text-gray-400'
            )}
          >
            {isComplete ? (
              <CheckCircle className="w-4 h-4" />
            ) : isActive ? (
              <>
                <Icon className="w-4 h-4 animate-pulse" />
                <span className="animate-pulse">{s.label}</span>
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                <span>{s.label}</span>
              </>
            )}
            {!isActive && !isComplete && <span>{s.label}</span>}
            {isComplete && <span className="line-through">{s.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

// In ChatMessage component:
{message.status === 'pending' && (
  <ProgressIndicator
    stage={message.progressStage}
    error={message.error}
  />
)}
```
  - **Success Criteria:**
    - [ ] Progress indicator shows during generation
    - [ ] Three stages shown: generating, uploading, placing
    - [ ] Active stage animated (pulse effect)
    - [ ] Completed stages marked with checkmark
    - [ ] Future stages grayed out
    - [ ] Progress cleared on completion
    - [ ] Errors shown in red with error icon
  - **Tests:**
    1. Start icon generation, verify "Generating..." appears
    2. Wait for upload stage, verify "Uploading..." shown
    3. Wait for placing stage, verify "Placing..." shown
    4. Verify completion clears progress
    5. Trigger error, verify error stage shown
  - **Edge Cases:**
    - ⚠️ Very fast generation: Stages may flash quickly (acceptable)
    - ⚠️ Network delay: Progress may pause between stages
    - ⚠️ Error during stage: Show error immediately, clear progress

#### 4.1.2 Add Preview Thumbnails in Chat (1 hour)
- [ ] **Action:** Show generated image preview in chat success message
  - **Why:** Confirm what was generated without searching canvas
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatMessage.tsx`
  - **Research Steps:**
    1. Review Apple HIG for image preview patterns
    2. Study existing image display in Canvas Icons
    3. Decide on thumbnail size (100x100 recommended)
  - **Implementation Steps:**
    1. Update ChatMessage to accept image URL
    2. Display thumbnail in success message
    3. Add hover effect to show larger preview
    4. Make thumbnail clickable to focus canvas object
    5. Handle loading state for thumbnail
    6. Handle error loading thumbnail
  - **Implementation Details:**
```typescript
/**
 * Chat Message with Image Preview
 *
 * Shows thumbnail preview of generated images in success message.
 * Clicking thumbnail focuses the object on canvas.
 */

interface ChatMessageProps {
  message: AIMessage;
  onFocusObject?: (objectId: string) => void;
}

export function ChatMessage({ message, onFocusObject }: ChatMessageProps) {
  const [imageError, setImageError] = useState(false);

  if (message.type === 'command_result' && message.success && message.imageUrl) {
    return (
      <div className="space-y-2">
        {/* Success message text */}
        <div className="text-sm text-gray-900">
          {message.message}
        </div>

        {/* Image preview(s) */}
        <div className="flex gap-2">
          {message.objectIds?.map((objectId, index) => (
            <button
              key={objectId}
              onClick={() => onFocusObject?.(objectId)}
              className={cn(
                'relative group',
                'w-24 h-24 rounded-lg overflow-hidden',
                'border-2 border-gray-200',
                'hover:border-blue-500',
                'transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              aria-label={`View ${message.objectNames?.[index]} on canvas`}
            >
              {!imageError ? (
                <img
                  src={message.imageUrl}
                  alt={message.objectNames?.[index] || 'Generated image'}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Platform label for icons */}
              {message.objectNames?.[index] && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 text-center">
                  {message.objectNames[index].split(' - ')[0]}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Helper text */}
        <div className="text-xs text-gray-500">
          Click thumbnails to view on canvas
        </div>
      </div>
    );
  }

  // ... existing message rendering
}
```
  - **Success Criteria:**
    - [ ] Thumbnails shown for successful generations
    - [ ] Thumbnail size 96x96 (w-24 h-24)
    - [ ] Hover shows border highlight and external link icon
    - [ ] Click focuses object on canvas
    - [ ] Platform label shown for icons (iOS/Android)
    - [ ] Loading state handled gracefully
    - [ ] Error loading shows placeholder icon
    - [ ] Helper text explains clickability
  - **Tests:**
    1. Generate icon, verify two thumbnails appear (iOS, Android)
    2. Hover over thumbnail, verify border highlight
    3. Click thumbnail, verify canvas focuses object
    4. Test with broken image URL, verify placeholder shown
    5. Generate feature graphic, verify single thumbnail
  - **Edge Cases:**
    - ⚠️ Image still loading: Show loading skeleton
    - ⚠️ Image load error: Show placeholder icon
    - ⚠️ Very tall chat: Thumbnails remain visible (don't overflow)
    - ⚠️ Object deleted from canvas: Click does nothing (graceful)

### 4.2: Advanced Features (Optional) (30-45 min)

#### 4.2.1 Add Style Parameter Support (20 min)
- [ ] **Action:** Allow users to specify DALL-E 3 style (vivid vs natural)
  - **Why:** Give users more control over output aesthetic
  - **Syntax:** `/icon coffee cup --style natural`
  - **Files Modified:**
    - Update: `src/features/ai-agent/utils/commandParser.ts`
    - Update: `functions/src/ai/tools/generateAppIcon.ts`
    - Update: `functions/src/ai/tools/generateFeatureGraphic.ts`
  - **Implementation Steps:**
    1. Update parseCommand to extract `--style` flag
    2. Validate style value (vivid or natural)
    3. Pass style to backend tools
    4. Tools pass style to generateImage service
    5. Update autocomplete to show style examples
  - **Implementation Details:**
```typescript
// In commandParser.ts:

/**
 * Parse command with optional style flag
 */
export function parseCommand(input: string): {
  command: string;
  description: string;
  commandObj: AICommand;
  style?: 'vivid' | 'natural';
} | null {
  const trimmed = input.trim();

  if (!hasCommandPrefix(trimmed)) {
    return null;
  }

  // Check for --style flag
  const styleMatch = trimmed.match(/--style\s+(vivid|natural)/i);
  const style = styleMatch ? (styleMatch[1].toLowerCase() as 'vivid' | 'natural') : undefined;

  // Remove style flag from description
  const withoutStyle = trimmed.replace(/--style\s+(vivid|natural)/gi, '').trim();

  // Parse command and description as before
  const spaceIndex = withoutStyle.indexOf(' ');

  if (spaceIndex === -1) {
    return null;
  }

  const command = withoutStyle.substring(0, spaceIndex).toLowerCase();
  const description = withoutStyle.substring(spaceIndex + 1).trim();

  const commandObj = AI_COMMANDS.find(cmd => cmd.command === command);

  if (!commandObj || !description) {
    return null;
  }

  return {
    command,
    description,
    commandObj,
    style,
  };
}

// Update AI_COMMANDS examples:
{
  command: '/icon',
  description: 'Generate iOS & Android app icons',
  example: '/icon a coffee cup --style vivid',
  category: 'Image Generation',
}
```
  - **Success Criteria:**
    - [ ] Style parameter parsed correctly
    - [ ] Default to 'vivid' if not specified
    - [ ] 'natural' produces more muted colors
    - [ ] 'vivid' produces saturated colors
    - [ ] Invalid style values ignored (use default)
  - **Tests:**
    1. Generate with `--style natural`, verify muted output
    2. Generate with `--style vivid`, verify vibrant output
    3. Generate without flag, verify default (vivid)
    4. Test invalid style `--style invalid`, verify ignored
  - **Edge Cases:**
    - ⚠️ Case insensitive: `--style VIVID` works
    - ⚠️ Multiple flags: Only first --style honored
    - ⚠️ Flag position: Works anywhere in description

#### 4.2.2 Add Regeneration Command (Optional, 15 min)
- [ ] **Action:** Allow users to regenerate last image with same prompt
  - **Why:** Sometimes results aren't perfect, regenerate is cheaper than editing description
  - **Syntax:** `/regenerate` or `regenerate last`
  - **Files Modified:**
    - Update: `src/features/ai-agent/utils/commandParser.ts`
    - Create: `functions/src/ai/tools/regenerateImage.ts`
    - Update: `src/features/ai-agent/hooks/useAIAgent.ts`
  - **Implementation:**
    1. Store last generation prompt in aiStore
    2. Add `/regenerate` command to AI_COMMANDS
    3. Parse regenerate command (no description needed)
    4. Backend retrieves last prompt from RTDB
    5. Regenerate with same parameters
    6. Replace old objects on canvas (optional)
  - **Success Criteria:**
    - [ ] `/regenerate` command recognized
    - [ ] Uses last generation prompt
    - [ ] Creates new objects (doesn't replace)
    - [ ] Works for both icons and feature graphics
  - **Edge Cases:**
    - ⚠️ No previous generation: Show error "Nothing to regenerate"
    - ⚠️ Different command type: Error if last was /icon, now /regenerate /feature

---

## Rollback Strategy

If issues arise during implementation, follow these rollback procedures:

### Phase 1 Rollback (Backend)
**Affected Files:**
- `functions/src/services/image-generation.ts`
- `functions/src/services/storage-upload.ts`
- `functions/src/ai/tools/generateAppIcon.ts`
- `functions/src/ai/tools/generateFeatureGraphic.ts`
- `functions/src/ai/tools/index.ts`

**Rollback Steps:**
1. Remove tool registrations from `index.ts`
2. Delete new service files (`image-generation.ts`, `storage-upload.ts`)
3. Delete new tool files (`generateAppIcon.ts`, `generateFeatureGraphic.ts`)
4. Redeploy Firebase Functions: `cd functions && npm run deploy`
5. Verify functions deploy successfully

**Impact:** No frontend changes yet, safe rollback

### Phase 2 Rollback (Frontend)
**Affected Files:**
- `src/features/ai-agent/utils/commandParser.ts`
- `src/features/ai-agent/components/CommandAutocomplete.tsx`
- `src/features/ai-agent/components/ChatInput.tsx`

**Rollback Steps:**
1. Revert `ChatInput.tsx` to previous version using git
2. Delete `commandParser.ts` and `CommandAutocomplete.tsx`
3. Test AI chat input still works for normal messages
4. Verify no TypeScript errors

**Impact:** Backend remains functional, users can still use other AI commands

### Phase 3 Rollback (Integration)
**Affected Files:**
- `_docs/architecture/ai-system.md`
- `CLAUDE.md`

**Rollback Steps:**
1. Revert documentation files to previous versions
2. If testing revealed backend issues, follow Phase 1 rollback
3. If testing revealed frontend issues, follow Phase 2 rollback

**Impact:** Minimal, documentation changes only

### Phase 4 Rollback (Polish)
**Affected Files:**
- `src/features/ai-agent/components/ChatMessage.tsx`
- Progress indicator components

**Rollback Steps:**
1. Revert ChatMessage to pre-Phase 4 version
2. Remove progress indicator components
3. Test basic image generation still works

**Impact:** Loses UX improvements but core functionality remains

### Emergency Full Rollback
If complete rollback needed:
1. Identify last known good commit: `git log --oneline`
2. Create emergency branch: `git checkout -b emergency-rollback`
3. Revert to commit: `git revert <commit-hash>..HEAD`
4. Test thoroughly in local environment
5. Deploy functions: `cd functions && npm run deploy`
6. Deploy frontend if using hosting
7. Monitor logs for 30 minutes

### Testing After Rollback
- [ ] AI chat input accepts messages
- [ ] Other AI commands still work (create rectangle, etc.)
- [ ] No console errors
- [ ] No function errors in Firebase logs
- [ ] Users can continue using app normally

---

## Future Enhancements

Post-launch improvements to consider:

### Image Editing Commands
- [ ] `/resize [objectId] [width] [height]` - Resize generated images
- [ ] `/crop [objectId] [bounds]` - Crop to specific area
- [ ] `/filter [objectId] [filter]` - Apply filters (grayscale, sepia, etc.)
- [ ] `/adjust [objectId] --brightness 1.2` - Adjust image properties

### Style Variations
- [ ] Support multiple art styles (3D, flat, gradient, line art, photorealistic)
- [ ] `/icon coffee cup --style 3d` - 3D rendered icon
- [ ] `/icon coffee cup --style flat` - Flat design icon
- [ ] Style presets based on popular apps

### Batch Generation
- [ ] `/icon [description] --variations 3` - Generate 3 variations
- [ ] Select best variation from set
- [ ] A/B test different prompts

### Image-to-Image
- [ ] Upload image as reference
- [ ] `/icon based on [uploaded-image]`
- [ ] Style transfer from existing images

### Custom Dimensions
- [ ] Support arbitrary sizes
- [ ] `/icon coffee cup --size 512x512`
- [ ] Presets for common sizes (App Store screenshots, etc.)

### Image History & Gallery
- [ ] View all generated images
- [ ] Re-use previous generations
- [ ] Tag and organize generated images
- [ ] Search generated images by description

### Cost & Usage Tracking
- [ ] Per-user cost tracking
- [ ] Usage analytics dashboard
- [ ] Monthly cost reports
- [ ] Budget alerts

### Rate Limiting
- [ ] Implement tiered rate limits
  - Free: 10 generations/day
  - Pro: 100 generations/day
  - Enterprise: Unlimited
- [ ] Show remaining quota in UI
- [ ] Upgrade prompts when limit reached

### Alternative Models
- [ ] DALL-E 2 fallback for cost savings ($0.02 vs $0.04)
- [ ] Stable Diffusion integration (lower cost, self-hosted option)
- [ ] Midjourney integration (higher artistic quality)

### SVG Generation
- [ ] Generate vector icons (scalable, smaller files)
- [ ] SVG-specific prompt enhancement
- [ ] Direct SVG manipulation tools

### Prompt Templates
- [ ] Save successful prompts as templates
- [ ] Community prompt sharing
- [ ] "Generate like this" feature

### Collaboration Features
- [ ] Share generated images with team
- [ ] Collaborative prompt refinement
- [ ] Vote on best variations

### Accessibility
- [ ] Alt text generation for images
- [ ] Color contrast checking
- [ ] Accessibility score for icons

---

## Notes & Learnings

**OpenAI Integration:**
- DALL-E 3 is significantly better quality than DALL-E 2
- HD quality worth the cost for professional use
- Image URLs expire after 1 hour - must download immediately
- Content policy is strict - sanitize user inputs

**Prompt Engineering:**
- Detailed prompts (1000+ chars) produce best results
- Technical specifications important (centered, no text, etc.)
- Style guidance improves consistency
- Examples in prompts help DALL-E understand context

**Performance:**
- DALL-E 3 generation: 10-20s (out of our control)
- Storage upload: 2-5s (depends on file size and network)
- Total UX should stay under 20s when possible
- Progress indicators critical for perceived performance

**Cost Management:**
- Rate limiting essential for sustainability
- Consider tiered pricing model
- Track costs per user for analytics
- OpenAI pricing may change - review quarterly

**UX Patterns:**
- Command autocomplete improves discoverability
- Keyboard navigation essential for power users
- Preview thumbnails reduce canvas searching
- Progress indicators reduce uncertainty during long operations

**Firebase Storage:**
- Public URLs work great for canvas images
- Metadata useful for tracking and analytics
- Organize by user and type for easy management
- Set cache headers for performance

**Error Handling:**
- Always show user-friendly messages
- Never expose API keys or internal errors
- Provide actionable guidance ("try again", "contact support")
- Log detailed errors for debugging

**Testing:**
- Manual E2E testing essential for image quality
- Performance testing reveals bottlenecks
- Error scenarios often overlooked - test explicitly
- Cost tracking prevents surprises

---

**Status**: Ready for implementation
**Priority**: Medium-High (valuable feature, well-scoped)
**Risk Level**: Low (builds on existing systems, clear requirements)
**Dependencies**: OpenAI API key, Firebase Storage configured
**Estimated Total Time**: 20-24 hours (Backend: 10-12h, Frontend: 5-6h, Integration: 3-4h, Polish: 2-3h)
