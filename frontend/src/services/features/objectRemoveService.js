import { apiClient } from '../base/apiClient';

/**
 * Initializes and executes the object removal process.
 * @param {File} file - Original uploaded image.
 * @param {Blob} maskBlob - PNG mask generated from canvas.
 * @param {string} turnstileToken - Cloudflare Turnstile token.
 * @returns {Promise<Object>} The job ID object.
 */
export async function removeObjectFromImage(file, maskBlob, turnstileToken) {
  return apiClient.executeObjectRemoveJob(file, maskBlob, turnstileToken);
}