# Smart Background Removal System

## Overview

Multi-method background removal system combining AI, interactive selection, and manual tools.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Background Removal UI                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [One-Click AI]  [Smart Select]  [Magic Wand]  [Manual]     │
│                                                               │
└───────┬──────────────┬─────────────┬──────────────┬──────────┘
        │              │             │              │
        ▼              ▼             ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
│   Replicate  │ │TensorFlow│ │ Color    │ │ Brush/Eraser│
│   rembg API  │ │.js Model │ │ Flood    │ │ Canvas Tool │
│              │ │          │ │ Fill     │ │             │
└──────────────┘ └──────────┘ └──────────┘ └─────────────┘
```

## Method Comparison

| Method | Speed | Accuracy | Use Case | Cost |
|--------|-------|----------|----------|------|
| **Replicate API** | 5-15s | Excellent | One-click, simple images | $$ per call |
| **TensorFlow.js** | 1-2s | Good | People, objects with contrast | Free |
| **Magic Wand** | Instant | Fair | Solid backgrounds | Free |
| **Manual Brush** | Variable | Perfect | Final touch-ups | Free |

## Implementation Phases

### Phase 1: TensorFlow.js Smart Selection (Core)

**Files to Create:**
- `src/features/background-removal/services/tfSegmentation.ts`
- `src/features/background-removal/components/SmartSelectionTool.tsx`
- `src/features/background-removal/utils/maskToKonva.ts`

**Dependencies:**
```json
{
  "@tensorflow-models/body-segmentation": "^1.0.2",
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-backend-webgl": "^4.22.0"
}
```

**Core Service:**
```typescript
/**
 * TensorFlow.js Segmentation Service
 *
 * Provides AI-powered subject detection using MediaPipe Selfie Segmentation.
 * Model runs entirely in browser (no API calls).
 */
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

let segmenter: bodySegmentation.BodySegmenter | null = null;

/**
 * Initialize segmentation model (call once on app start)
 * Downloads ~5MB model from TensorFlow CDN
 */
export async function initSegmentationModel(): Promise<void> {
  if (segmenter) return;

  segmenter = await bodySegmentation.createSegmenter(
    bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
    {
      runtime: 'tfjs',
      modelType: 'general', // 'general' or 'landscape' (landscape = better backgrounds)
    }
  );
}

/**
 * Generate binary mask for image
 * Returns Uint8Array where 255 = keep, 0 = remove
 */
export async function generateMask(
  imageElement: HTMLImageElement
): Promise<ImageData> {
  if (!segmenter) {
    await initSegmentationModel();
  }

  const segmentation = await segmenter!.segmentPeople(imageElement, {
    multiSegmentation: false,
    segmentBodyParts: false,
  });

  const coloredPartImage = await bodySegmentation.toBinaryMask(
    segmentation,
    { r: 0, g: 0, b: 0, a: 0 },      // Background (transparent)
    { r: 255, g: 255, b: 255, a: 255 } // Foreground (opaque)
  );

  return coloredPartImage;
}

/**
 * Apply mask to remove background
 * Returns new ImageData with transparent background
 */
export function applyMask(
  originalImage: ImageData,
  maskImage: ImageData
): ImageData {
  const result = new ImageData(originalImage.width, originalImage.height);

  for (let i = 0; i < originalImage.data.length; i += 4) {
    const maskAlpha = maskImage.data[i]; // Use red channel as mask

    if (maskAlpha > 128) {
      // Keep pixel
      result.data[i] = originalImage.data[i];     // R
      result.data[i + 1] = originalImage.data[i + 1]; // G
      result.data[i + 2] = originalImage.data[i + 2]; // B
      result.data[i + 3] = originalImage.data[i + 3]; // A
    } else {
      // Remove pixel (transparent)
      result.data[i] = 0;
      result.data[i + 1] = 0;
      result.data[i + 2] = 0;
      result.data[i + 3] = 0;
    }
  }

  return result;
}
```

**UI Component:**
```typescript
/**
 * Smart Selection Tool Component
 *
 * Displays mask overlay on image with brush tools for refinement.
 */
export function SmartSelectionTool({
  image,
  onComplete
}: {
  image: ImageObject;
  onComplete: (processedImage: string) => void;
}) {
  const [mask, setMask] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate initial mask
  async function handleGenerateMask() {
    setIsProcessing(true);

    // Load image
    const img = await loadImage(image.src);

    // Generate mask using TensorFlow
    const maskData = await generateMask(img);
    setMask(maskData);

    // Draw mask overlay on canvas
    drawMaskOverlay(canvasRef.current!, img, maskData);

    setIsProcessing(false);
  }

  // Apply mask and create new image
  async function handleApply() {
    if (!mask) return;

    const img = await loadImage(image.src);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // Apply mask
    const processed = applyMask(imageData, mask);
    ctx.putImageData(processed, 0, 0);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    onComplete(dataUrl);
  }

  return (
    <div className="smart-selection-tool">
      <canvas ref={canvasRef} />

      <div className="controls">
        <Button onClick={handleGenerateMask} disabled={isProcessing}>
          {isProcessing ? 'Detecting...' : 'Auto-Detect Subject'}
        </Button>

        {mask && (
          <>
            <BrushTool mask={mask} onMaskChange={setMask} />
            <Button onClick={handleApply}>Apply</Button>
          </>
        )}
      </div>
    </div>
  );
}
```

### Phase 2: Magic Wand Tool

**Color-based selection for solid backgrounds:**

```typescript
/**
 * Magic Wand Selection
 * Click-and-grow selection based on color similarity
 */
