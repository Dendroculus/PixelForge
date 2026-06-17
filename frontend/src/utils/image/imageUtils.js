/**
 * Utility module for image processing operations using HTML5 Canvas.
 */

/**
 * Processes an image file using an offscreen canvas to manipulate format, quality, and background.
 * @param {File|Blob} file - The input image file.
 * @param {Object} [options={}] - Processing configuration options.
 * @param {string} [options.mimeType='image/jpeg'] - The output MIME type.
 * @param {number} [options.quality=0.92] - The compression quality (0.0 to 1.0).
 * @param {boolean} [options.fillBackground=false] - Whether to fill transparent areas.
 * @param {string} [options.backgroundColor='#ffffff'] - The background color to apply.
 * @returns {Promise<Blob>} A promise resolving to the processed image Blob.
 */
export const processImageWithCanvas = async (file, options = {}) => {
  const {
    mimeType = 'image/jpeg',
    quality = 0.92,
    fillBackground = false,
    backgroundColor = '#ffffff'
  } = options;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context unavailable.');
  }

  if (fillBackground) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Image processing failed.'));
      },
      mimeType,
      quality
    );
  });
};

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing image URL'));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

/**
 * @param {string|number} value
 * @param {number} maxDimension
 * @returns {number|string}
 */
export const toSafeDimension = (value, maxDimension) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return '';
  return Math.min(parsed, maxDimension);
};

/**
 * @param {string} imageUrl
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} mimeType
 * @param {number} maxDimension
 * @returns {Promise<Blob>}
 */
export const processImageResize = async (imageUrl, targetWidth, targetHeight, mimeType, maxDimension) => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Canvas context unavailable');

  const finalW = Math.min(Math.max(1, Math.round(targetWidth)), maxDimension);
  const finalH = Math.min(Math.max(1, Math.round(targetHeight)), maxDimension);

  canvas.width = finalW;
  canvas.height = finalH;
  ctx.drawImage(img, 0, 0, finalW, finalH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas export failed'));
        else resolve(blob);
      },
      mimeType || 'image/jpeg',
      0.95
    );
  });
};