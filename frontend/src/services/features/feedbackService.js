import { apiClient } from '../base/apiClient';

/**
 * Submits user feedback to the backend.
 * @param {string} name - User's name.
 * @param {string} email - User's email.
 * @param {string} message - Feedback message.
 * @param {string} turnstileToken - Cloudflare Turnstile verification token.
 * @returns {Promise<Object>} API response data.
 */
export async function submitFeedback(name, email, message, turnstileToken) {
  return apiClient.post('/feedback', {
    name,
    email,
    message,
    cf_turnstile_response: turnstileToken,
  });
}