const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

/**
 * Handles communication with backend upscale API.
 * Provides upload and polling methods.
 */
export const apiService = {
  /**
   * Uploads an image for processing.
   *
   * @param {File} file - Image file to upload
   * @param {string} turnstileToken - Cloudflare Turnstile token
   * @param {number} scale - Upscale factor (default: 2)
   * @returns {Promise<Object>} Job response containing jobId
   * @throws {Error} LIMIT_REACHED if rate limited
   * @throws {Error} Upload error message from server
   */
  async uploadImage(file, turnstileToken, scale = 2) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', 'general');
    formData.append('cf_turnstile_response', turnstileToken);
    formData.append('scale', scale);

    const response = await fetch(`${apiUrl}/upscale`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 429) {
      throw new Error('LIMIT_REACHED');
    }

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Polls the result endpoint for job status.
   *
   * @param {string} jobId - Job identifier
   * @returns {Promise<Object>} Result state:
   *   - success: true + data (when ready)
   *   - success: false + rateLimited (when 429)
   *   - success: false + error (on failure)
   */
  async pollResult(jobId) {
    try {
      const res = await fetch(`${apiUrl}/result/${jobId}`);

      if (res.status === 429) {
        return { success: false, error: false, rateLimited: true };
      }

      if (!res.ok) {
        return { success: false, error: true, status: res.status };
      }

      const data = await res.json();

      if (data.status === 'ready') {
        return { success: true, data };
      }

      if (data.status === 'processing') {
        return { success: false, error: false };
      }

      if (data.status === 'failed') {
        return { success: false, error: true };
      }

      return { success: false, error: true };
    } catch (err) {
      console.error('Polling failed:', err);
      return { success: false, error: true };
    }
  }
};