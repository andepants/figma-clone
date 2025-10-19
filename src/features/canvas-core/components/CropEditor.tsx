/**
 * Crop Editor Component
 *
 * Interactive Konva Stage for visual image cropping with drag handles.
 * Shows full image with semi-transparent overlay and draggable crop frame.
 */

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { ImageObject } from '@/types';

interface CropEditorProps {
  /** Image object to crop */
  image: ImageObject;
  /** HTML image element (already loaded) */
  htmlImage: HTMLImageElement;
  /** Current crop values */
  crop: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  };
  /** Callback when crop changes */
  onCropChange: (crop: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) => void;
  /** Whether to maintain aspect ratio when resizing */
  keepRatio?: boolean;
}

/**
 * CropEditor Component
 *
 * Displays image in a Konva Stage with interactive crop controls:
 * - Semi-transparent overlay covering non-cropped areas
 * - Draggable crop frame with 8 resize handles (Transformer)
 * - Real-time crop calculation as user drags handles
 *
 * @example
 * ```tsx
 * <CropEditor
 *   image={imageObject}
 *   htmlImage={loadedImage}
 *   crop={{ cropX: 0, cropY: 0, cropWidth: 800, cropHeight: 600 }}
 *   onCropChange={(newCrop) => setCropData(newCrop)}
 * />
 * ```
 */
