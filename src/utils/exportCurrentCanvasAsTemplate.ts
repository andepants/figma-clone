/**
 * Export Current Canvas as Template (Browser-Based)
 *
 * Call this from browser console when viewing the template project:
 * 1. Open http://localhost:5173/canvas/4e08256c-d03d-49ac-9f96-86e15740931b
 * 2. Open browser console (F12)
 * 3. Run: window.exportTemplate()
 * 4. Save the downloaded JSON file to src/lib/templates/default-template.json
 * 5. Download images manually and place in /public/templates/
 */

import { get, ref } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase/realtimedb';
import type { CanvasObject, ImageObject } from '@/types/canvas.types';

/**
 * Export current canvas as template
 *
 * @param projectId - Canvas project ID to export
 */
export async function exportCurrentCanvasAsTemplate(projectId: string): Promise<void> {
  console.log(`🚀 Exporting template from project: ${projectId}`);

  // Fetch objects from project
  const objectsRef = ref(realtimeDb, `canvases/${projectId}/objects`);
  const snapshot = await get(objectsRef);

  if (!snapshot.exists()) {
    console.error(`❌ No objects found for project ${projectId}`);
    return;
  }

  const objectsMap = snapshot.val() as Record<string, CanvasObject>;
  const objects = Object.values(objectsMap);

  console.log(`✓ Found ${objects.length} objects`);

  // Sanitize objects for template
  const templateObjects = objects.map((obj) => ({
    ...obj,
    createdBy: 'system',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  // Sort by z-index
  templateObjects.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  // Create template data
  const templateData = {
    version: 1,
    exported: new Date().toISOString(),
    sourceProjectId: projectId,
    objectCount: templateObjects.length,
    objects: templateObjects,
  };

  // Log image URLs for manual download
  const imageObjects = templateObjects.filter(obj => obj.type === 'image') as ImageObject[];
  if (imageObjects.length > 0) {
    console.log('\n📸 Image URLs to download manually:');
    imageObjects.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.fileName || `image-${index}`}`);
      console.log(`     ${img.src}`);
      console.log('');
    });
    console.log('💡 Save these images to /public/templates/');
  }

  // Download JSON
  const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'default-template.json';
  a.click();
  URL.revokeObjectURL(url);

  console.log('\n✅ Template exported! Save to src/lib/templates/default-template.json');
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).exportTemplate = () => {
    const projectId = window.location.pathname.split('/').pop() || '';
    if (!projectId) {
      console.error('❌ Could not determine project ID from URL');
      return;
    }
    exportCurrentCanvasAsTemplate(projectId);
  };
  console.log('💡 Export tool loaded! Run: window.exportTemplate()');
}
