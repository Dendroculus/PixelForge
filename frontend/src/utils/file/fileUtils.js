import { APP_CONFIG } from '../../config';
/**
 * Utility module for file-related operations and conversions.
 */

/**
 * Converts bytes to a formatted Megabyte string.
 * @param {number} bytes - The file size in bytes.
 * @returns {string} The formatted size in MB.
 */
export const bytesToMB = (bytes) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

/**
 * Generates a safe, sanitized filename for downloads.
 * @param {string} originalName - The original name of the file.
 * @param {string} suffix - The string to append before the extension.
 * @param {string} extension - The target file extension.
 * @returns {string} The sanitized filename.
 */
export const generateSafeFilename = (originalName, suffix, extension) => {
  const safeBase = (originalName || 'file')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w-]+/g, '_')
    .slice(0, 80);
    
  return `${safeBase}_${suffix}.${extension}`;
};

/**
 * Safely extracts and normalizes the file extension from a filename.
 * @param {string} filename - The name of the file.
 * @returns {string} The lowercase file extension, or an empty string if none.
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  
  // If there is no dot, or the dot is the first character (e.g., '.gitignore'), return empty
  if (lastDotIndex <= 0) return '';
  
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * Checks if a filename's extension matches a target extension.
 * @param {string} filename - The name of the file.
 * @param {string} targetExtension - The target extension to compare against.
 * @returns {boolean} True if extensions match (case-insensitive).
 */
export const isSameExtension = (filename, targetExtension) => {
  if (!filename || !targetExtension) return false;
  
  const fileExt = getFileExtension(filename);
  const targetExt = targetExtension.toLowerCase();
  
  return fileExt === targetExt;
};

/** Retrieves the list of acceptable MIME types based on allowed extensions.
 * @returns {string[]} An array of acceptable MIME types and extensions for file inputs.
 */
export const getAcceptableMimeTypes = () => {
  const types = APP_CONFIG.ALLOWED_EXTENSIONS.flatMap(ext => {
    // Map 'jpg' to 'jpeg' for the official MIME type
    const mimeExt = ext === 'jpg' ? 'jpeg' : ext;
    return [`.${ext}`, `image/${mimeExt}`];
  });
  return [...new Set(types)].join(',');
};

export const AcceptableImageMimeTypes = getAcceptableMimeTypes();