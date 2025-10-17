# TODO: Generate Proper Assets

## Required Actions

The following asset files need to be generated before deployment:

### 1. Favicon Files (REQUIRED)
- `/public/favicon-16x16.png` - 16x16px PNG favicon
- `/public/favicon-32x32.png` - 32x32px PNG favicon
- `/public/apple-touch-icon.png` - 180x180px PNG Apple touch icon

**How to generate:**
```bash
# Option 1: Use online tool
# Visit https://realfavicongenerator.net/
# Upload /public/favicon.svg
# Download generated files to /public/

# Option 2: Install ImageMagick and run:
convert -background none public/favicon.svg -resize 16x16 public/favicon-16x16.png
convert -background none public/favicon.svg -resize 32x32 public/favicon-32x32.png
convert -background none public/favicon.svg -resize 180x180 public/apple-touch-icon.png
```

### 2. Open Graph Image (REQUIRED)
- `/public/og-image.png` - 1200x630px PNG for social sharing

**Design Specs:**
- Size: 1200x630px
- Background: Blue gradient (#0ea5e9)
- Text: "Design App Icons That Convert"
- Subtext: "From $9.99/year"
- Include CollabCanvas logo

**How to generate:**
```bash
# Option 1: Use Figma/Canva
# Create 1200x630px design with above specs
# Export as PNG to /public/og-image.png

# Option 2: Use script (after installing dependencies)
npm install --save-dev sharp
npm run generate:assets
```

## Current Workaround

For development purposes, the favicon.svg will be used as fallback.
The og-image.png reference in meta tags will need the actual file before production deployment.

## Verification Checklist

Before deploying to production:
- [ ] All favicon files exist in /public/
- [ ] og-image.png exists in /public/
- [ ] Test Open Graph: https://www.opengraph.xyz/url/YOUR_URL
- [ ] Test Twitter Card: https://cards-dev.twitter.com/validator
- [ ] Lighthouse audit shows all meta tags correctly
