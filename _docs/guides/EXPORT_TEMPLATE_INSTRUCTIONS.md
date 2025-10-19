# How to Export Your Template

Since the Firebase Security Rules block direct Node.js access, we've created a browser-based export tool.

## Step-by-Step Instructions

### 1. Start your dev server (if not already running)
```bash
npm run dev
```

### 2. Open the template project in your browser
Navigate to:
```
http://localhost:5173/canvas/4e08256c-d03d-49ac-9f96-86e15740931b
```

### 3. Open Browser Console
Press `F12` or right-click → "Inspect" → "Console" tab

### 4. Run the export command
In the console, type:
```javascript
window.exportTemplate()
```

### 5. Save the downloaded file
- A file named `default-template.json` will download
- Move it to: `src/lib/templates/default-template.json` (replace the existing placeholder)

### 6. Download images manually
The console will list all image URLs. For each image:
- Open the URL in a new tab
- Right-click → "Save image as..."
- Save to `/public/templates/` with a descriptive filename (e.g., `app-icon.png`)

### 7. Update image paths in the template JSON
Open `src/lib/templates/default-template.json` and for each image object, update the `src` field:
```json
{
  "type": "image",
  "src": "${window.location.origin}/templates/your-image-name.png",
  ...
}
```

### 8. Test the template
Create a new project and verify the template loads correctly with all images.

## Alternative: Quick Copy-Paste Method

If you just want to get it working quickly:

1. Open the template project in browser
2. Open console and run: `window.exportTemplate()`
3. Save the downloaded JSON to `src/lib/templates/default-template.json`
4. For images, you can temporarily use the Firebase Storage URLs (they'll work but require internet)
5. Later, download images to `/public/templates/` for offline support

## Troubleshooting

**"window.exportTemplate is not a function"**
- Refresh the page - the export tool loads automatically in dev mode

**Images not loading**
- Check that image filenames match what's in the JSON
- Verify images are in `/public/templates/` directory
- Check browser console for 404 errors

**Template not applying to new projects**
- Verify `src/lib/templates/default-template.json` exists and has valid JSON
- Check that `objects` array is not empty
- Restart dev server after updating the JSON file
