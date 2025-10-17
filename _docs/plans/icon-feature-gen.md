# Implementation Plan: AI Image Generation for App Icons & Feature Graphics

**Created:** 2025-10-17
**Estimated Time:** 18-22 hours
**Status:** Not Started

## Overview

Add AI-powered image generation capabilities to create professional app icons and feature graphics using OpenAI's DALL-E 3. Users can generate icons via `/icon` and `/feature` commands with automatic prompt enhancement, intelligent sizing, Firebase Storage integration, and canvas placement.

## Dependencies

- OpenAI API key (already configured)
- Firebase Storage (already configured)
- Existing AI agent system (LangChain + LangGraph)
- Existing canvas image upload system

## Success Metrics

- [ ] Users can generate app icons with `/icon [description]` command
- [ ] Users can generate feature graphics with `/feature [description]` command
- [ ] Icons automatically sized: iOS (1024x1024) + Android (512x512)
- [ ] Feature graphics sized: Android (1024x500)
- [ ] Images stored in Firebase Storage with public URLs
- [ ] Images placed on canvas with proper labels and spacing
- [ ] Command suggestions appear when typing `/`
- [ ] Simple prompts enhanced with professional design principles

---

## Phase 0: Research & Planning ✅

### Decisions Made

**Image Generation:**
- Model: OpenAI DALL-E 3 (higher quality, $0.04/image)
- Format: 1024x1024 PNG (base64 or URL)
- Storage: Firebase Storage (permanent, user-scoped)

**Icon Sizes:**
- iOS: 1024x1024 (App Store requirement)
- Android: 512x512 (scaled down from iOS)
- Feature Graphic: 1024x500 (Google Play requirement)

**UX Pattern:**
- Command syntax: `/icon a coffee cup` (no quotes needed)
- Inline autocomplete in AI chat input (Option B)
- Command suggestions when typing `/`
- Canvas placement: horizontal row, 100px spacing

**Prompt Enhancement Strategy:**
Based on 2025 app store best practices:
- **Icons**: Glassmorphism 2.0, dynamic minimalism, vibrant gradients, 3D symbolism
- **Feature Graphics**: Clear value prop, contrasting colors, no text clutter, video overlay consideration
- **General**: Simple, bold, high contrast, memorable, avoid text unless necessary

---

## Phase 1: Backend - Image Generation Tools (6-8 hours)

### 1.1: OpenAI Integration & Prompt Enhancement

#### 1.1.1 Create Image Generation Service
- [ ] **Action:** Create `functions/src/services/image-generation.ts` with DALL-E 3 integration
  - **Why:** Centralized service for all image generation operations
  - **Files Modified:**
    - Create: `functions/src/services/image-generation.ts`
  - **Implementation Details:**
```typescript
import OpenAI from 'openai';
import * as logger from 'firebase-functions/logger';

interface GenerateImageOptions {
  prompt: string;
  type: 'icon' | 'feature';
  size: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  base64?: string;
  revisedPrompt?: string;
  error?: string;
}

/**
 * Generate image using DALL-E 3
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: options.prompt,
      n: 1,
      size: options.size,
      quality: options.quality || 'hd',
      style: options.style || 'vivid',
      response_format: 'url', // Use URL for simplicity
    });

    const imageData = response.data[0];

    logger.info('Image generated successfully', {
      revisedPrompt: imageData.revised_prompt,
      originalPrompt: options.prompt,
    });

    return {
      success: true,
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt,
    };
  } catch (error) {
    logger.error('Image generation failed', { error, options });
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Enhance user prompt with professional design principles
 */
export function enhancePrompt(userPrompt: string, type: 'icon' | 'feature'): string {
  if (type === 'icon') {
    // App icon enhancement based on 2025 best practices
    return `Professional mobile app icon design: ${userPrompt}.
Style: modern minimalist with glassmorphism 2.0 effect, subtle depth and translucency,
vibrant gradient colors, 3D symbolism, high contrast, bold and memorable.
Technical: centered composition, no text, simple geometric shapes,
suitable for both iOS and Android, square format, clean edges.`;
  } else {
    // Feature graphic enhancement based on Google Play best practices
    return `Professional Google Play Store feature graphic: ${userPrompt}.
