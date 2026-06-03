import { apiClient } from '../base/apiClient';

/**
 * Initializes and executes the background removal process.
 * @param {File} file - The image file to process.
 * @param {string} turnstileToken - Cloudflare Turnstile verification token.
 * @returns {Promise<Object>} The job ID object.
 */
export async function removeBackgroundImage(file, turnstileToken) {
  return apiClient.executeAiJob('rembg', file, turnstileToken);
}