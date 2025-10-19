# Template Images

This directory contains static images used in the default template for new projects.

## Current Files

These files will be replaced when you export your custom template:
- `iphone-frame.svg` - iPhone mockup frame (will be replaced if not in your template)
- `screenshot-placeholder.svg` - Placeholder screenshot (will be replaced if not in your template)

## After Exporting Your Template

1. Download all images from your template project
2. Save them to this directory
3. Update `src/lib/templates/default-template.json` to reference these files
4. Delete any unused template files

## Image Requirements

- **Formats:** PNG, JPG, SVG, WebP
- **Size:** Keep individual files under 1MB
- **Total:** Keep total template images under 5MB
- **Naming:** Use descriptive, URL-safe filenames (e.g., `app-icon-ios.png`)

## File Naming Conventions

Good examples:
- `app-icon-ios-1024.png`
- `app-icon-android-512.png`
- `feature-graphic-background.jpg`
- `iphone-15-frame.svg`

Bad examples:
- `image1.png` (not descriptive)
- `My Image (1).png` (spaces and parentheses)
- `Screenshot 2024-10-19 at 3.24.56 PM.png` (too long, spaces)

## Deployment

These files are automatically included in production builds by Vite.
No additional configuration needed.
