import { apiClient } from '../base/apiClient';

/**
 * Initializes and executes the color restoration process.
 * @param {File} file - The image file to process.
 * @param {string} turnstileToken - Cloudflare Turnstile verification token.
 * @returns {Promise<Object>} The job ID object.
 */
export async function colorRestoreImage(file, turnstileToken) {
  return apiClient.executeAiJob('colorrestore', file, turnstileToken);
}