Style: clean modern design, showcase value proposition clearly,
vibrant contrasting colors (avoid white/black/dark gray backgrounds),
eye-catching visuals, suitable for video overlay with play button,
no text clutter, key elements centered and visible.
Technical: horizontal landscape format 1024x500, high detail, professional quality.`;
  }
}
```
  - **Success Criteria:**
    - [ ] Service exports `generateImage` function
    - [ ] Service exports `enhancePrompt` function
    - [ ] Handles DALL-E 3 API calls with proper error handling
    - [ ] Returns URL or base64 format
  - **Tests:**
    1. Call `generateImage({ prompt: 'coffee cup', type: 'icon', size: '1024x1024' })`
    2. Expected: Returns `{ success: true, imageUrl: 'https://...' }`
    3. Test `enhancePrompt('coffee cup', 'icon')` returns enhanced prompt
  - **Edge Cases:**
    - ⚠️ OpenAI API error: Return `{ success: false, error: 'message' }`
    - ⚠️ Rate limit: Catch and return user-friendly error
    - ⚠️ Invalid API key: Validate on function start

#### 1.1.2 Create Firebase Storage Upload Service
- [ ] **Action:** Create `functions/src/services/storage-upload.ts` for image persistence
  - **Why:** Store generated images permanently in Firebase Storage
  - **Files Modified:**
    - Create: `functions/src/services/storage-upload.ts`
  - **Implementation Details:**
```typescript
import { getStorage } from 'firebase-admin/storage';
import fetch from 'node-fetch';
import * as logger from 'firebase-functions/logger';
import { v4 as uuidv4 } from 'uuid';

interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Download image from URL and upload to Firebase Storage
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  userId: string,
  type: 'icon' | 'feature'
): Promise<UploadImageResult> {
  try {
    // Fetch image from OpenAI URL
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const filename = `ai-generated/${userId}/${type}/${timestamp}-${uniqueId}.png`;

    // Upload to Firebase Storage
    const bucket = getStorage().bucket();
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          generatedBy: 'dalle-3',
          userId,
          type,
          timestamp: timestamp.toString(),
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    logger.info('Image uploaded to storage', {
      filename,
      publicUrl,
      userId,
      type,
    });

    return {
      success: true,
      publicUrl,
      storagePath: filename,
    };
  } catch (error) {
    logger.error('Storage upload failed', { error, imageUrl, userId });
    return {
      success: false,
      error: String(error),
    };
  }
}
```
  - **Success Criteria:**
    - [ ] Downloads image from URL
    - [ ] Uploads to Firebase Storage under `ai-generated/{userId}/{type}/`
    - [ ] Makes file publicly accessible
    - [ ] Returns public URL
  - **Tests:**
    1. Call with mock image URL
    2. Verify file exists in Storage
    3. Verify public URL is accessible
  - **Edge Cases:**
    - ⚠️ Download fails: Retry once, then return error
    - ⚠️ Storage quota exceeded: Catch and return friendly error
    - ⚠️ Network timeout: Set 30s timeout

### 1.2: AI Tools for Image Generation

#### 1.2.1 Create GenerateAppIconTool
- [ ] **Action:** Create `functions/src/ai/tools/generateAppIcon.ts`
  - **Why:** AI tool for generating app icons via natural language
  - **Files Modified:**
    - Create: `functions/src/ai/tools/generateAppIcon.ts`
  - **Implementation Details:**