export function magicWandSelect(
  imageData: ImageData,
  x: number,
  y: number,
  tolerance: number = 30
): Uint8Array {
  const mask = new Uint8Array(imageData.width * imageData.height);
  const visited = new Set<number>();
  const queue: [number, number][] = [[x, y]];

  const seedColor = getPixelColor(imageData, x, y);

  while (queue.length > 0) {
    const [px, py] = queue.shift()!;
    const idx = py * imageData.width + px;

    if (visited.has(idx)) continue;
    visited.add(idx);

    const color = getPixelColor(imageData, px, py);

    if (colorDistance(color, seedColor) <= tolerance) {
      mask[idx] = 255; // Selected

      // Add neighbors to queue
      if (px > 0) queue.push([px - 1, py]);
      if (px < imageData.width - 1) queue.push([px + 1, py]);
      if (py > 0) queue.push([px, py - 1]);
      if (py < imageData.height - 1) queue.push([px, py + 1]);
    }
  }

  return mask;
}

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}
```

### Phase 3: Manual Refinement Tools

**Brush and eraser for mask editing:**

```typescript
/**
 * Brush Tool Component
 * Click/drag to add or remove from selection mask
 */
export function BrushTool({
  mask,
  onMaskChange
}: {
  mask: ImageData;
  onMaskChange: (mask: ImageData) => void;
}) {
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  function handlePaint(x: number, y: number) {
    const newMask = { ...mask };
    const value = mode === 'add' ? 255 : 0;

    // Paint circular brush
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          const px = x + dx;
          const py = y + dy;

          if (px >= 0 && px < mask.width && py >= 0 && py < mask.height) {
            const idx = (py * mask.width + px) * 4;
            newMask.data[idx] = value; // R channel = mask
          }
        }
      }
    }

    onMaskChange(newMask);
  }

  return (
    <div className="brush-tool">
      <Slider
        value={brushSize}
        onChange={setBrushSize}
        min={1}
        max={100}
        label="Brush Size"
      />

      <ButtonGroup>
        <Button
          active={mode === 'add'}
          onClick={() => setMode('add')}
        >
          Add to Selection
        </Button>
        <Button
          active={mode === 'remove'}
          onClick={() => setMode('remove')}
        >
          Remove from Selection
        </Button>
      </ButtonGroup>
    </div>
  );
}
```

## Usage in Properties Panel

**Update ImageSection.tsx:**

```typescript
// Add to ImageSection
function ImageSection({ image }: { image: ImageObject }) {
  const [showRemovalTool, setShowRemovalTool] = useState(false);

  return (
    <div>
      {/* ... existing image properties ... */}

      <div className="border-t pt-3 mt-3">
        <h4>Background Removal</h4>

        {/* Method selection */}
        <Select value={method} onChange={setMethod}>
          <option value="ai">One-Click AI (Replicate)</option>
          <option value="smart">Smart Selection (TensorFlow)</option>
          <option value="wand">Magic Wand</option>
          <option value="manual">Manual Brush</option>
        </Select>

        <Button onClick={() => setShowRemovalTool(true)}>
          Remove Background
        </Button>
      </div>

      {showRemovalTool && (
        <BackgroundRemovalModal
          image={image}
          method={method}
          onClose={() => setShowRemovalTool(false)}
          onComplete={handleProcessedImage}
        />
      )}
    </div>
  );
}
```

## Performance Considerations

1. **Model Loading**: Load TensorFlow model on first use, show loading state
2. **Canvas Size**: Downscale very large images (>2000px) for faster processing
3. **Progressive Enhancement**: Start with crop tool, add AI features incrementally
4. **Caching**: Cache segmentation results for undo/redo

## Bundle Size Impact

| Package | Size | When Loaded |
|---------|------|-------------|
| `@tensorflow/tfjs` | ~450KB | On demand |
| `@tensorflow-models/body-segmentation` | ~50KB | On demand |
| MediaPipe model | ~5MB | First use (CDN) |

**Recommendation**: Lazy load with code splitting:
```typescript
const SmartSelectionTool = lazy(() =>
  import('./features/background-removal/SmartSelectionTool')
);
```

## Testing Plan

1. **Unit Tests**: Mask generation, color distance, flood fill
2. **Integration Tests**: Full background removal flow
3. **Visual Tests**: Screenshot comparisons of masks
4. **Performance Tests**: Measure processing time for various image sizes

## Rollout Strategy

1. **Week 1**: Ship TensorFlow.js smart selection (beta flag)
2. **Week 2**: Add magic wand tool
3. **Week 3**: Add manual brush refinement
4. **Week 4**: Polish UI, add keyboard shortcuts, full release

## References

- [MediaPipe Selfie Segmentation](https://google.github.io/mediapipe/solutions/selfie_segmentation.html)
- [TensorFlow.js Body Segmentation](https://github.com/tensorflow/tfjs-models/tree/master/body-segmentation)
- [Example Implementation](https://github.com/jasonmayes/Real-Time-Person-Removal)
