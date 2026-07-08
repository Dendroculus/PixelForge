/**
 * MIME and file-type validators for uploaded image files.
 *
 * These checks reject obvious unsupported input before the browser attempts to
 * decode the image. Browser-side MIME checks are not a security boundary, but
 * they improve user feedback and avoid unnecessary work.
 */

import { AppConfig as config } from '@/config';
import { ERROR_MESSAGES, invalidResult } from './errorMessages';

const FALLBACK_ALLOWED_EXTENSIONS = config.ALLOWED_EXTENSIONS;

/**
 * Normalize extension aliases used by backend and frontend config.
 *
 * @param {string} ext - File extension without a leading dot.
 * @returns {string} Normalized extension.
 */
export const normalizeExtension = (ext) => {
  if (ext === 'jpeg') return 'jpg';
  return ext;
};

/**
 * Convert configured allowed extensions into browser MIME types.
 *
 * @param {object} limits - Runtime limits from the backend or fallback config.
 * @returns {Set<string>} Allowed image MIME types.
 */
export const getAllowedMimeTypes = (limits) => {
  const extensions = limits?.upload?.allowed_extensions?.length
    ? limits.upload.allowed_extensions
    : FALLBACK_ALLOWED_EXTENSIONS;

  return new Set(
    extensions.map((ext) => {
      const normalized = normalizeExtension(ext);
      return `image/${normalized === 'jpg' ? 'jpeg' : normalized}`;
    }),
  );
};

/**
 * Validate whether the uploaded file type is allowed.
 *
 * @param {File|Blob} file - User-selected file/blob.
 * @param {Set<string>} allowedMimeTypes - Allowed MIME type set.
 * @returns {{isValid: false, error: string}|null} Invalid result, or ``null``
 * when the MIME type is acceptable.
 */
export const validateMimeType = (file, allowedMimeTypes) => {
  const fileType = file.type || '';

  if (fileType === 'image/svg+xml') {
    return invalidResult(ERROR_MESSAGES.SVG);
  }

  if (fileType.startsWith('video/')) {
    return invalidResult(ERROR_MESSAGES.VIDEO);
  }

  if (fileType.startsWith('image/') && !allowedMimeTypes.has(fileType)) {
    return invalidResult(ERROR_MESSAGES.OTHER_IMAGE);
  }

  if (!allowedMimeTypes.has(fileType)) {
    return invalidResult(ERROR_MESSAGES.ATTACK);
  }

  return null;
};