```typescript
import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';
import { generateImage, enhancePrompt } from '../../services/image-generation';
import { uploadImageFromUrl } from '../../services/storage-upload';
import { createCanvasObject } from '../../services/canvas-objects';
import * as logger from 'firebase-functions/logger';

const GenerateAppIconSchema = z.object({
  description: z.string()
    .min(3)
    .max(200)
    .describe('Description of the app icon to generate (e.g., "a coffee cup", "a fitness tracker")'),
});

export class GenerateAppIconTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'generateAppIcon',
      'Generate professional app icons for iOS and Android from a text description. ' +
      'Creates two icons: iOS (1024x1024) and Android (512x512) with automatic prompt enhancement.',
      GenerateAppIconSchema,
      context
    );
  }

  async execute(input: z.infer<typeof GenerateAppIconSchema>): Promise<ToolResult> {
    try {
      logger.info('Generating app icon', { description: input.description });

      // Enhance prompt with professional design principles
      const enhancedPrompt = enhancePrompt(input.description, 'icon');

      // Generate iOS icon (1024x1024)
      const imageResult = await generateImage({
        prompt: enhancedPrompt,
        type: 'icon',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });

      if (!imageResult.success || !imageResult.imageUrl) {
        return {
          success: false,
          error: imageResult.error || 'Image generation failed',
          message: 'Failed to generate app icon',
        };
      }

      // Upload to Firebase Storage
      const uploadResult = await uploadImageFromUrl(
        imageResult.imageUrl,
        this.context.userId,
        'icon'
      );

      if (!uploadResult.success || !uploadResult.publicUrl) {
        return {
          success: false,
          error: uploadResult.error || 'Storage upload failed',
          message: 'Failed to save app icon',
        };
      }

      // Determine placement (viewport center or canvas center)
      let startX: number;
      let startY: number;

      if (this.context.viewportBounds) {
        startX = this.context.viewportBounds.centerX - 612; // Half of total width
        startY = this.context.viewportBounds.centerY - 512; // Center vertically
      } else {
        startX = this.context.canvasSize.width / 2 - 612;
        startY = this.context.canvasSize.height / 2 - 512;
      }

      // Extract keyword from description (first 2 words)
      const keyword = input.description.split(' ').slice(0, 2).join(' ');

      // Create iOS icon (1024x1024) on canvas
      const iosIconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: startX, y: startY },
        dimensions: { width: 1024, height: 1024 },
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        name: `iOS - ${keyword}`,
        userId: this.context.userId,
      });

      // Create Android icon (512x512) on canvas - positioned to the right
      const androidIconId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: startX + 1024 + 100, y: startY + 256 }, // Vertically centered
        dimensions: { width: 512, height: 512 },
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        name: `Android - ${keyword}`,
        userId: this.context.userId,
      });

      logger.info('App icons created', {
        iosIconId,
        androidIconId,
        publicUrl: uploadResult.publicUrl,
      });

      return {
        success: true,
        message: `Created iOS (1024x1024) and Android (512x512) app icons for "${keyword}"`,
        objectsCreated: [iosIconId, androidIconId],
        data: {
          iosIconId,
          androidIconId,
          imageUrl: uploadResult.publicUrl,
          revisedPrompt: imageResult.revisedPrompt,
        },
      };
    } catch (error) {
      logger.error('GenerateAppIconTool failed', { error, input });
      return {
        success: false,
        error: String(error),
        message: 'Failed to generate app icon',
      };
    }
  }
}
```
  - **Success Criteria:**
    - [ ] Tool registered with LangChain
    - [ ] Generates 1024x1024 icon
    - [ ] Uploads to Firebase Storage
    - [ ] Creates iOS icon on canvas (1024x1024)
    - [ ] Creates Android icon on canvas (512x512)
    - [ ] Labels with "iOS - keyword" and "Android - keyword"
  - **Tests:**
    1. Invoke tool with `{ description: "coffee cup" }`
    2. Verify DALL-E 3 called with enhanced prompt
    3. Verify two canvas objects created
    4. Verify proper sizing and placement
  - **Edge Cases:**
    - ⚠️ Very long description: Truncate to 200 chars
    - ⚠️ Generation fails: Return clear error to user
    - ⚠️ Canvas overlap: Use existing collision detection

#### 1.2.2 Create GenerateFeatureGraphicTool
- [ ] **Action:** Create `functions/src/ai/tools/generateFeatureGraphic.ts`
  - **Why:** AI tool for generating Google Play feature graphics
  - **Files Modified:**
    - Create: `functions/src/ai/tools/generateFeatureGraphic.ts`
  - **Implementation Details:**
