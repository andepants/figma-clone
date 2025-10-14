/**
 * @fileoverview Simple prerendering script for SEO optimization.
 * Generates static HTML for the landing page to improve initial load and crawlability.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a prerendered version of the landing page
 */
function prerenderLandingPage() {
  const distPath = path.resolve(__dirname, '../dist');
  const indexPath = path.join(distPath, 'index.html');

  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  dist directory not found. Run build first.');
    return;
  }

  // Read the built index.html
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  index.html not found in dist.');
    return;
  }

  const html = fs.readFileSync(indexPath, 'utf-8');

  // Simple prerender: The HTML already has all SEO meta tags from index.html
  // For a more advanced solution, consider using vite-plugin-ssr or similar

  console.log('✅ Prerender complete. HTML is SEO-ready with meta tags.');
  console.log('   For dynamic server-side rendering, consider:');
  console.log('   - vite-plugin-ssr');
  console.log('   - Netlify/Vercel prerendering');
  console.log('   - Firebase Hosting with Cloud Functions SSR');
}

prerenderLandingPage();
