# Asset Generation Guide

This document describes the assets that need to be created for SEO and social sharing.

## Required Assets

### 1. Favicon Files

**Source:** `/public/favicon.svg`

**Files to create:**

1. **favicon-16x16.png**
   - Size: 16x16px
   - Format: PNG
   - Location: `/public/favicon-16x16.png`
   - Content: Rendered version of favicon.svg

2. **favicon-32x32.png**
   - Size: 32x32px
   - Format: PNG
   - Location: `/public/favicon-32x32.png`
   - Content: Rendered version of favicon.svg

3. **apple-touch-icon.png**
   - Size: 180x180px
   - Format: PNG
   - Location: `/public/apple-touch-icon.png`
   - Content: Rendered version of favicon.svg

### 2. Open Graph Image

**File:** `og-image.png`

**Specifications:**
- Size: 1200x630px
- Format: PNG or JPG
- Location: `/public/og-image.png`

**Design Content:**
- Background: Blue gradient (#0ea5e9 to darker blue)
- Logo: CollabCanvas logo (white)
- Headline: "Design App Icons That Convert" (large, white, bold)
- Subheading: "$9.99/year" (medium, white)
- Visual: Simple icon graphics or canvas illustration

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│     [Logo]                              │
│                                         │
│     Design App Icons                    │
│     That Convert                        │
│                                         │
│     From $9.99/year                     │
│                                         │
└─────────────────────────────────────────┘
```

## Generation Methods

### Option 1: Online Tools
1. Use Figma or Canva to create og-image.png
2. Use https://realfavicongenerator.net/ to generate favicon files

### Option 2: Command Line (ImageMagick)
```bash
# Generate favicons from SVG
convert -background none public/favicon.svg -resize 16x16 public/favicon-16x16.png
convert -background none public/favicon.svg -resize 32x32 public/favicon-32x32.png
convert -background none public/favicon.svg -resize 180x180 public/apple-touch-icon.png
```

### Option 3: Node.js Script
Install dependencies:
```bash
npm install --save-dev sharp
```

Then use the script at `scripts/generate-assets.js` (to be created).

## Verification

After creating assets:
1. Check files exist:
   ```bash
   ls -la public/*.png
   ```

2. Verify dimensions:
   ```bash
   file public/favicon-16x16.png
   file public/favicon-32x32.png
   file public/apple-touch-icon.png
   file public/og-image.png
   ```

3. Test Open Graph:
   - https://www.opengraph.xyz/url/https://collabcanvas.app

4. Test Twitter Card:
   - https://cards-dev.twitter.com/validator

## Current Status

- [x] Meta tags updated in index.html
- [ ] favicon-16x16.png created
- [ ] favicon-32x32.png created
- [ ] apple-touch-icon.png created
- [ ] og-image.png created