```typescript
import { z } from 'zod';
import { CanvasTool } from './base';
import { ToolResult, CanvasToolContext } from './types';
import { generateImage, enhancePrompt } from '../../services/image-generation';
import { uploadImageFromUrl } from '../../services/storage-upload';
import { createCanvasObject } from '../../services/canvas-objects';
import * as logger from 'firebase-functions/logger';

const GenerateFeatureGraphicSchema = z.object({
  description: z.string()
    .min(3)
    .max(200)
    .describe('Description of the feature graphic to generate (e.g., "fitness app with running theme", "food delivery service")'),
});

export class GenerateFeatureGraphicTool extends CanvasTool {
  constructor(context: CanvasToolContext) {
    super(
      'generateFeatureGraphic',
      'Generate a professional Google Play Store feature graphic (1024x500) from a text description. ' +
      'Creates a wide landscape image optimized for video overlay and store visibility.',
      GenerateFeatureGraphicSchema,
      context
    );
  }

  async execute(input: z.infer<typeof GenerateFeatureGraphicSchema>): Promise<ToolResult> {
    try {
      logger.info('Generating feature graphic', { description: input.description });

      // Enhance prompt with professional design principles
      const enhancedPrompt = enhancePrompt(input.description, 'feature');

      // Generate feature graphic (1024x1792 then crop to 1024x500)
      // Use 1024x1792 for better horizontal composition
      const imageResult = await generateImage({
        prompt: enhancedPrompt,
        type: 'feature',
        size: '1792x1024', // Landscape format
        quality: 'hd',
        style: 'vivid',
      });

      if (!imageResult.success || !imageResult.imageUrl) {
        return {
          success: false,
          error: imageResult.error || 'Image generation failed',
          message: 'Failed to generate feature graphic',
        };
      }

      // Upload to Firebase Storage
      const uploadResult = await uploadImageFromUrl(
        imageResult.imageUrl,
        this.context.userId,
        'feature'
      );

      if (!uploadResult.success || !uploadResult.publicUrl) {
        return {
          success: false,
          error: uploadResult.error || 'Storage upload failed',
          message: 'Failed to save feature graphic',
        };
      }

      // Determine placement (viewport center or canvas center)
      let startX: number;
      let startY: number;

      if (this.context.viewportBounds) {
        startX = this.context.viewportBounds.centerX - 896; // Half of 1792
        startY = this.context.viewportBounds.centerY - 512; // Half of 1024
      } else {
        startX = this.context.canvasSize.width / 2 - 896;
        startY = this.context.canvasSize.height / 2 - 512;
      }

      // Extract keyword from description (first 2 words)
      const keyword = input.description.split(' ').slice(0, 2).join(' ');

      // Create feature graphic on canvas
      const featureGraphicId = await createCanvasObject({
        canvasId: this.context.canvasId,
        type: 'image',
        position: { x: startX, y: startY },
        dimensions: { width: 1792, height: 1024 }, // Use generated size
        appearance: {},
        imageUrl: uploadResult.publicUrl,
        name: `Feature - ${keyword}`,
        userId: this.context.userId,
      });

      logger.info('Feature graphic created', {
        featureGraphicId,
        publicUrl: uploadResult.publicUrl,
      });

      return {
        success: true,
        message: `Created feature graphic (1792x1024) for "${keyword}"`,
        objectsCreated: [featureGraphicId],
        data: {
          featureGraphicId,
          imageUrl: uploadResult.publicUrl,
          revisedPrompt: imageResult.revisedPrompt,
        },
      };
    } catch (error) {
      logger.error('GenerateFeatureGraphicTool failed', { error, input });
      return {
        success: false,
        error: String(error),
        message: 'Failed to generate feature graphic',
      };
    }
  }
}
```
  - **Success Criteria:**
    - [ ] Tool registered with LangChain
    - [ ] Generates 1792x1024 landscape image
    - [ ] Uploads to Firebase Storage
    - [ ] Creates single object on canvas
    - [ ] Labels with "Feature - keyword"
  - **Tests:**
    1. Invoke tool with `{ description: "fitness app" }`
    2. Verify DALL-E 3 called with enhanced prompt
    3. Verify canvas object created with correct dimensions
  - **Edge Cases:**
    - ⚠️ Very long description: Truncate to 200 chars
    - ⚠️ Generation fails: Return clear error to user

#### 1.2.3 Register Tools in Index
- [ ] **Action:** Update `functions/src/ai/tools/index.ts` to register new tools
  - **Why:** Make tools available to LangGraph agent
  - **Files Modified:**
    - Update: `functions/src/ai/tools/index.ts`
  - **Implementation Details:**
```typescript
import { GenerateAppIconTool } from './generateAppIcon';
import { GenerateFeatureGraphicTool } from './generateFeatureGraphic';

export function getTools(context: CanvasToolContext): DynamicStructuredTool[] {
  const tools = [
    // ... existing tools

    // Image generation tools
    new GenerateAppIconTool(context),
    new GenerateFeatureGraphicTool(context),
  ];

  return tools.map((tool) => tool.getTool());
}
```
  - **Success Criteria:**
    - [ ] Both tools exported from index
    - [ ] Tools available in LangGraph agent
  - **Tests:**
    1. Call `getTools(mockContext)`
    2. Verify array includes new tools
    3. Test end-to-end via Firebase Function

