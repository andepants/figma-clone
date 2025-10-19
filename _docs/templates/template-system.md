# Template System

Canvas Icons uses a JSON-based template system to provide starter objects for new projects.

## Overview

When a user creates a new project, the system automatically generates canvas objects from a template JSON file. This ensures every new project starts with helpful starter content.

## Architecture

```
src/lib/
  ├── templates/
  │   └── default-template.json    # Template data (objects, metadata)
  └── utils/
      ├── template-generator.ts     # Loads & applies template to new projects
      └── exportCurrentCanvasAsTemplate.ts  # Browser tool for exporting templates

public/
  └── templates/                    # Template images (SVG, PNG, etc.)
      ├── image1.png
      └── image2.svg

src/scripts/
  ├── exportTemplate.ts             # Node.js export script (unused due to auth)
  └── listProjects.ts               # List Firebase projects
```

## Template JSON Structure

```json
{
  "version": 1,
  "exported": "2025-10-19T12:00:00.000Z",
  "sourceProjectId": "4e08256c-d03d-49ac-9f96-86e15740931b",
  "objectCount": 10,
  "objects": [
    {
      "id": "unique-id",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 150,
      "fill": "#E5E7EB",
      "stroke": "#9CA3AF",
      "strokeWidth": 2,
      "name": "Example Rectangle",
      "createdBy": "system",
      "createdAt": 1634567890,
      "updatedAt": 1634567890,
      "zIndex": 0
    }
    // ... more objects
  ]
}
```

## Exporting a New Template

### Method 1: Browser Console (Recommended)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open template project:**
   Navigate to the canvas project you want to use as a template:
   ```
   http://localhost:5173/canvas/{your-project-id}
   ```

3. **Export via console:**
   Open browser DevTools (F12) and run:
   ```javascript
   window.exportTemplate()
   ```

4. **Save template file:**
   - Downloads `default-template.json`
   - Move to `src/lib/templates/default-template.json`

5. **Download images:**
   - Console lists all image URLs
   - Download each image
   - Save to `/public/templates/`

6. **Update image paths:**
   Edit template JSON to reference public folder:
   ```json
   {
     "type": "image",
     "src": "${window.location.origin}/templates/your-image.png"
   }
   ```

### Method 2: Node.js Script (Requires Firebase Admin SDK)

*Not currently implemented due to Firebase Security Rules. Use Method 1 instead.*

## How Templates Work

### 1. New Project Creation

When a user creates a project:

```typescript
// In CreateProjectModal or similar
const projectId = generateProjectId();
await createProject(project);

// Template is automatically applied
await generateTemplateObjects(projectId);
```

### 2. Template Loading

```typescript
// template-generator.ts
function loadTemplateObjects(): CanvasObject[] {
  return defaultTemplate.objects as CanvasObject[];
}
```

### 3. Deep Cloning

Each project gets independent copies:

```typescript
const clonedObjects = templateObjects.map(deepCloneCanvasObject);
```

This ensures editing objects in one project doesn't affect others.

### 4. Firebase Sync

```typescript
// Convert array to Firebase RTDB format
const objectsMap: Record<string, CanvasObject> = {};
clonedObjects.forEach((obj) => {
  objectsMap[obj.id] = obj;
});

// Write to /canvases/{projectId}/objects
await set(objectsRef, objectsMap);
```

## Image Handling

### Storage Options

**Option 1: Public Folder (Current)**
- Images stored in `/public/templates/`
- Fast loading, no Firebase Storage costs
- Bundled with deployment
- Best for template images

**Option 2: Firebase Storage**
- Images uploaded to Firebase Storage
- URL stored in object `src` field
- Better for user-uploaded images
- Not recommended for templates

### Image Path Format

Template images use template literals for dynamic origin:

```json
{
  "src": "${window.location.origin}/templates/iphone-frame.svg"
}
```

This works in both dev (`localhost:5173`) and production.

## Production Deployment

### What Gets Deployed

Vite automatically includes `/public/templates/` in the production build:

```
dist/
  ├── templates/           # Copied from /public/templates/
  │   ├── image1.png
  │   └── image2.svg
  └── index.html
```

### Deployment Checklist

- [ ] Template JSON exists at `src/lib/templates/default-template.json`
- [ ] All images referenced in JSON exist in `/public/templates/`
- [ ] Image paths use `${window.location.origin}/templates/`
- [ ] Template tested locally (create new project)
- [ ] Run build: `npm run build`
- [ ] Deploy: `npm run deploy`

## Updating the Template

### 1. Design Your Template

Create a canvas project with your desired starter objects:
- App icon placeholders
- Feature graphic templates
- Example shapes
- Tutorial content

### 2. Export the Template

Follow "Exporting a New Template" steps above.

### 3. Test Locally

```bash
# 1. Restart dev server
npm run dev

# 2. Create a new project in the UI
# 3. Verify template objects load
# 4. Check images display correctly
```

### 4. Deploy to Production

```bash
npm run build
npm run deploy
```

## Troubleshooting

### Template Not Loading

**Check template JSON exists:**
```bash
ls -la src/lib/templates/default-template.json
```

**Verify JSON is valid:**
```bash
cat src/lib/templates/default-template.json | jq .
```

**Check objects array:**
```json
{
  "objectCount": 10,  // Should match array length
  "objects": [ /* Should not be empty */ ]
}
```

### Images Not Displaying

**Check image files exist:**
```bash
ls -la public/templates/
```

**Verify image paths in JSON:**
- Must use `${window.location.origin}/templates/filename`
- Filename must match actual file in `/public/templates/`

**Check browser console:**
- Look for 404 errors
- Verify image URLs are correct

### Template Changes Not Appearing

**Restart dev server:**
```bash
# Ctrl+C to stop
npm run dev
```

**Clear browser cache:**
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

**Check if template is cached:**
- Template JSON is imported at build time
- Changes require dev server restart

## Template Best Practices

### Object Naming

Use descriptive names:
```json
{
  "name": "iOS 1024x1024 App Icon",  // Good
  "name": "Rectangle 1",              // Bad
}
```

### Z-Index Management

Maintain proper layer order:
- Background elements: low z-index (0-10)
- Content elements: mid z-index (11-50)
- UI elements: high z-index (51-100)

### Hierarchy

Use `parentId` for logical grouping:
```json
[
  { "id": "group-1", "type": "group", "name": "App Icons" },
  { "id": "ios-icon", "parentId": "group-1", "type": "rectangle" },
  { "id": "android-icon", "parentId": "group-1", "type": "rectangle" }
]
```

### Image Optimization

Before adding images to template:
- Compress images (use tools like TinyPNG)
- Use SVG for icons/illustrations when possible
- Keep total template size under 5MB

## Future Improvements

### Multiple Templates

Support different starter templates:
```typescript
export async function generateTemplateObjects(
  projectId: string,
  templateName: 'default' | 'app-icons' | 'social-media' = 'default'
): Promise<void>
```

### Template Marketplace

Allow users to:
- Browse community templates
- Export their projects as templates
- Share templates with others

### Visual Template Editor

UI for creating/editing templates without code:
- Drag-drop canvas objects
- Configure template metadata
- Preview before saving
