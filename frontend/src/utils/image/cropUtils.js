import { centerCrop, makeAspectCrop } from 'react-image-crop';

/**
 * Builds a centered aspect crop in percent units.
 */
export function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Safely creates a centered default crop (free or aspect-locked).
 */
export function buildDefaultCrop(width, height, aspect) {
  if (width <= 0 || height <= 0) {
    return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
  }

  if (!aspect) {
    return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
  }

  return centerAspectCrop(width, height, aspect);
}

/**
 * Generates a cropped Blob from an HTMLImageElement using percentage-based crop coordinates.
 */
export async function generateCroppedImageBlob(imageElement, completedCrop, fileType = 'image/jpeg') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const outputWidth = Math.max(1, Math.floor((completedCrop.width * imageElement.naturalWidth) / 100));
  const outputHeight = Math.max(1, Math.floor((completedCrop.height * imageElement.naturalHeight) / 100));

  if (outputWidth <= 0 || outputHeight <= 0) throw new Error('Invalid crop dimensions');

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  const sourceX = (completedCrop.x * imageElement.naturalWidth) / 100;
  const sourceY = (completedCrop.y * imageElement.naturalHeight) / 100;

  ctx.drawImage(
    imageElement,
    sourceX,
    sourceY,
    outputWidth,
    outputHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas export failed'));
        else resolve(blob);
      },
      fileType,
      0.95
    );
  });
}