---

## Phase 2: Frontend - Command Autocomplete (4-5 hours)

### 2.1: Command Detection & Autocomplete

#### 2.1.1 Create Command Parser Utility
- [ ] **Action:** Create `src/features/ai-agent/utils/commandParser.ts`
  - **Why:** Parse and detect `/icon` and `/feature` commands
  - **Files Modified:**
    - Create: `src/features/ai-agent/utils/commandParser.ts`
  - **Implementation Details:**
```typescript
/**
 * Available AI commands
 */
export const AI_COMMANDS = [
  {
    command: '/icon',
    description: 'Generate iOS & Android app icons',
    example: '/icon a coffee cup',
  },
  {
    command: '/feature',
    description: 'Generate Android feature graphic',
    example: '/feature fitness app with running theme',
  },
] as const;

/**
 * Check if input contains a command prefix
 */
export function hasCommandPrefix(input: string): boolean {
  return input.trim().startsWith('/');
}

/**
 * Get command suggestions based on current input
 */
export function getCommandSuggestions(input: string) {
  if (!hasCommandPrefix(input)) return [];

  const query = input.trim().toLowerCase();

  return AI_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().startsWith(query) ||
    cmd.command === query.split(' ')[0]
  );
}

/**
 * Extract command and description from input
 */
export function parseCommand(input: string): { command: string; description: string } | null {
  const trimmed = input.trim();

  if (!hasCommandPrefix(trimmed)) return null;

  const parts = trimmed.split(' ');
  const command = parts[0];
  const description = parts.slice(1).join(' ');

  // Validate command
  const isValid = AI_COMMANDS.some(cmd => cmd.command === command);
  if (!isValid || !description) return null;

  return { command, description };
}
```
  - **Success Criteria:**
    - [ ] `hasCommandPrefix('/icon')` returns `true`
    - [ ] `getCommandSuggestions('/ic')` returns `/icon`
    - [ ] `parseCommand('/icon coffee')` returns `{ command: '/icon', description: 'coffee' }`
  - **Tests:**
    1. Test `hasCommandPrefix` with various inputs
    2. Test `getCommandSuggestions` with partial matches
    3. Test `parseCommand` with valid/invalid commands

#### 2.1.2 Create Command Autocomplete Component
- [ ] **Action:** Create `src/features/ai-agent/components/CommandAutocomplete.tsx`
  - **Why:** Display command suggestions inline
  - **Files Modified:**
    - Create: `src/features/ai-agent/components/CommandAutocomplete.tsx`
  - **Implementation Details:**
```typescript
import { cn } from '@/lib/utils';
import { AI_COMMANDS } from '../utils/commandParser';

interface CommandAutocompleteProps {
  suggestions: typeof AI_COMMANDS;
  selectedIndex: number;
  onSelect: (command: string) => void;
}

/**
 * Command autocomplete dropdown
 * Shows when user types `/` in AI input
 */
export function CommandAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
}: CommandAutocompleteProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.command}
          onClick={() => onSelect(suggestion.command)}
          className={cn(
            'w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors',
            selectedIndex === index && 'bg-blue-50'
          )}
        >
          <div className="font-medium text-sm text-gray-900">
            {suggestion.command}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {suggestion.description}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 font-mono">
            {suggestion.example}
          </div>
        </button>
      ))}
    </div>
  );
}
```
  - **Success Criteria:**
    - [ ] Component renders suggestion list
    - [ ] Highlights selected suggestion
    - [ ] Handles click to select
  - **Tests:**
    1. Render with mock suggestions
    2. Verify list displays correctly
    3. Click suggestion, verify callback

#### 2.1.3 Update ChatInput with Autocomplete
- [ ] **Action:** Update `src/features/ai-agent/components/ChatInput.tsx`
  - **Why:** Integrate autocomplete into existing input
  - **Files Modified:**
    - Update: `src/features/ai-agent/components/ChatInput.tsx`
  - **Implementation Details:**
