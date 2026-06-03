import { apiClient } from '../base/apiClient';

/**
 * Initializes and executes the image upscaling process.
 * @param {File} file - The image file to process.
 * @param {string} turnstileToken - Cloudflare Turnstile verification token.
 * @param {number} scale - The upscale multiplier (default: 2).
 * @returns {Promise<Object>} The job ID object.
 */
export async function uploadImage(file, turnstileToken, scale = 2) {
  return apiClient.executeAiJob('upscale', file, turnstileToken, { scale });
}