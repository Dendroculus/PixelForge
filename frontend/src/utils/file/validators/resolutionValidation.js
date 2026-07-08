/**
 * Image resolution validators.
 *
 * File byte size alone is not enough for AI safety. A highly compressed image
 * can be small in bytes but huge in total pixels. This module validates decoded
 * dimensions against backend-owned runtime limits.
 */

import { invalidResult } from './errorMessages';

/**
 * Format a pixel count as megapixels.
 *
 * @param {number} pixels - Total image pixels.
 * @returns {string} Megapixel string with two decimal places.
 */
export const formatMegapixels = (pixels) => (pixels / 1_000_000).toFixed(2);

/**
 * Validate decoded image resolution against runtime upload limits.
 *
 * @param {{width: number, height: number, pixels: number}} metadata - Decoded
 * image metadata.
 * @param {object} limits - Runtime limits from backend or fallback config.
 * @returns {{isValid: false, error: string}|null} Invalid result, or ``null``
 * when the image is within the allowed pixel limit.
 */
export const validateResolution = (metadata, limits) => {
  const { width, height, pixels } = metadata;
  const maxPixels = limits.upload.max_pixels;
  const maxMegapixels = limits.upload.max_megapixels;

  if (pixels > maxPixels) {
    return invalidResult(
      `Image resolution is too large. Your image is ${width}x${height} ` +
        `(${formatMegapixels(pixels)}MP), but the limit is ` +
        `${maxMegapixels}MP.`,
    );
  }

  return null;
};