```typescript
import { useState, useEffect, useRef } from 'react';
import { getCommandSuggestions, parseCommand } from '../utils/commandParser';
import { CommandAutocomplete } from './CommandAutocomplete';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { sendCommand, isProcessing } = useAIAgent();

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = getCommandSuggestions(input);
    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle autocomplete navigation
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Tab' && suggestions.length > 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        setInput(selected.command + ' ');
        setSuggestions([]);
      }
    }

    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectSuggestion = (command: string) => {
    setInput(command + ' ');
    setSuggestions([]);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 relative">
      <CommandAutocomplete
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        onSelect={handleSelectSuggestion}
      />
      {/* Existing textarea */}
    </form>
  );
}
```
  - **Success Criteria:**
    - [ ] Autocomplete appears when typing `/`
    - [ ] Arrow keys navigate suggestions
    - [ ] Tab key completes selected suggestion
    - [ ] Clicking suggestion completes it
  - **Tests:**
    1. Type `/`, verify autocomplete appears
    2. Press ArrowDown, verify selection changes
    3. Press Tab, verify input updated
    4. Click suggestion, verify input updated

---

## Phase 3: Integration & Testing (3-4 hours)

### 3.1: End-to-End Testing

#### 3.1.1 Test Icon Generation Flow
- [ ] **Action:** Manual E2E testing of icon generation
  - **Why:** Verify complete flow from command to canvas
  - **Test Procedure:**
    1. Open AI chat panel
    2. Type `/icon` and verify autocomplete appears
    3. Complete command: `/icon coffee cup`
    4. Submit and verify:
       - Loading state shown
       - Success message appears
       - Two images appear on canvas (iOS 1024x1024, Android 512x512)
       - Images labeled "iOS - coffee cup" and "Android - coffee cup"
       - Images spaced 100px apart horizontally
    5. Check Firebase Storage for uploaded image
  - **Success Criteria:**
    - [ ] Autocomplete works smoothly
    - [ ] Icons generated and placed correctly
    - [ ] Labels accurate
    - [ ] Spacing correct (100px)

#### 3.1.2 Test Feature Graphic Generation Flow
- [ ] **Action:** Manual E2E testing of feature graphic generation
  - **Why:** Verify complete flow from command to canvas
  - **Test Procedure:**
    1. Open AI chat panel
    2. Type `/feature` and verify autocomplete appears
    3. Complete command: `/feature fitness app running theme`
    4. Submit and verify:
       - Loading state shown
       - Success message appears
       - One landscape image appears on canvas (1792x1024)
       - Image labeled "Feature - fitness app"
    5. Check Firebase Storage for uploaded image
  - **Success Criteria:**
    - [ ] Autocomplete works smoothly
    - [ ] Feature graphic generated and placed correctly
    - [ ] Label accurate
    - [ ] Landscape orientation correct

#### 3.1.3 Test Error Scenarios
- [ ] **Action:** Test error handling
  - **Test Procedure:**
    1. Test with invalid command: `/invalid test`
    2. Test with empty description: `/icon`
    3. Test with very long description (>200 chars)
    4. Test without OpenAI API key (temporarily remove)
    5. Test with storage quota exceeded (mock)
  - **Success Criteria:**
    - [ ] Invalid command: Shows "Unknown command" error
    - [ ] Empty description: Shows "Description required" error
    - [ ] Long description: Truncates to 200 chars, generates successfully
    - [ ] API error: Shows clear error message to user
    - [ ] Storage error: Shows clear error message to user

### 3.2: Performance & Cost Testing

#### 3.2.1 Measure Generation Times
- [ ] **Action:** Log and analyze generation times
  - **Why:** Ensure reasonable user experience
  - **Test Procedure:**
    1. Generate 10 icons, measure average time
    2. Generate 10 feature graphics, measure average time
    3. Analyze breakdown: DALL-E 3 time vs upload time vs canvas creation
  - **Success Criteria:**
    - [ ] Icon generation: < 20 seconds total
    - [ ] Feature graphic generation: < 20 seconds total
    - [ ] Breakdown logged clearly

