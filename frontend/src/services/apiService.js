const apiUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

/**
 * API service for upload and polling endpoints.
 * The upscale request always uses the single supported model: "general".
 */
export const apiService = {
  async uploadImage(file, turnstileToken) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', 'general');
    formData.append('cf_turnstile_response', turnstileToken);

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