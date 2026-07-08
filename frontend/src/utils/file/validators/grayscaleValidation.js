/**
 * Grayscale validation helper for color-restoration uploads.
 *
 * Color restoration only makes sense for black-and-white images. This validator
 * samples a small canvas version of the uploaded image and rejects files that
 * already contain enough color to be considered colorized.
 */

import { FILE_VALIDATION_CONFIG } from '@/config';
import { ERROR_MESSAGES, invalidResult } from './errorMessages';

export const GRAYSCALE_SAMPLE_SIZE =
  FILE_VALIDATION_CONFIG.GRAYSCALE_SAMPLE_SIZE;

export const ALPHA_THRESHOLD =
  FILE_VALIDATION_CONFIG.GRAYSCALE_ALPHA_THRESHOLD;

export const COLOR_DELTA_THRESHOLD =
  FILE_VALIDATION_CONFIG.GRAYSCALE_COLOR_DELTA_THRESHOLD;

export const COLOR_RATIO_THRESHOLD =
  FILE_VALIDATION_CONFIG.GRAYSCALE_COLOR_RATIO_THRESHOLD;

/**
 * Determine whether sampled RGBA data contains meaningful color.
 *
 * @param {Uint8ClampedArray} data - Canvas image data.
 * @param {object} [options] - Optional detection thresholds.
 * @param {number} [options.alphaThreshold=20] - Ignore pixels below alpha.
 * @param {number} [options.colorDeltaThreshold=35] - RGB channel spread that
 * marks a pixel as colored.
 * @param {number} [options.colorRatioThreshold=0.05] - Colored-pixel ratio
 * required to reject the image.
 * @returns {boolean} ``true`` when the sample appears colorized.
 */
export const hasSignificantColor = (
  data,
  {
    alphaThreshold = ALPHA_THRESHOLD,
    colorDeltaThreshold = COLOR_DELTA_THRESHOLD,
    colorRatioThreshold = COLOR_RATIO_THRESHOLD,
  } = {},
) => {
  let colorPixels = 0;
  let validPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < alphaThreshold) continue;

    validPixels++;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max - min > colorDeltaThreshold) {
      colorPixels++;
    }
  }

  return validPixels > 0 && colorPixels / validPixels >= colorRatioThreshold;
};

/**
 * Validate that a loaded image appears grayscale.
 *
 * If canvas pixel reading fails, this function preserves the previous behavior:
 * it logs a warning and lets validation continue instead of blocking upload.
 *
 * @param {HTMLImageElement} image - Loaded image element.
 * @returns {{isValid: false, error: string}|null} Invalid result when the image
 * appears colorized, or ``null`` when grayscale/unknown.
 */
export const validateGrayscaleImage = (image) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = GRAYSCALE_SAMPLE_SIZE;
  canvas.height = GRAYSCALE_SAMPLE_SIZE;
  ctx.drawImage(image, 0, 0, GRAYSCALE_SAMPLE_SIZE, GRAYSCALE_SAMPLE_SIZE);

  try {
    const data = ctx.getImageData(
      0,
      0,
      GRAYSCALE_SAMPLE_SIZE,
      GRAYSCALE_SAMPLE_SIZE,
    ).data;

    if (hasSignificantColor(data)) {
      return invalidResult(ERROR_MESSAGES.COLORIZED);
    }
  } catch (e) {
    console.warn('Could not read image data for color check', e);
  }

  return null;
};
