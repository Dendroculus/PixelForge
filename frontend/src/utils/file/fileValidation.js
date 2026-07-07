import { AppConfig as config, STORAGE_KEYS } from '@/config';
import { apiClient } from '@/services/base/apiClient';

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

const RUNTIME_LIMIT_CACHE_MS = 10 * 60 * 1000;

const getFallbackLimits = () => ({
  upload: {
    max_file_size_mb: config.MAX_FILE_SIZE_MB,
    max_file_size_bytes: config.MAX_FILE_SIZE_MB * 1024 * 1024,
    max_megapixels: config.MAX_MEGAPIXELS,
    max_pixels: config.MAX_PIXELS,
    allowed_extensions: config.ALLOWED_EXTENSIONS,
  },
  result: {
    max_result_file_size_mb: config.MAX_RESULT_FILE_SIZE_MB,
  },
});

const normalizeExtension = (ext) => {
  if (ext === 'jpeg') return 'jpg';
  return ext;
};

const getAllowedMimeTypes = (limits) => {
  const extensions = limits?.upload?.allowed_extensions?.length
    ? limits.upload.allowed_extensions
    : config.ALLOWED_EXTENSIONS;

  return new Set(
    extensions.map((ext) => {
      const normalized = normalizeExtension(ext);
      return `image/${normalized === 'jpg' ? 'jpeg' : normalized}`;
    }),
  );
};

/**
 * Fetch backend-owned upload/result limits, with session cache and fallback.
 *
 * Frontend validation is only for UX. The backend still validates size and
 * resolution after direct-to-Azure upload.
 */
const getRuntimeLimits = async () => {
  try {
    const cachedRaw = sessionStorage.getItem(STORAGE_KEYS.RUNTIME_LIMITS);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);

      if (Date.now() - cached.savedAt < RUNTIME_LIMIT_CACHE_MS) {
        return cached.value;
      }
    }

    const value = await apiClient.getRuntimeLimits();

    sessionStorage.setItem(
      STORAGE_KEYS.RUNTIME_LIMITS,
      JSON.stringify({
        savedAt: Date.now(),
        value,
      }),
    );

    return value;
  } catch (e) {
    console.warn('Using fallback upload limits because /limits failed.', e);
    return getFallbackLimits();
  }
};

const formatMegapixels = (pixels) => (pixels / 1_000_000).toFixed(2);

/**
 * Validate whether an uploaded image is allowed.
 *
 * @param {File} file - The file object from the dropzone/input.
 * @param {number} [customMaxSizeMB] - Optional override for max file size.
 * @param {boolean} [requireGrayscale] - If true, rejects images that already have color.
 */
export const validateImageUpload = async (
  file,
  customMaxSizeMB = null,
  requireGrayscale = false,
) => {
  if (!file) {
    return { isValid: false, error: ERROR_MESSAGES.DEFAULT };
  }

  const limits = await getRuntimeLimits();
  const allowedMimeTypes = getAllowedMimeTypes(limits);

  const limitMB = customMaxSizeMB || limits.upload.max_file_size_mb;
  const maxFileSizeBytes =
    customMaxSizeMB != null
      ? customMaxSizeMB * 1024 * 1024
      : limits.upload.max_file_size_bytes;

  if (file.size > maxFileSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds the ${limitMB}MB limit.`,
    };
  }

  const fileType = file.type || '';

  if (fileType === 'image/svg+xml') {
    return { isValid: false, error: ERROR_MESSAGES.SVG };
  }

  if (fileType.startsWith('video/')) {
    return { isValid: false, error: ERROR_MESSAGES.VIDEO };
  }

  if (fileType.startsWith('image/') && !allowedMimeTypes.has(fileType)) {
    return { isValid: false, error: ERROR_MESSAGES.OTHER_IMAGE };
  }

  if (!allowedMimeTypes.has(fileType)) {
    return { isValid: false, error: ERROR_MESSAGES.ATTACK };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      img.src = '';
      resolve({ isValid: false, error: ERROR_MESSAGES.TIMEOUT });
    }, 5000);

    img.onload = () => {
      clearTimeout(timeoutId);

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const pixels = width * height;
      const maxPixels = limits.upload.max_pixels;
      const maxMegapixels = limits.upload.max_megapixels;

      if (pixels > maxPixels) {
        URL.revokeObjectURL(objectUrl);

        return resolve({
          isValid: false,
          error:
            `Image resolution is too large. Your image is ${width}x${height} ` +
            `(${formatMegapixels(pixels)}MP), but the limit is ` +
            `${maxMegapixels}MP.`,
        });
      }

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

      resolve({
        isValid: true,
        file,
        metadata: {
          width,
          height,
          pixels,
          megapixels: pixels / 1_000_000,
        },
      });
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve({ isValid: false, error: ERROR_MESSAGES.SPOOFED });
    };

    img.src = objectUrl;
  });
};