#### 3.2.2 Calculate Cost Per Generation
- [ ] **Action:** Document generation costs
  - **Why:** Understand operational costs
  - **Calculations:**
    - Icon generation: $0.04 per icon (DALL-E 3 1024x1024 HD)
    - Feature graphic: $0.08 per graphic (DALL-E 3 1792x1024 HD)
    - Storage: ~$0.026 per GB/month
  - **Success Criteria:**
    - [ ] Costs documented in analytics
    - [ ] Consider rate limiting (e.g., 10 generations/day per user)

### 3.3: Documentation

#### 3.3.1 Update AI System Documentation
- [ ] **Action:** Update `_docs/architecture/ai-system.md`
  - **Why:** Document new capabilities
  - **Content:**
    - Add image generation tools section
    - Document DALL-E 3 integration
    - Document Firebase Storage integration
    - Document command syntax
    - Document prompt enhancement strategy
  - **Success Criteria:**
    - [ ] Documentation complete and accurate
    - [ ] Examples provided

#### 3.3.2 Update CLAUDE.md
- [ ] **Action:** Update project instructions for future AI sessions
  - **Why:** Inform future development
  - **Content:**
    - Add image generation commands to AI capabilities
    - Document command syntax
    - Document Firebase Storage structure
  - **Success Criteria:**
    - [ ] CLAUDE.md updated with new features

---

## Phase 4: Polish & Optimization (3-4 hours)

### 4.1: UX Improvements

#### 4.1.1 Add Generation Progress Indicator
- [ ] **Action:** Show progress during image generation
  - **Why:** Long wait times need feedback
  - **Implementation:**
    - Show "Generating image..." message
    - Show "Uploading to storage..." message
    - Show "Placing on canvas..." message
  - **Success Criteria:**
    - [ ] Progress messages shown
    - [ ] User understands what's happening

#### 4.1.2 Add Preview Thumbnails in Chat
- [ ] **Action:** Show generated image preview in chat message
  - **Why:** Confirm what was generated
  - **Implementation:**
    - Add image preview to success message
    - Show small thumbnails (100x100)
    - Link to full-size on canvas
  - **Success Criteria:**
    - [ ] Thumbnails shown in chat
    - [ ] Clicking jumps to canvas location

### 4.2: Advanced Features (Optional)

#### 4.2.1 Add Style Parameter
- [ ] **Action:** Allow users to specify style (vivid vs natural)
  - **Why:** More control over output
  - **Syntax:** `/icon coffee cup --style natural`
  - **Success Criteria:**
    - [ ] Style parameter parsed
    - [ ] Passed to DALL-E 3

#### 4.2.2 Add Regeneration Command
- [ ] **Action:** Allow users to regenerate with same prompt
  - **Why:** Sometimes results aren't perfect
  - **Syntax:** `regenerate last icon`
  - **Success Criteria:**
    - [ ] Regeneration works
    - [ ] Uses same prompt

---

## Rollback Strategy

If issues arise during implementation:

### Phase 1 Rollback
- Remove new files: `image-generation.ts`, `storage-upload.ts`, tool files
- Remove tool registrations from `index.ts`
- No frontend changes yet, safe to rollback

### Phase 2 Rollback
- Revert `ChatInput.tsx` to previous version
- Remove new files: `commandParser.ts`, `CommandAutocomplete.tsx`
- Backend remains functional

### Phase 3+ Rollback
- Remove tools from backend
- Revert frontend changes
- Clean up Firebase Storage test images

---

## Future Enhancements

- [ ] Add image editing commands (resize, crop, filter)
- [ ] Support multiple image styles (3D, flat, gradient, etc.)
- [ ] Add batch generation (multiple variations)
- [ ] Add image-to-image variation
- [ ] Add custom dimension support
- [ ] Add image history/gallery
- [ ] Add cost tracking per user
- [ ] Add generation rate limiting
- [ ] Add DALL-E 2 fallback for cost savings
- [ ] Add SVG generation support

---

## Notes

- **OpenAI API key**: Already configured in Firebase Functions
- **Firebase Storage**: Already configured for image uploads
- **Cost consideration**: DALL-E 3 is $0.04-0.08 per image; consider rate limiting
- **Image URLs**: OpenAI URLs expire after 1 hour; must upload to Storage immediately
- **Prompt enhancement**: Based on 2025 app store design trends
- **Canvas placement**: Uses existing viewport-aware positioning
- **Image type**: Existing ImageShape component supports this

---

**Status**: Ready for implementation
**Priority**: Medium-High
**Risk Level**: Low (builds on existing systems)
