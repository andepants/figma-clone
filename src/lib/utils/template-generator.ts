/**
 * Template Generator Utility
 *
 * Auto-generates starter canvas objects for new projects:
 * 1. App Icons Template (iOS 1024x1024 + Android 512x512 rectangles)
 * 2. Feature Graphic Template (1024x500 graphic with text and iPhone mockup)
 *
 * All templates are generated client-side and written directly to Firebase RTDB.
 */

import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase/realtimedb';
import type { CanvasObject, Rectangle, Text, ImageObject } from '@/types/canvas.types';

/**
 * Generate App Icons Template
 *
 * Creates:
 * - iOS rectangle (1024x1024) at x: 100, y: 100
 * - Android rectangle (512x512) at x: 1324, y: 100 (200px gap)
 * - "iOS 1024x1024" label above iOS rect
 * - "Android 512x512" label above Android rect
 *
 * Total: 4 objects (2 labels + 2 rectangles)
 */
function generateAppIconsTemplate(): CanvasObject[] {
  const timestamp = Date.now();
  const objects: CanvasObject[] = [];

  // iOS Label
  const iosLabel: Text = {
    id: crypto.randomUUID(),
    type: 'text',
    x: 100,
    y: 20,
    width: 1024,
    height: 120,
    fill: '#000000',
    text: 'iOS 1024x1024',
    fontSize: 60,
    fontFamily: 'Inter',
    name: 'iOS Label',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(iosLabel);

  // iOS Rectangle
  const iosRect: Rectangle = {
    id: crypto.randomUUID(),
    type: 'rectangle',
    x: 100,
    y: 180,
    width: 1024,
    height: 1024,
    fill: '#E5E7EB',
    stroke: '#9CA3AF',
    strokeWidth: 2,
    name: 'iOS App Icon',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(iosRect);

  // Android Label
  const androidLabel: Text = {
    id: crypto.randomUUID(),
    type: 'text',
    x: 1324,
    y: 276,
    width: 512,
    height: 120,
    fill: '#000000',
    text: 'Android 512x512',
    fontSize: 60,
    fontFamily: 'Inter',
    name: 'Android Label',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(androidLabel);

  // Android Rectangle (vertically centered with iOS rect)
  const androidRect: Rectangle = {
    id: crypto.randomUUID(),
    type: 'rectangle',
    x: 1324,
    y: 436,
    width: 512,
    height: 512,
    fill: '#E5E7EB',
    stroke: '#9CA3AF',
    strokeWidth: 2,
    name: 'Android App Icon',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(androidRect);

  return objects;
}

/**
 * Generate Feature Graphic Template
 *
 * Creates 1024x500 Google Play feature graphic with:
 * - Size label (1024x500)
 * - Gray background rectangle (1024x500)
 * - Screenshot inside iPhone frame
 * - iPhone 15 Pro frame image (right side, with Dynamic Island)
 * - "Your App Name" text (large, centered-left, ABOVE background)
 * - "Your Tagline Here" text (smaller, below app name, ABOVE background)
 *
 * Layout positions all elements below app icons template with 300px gap
 * Total: 6 objects (1 label + 1 bg + 2 images + 2 text)
 *
 * Z-index ordering ensures text appears above background rectangle
 */
function generateFeatureGraphicTemplate(): CanvasObject[] {
  const timestamp = Date.now();
  const objects: CanvasObject[] = [];
  const startY = 1504; // 180 + 1024 + 300 (label y + iOS height + gap)

  // Z-INDEX ORDER (first = back/bottom of layers panel, last = front/top of layers panel):
  // 1. Background Rectangle (bottom layer, bottom of layers panel)
  // 2. Feature Graphic Label (above background)
  // 3. Screenshot (inside iPhone frame, below frame border)
  // 4. iPhone Frame (border on top of screenshot)
  // 5. App Name Text (above background)
  // 6. Tagline Text (top layer, top of layers panel)

  // Background Rectangle (FIRST - bottom layer, appears at BOTTOM of layers panel)
  const background: Rectangle = {
    id: crypto.randomUUID(),
    type: 'rectangle',
    x: 100,
    y: startY,
    width: 1024,
    height: 500,
    fill: '#6B7280',
    stroke: '#4B5563',
    strokeWidth: 2,
    name: 'Feature Graphic Background',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(background);

  // Feature Graphic Label (SECOND - above background)
  const featureGraphicLabel: Text = {
    id: crypto.randomUUID(),
    type: 'text',
    x: 100,
    y: startY - 100,
    width: 1024,
    height: 80,
    fill: '#000000',
    text: 'Feature Graphic 1024x500',
    fontSize: 60,
    fontFamily: 'Inter',
    name: 'Feature Graphic Label',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(featureGraphicLabel);

  // Screenshot (THIRD - inside iPhone frame, below frame border)
  const screenshot: ImageObject = {
    id: crypto.randomUUID(),
    type: 'image',
    x: 744,
    y: startY + 70,
    width: 260,
    height: 560,
    src: `${window.location.origin}/templates/screenshot-placeholder.svg`,
    naturalWidth: 260,
    naturalHeight: 560,
    fileName: 'screenshot-placeholder.svg',
    fileSize: 0,
    mimeType: 'image/svg+xml',
    storageType: 'dataURL',
    name: 'Screenshot',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(screenshot);

  // iPhone Frame (FOURTH - border on top of screenshot)
  // NOTE: Images loaded from /public folder via relative URL
  // fileSize: 0 is allowed for template images (validation rule updated)
  // Using SVG for crisp rendering at any scale
  const iphoneFrame: ImageObject = {
    id: crypto.randomUUID(),
    type: 'image',
    x: 724,
    y: startY + 50,
    width: 300,
    height: 600,
    src: `${window.location.origin}/templates/iphone-frame.svg`,
    naturalWidth: 300,
    naturalHeight: 600,
    fileName: 'iphone-frame.svg',
    fileSize: 0,
    mimeType: 'image/svg+xml',
    storageType: 'dataURL',
    name: 'iPhone Frame',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(iphoneFrame);

  // App Name Text (FIFTH - above background and phone)
  const appName: Text = {
    id: crypto.randomUUID(),
    type: 'text',
    x: 150,
    y: startY + 120,
    width: 500,
    height: 120,
    fill: '#FFFFFF',
    text: 'Your App Name',
    fontSize: 80,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    name: 'App Name',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(appName);

  // Tagline Text (SIXTH - top layer)
  const tagline: Text = {
    id: crypto.randomUUID(),
    type: 'text',
    x: 150,
    y: startY + 270,
    width: 500,
    height: 120,
    fill: '#F3F4F6',
    text: 'Your Tagline Here',
    fontSize: 30,
    fontFamily: 'Inter',
    name: 'Tagline',
    createdBy: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  objects.push(tagline);

  return objects;
}

/**
 * Deep clone a canvas object
 *
 * Creates a deep copy of a canvas object with a new unique ID.
 * This ensures each project gets completely independent template objects
 * that won't affect other projects when edited.
 *
 * @param obj - Canvas object to clone
 * @returns Deep copy with new UUID
 */
function deepCloneCanvasObject(obj: CanvasObject): CanvasObject {
  // Parse and stringify to create a deep copy
  const cloned = JSON.parse(JSON.stringify(obj)) as CanvasObject;

  // Generate new unique ID for the clone
  cloned.id = crypto.randomUUID();

  return cloned;
}

/**
 * Generate Template Objects for New Project
 *
 * Creates starter canvas objects for every new project:
 * 1. App Icons Template (4 objects: 2 labels + 2 rectangles)
 * 2. Feature Graphic Template (6 objects: 1 label + 1 bg + 2 text + 2 images)
 *
 * Total: 10 canvas objects written to Firebase RTDB
 *
 * IMPORTANT: Each project gets completely independent copies of template objects.
 * Editing template objects in one project will NOT affect other projects.
 *
 * @param projectId - Firebase project ID
 * @throws Error if Firebase write fails
 */
export async function generateTemplateObjects(projectId: string): Promise<void> {
  try {
    // Generate fresh template objects for this project
    // NOTE: Even though we call these functions, we'll deep clone the results
    // to ensure absolute independence between projects
    const appIconObjects = generateAppIconsTemplate();
    const featureGraphicObjects = generateFeatureGraphicTemplate();

    // Deep clone all objects to ensure complete independence
    // This guarantees that editing objects in one project won't affect templates
    const allObjects = [
      ...appIconObjects.map(deepCloneCanvasObject),
      ...featureGraphicObjects.map(deepCloneCanvasObject)
    ];

    // Convert array to Firebase object structure
    // Firebase RTDB stores objects as { [id]: object } not arrays
    const objectsMap: Record<string, CanvasObject> = {};
    allObjects.forEach((obj) => {
      objectsMap[obj.id] = obj;
    });

    // Write to Firebase RTDB: /canvases/{projectId}/objects
    const objectsRef = ref(realtimeDb, `canvases/${projectId}/objects`);
    await set(objectsRef, objectsMap);
  } catch (error) {
    console.error('❌ Failed to generate template objects:', error);
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
