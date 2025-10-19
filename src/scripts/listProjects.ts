/**
 * List Projects Script
 *
 * Lists all projects/canvases in Firebase to help find the correct template project ID.
 *
 * Usage: npm run list-projects
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import * as dotenv from 'dotenv';

// Load environment variables from .env.development by default
// Use --prod flag to load from .env.production instead
const envFile = process.argv.includes('--prod') ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
console.log(`📄 Loading config from: ${envFile}\n`);

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'dev-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'http://localhost:9000?ns=demo-project',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_FIREBASE_APP_ID || 'dev-app-id',
};

async function listProjects(): Promise<void> {
  console.log('🔍 Listing all projects in Firebase...\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  console.log('🔌 Connecting to live Firebase database...\n');

  // Fetch all canvases
  const canvasesRef = ref(database, 'canvases');
  const snapshot = await get(canvasesRef);

  if (!snapshot.exists()) {
    console.log('❌ No canvases found in database.');
    return;
  }

  const canvases = snapshot.val() as Record<string, any>;
  const canvasIds = Object.keys(canvases);

  console.log(`✓ Found ${canvasIds.length} canvases:\n`);

  for (const canvasId of canvasIds) {
    const objectCount = Object.keys(canvases[canvasId].objects || {}).length;
    console.log(`  📦 ${canvasId}`);
    console.log(`     Objects: ${objectCount}`);
    console.log('');
  }

  console.log('\n💡 Copy the project ID you want to use as the template and update TEMPLATE_PROJECT_ID in exportTemplate.ts');
}

// Run listing
listProjects().catch((error) => {
  console.error('\n❌ Failed to list projects:', error);
  process.exit(1);
});
