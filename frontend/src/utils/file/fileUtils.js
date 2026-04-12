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