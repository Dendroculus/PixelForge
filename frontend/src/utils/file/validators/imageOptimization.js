/**
 * Browser-side image optimization helpers.
 *
 * These helpers downscale oversized images before upload so the backend,
 * Azure storage, and AI providers receive safer payloads. Backend validation
 * remains the security boundary because browser-side optimization can be
 * bypassed.
 */

/**
 * Return whether an image exceeds the configured pixel limit.
 *
 * @param {{pixels: number}} metadata - Decoded image metadata.
 * @param {number} maxPixels - Maximum recommended pixel count.
 * @returns {boolean} Whether the image should be optimized.
 */
export const shouldOptimizeResolution = (metadata, maxPixels) =>
  metadata.pixels > maxPixels;

/**
 * Resolve the browser canvas output MIME type for an uploaded image.
 *
 * @param {File|Blob} file - Uploaded image file.
 * @returns {string} Canvas output MIME type.
 */
const getOutputMimeType = (file) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file.type;
  }

  return 'image/jpeg';
};

/**
 * Encode a canvas into a Blob.
 *
 * @param {HTMLCanvasElement} canvas - Canvas containing the resized image.
 * @param {string} mimeType - Output MIME type.
 * @returns {Promise<Blob>} Encoded image blob.
 */
const canvasToBlob = (canvas, mimeType) =>
  new Promise((resolve, reject) => {
    const quality = mimeType === 'image/png' ? undefined : 0.92;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to optimize image.'));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });

/**
 * Downscale an image file so its total pixels fit within ``maxPixels``.
 *
 * @param {File} file - Original uploaded image file.
 * @param {HTMLImageElement} image - Loaded browser image.
 * @param {{width: number, height: number, pixels: number}} metadata - Original metadata.
 * @param {number} maxPixels - Target pixel limit.
 * @returns {Promise<{file: File, metadata: object, optimization: object}>}
 * Optimized file, updated metadata, and optimization details.
 */
export const optimizeImageResolution = async (
  file,
  image,
  metadata,
  maxPixels,
) => {
  const scale = Math.sqrt(maxPixels / metadata.pixels);
  const width = Math.max(1, Math.floor(metadata.width * scale));
  const height = Math.max(1, Math.floor(metadata.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', {
    alpha: file.type === 'image/png',
  });

  if (!context) {
    throw new Error('Image optimization is not supported in this browser.');
  }

  context.drawImage(image, 0, 0, width, height);

  const mimeType = getOutputMimeType(file);
  const blob = await canvasToBlob(canvas, mimeType);
  const optimizedFile = new File([blob], file.name, {
    type: mimeType,
    lastModified: Date.now(),
  });

  return {
    file: optimizedFile,
    metadata: {
      width,
      height,
      pixels: width * height,
      megapixels: (width * height) / 1_000_000,
    },
    optimization: {
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      originalPixels: metadata.pixels,
      optimizedWidth: width,
      optimizedHeight: height,
      optimizedPixels: width * height,
    },
  };
};