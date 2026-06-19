import { AppConfig as config } from '@/config';

const ERROR_MESSAGES = {
  ATTACK: "Are you trying to attack the web? Well that's unfortunate",
  SPOOFED:
    'Nice try! That file is disguised as an image, are you trying to trick us?',
  SVG: 'SVGs are math! They already have infinite resolution',
  OTHER_IMAGE:
    'Nice picture, but we only support static PNG, JPG, and WEBP right now 🎨',
  VIDEO: 'Why do you even try to upload a video to an image upscaler web?',
  TIMEOUT: 'The file took too long to process. Is it corrupted? ⏳',
  DEFAULT: 'Uh oh! This file is not supported.',
  COLORIZED:
    'This image already has color! Please upload a black and white image.',
};

const allowedMimeTypes = new Set(
  config.ALLOWED_EXTENSIONS.map(
    (ext) => `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  ),
);

/**
 * @param {File} file - The file object from the dropzone/input.
 * @param {number} [customMaxSizeMB] - Optional override for max file size.
 * @param {boolean} [requireGrayscale] - If true, rejects images that already have color.
 */
export const validateImageUpload = (
  file,
  customMaxSizeMB = null,
  requireGrayscale = false,
) => {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({ isValid: false, error: ERROR_MESSAGES.DEFAULT });
    }

    // Use custom size if provided, otherwise fallback to the default config
    const limitMB = customMaxSizeMB || config.MAX_FILE_SIZE_MB;
    const maxFileSizeBytes = limitMB * 1024 * 1024;

    if (file.size > maxFileSizeBytes) {
      return resolve({
        isValid: false,
        error: `File size exceeds the ${limitMB}MB limit.`,
      });
    }

    const fileType = file.type || '';

    if (fileType === 'image/svg+xml') {
      return resolve({ isValid: false, error: ERROR_MESSAGES.SVG });
    }
    if (fileType.startsWith('video/')) {
      return resolve({ isValid: false, error: ERROR_MESSAGES.VIDEO });
    }
    if (fileType.startsWith('image/') && !allowedMimeTypes.has(fileType)) {
      return resolve({ isValid: false, error: ERROR_MESSAGES.OTHER_IMAGE });
    }
    if (!allowedMimeTypes.has(fileType)) {
      return resolve({ isValid: false, error: ERROR_MESSAGES.ATTACK });
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      img.src = '';
      resolve({ isValid: false, error: ERROR_MESSAGES.TIMEOUT });
    }, 5000);

    img.onload = () => {
      clearTimeout(timeoutId);

      if (requireGrayscale) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);

        try {
          const data = ctx.getImageData(0, 0, 100, 100).data;
          let colorPixels = 0;
          let validPixels = 0;

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 20) continue;
            validPixels++;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);

            if (max - min > 35) {
              colorPixels++;
            }
          }

          const hasColor = validPixels > 0 && colorPixels / validPixels >= 0.05;

          if (hasColor) {
            URL.revokeObjectURL(objectUrl);
            return resolve({
              isValid: false,
              error: ERROR_MESSAGES.COLORIZED,
            });
          }
        } catch (e) {
          console.warn('Could not read image data for color check', e);
        }
      }

      URL.revokeObjectURL(objectUrl);
      resolve({ isValid: true, file });
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve({ isValid: false, error: ERROR_MESSAGES.SPOOFED });
    };

    img.src = objectUrl;
  });
};
