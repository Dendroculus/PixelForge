/**
 * Public file validation entrypoint for PixelForge uploads.
 *
 * This module intentionally keeps ``validateImageUpload`` as the stable public
 * function used by upload hooks/components, while delegating each validation
 * responsibility to focused modules under ``utils/file/validation``.
 *
 * Validation flow:
 *   1. Ensure a file exists.
 *   2. Resolve backend-owned runtime upload/result limits.
 *   3. Check file byte size.
 *   4. Check MIME type.
 *   5. Decode the image and read metadata.
 *   6. Check decoded resolution.
 *   7. Optionally check grayscale suitability for color restoration.
 *
 * Frontend validation improves UX only. Backend validation remains the security
 * boundary because client-side checks can be bypassed.
 */

import { ERROR_MESSAGES, invalidResult } from './validators/errorMessages';
import {
  getRuntimeLimits,
  resolveUploadSizeLimit,
} from './validators/runtimeLimits';
import {
  getAllowedMimeTypes,
  validateMimeType,
} from './validators/mimeValidation';
import { loadImageMetadata } from './validators/imageMetadata';
import { validateResolution } from './validators/resolutionValidation';
import { validateGrayscaleImage } from './validators/grayscaleValidation';

/**
 * Build a successful validation result.
 *
 * @param {File|Blob} file - Original uploaded file/blob.
 * @param {object} metadata - Decoded image metadata.
 * @returns {{isValid: true, file: File|Blob, metadata: object}} Success result.
 */
const validResult = (file, metadata) => ({
  isValid: true,
  file,
  metadata,
});

/**
 * Validate uploaded image byte size.
 *
 * @param {File|Blob} file - User-selected file/blob.
 * @param {object} limits - Runtime limits from backend or fallback config.
 * @param {number|null} customMaxSizeMB - Optional upload-size override in MB.
 * @returns {{isValid: false, error: string}|null} Invalid result, or ``null``
 * when the file is within the allowed byte limit.
 */
const validateFileSize = (file, limits, customMaxSizeMB = null) => {
  const { limitMB, maxFileSizeBytes } = resolveUploadSizeLimit(
    limits,
    customMaxSizeMB,
  );

  if (file.size > maxFileSizeBytes) {
    return invalidResult(`File size exceeds the ${limitMB}MB limit.`);
  }

  return null;
};

/**
 * Validate whether an uploaded image is allowed.
 *
 * This function keeps the original return shape used by the rest of the app:
 *
 * Success:
 * ``{ isValid: true, file, metadata }``
 *
 * Failure:
 * ``{ isValid: false, error }``
 *
 * @param {File|Blob|null} file - File object from the dropzone/input.
 * @param {number|null} [customMaxSizeMB=null] - Optional max-size override in MB.
 * @param {boolean} [requireGrayscale=false] - If true, rejects images that
 * already contain significant color data.
 * @returns {Promise<
 *   | {isValid: true, file: File|Blob, metadata: object}
 *   | {isValid: false, error: string}
 * >} Validation result.
 */
export const validateImageUpload = async (
  file,
  customMaxSizeMB = null,
  requireGrayscale = false,
) => {
  if (!file) {
    return invalidResult(ERROR_MESSAGES.DEFAULT);
  }

  const limits = await getRuntimeLimits();

  const sizeError = validateFileSize(file, limits, customMaxSizeMB);
  if (sizeError) return sizeError;

  const allowedMimeTypes = getAllowedMimeTypes(limits);
  const mimeError = validateMimeType(file, allowedMimeTypes);
  if (mimeError) return mimeError;

  const imageResult = await loadImageMetadata(file);
  if (!imageResult.isValid) return imageResult;

  const { image, metadata } = imageResult;

  const resolutionError = validateResolution(metadata, limits);
  if (resolutionError) return resolutionError;

  if (requireGrayscale) {
    const grayscaleError = validateGrayscaleImage(image);
    if (grayscaleError) return grayscaleError;
  }

  return validResult(file, metadata);
};
