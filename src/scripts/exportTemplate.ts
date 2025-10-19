/**
 * Template Export Script
 *
 * Exports canvas objects from a Firebase project to create a default template.
 * Downloads images to /public/templates/ and generates template JSON.
 *
 * Usage: npm run export-template
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, ref as storageRef, getDownloadURL, connectStorageEmulator } from 'firebase/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as dotenv from 'dotenv';
import type { CanvasObject, ImageObject } from '../types/canvas.types';

// Load environment variables from .env.development (where template project exists)
// Use --prod flag to load from .env.production instead
const envFile = process.argv.includes('--prod') ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
console.log(`📄 Loading config from: ${envFile}\n`);

// Firebase config for dev environment
// Use emulator-compatible database URL
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'dev-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'http://localhost:9000?ns=demo-project',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_FIREBASE_APP_ID || 'dev-app-id',
};

// Template project ID (dev environment)
const TEMPLATE_PROJECT_ID = '4e08256c-d03d-49ac-9f96-86e15740931b';

// Output paths
const PUBLIC_TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates');
const TEMPLATE_JSON_PATH = path.join(process.cwd(), 'src', 'lib', 'templates', 'default-template.json');

/**
 * Download file from URL to local path
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, outputPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => reject(err));
      });
    }).on('error', reject);
  });
}

/**
 * Convert data URL to file
 */
async function dataURLToFile(dataURL: string, outputPath: string): Promise<void> {
  const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL');
  }

  const buffer = Buffer.from(matches[2], 'base64');
  await fs.promises.writeFile(outputPath, buffer);
}

/**
 * Sanitize filename for filesystem
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Process image object: download image and update src path
 */
async function processImageObject(obj: ImageObject, imageIndex: number): Promise<ImageObject> {
  const ext = obj.mimeType === 'image/svg+xml' ? 'svg' :
              obj.mimeType === 'image/png' ? 'png' :
              obj.mimeType === 'image/jpeg' ? 'jpg' : 'png';

  const sanitizedName = sanitizeFilename(obj.fileName || `image-${imageIndex}`);
  const filename = `${path.parse(sanitizedName).name}.${ext}`;
  const outputPath = path.join(PUBLIC_TEMPLATES_DIR, filename);

  console.log(`  📥 Downloading image: ${obj.fileName} → ${filename}`);

  try {
    if (obj.src.startsWith('data:')) {
      // Convert data URL to file
      await dataURLToFile(obj.src, outputPath);
    } else if (obj.src.startsWith('http')) {
      // Download from URL
      await downloadFile(obj.src, outputPath);
    } else {
      console.warn(`  ⚠️  Skipping unknown image source: ${obj.src.substring(0, 50)}...`);
      return obj;
    }

    console.log(`  ✓ Saved to /public/templates/${filename}`);

    // Update object to reference public folder
    return {
      ...obj,
      src: `\${window.location.origin}/templates/${filename}`,
      storageType: 'dataURL', // Treat as static asset
      storagePath: undefined, // Remove storage path
    };
  } catch (error) {
    console.error(`  ❌ Failed to download ${obj.fileName}:`, error);
    throw error;
  }
}

/**
 * Sanitize canvas object for template
 */
function sanitizeObject(obj: CanvasObject): CanvasObject {
  return {
    ...obj,
    createdBy: 'system',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Main export function
 */
async function exportTemplate(): Promise<void> {
  console.log('🚀 Starting template export...\n');

  // Initialize Firebase
  console.log('🔧 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const storage = getStorage(app);

  // Check if we should use emulators or live Firebase
  const useEmulator = process.env.USE_EMULATOR === 'true';

  if (useEmulator) {
    console.log('🔌 Connecting to Firebase emulators...');
    connectDatabaseEmulator(database, 'localhost', 9000);
    connectStorageEmulator(storage, 'localhost', 9199);
  } else {
    console.log('🔌 Connecting to live Firebase database...');
  }

  // Fetch objects from project
  console.log(`\n📦 Fetching objects from project: ${TEMPLATE_PROJECT_ID}`);

  const objectsRef = ref(database, `canvases/${TEMPLATE_PROJECT_ID}/objects`);
  const snapshot = await get(objectsRef);

  if (!snapshot.exists()) {
    console.error(`\n❌ Project ${TEMPLATE_PROJECT_ID} not found in database.`);

    // Try to list available canvases for debugging
    const canvasesRef = ref(database, 'canvases');
    const canvasesSnapshot = await get(canvasesRef);

    if (canvasesSnapshot.exists()) {
      const allCanvases = Object.keys(canvasesSnapshot.val() || {});
      console.log(`\n   Found ${allCanvases.length} other canvases in database`);
      console.log('   First 5:', allCanvases.slice(0, 5).join(', '));
    }

    throw new Error(`No objects found for project ${TEMPLATE_PROJECT_ID}`);
  }

  const objectsMap = snapshot.val() as Record<string, CanvasObject>;
  const objects = Object.values(objectsMap);
  console.log(`✓ Found ${objects.length} objects`);

  // Create output directories
  console.log('\n📁 Creating output directories...');
  await fs.promises.mkdir(PUBLIC_TEMPLATES_DIR, { recursive: true });
  await fs.promises.mkdir(path.dirname(TEMPLATE_JSON_PATH), { recursive: true });

  // Process images
  console.log('\n🖼️  Processing images...');
  const processedObjects: CanvasObject[] = [];
  let imageIndex = 0;

  for (const obj of objects) {
    if (obj.type === 'image') {
      const processed = await processImageObject(obj as ImageObject, imageIndex++);
      processedObjects.push(sanitizeObject(processed));
    } else {
      processedObjects.push(sanitizeObject(obj));
    }
  }

  // Sort by z-index to preserve layer order
  console.log('\n📊 Sorting objects by z-index...');
  processedObjects.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  // Export to JSON
  console.log('\n💾 Exporting template JSON...');
  const templateData = {
    version: 1,
    exported: new Date().toISOString(),
    sourceProjectId: TEMPLATE_PROJECT_ID,
    objectCount: processedObjects.length,
    objects: processedObjects,
  };

  await fs.promises.writeFile(
    TEMPLATE_JSON_PATH,
    JSON.stringify(templateData, null, 2),
    'utf-8'
  );

  console.log(`✓ Template exported to: ${TEMPLATE_JSON_PATH}`);
  console.log(`✓ Images saved to: ${PUBLIC_TEMPLATES_DIR}`);
  console.log(`\n✅ Export complete! Exported ${processedObjects.length} objects.`);
}

// Run export
exportTemplate().catch((error) => {
  console.error('\n❌ Export failed:', error);
  process.exit(1);
});
