# Template Assets

This directory contains static assets used in auto-generated project templates.

## Required Assets

### 1. iphone-frame.png
- **Purpose:** iPhone 14 Pro frame for feature graphic template
- **Specifications:**
  - Dimensions: 300x600px
  - Format: PNG with transparent background
  - File size: < 100KB
  - Should show iPhone frame outline with screen area visible

### 2. screenshot-placeholder.png
- **Purpose:** Default screenshot content for iPhone frame
- **Specifications:**
  - Dimensions: 260x560px (fits inside iPhone frame)
  - Format: PNG
  - File size: < 100KB
  - Content: Sample app screenshot or placeholder content

## Usage

These assets are referenced in the template generator:
- `/templates/iphone-frame.png` - Loaded as image object in feature graphic template
- `/templates/screenshot-placeholder.png` - Positioned inside iPhone frame

## Adding Images

1. Place your iPhone frame PNG at: `public/templates/iphone-frame.png`
2. Place your screenshot PNG at: `public/templates/screenshot-placeholder.png`
3. Images will be automatically loaded when new projects are created

## Testing

Verify images load correctly:
- Navigate to: http://localhost:5173/templates/iphone-frame.png
- Navigate to: http://localhost:5173/templates/screenshot-placeholder.png
- Both should display without 404 errors
