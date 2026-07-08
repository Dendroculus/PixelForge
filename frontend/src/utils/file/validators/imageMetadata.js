/**
 * Browser image metadata loader.
 *
 * This module owns object URL creation, image decoding, timeout handling, and
 * cleanup. It returns image dimensions and the loaded ``HTMLImageElement`` so
 * later validators can run resolution and grayscale checks without reloading the
 * same file.
 */

import { FILE_VALIDATION_CONFIG } from '@/config';
import { ERROR_MESSAGES, invalidResult } from './errorMessages';

export const IMAGE_LOAD_TIMEOUT_MS = FILE_VALIDATION_CONFIG.IMAGE_LOAD_TIMEOUT_MS;

/**
 * Build metadata from a loaded browser image.
 *
 * @param {HTMLImageElement} img - Loaded image element.
 * @returns {{width: number, height: number, pixels: number, megapixels: number}}
 * Image dimension metadata.
 */
export const getImageMetadata = (img) => {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const pixels = width * height;

  return {
    width,
    height,
    pixels,
    megapixels: pixels / 1_000_000,
  };
};

/**
 * Load an uploaded image file and return metadata.
 *
 * @param {File|Blob} file - User-selected image file/blob.
 * @param {number} [timeoutMs=IMAGE_LOAD_TIMEOUT_MS] - Decode timeout in ms.
 * @returns {Promise<
 *   | {isValid: true, image: HTMLImageElement, metadata: object}
 *   | {isValid: false, error: string}
 * >} Loaded image result.
 */
export const loadImageMetadata = (file, timeoutMs = IMAGE_LOAD_TIMEOUT_MS) =>
  new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
    };

    const settle = (result) => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve(result);
    };

    timeoutId = setTimeout(() => {
      img.src = '';
      settle(invalidResult(ERROR_MESSAGES.TIMEOUT));
    }, timeoutMs);

    img.onload = () => {
      settle({
        isValid: true,
        image: img,
        metadata: getImageMetadata(img),
      });
    };

    img.onerror = () => {
      settle(invalidResult(ERROR_MESSAGES.SPOOFED));
    };

    img.src = objectUrl;
  });