export function CropEditor({ image, htmlImage, crop, onCropChange, keepRatio = false }: CropEditorProps) {
  const cropFrameRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Stage dimensions (modal container size)
  const stageWidth = 800;
  const stageHeight = 500;

  // Calculate scale to fit image in stage
  const scaleX = stageWidth / image.naturalWidth;
  const scaleY = stageHeight / image.naturalHeight;
  const displayScale = Math.min(scaleX, scaleY, 1); // Don't scale up, max 1:1

  const displayWidth = image.naturalWidth * displayScale;
  const displayHeight = image.naturalHeight * displayScale;

  // Center image in stage
  const offsetX = (stageWidth - displayWidth) / 2;
  const offsetY = (stageHeight - displayHeight) / 2;

  // Convert crop values to display coordinates
  const [cropFrame, setCropFrame] = useState({
    x: crop.cropX * displayScale,
    y: crop.cropY * displayScale,
    width: crop.cropWidth * displayScale,
    height: crop.cropHeight * displayScale,
  });

  /**
   * Attach transformer to crop frame on mount
   */
  useEffect(() => {
    if (transformerRef.current && cropFrameRef.current) {
      transformerRef.current.nodes([cropFrameRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, []);

  /**
   * Update crop frame when crop prop changes (external updates)
   */
  useEffect(() => {
    setCropFrame({
      x: crop.cropX * displayScale,
      y: crop.cropY * displayScale,
      width: crop.cropWidth * displayScale,
      height: crop.cropHeight * displayScale,
    });
  }, [crop.cropX, crop.cropY, crop.cropWidth, crop.cropHeight, displayScale]);

  /**
   * Handle crop frame transformation
   * Updates crop data in parent component
   */
  function handleTransformEnd() {
    const node = cropFrameRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height
    node.scaleX(1);
    node.scaleY(1);

    const newCropFrame = {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, node.width() * scaleX), // Min 10px
      height: Math.max(10, node.height() * scaleY),
    };

    setCropFrame(newCropFrame);

    // Convert back to original image coordinates
    onCropChange({
      cropX: Math.round(newCropFrame.x / displayScale),
      cropY: Math.round(newCropFrame.y / displayScale),
      cropWidth: Math.round(newCropFrame.width / displayScale),
      cropHeight: Math.round(newCropFrame.height / displayScale),
    });
  }

  /**
   * Handle crop frame drag
   */
  function handleDragEnd() {
    const node = cropFrameRef.current;
    if (!node) return;

    const newCropFrame = {
      ...cropFrame,
      x: node.x(),
      y: node.y(),
    };

    setCropFrame(newCropFrame);

    // Convert back to original image coordinates
    onCropChange({
      cropX: Math.round(newCropFrame.x / displayScale),
      cropY: Math.round(newCropFrame.y / displayScale),
      cropWidth: Math.round(newCropFrame.width / displayScale),
      cropHeight: Math.round(newCropFrame.height / displayScale),
    });
  }

  /**
   * Limit crop frame to image bounds
   * Note: Receives coordinates in stage space, so must account for layer offset
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function boundBoxFunc(oldBox: any, newBox: any) {
    // Minimum size
    if (newBox.width < 10 || newBox.height < 10) {
      return oldBox;
    }

    // Keep within image bounds (stage coordinates = offsetX/Y + display coordinates)
    // Left boundary
    if (newBox.x < offsetX) {
      newBox.x = offsetX;
    }

    // Top boundary
    if (newBox.y < offsetY) {
      newBox.y = offsetY;
    }

    // Right boundary (stage coords: offsetX + displayWidth)
    if (newBox.x + newBox.width > offsetX + displayWidth) {
      newBox.width = (offsetX + displayWidth) - newBox.x;
    }

    // Bottom boundary (stage coords: offsetY + displayHeight)
    if (newBox.y + newBox.height > offsetY + displayHeight) {
      newBox.height = (offsetY + displayHeight) - newBox.y;
    }

    return newBox;
  }

  // Calculate overlay rectangles (grey out non-cropped areas)
  const overlays = {
    top: {
      x: 0,
      y: 0,
      width: displayWidth,
      height: cropFrame.y,
    },
    right: {
      x: cropFrame.x + cropFrame.width,
      y: cropFrame.y,
      width: displayWidth - (cropFrame.x + cropFrame.width),
      height: cropFrame.height,
    },
    bottom: {
      x: 0,
      y: cropFrame.y + cropFrame.height,
      width: displayWidth,
      height: displayHeight - (cropFrame.y + cropFrame.height),
    },
    left: {
      x: 0,
      y: cropFrame.y,
      width: cropFrame.x,
      height: cropFrame.height,
    },
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width: stageWidth, height: stageHeight }}>
      <Stage width={stageWidth} height={stageHeight}>
        {/* Base Image Layer */}
        <Layer x={offsetX} y={offsetY}>
          <Image
            image={htmlImage}
            width={displayWidth}
            height={displayHeight}
          />
        </Layer>

        {/* Overlay Layer (greys out non-cropped areas) */}
        <Layer x={offsetX} y={offsetY}>
          <Rect {...overlays.top} fill="rgba(0, 0, 0, 0.5)" listening={false} />
          <Rect {...overlays.right} fill="rgba(0, 0, 0, 0.5)" listening={false} />
          <Rect {...overlays.bottom} fill="rgba(0, 0, 0, 0.5)" listening={false} />
          <Rect {...overlays.left} fill="rgba(0, 0, 0, 0.5)" listening={false} />
        </Layer>

        {/* Crop Frame Layer with Transformer */}
        <Layer x={offsetX} y={offsetY}>
          <Rect
            ref={cropFrameRef}
            x={cropFrame.x}
            y={cropFrame.y}
            width={cropFrame.width}
            height={cropFrame.height}
            fill="transparent"
            stroke="#0ea5e9"
            strokeWidth={2}
            dash={[6, 3]}
            draggable
            dragBoundFunc={(pos) => {
              // Keep within bounds
              let newX = pos.x - offsetX;
              let newY = pos.y - offsetY;

              if (newX < 0) newX = 0;
              if (newY < 0) newY = 0;
              if (newX + cropFrame.width > displayWidth) newX = displayWidth - cropFrame.width;
              if (newY + cropFrame.height > displayHeight) newY = displayHeight - cropFrame.height;

              return {
                x: newX + offsetX,
                y: newY + offsetY,
              };
            }}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
          <Transformer
            ref={transformerRef}
            keepRatio={keepRatio}
            enabledAnchors={[
              'top-left',
              'top-center',
              'top-right',
              'middle-right',
              'bottom-right',
              'bottom-center',
              'bottom-left',
              'middle-left',
            ]}
            boundBoxFunc={boundBoxFunc}
            anchorSize={10}
            anchorStroke="#0ea5e9"
            anchorFill="#ffffff"
            anchorStrokeWidth={2}
            borderStroke="#0ea5e9"
            borderStrokeWidth={2}
          />
        </Layer>
      </Stage>
    </div>
  );
}
