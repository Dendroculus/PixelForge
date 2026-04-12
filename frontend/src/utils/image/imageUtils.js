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